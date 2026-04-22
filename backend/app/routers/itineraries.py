from fastapi import APIRouter, Depends
from typing import List

from ..schemas.itineraries import ItineraryGenerateRequest, ItineraryOut
from ..services.itinerary_service import generate_itinerary, list_itineraries
from ..services.deps import get_current_user

router = APIRouter()


@router.post("/generate-itinerary", response_model=ItineraryOut, status_code=201)
async def generate_itinerary_api(payload: ItineraryGenerateRequest, current_user=Depends(get_current_user)):
    return await generate_itinerary(current_user["id"], payload.district_id, payload.days, payload.categories)


@router.get("/itineraries", response_model=List[ItineraryOut])
async def get_itineraries(current_user=Depends(get_current_user)):
    return await list_itineraries(current_user["id"])
