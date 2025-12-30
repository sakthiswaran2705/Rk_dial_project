import math
import requests
from fastapi import APIRouter, Query
from bson import ObjectId
from api.common_urldb import db
from api.translator import ta_to_en, en_to_ta
from api.cache import get_cached, set_cache

router = APIRouter()

col_city = db["city"]
col_shop = db["shop"]
col_offers = db["offers"]


# ---------------- SAFE OBJECT ----------------
def safe(doc):
    if not doc:
        return None
    for k, v in list(doc.items()):
        if isinstance(v, ObjectId):
            doc[k] = str(v)
    return doc


# ---------------- TRANSLATION HELPERS ----------------
def translate_to_en_logic(text: str):
    if not text: return text
    cached = get_cached(f"ta_en:{text}")
    if cached: return cached
    try:
        translated = ta_to_en(text)
        set_cache(f"ta_en:{text}", translated)
        return translated
    except:
        return text


def translate_to_ta_logic(text: str):
    if not text: return text
    cached = get_cached(f"en_ta:{text}")
    if cached: return cached
    try:
        translated = en_to_ta(text)
        set_cache(f"en_ta:{text}", translated)
        return translated
    except:
        return text


# ---------------- NEW HELPERS: GEO & DISTANCE ----------------
def get_coordinates_from_osm(city_name):
    # Check cache first
    cache_key = f"geo_coords:{city_name.lower()}"
    cached = get_cached(cache_key)
    if cached: return cached["lat"], cached["lng"]

    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {"q": f"{city_name}, Tamil Nadu", "format": "json", "limit": 1}
        headers = {"User-Agent": "MyLocalApp/1.0"}
        resp = requests.get(url, params=params, headers=headers, timeout=3)
        data = resp.json()
        if data:
            lat, lng = float(data[0]["lat"]), float(data[0]["lon"])
            set_cache(cache_key, {"lat": lat, "lng": lng})
            return lat, lng
    except:
        return None, None
    return None, None


def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) * math.sin(dlon / 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


# ---------------- HELPER: GET SLIDES (Reuse Logic) ----------------
def get_slides_logic(city_doc, lang):
    """
    Extracts offers/slides for a given city document.
    Returns (slides_list, safe_city_doc)
    """
    if not city_doc: return [], None

    city_id = str(city_doc["_id"])
    final_city_safe = safe(city_doc)

    if lang == "ta":
        final_city_safe["city_name"] = translate_to_ta_logic(final_city_safe.get("city_name", ""))

    shops = list(col_shop.find({"city_id": city_id}))
    if not shops: return [], final_city_safe

    local_slides = []

    for shop in shops:
        shop_id = str(shop["_id"])
        shop_safe = safe(shop)

        if lang == "ta":
            shop_safe["shop_name"] = translate_to_ta_logic(shop_safe.get("shop_name", ""))
            shop_safe["description"] = translate_to_ta_logic(shop_safe.get("description", ""))
            shop_safe["address"] = translate_to_ta_logic(shop_safe.get("address", ""))

        offer_doc = col_offers.find_one({"shop_id": shop_id})
        if not offer_doc: continue

        for off in offer_doc.get("offers", []):
            if off.get("status") != "approved": continue

            media_path = off.get("media_path")
            media_type = off.get("media_type")
            if not media_path or not media_type: continue

            local_slides.append({
                "shop_id": shop_id,
                "shop": shop_safe,
                "city": final_city_safe,
                "offer_id": off.get("offer_id"),
                "title": off.get("title"),
                "percentage": off.get("percentage"),
                "type": media_type,
                "path": media_path
            })

            if len(local_slides) == 3: break
        if len(local_slides) == 3: break

    return local_slides, final_city_safe


@router.get(
    "/offers/{city}/",
    operation_id="getOffersByCity",
    summary="Get offers by city"
)
def get_offers(
        city: str,
        lang: str = Query("en")
):
    # ---------- CITY SEARCH ----------
    raw_city = city.strip()
    search_city = translate_to_en_logic(raw_city) if lang == "ta" else raw_city

    # 1. Try finding the exact city
    city_list = list(col_city.find({
        "city_name": {"$regex": f"^{search_city}$", "$options": "i"}
    }))

    slides = []
    final_city = None
    is_nearby = False

    # 2. Check shops in the exact city
    if city_list:
        for c in city_list:
            cid = str(c["_id"])
            if col_shop.find_one({"city_id": cid}):
                # Found a valid city with shops
                slides, final_city = get_slides_logic(c, lang)
                if slides:
                    break

    # ---------- FALLBACK: NEARBY CHECK (If no slides found) ----------
    if not slides:
        user_lat, user_lng = None, None

        # A. If city exists in DB but has no offers -> use its Lat/Lng
        if city_list and "lat" in city_list[0]:
            user_lat = city_list[0].get("lat")
            user_lng = city_list[0].get("lng")

        # B. If city NOT in DB -> Get Lat/Lng from Internet (OSM)
        elif not city_list:
            user_lat, user_lng = get_coordinates_from_osm(search_city)

        # C. If we have coordinates, find nearest city with offers
        if user_lat and user_lng:
            # Get all DB cities with coordinates
            all_cities = list(col_city.find({
                "lat": {"$exists": True},
                "lng": {"$exists": True}
            }))

            cities_dist = []
            for db_c in all_cities:
                # Calculate distance
                d = calculate_distance(user_lat, user_lng, db_c["lat"], db_c["lng"])
                cities_dist.append((d, db_c))

            # Sort by distance (nearest first)
            cities_dist.sort(key=lambda x: x[0])

            # Check closest cities within 25km
            for dist, nearby_city in cities_dist:
                if dist > 25.0:  # Strict 25km limit
                    break

                # Try getting slides for this nearby city
                n_slides, n_city = get_slides_logic(nearby_city, lang)

                if n_slides:
                    slides = n_slides
                    final_city = n_city
                    is_nearby = True
                    # Optional: Add distance to response
                    final_city["distance_km"] = round(dist, 1)
                    break

    # ---------- FINAL RESPONSE ----------
    if not slides:
        msg = "No offers found in this area (within 25km)"
        if lang == "ta":
            msg = translate_to_ta_logic("No offers found in this area (within 25km)")

        return {
            "status": True,  # Keep true so frontend doesn't break, just empty slides
            "slides": [],
            "message": msg
        }

    return {
        "status": True,
        "slides": slides,
        "count": len(slides),
        "city_data": final_city,
        "is_nearby_result": is_nearby
    }
