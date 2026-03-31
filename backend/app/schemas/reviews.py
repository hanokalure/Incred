from pydantic import BaseModel, Field
from typing import Optional


class ReviewCreate(BaseModel):
    place_id: int
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None
    image_url: Optional[str] = None


class ReviewOut(BaseModel):
    id: int
    place_id: int
    user_id: str
    user_name: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    image_url: Optional[str] = None
    created_at: str
