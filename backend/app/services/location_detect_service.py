import re
from typing import Any, Dict, List, Optional
from urllib.parse import unquote, urlparse

import httpx
from fastapi import HTTPException, status

from ..database import get_supabase_client


DISTRICT_ALIASES = {
    "bagalkot": "Bagalkot",
    "ballari": "Ballari",
    "bellary": "Ballari",
    "belagavi": "Belagavi",
    "belgaum": "Belagavi",
    "bengaluru urban": "Bengaluru Urban",
    "bangalore urban": "Bengaluru Urban",
    "bengaluru rural": "Bengaluru Rural",
    "bangalore rural": "Bengaluru Rural",
    "bidar": "Bidar",
    "chamarajanagar": "Chamarajanagar",
    "chikkaballapur": "Chikkaballapur",
    "chikballapur": "Chikkaballapur",
    "chikkamagaluru": "Chikkamagaluru",
    "chikmagalur": "Chikkamagaluru",
    "chitradurga": "Chitradurga",
    "dakshina kannada": "Dakshina Kannada",
    "south canara": "Dakshina Kannada",
    "davanagere": "Davanagere",
    "davangere": "Davanagere",
    "dharwad": "Dharwad",
    "gadag": "Gadag",
    "hassan": "Hassan",
    "haveri": "Haveri",
    "kalaburagi": "Kalaburagi",
    "gulbarga": "Kalaburagi",
    "kodagu": "Kodagu",
    "coorg": "Kodagu",
    "kolar": "Kolar",
    "koppal": "Koppal",
    "mandya": "Mandya",
    "mysuru": "Mysuru",
    "mysore": "Mysuru",
    "raichur": "Raichur",
    "ramanagara": "Ramanagara",
    "ramanagaram": "Ramanagara",
    "shivamogga": "Shivamogga",
    "shimoga": "Shivamogga",
    "tumakuru": "Tumakuru",
    "tumkur": "Tumakuru",
    "udupi": "Udupi",
    "uttara kannada": "Uttara Kannada",
    "uttar kannada": "Uttara Kannada",
    "vijayanagara": "Vijayanagara",
    "vijayapura": "Vijayapura",
    "bijapur": "Vijayapura",
    "yadgir": "Yadgir",
}

COORD_PATTERNS = [
    re.compile(r"@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)"),
    re.compile(r"!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)"),
    re.compile(r"[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)"),
    re.compile(r"[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)"),
    re.compile(r"[?&]query=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)"),
]


def _clean_token(value: str | None) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z\s]", " ", (value or "").lower().replace("district", " "))).strip()


def _canonical_district_name(value: str | None) -> str | None:
    cleaned = _clean_token(value)
    if not cleaned:
        return None
    return DISTRICT_ALIASES.get(cleaned)


def _extract_coords(text: str) -> tuple[float, float] | None:
    for pattern in COORD_PATTERNS:
      match = pattern.search(text)
      if match:
          return float(match.group(1)), float(match.group(2))
    return None


def _extract_name_from_url(url: str) -> str | None:
    parsed = urlparse(url)
    match = re.search(r"/place/([^/]+)", unquote(parsed.path))
    if not match:
        return None
    value = match.group(1).replace("+", " ").strip()
    if not value or re.match(r"^-?\d", value):
        return None
    return value


async def _list_districts() -> List[Dict[str, Any]]:
    supabase = await get_supabase_client(anon=True)
    result = await supabase.table("districts").select("id,name").execute()
    return result.data or []


def _match_district_id(districts: List[Dict[str, Any]], address: Dict[str, Any], display_name: str | None) -> int | None:
    candidates = [
        address.get("state_district"),
        address.get("county"),
        address.get("city_district"),
        address.get("city"),
        address.get("town"),
        display_name,
    ]

    for candidate in candidates:
        canonical = _canonical_district_name(candidate)
        if not canonical:
            continue
        for district in districts:
            if district.get("name") == canonical:
                return district.get("id")

    display = _clean_token(display_name)
    if display:
        for district in districts:
            name = _clean_token(district.get("name"))
            if name and name in display:
                return district.get("id")
    return None


async def detect_place_from_google_maps_link(link: str) -> Dict[str, Any]:
    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=15.0,
            headers={"User-Agent": "Incredible Karnataka/1.0"},
        ) as client:
            response = await client.get(link)
            response.raise_for_status()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to open that Google Maps link. Please paste the full place link.",
        ) from exc

    final_url = str(response.url)
    coords = _extract_coords(final_url) or _extract_coords(response.text)
    if not coords:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not detect coordinates from this Google Maps link.",
        )

    latitude, longitude = coords

    try:
        async with httpx.AsyncClient(
            timeout=15.0,
            headers={"User-Agent": "Incredible Karnataka/1.0"},
        ) as client:
            geo = await client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={
                    "format": "jsonv2",
                    "lat": str(latitude),
                    "lon": str(longitude),
                    "zoom": "18",
                    "addressdetails": "1",
                    "namedetails": "1",
                },
            )
            geo.raise_for_status()
            geo_data = geo.json()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Coordinates were found, but address lookup failed.",
        ) from exc

    address = geo_data.get("address") or {}
    display_name = geo_data.get("display_name")
    districts = await _list_districts()
    district_id = _match_district_id(districts, address, display_name)

    return {
        "name": _extract_name_from_url(final_url),
        "address": display_name,
        "district_id": district_id,
        "latitude": latitude,
        "longitude": longitude,
    }
