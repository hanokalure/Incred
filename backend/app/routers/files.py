import logging
import mimetypes

from botocore.exceptions import ClientError
from fastapi import APIRouter, HTTPException, Request
from starlette.responses import Response

from ..config import settings
from ..database import supabase_admin
from ..services.storage_service import s3_client

router = APIRouter()
logger = logging.getLogger(__name__)


@router.api_route("/files/place-images/{object_path:path}", methods=["GET", "HEAD"])
def get_place_image(object_path: str, request: Request):
    # Restrict to expected prefix to avoid becoming a generic file proxy.
    if not object_path or not object_path.startswith("places/"):
        raise HTTPException(status_code=404, detail="Not found")

    media_type, _ = mimetypes.guess_type(object_path)
    byte_range = request.headers.get("range")

    try:
        kwargs = {"Bucket": settings.AWS_S3_BUCKET, "Key": object_path}
        if byte_range:
            kwargs["Range"] = byte_range
        response = s3_client.get_object(**kwargs)
        content = response["Body"].read()
        headers = {
            "Cache-Control": "public, max-age=3600",
            "Accept-Ranges": "bytes",
        }
        content_range = response.get("ContentRange")
        content_length = response.get("ContentLength")
        if content_length is not None:
            headers["Content-Length"] = str(content_length)
        if content_range:
            headers["Content-Range"] = content_range
            return Response(
                content=content,
                media_type=media_type or "application/octet-stream",
                headers=headers,
                status_code=206,
            )
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code")
        if code in {"NoSuchKey", "404"}:
            content = _download_legacy_supabase_image(object_path)
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


def _download_legacy_supabase_image(object_path: str):
    try:
        data = supabase_admin.storage.from_("place-images").download(object_path)
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
