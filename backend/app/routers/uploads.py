from fastapi import APIRouter, Depends, UploadFile, File
from ..database import get_supabase_client

from ..services.deps import get_current_user
from ..services.storage_service import (
    upload_place_image,
    upload_place_video,
    upload_story_image,
    upload_story_video,
    upload_user_profile_pic,
)

router = APIRouter()


@router.post("/uploads/place-image", dependencies=[Depends(get_current_user)])
async def upload_place_image_api(file: UploadFile = File(...)):
    path, public_url = await upload_place_image(file)
    return {"path": path, "public_url": public_url}


@router.post("/uploads/place-video", dependencies=[Depends(get_current_user)])
async def upload_place_video_api(file: UploadFile = File(...)):
    path, public_url = await upload_place_video(file)
    return {"path": path, "public_url": public_url}


@router.post("/uploads/story-image", dependencies=[Depends(get_current_user)])
async def upload_story_image_api(file: UploadFile = File(...)):
    path, public_url = await upload_story_image(file)
    return {"path": path, "public_url": public_url}


@router.post("/uploads/story-video", dependencies=[Depends(get_current_user)])
async def upload_story_video_api(file: UploadFile = File(...)):
    path, public_url = await upload_story_video(file)
    return {"path": path, "public_url": public_url}


@router.post("/uploads/profile-pic")
async def upload_profile_pic_api(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    user_id = current_user["id"]
    object_path, _ = await upload_user_profile_pic(file, user_id)
    
    # Update user profile in Supabase
    admin = await get_supabase_client(anon=False)
    await admin.table("users").update({"profile_pic": object_path}).eq("id", user_id).execute()
    
    return {"profile_pic": object_path}


@router.post("/uploads/profile-pic/remove")
async def delete_profile_pic_api(current_user=Depends(get_current_user)):
    user_id = current_user["id"]
    admin = await get_supabase_client(anon=False)
    await admin.table("users").update({"profile_pic": None}).eq("id", user_id).execute()
    return {"message": "Profile picture removed", "profile_pic": None}
