import mimetypes
import uuid
from typing import Tuple

import boto3
from fastapi import UploadFile, HTTPException, status
from anyio.to_thread import run_sync
from ..config import settings

_s3_client = None


def get_s3_client():
    global _s3_client
    if _s3_client is None:
        if not settings.AWS_ACCESS_KEY_ID or not settings.AWS_SECRET_ACCESS_KEY or not settings.AWS_REGION:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AWS S3 is not configured",
            )
        _s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
        )
    return _s3_client


class LazyS3Client:
    def __getattr__(self, name):
        return getattr(get_s3_client(), name)


s3_client = LazyS3Client()


def _guess_extension(filename: str, content_type: str | None) -> str:
    if filename and "." in filename:
        return filename.rsplit(".", 1)[-1].lower()
    if content_type:
        ext = mimetypes.guess_extension(content_type)
        if ext:
            return ext.lstrip(".")
    return "jpg"




def _guess_extension(filename: str, content_type: str | None) -> str:
    if filename and "." in filename:
        return filename.rsplit(".", 1)[-1].lower()
    if content_type:
        ext = mimetypes.guess_extension(content_type)
        if ext:
            return ext.lstrip(".")
    return "jpg"


def _object_key(filename: str, content_type: str | None, media_type: str) -> str:
    ext = _guess_extension(filename, content_type)
    base_folder = settings.AWS_S3_BASE_FOLDER.strip("/") or "places"
    return f"{base_folder}/{media_type}/{uuid.uuid4().hex}.{ext}"


async def _upload_place_media(file: UploadFile, media_type: str) -> Tuple[str, str]:
    if not file:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File is required")

    object_path = _object_key(file.filename or "", file.content_type, media_type)

    data = await file.read()
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file")

    try:
        client = get_s3_client()
        await run_sync(
            lambda: client.put_object(
                Bucket=settings.AWS_S3_BUCKET,
                Key=object_path,
                Body=data,
                ContentType=file.content_type or "image/jpeg",
            )
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc

    # We store the object key in the database and let the frontend convert it
    # into our backend proxy URL for display.
    return object_path, object_path


async def upload_place_image(file: UploadFile) -> Tuple[str, str]:
    return await _upload_place_media(file, "images")


async def upload_place_video(file: UploadFile) -> Tuple[str, str]:
    return await _upload_place_media(file, "videos")


async def upload_story_image(file: UploadFile) -> Tuple[str, str]:
    return await _upload_place_media(file, "stories/images")


async def upload_story_video(file: UploadFile) -> Tuple[str, str]:
    return await _upload_place_media(file, "stories/videos")


async def upload_user_profile_pic(file: UploadFile, user_id: str) -> Tuple[str, str]:
    # We use a user-specific folder for profile pictures
    return await _upload_place_media(file, f"profiles/{user_id}")
