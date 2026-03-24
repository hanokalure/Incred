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
def dashboard():
    return get_admin_dashboard()


@router.get("/users")
def users():
    return get_admin_users()


@router.get("/analytics")
def analytics():
    return get_admin_analytics()


@router.get("/settings")
def settings():
    return get_admin_settings()
