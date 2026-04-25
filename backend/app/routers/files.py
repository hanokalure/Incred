import logging
import mimetypes

from botocore.exceptions import ClientError
from fastapi import APIRouter, HTTPException, Request
from starlette.responses import Response
from starlette.responses import StreamingResponse
from anyio.to_thread import run_sync
from storage3.exceptions import StorageApiError

from ..config import settings
from ..database import get_supabase_client
from ..services.storage_service import s3_client

router = APIRouter()
logger = logging.getLogger(__name__)


@router.api_route("/files/place-images/{object_path:path}", methods=["GET", "HEAD"])
async def get_place_image(object_path: str, request: Request):
    return await _stream_bucket_object(object_path, request, allowed_prefixes=_allowed_prefixes(""))


@router.api_route("/files/story-media/{object_path:path}", methods=["GET", "HEAD"])
async def get_story_media(object_path: str, request: Request):
    return await _stream_bucket_object(object_path, request, allowed_prefixes=_allowed_prefixes("stories"))


@router.api_route("/files/profile-pictures/{object_path:path}", methods=["GET", "HEAD"])
async def get_profile_picture(object_path: str, request: Request):
    return await _stream_bucket_object(object_path, request, allowed_prefixes=_allowed_prefixes("profiles"))


def _allowed_prefixes(*suffixes: str) -> tuple[str, ...]:
    base_folder = settings.AWS_S3_BASE_FOLDER.strip("/") or "places"
    prefixes = []
    for suffix in suffixes:
        normalized = suffix.strip("/")
        prefixes.append(f"{base_folder}/{normalized}/" if normalized else f"{base_folder}/")
    return tuple(prefixes)


async def _stream_bucket_object(object_path: str, request: Request, allowed_prefixes: tuple[str, ...]):
    if not object_path or not any(object_path.startswith(prefix) for prefix in allowed_prefixes):
        raise HTTPException(status_code=404, detail="Not found")

    media_type, _ = mimetypes.guess_type(object_path)
    byte_range = request.headers.get("range")
    if request.method == "HEAD":
        try:
            head = await run_sync(
                lambda: s3_client.head_object(
                    Bucket=settings.AWS_S3_BUCKET,
                    Key=object_path
                )
            )
            headers = {
                "Cache-Control": "public, max-age=3600",
                "Accept-Ranges": "bytes",
            }
            content_length = head.get("ContentLength")
            if content_length is not None:
                headers["Content-Length"] = str(content_length)
            return Response(status_code=200, media_type=media_type or "application/octet-stream", headers=headers)
        except ClientError as exc:
            code = exc.response.get("Error", {}).get("Code")
            if code in {"NoSuchKey", "404"}:
                raise HTTPException(status_code=404, detail="Not found") from exc
            logger.exception("S3 head failed for %s", object_path)
            raise HTTPException(status_code=502, detail="Storage lookup failed") from exc
        except Exception as exc:
            logger.exception("S3 head failed for %s", object_path)
            raise HTTPException(status_code=502, detail="Storage lookup failed") from exc

    try:
        kwargs = {"Bucket": settings.AWS_S3_BUCKET, "Key": object_path}
        if byte_range:
            kwargs["Range"] = byte_range
        s3_response = await run_sync(lambda: s3_client.get_object(**kwargs))
        body = s3_response["Body"]
        headers = {
            "Cache-Control": "public, max-age=3600",
            "Accept-Ranges": "bytes",
        }
        content_range = s3_response.get("ContentRange")
        content_length = s3_response.get("ContentLength")
        if content_length is not None:
            headers["Content-Length"] = str(content_length)
        if content_range:
            headers["Content-Range"] = content_range
        return StreamingResponse(
            _iter_s3_body(body),
            media_type=media_type or "application/octet-stream",
            headers=headers,
            status_code=206 if content_range else 200,
        )
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code")
        if code in {"NoSuchKey", "404"}:
            content = await _download_legacy_supabase_image(object_path)
            if not content:
                raise HTTPException(status_code=404, detail="Not found") from exc
        else:
            logger.exception("S3 download failed for %s", object_path)
            raise HTTPException(status_code=502, detail="Storage download failed") from exc
    except Exception as exc:
        logger.exception("S3 download failed for %s", object_path)
        raise HTTPException(status_code=502, detail="Storage download failed") from exc

    return Response(
        content=content,
        media_type=media_type or "application/octet-stream",
        headers={
            "Cache-Control": "public, max-age=3600",
            "Accept-Ranges": "bytes",
            "Content-Length": str(len(content)),
        },
    )


def _iter_s3_body(body, chunk_size: int = 1024 * 1024):
    try:
        for chunk in body.iter_chunks(chunk_size):
            if chunk:
                yield chunk
    finally:
        try:
            body.close()
        except Exception:
            pass


async def _download_legacy_supabase_image(object_path: str):
    try:
        admin = await get_supabase_client(anon=False)
        data = await admin.storage.from_("place-images").download(object_path)
    except StorageApiError as exc:
        # Expected when object does not exist in the legacy bucket.
        if str(exc).find("404") != -1 or str(exc).find("not_found") != -1:
            return None
        logger.exception("Legacy Supabase fallback failed for %s", object_path)
        return None
    except Exception:
        logger.exception("Legacy Supabase fallback failed for %s", object_path)
        return None

    if isinstance(data, (bytes, bytearray)):
        return bytes(data)
    if hasattr(data, "content"):
        return data.content
    if hasattr(data, "data"):
        return data.data
    if isinstance(data, dict):
        return data.get("data")
    return None
