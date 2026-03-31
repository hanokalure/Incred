from fastapi import APIRouter, Depends, UploadFile, File

from ..services.deps import get_current_user
from ..services.storage_service import upload_place_image, upload_place_video

router = APIRouter()


@router.post("/uploads/place-image", dependencies=[Depends(get_current_user)])
def upload_place_image_api(file: UploadFile = File(...)):
    path, public_url = upload_place_image(file)
    return {"path": path, "public_url": public_url}


@router.post("/uploads/place-video", dependencies=[Depends(get_current_user)])
def upload_place_video_api(file: UploadFile = File(...)):
    path, public_url = upload_place_video(file)
    return {"path": path, "public_url": public_url}
