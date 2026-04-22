from fastapi import APIRouter, Depends

from ..services.deps import require_admin
from ..services.admin_service import (
    get_admin_analytics,
    get_admin_dashboard,
    get_admin_settings,
    get_admin_users,
)

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_admin)])


@router.get("/dashboard")
async def dashboard():
    return await get_admin_dashboard()


@router.get("/users")
async def users():
    return await get_admin_users()


@router.get("/analytics")
async def analytics():
    return await get_admin_analytics()


@router.get("/settings")
async def settings():
    return await get_admin_settings()
