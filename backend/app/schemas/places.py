from pydantic import BaseModel, Field
from typing import Optional, List


class RestaurantDetailsIn(BaseModel):
    cuisine: Optional[str] = None
    price_range: Optional[str] = None
    must_try: Optional[str] = None


class StayDetailsIn(BaseModel):
    stay_type: Optional[str] = None
    price_per_night: Optional[float] = None
    amenities: Optional[List[str]] = None


class RestaurantDetailsOut(RestaurantDetailsIn):
    place_id: int | None = None


class StayDetailsOut(StayDetailsIn):
    place_id: int | None = None


class PlaceBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    district_id: int
    category: str
    description: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_urls: Optional[List[str]] = None


class PlaceCreate(PlaceBase):
    restaurant_details: Optional[RestaurantDetailsIn] = None
    stay_details: Optional[StayDetailsIn] = None


class PlaceUpdate(BaseModel):
    name: Optional[str] = None
    district_id: Optional[int] = None
    category: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_urls: Optional[List[str]] = None
    restaurant_details: Optional[RestaurantDetailsIn] = None
    stay_details: Optional[StayDetailsIn] = None


class PlaceDetectRequest(BaseModel):
    google_maps_link: str = Field(min_length=1, max_length=2000)


class PlaceDetectOut(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    district_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class PlaceOut(PlaceBase):
    id: int
    avg_rating: Optional[float] = None
    restaurant_details: Optional[RestaurantDetailsOut] = None
    stay_details: Optional[StayDetailsOut] = None
