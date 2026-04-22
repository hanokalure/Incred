from typing import List, Dict, Any
from fastapi import HTTPException, status

from ..database import get_supabase_client


async def list_districts() -> List[Dict[str, Any]]:
    supabase = await get_supabase_client(anon=True)
    result = await supabase.table("districts").select("id,name,description").order("name").execute()
    return result.data or []


async def get_district(district_id: int) -> Dict[str, Any]:
    supabase = await get_supabase_client(anon=True)
    result = await supabase.table("districts").select("id,name,description").eq("id", district_id).single().execute()
    if not result or not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="District not found")
    return result.data
