import mimetypes
import uuid
from typing import Tuple

import boto3
from fastapi import UploadFile, HTTPException, status
from ..config import settings

s3_client = boto3.client(
    "s3",
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION,
)


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


def _upload_place_media(file: UploadFile, media_type: str) -> Tuple[str, str]:
    if not file:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File is required")

    object_path = _object_key(file.filename or "", file.content_type, media_type)

    data = file.file.read()
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file")

    try:
        s3_client.put_object(
            Bucket=settings.AWS_S3_BUCKET,
            Key=object_path,
            Body=data,
            ContentType=file.content_type or "image/jpeg",
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc

    # We store the object key in the database and let the frontend convert it
    # into our backend proxy URL for display.
    return object_path, object_path


def upload_place_image(file: UploadFile) -> Tuple[str, str]:
    return _upload_place_media(file, "images")


def upload_place_video(file: UploadFile) -> Tuple[str, str]:
    return _upload_place_media(file, "videos")
