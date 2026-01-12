from fastapi import APIRouter, Query
from bson import ObjectId
from api.common_urldb import db
import re

from api.translator import en_to_ta, ta_to_en
from api.cache import get_cached, set_cache

router = APIRouter()

col_shop = db["shop"]
col_city = db["city"]
col_category = db["category"]
col_reviews = db["reviews"]



def safe(x):
    if isinstance(x, ObjectId):
        return str(x)
    if isinstance(x, list):
        return [safe(i) for i in x]
    if isinstance(x, dict):
        return {k: safe(v) for k, v in x.items()}
    return x


LETTER_MAP = {
    "A": "ஏ", "B": "பி", "C": "சி", "D": "டி", "E": "ஈ",
    "F": "எஃப்", "G": "ஜி", "H": "எச்", "I": "ஐ",
    "J": "ஜே", "K": "கே", "L": "எல்", "M": "எம்",
    "N": "என்", "O": "ஓ", "P": "பி", "Q": "க்யூ",
    "R": "ஆர்", "S": "எஸ்", "T": "டி", "U": "யூ",
    "V": "வி", "W": "டபிள்யூ", "X": "எக்ஸ்",
    "Y": "வை", "Z": "ஸெட்"
}


def phonetic_tamil(text: str):
    if not text:
        return text

    words = text.split()
    out = []

    for w in words:
        if w.isalpha() and len(w) <= 5:
            out.append(" ".join(LETTER_MAP.get(c.upper(), c) for c in w))
        else:
            out.append(w)

    return " ".join(out)


# ---------------- TRANSLATION SAFETY ----------------
def is_base64(text: str) -> bool:
    return len(text) > 200 and re.fullmatch(r"[A-Za-z0-9+/=]+", text) is not None


def should_translate(text: str) -> bool:
    if not text:
        return False
    if len(text) > 500:
        return False
    if is_base64(text):
        return False
    if text.startswith("http"):
        return False
    if text.startswith("media/"):
        return False
    return True


def translate_text_en_to_ta(text: str):
    if not should_translate(text):
        return text

    cached = get_cached(text)
    if cached:
        return cached

    ta = en_to_ta(text)
    set_cache(text, ta)
    return ta


def translate_dict(obj):
    if isinstance(obj, dict):
        new_obj = {}
        for k, v in obj.items():
            if k in ("shop_name", "category_image"):
                new_obj[k] = v
            else:
                new_obj[k] = translate_dict(v)
        return new_obj

    if isinstance(obj, list):
        return [translate_dict(i) for i in obj]

    if isinstance(obj, str):
        return translate_text_en_to_ta(obj)

    return obj


@router.get("/shop/search/")
def search_shop(
    name: str = Query(...),
    place: str | None = Query(None),
    lang: str = Query("en"),
    page: int = Query(1),
    limit: int = Query(10)
):
    skip = (page - 1) * limit

    if lang == "ta":
        name = ta_to_en(name)
        if place:
            place = ta_to_en(place)

    # ---------- CATEGORY MATCH ----------
    matched_cat_ids = [
        c["_id"] for c in col_category.find(
            {"name": {"$regex": name, "$options": "i"}},
            {"_id": 1}
        )
    ]

    query = {
        "status": "approved",
        "$or": [
            {"shop_name": {"$regex": name, "$options": "i"}},
            {"keywords": {"$regex": name, "$options": "i"}},
            {"category": {"$in": matched_cat_ids}},
            {"category": {"$in": [str(x) for x in matched_cat_ids]}},
        ]
    }

    shops = list(
        col_shop.find(query)
        .skip(skip)
        .limit(limit)
    )

    if not shops:
        return {"data": []}

    # ---------- BATCH IDS ----------
    shop_ids = [str(s["_id"]) for s in shops]
    city_ids = list({ObjectId(s["city_id"]) for s in shops if ObjectId.is_valid(str(s.get("city_id")))})

    # ---------- REVIEWS (GROUPED) ----------
    reviews = list(col_reviews.find({"shop_id": {"$in": shop_ids}}))
    review_map = {}
    for r in reviews:
        review_map.setdefault(r["shop_id"], []).append(r)

    # ---------- CITIES ----------
    cities = {
        str(c["_id"]): c
        for c in col_city.find({"_id": {"$in": city_ids}})
    }

    # ---------- CATEGORIES ----------
    all_cat_ids = set()
    for s in shops:
        for c in s.get("category", []):
            if ObjectId.is_valid(str(c)):
                all_cat_ids.add(ObjectId(c))

    categories = {
        str(c["_id"]): c
        for c in col_category.find({"_id": {"$in": list(all_cat_ids)}})
    }

    result = []

    for s in shops:
        sid = str(s["_id"])
        shop_reviews = review_map.get(sid, [])
        avg_rating = round(
            sum(r.get("rating", 0) for r in shop_reviews) / len(shop_reviews),
            1
        ) if shop_reviews else 0

        city = cities.get(str(s.get("city_id")))

        if place and city:
            if city.get("city_name", "").lower() != place.lower():
                continue

        final_categories = []
        for c in s.get("category", []):
            cat = categories.get(str(c))
            if cat:
                final_categories.append({
                    "_id": str(cat["_id"]),
                    "name": cat["name"],
                    "category_image": cat.get("category_image")
                })

        shop_name = s.get("shop_name", "")
        if lang == "ta":
            shop_name = translate_text_en_to_ta(shop_name)

        result.append({
            "shop": safe(s),
            "categories": final_categories,
            "city": safe(city) if city else None,
            "avg_rating": avg_rating,
            "reviews_count": len(shop_reviews)
        })

    result.sort(key=lambda x: x["avg_rating"], reverse=True)
    return {"data": result}
