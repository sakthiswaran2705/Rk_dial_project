from fastapi import APIRouter, Form, Depends, Query
from bson import ObjectId
from api.common_urldb import db
from datetime import datetime
from auth_jwt import verify_token

from api.translator import en_to_ta, ta_to_en
from api.cache import get_cached, set_cache

router = APIRouter()

col_category = db["category"]
col_shop = db["shop"]
col_reviews = db["reviews"]


def serialize(doc):
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc



def should_translate(text: str):
    if not text:
        return False
    if len(text) > 200:
        return False
    if text.startswith("media/"):
        return False
    if text.startswith("http"):
        return False
    if "/" in text:
        return False
    return True


def translate_text(text: str):
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
        new = {}
        for k, v in obj.items():
            # ❌ NEVER TRANSLATE THESE FIELDS
            if k in ("_id", "category_image", "path", "date", "rating", "shop_id"):
                new[k] = v
            else:
                new[k] = translate_dict(v)
        return new

    if isinstance(obj, list):
        return [translate_dict(i) for i in obj]

    if isinstance(obj, str):
        return translate_text(obj)

    return obj


# CATEGORY LIST API (IMAGE PATH SAFE)
@router.get("/category/list/", operation_id="getCategoryList")
def get_categories(lang: str = Query("en")):
    try:
        data = list(col_category.find())
        data = [serialize(c) for c in data]

        if lang == "ta":
            data = translate_dict(data)

        return {"status": True, "data": data}

    except Exception as e:
        return {"status": False, "error": str(e)}


# SHOP MEDIA API

@router.get("/shop/{shop_id}/media/", operation_id="getShopMedia")
def get_shop_photos(shop_id: str):
    try:
        shop = col_shop.find_one({"_id": ObjectId(shop_id)})
        if not shop:
            return {"status": False, "message": "Shop not found"}

        media = shop.get("media", [])

        valid_media = [
            {
                "type": m.get("type"),
                "path": m.get("path")
            }
            for m in media
            if m.get("type") in ("image", "video") and m.get("path")
        ]

        return {
            "status": True,
            "media": valid_media,
            "main_image": shop.get("main_image")
        }

    except Exception as e:
        return {"status": False, "error": str(e)}



# GET REVIEWS

@router.get("/shop/{shop_id}/reviews/", operation_id="getShopReviews")
def get_reviews(shop_id: str, lang: str = Query("en")):
    try:
        reviews = list(col_reviews.find({"shop_id": shop_id}))
        for r in reviews:
            r["_id"] = str(r["_id"])

        if lang == "ta":
            reviews = translate_dict(reviews)

        return {"status": True, "reviews": reviews}

    except Exception as e:
        return {"status": False, "error": str(e)}


@router.post("/review/add/", operation_id="addReview")
def add_review_api(
    user_id: str = Depends(verify_token),
    shop_id: str = Form(...),
    rating: int = Form(...),
    review: str = Form(...)
):
    user = db.user.find_one({"_id": ObjectId(user_id)})
    if not user:
        return {"status": False, "message": "User not found"}

    review_en = ta_to_en(review)

    data = {
        "shop_id": shop_id,
        "rating": int(rating),
        "review": review_en,
        "username": user.get("firstname"),
        "user_id": user_id,
        "date": datetime.now().strftime("%d-%m-%Y")
    }

    inserted = col_reviews.insert_one(data)
    data["_id"] = str(inserted.inserted_id)

    return {
        "status": True,
        "message": "Review added successfully",
        "data": data
    }



@router.delete("/review/delete/", operation_id="deleteReview")
def delete_review(
    user_id: str = Depends(verify_token),
    review_id: str = Form(...)
):
    oid = ObjectId(review_id)
    review = col_reviews.find_one({"_id": oid})

    if not review:
        return {"status": False, "message": "Review not found"}

    if review.get("user_id") != user_id:
        return {
            "status": False,
            "message": "You are not allowed to delete this review"
        }

    col_reviews.delete_one({"_id": oid})

    return {
        "status": True,
        "message": "Review deleted successfully"
    }
