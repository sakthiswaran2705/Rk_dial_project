from fastapi import APIRouter, Request
from datetime import datetime
from pymongo import ReturnDocument
import redis
from common_urldb import db

router = APIRouter()

col_views = db["shopviews"]

# UNIQUE: one document per shop per month
col_views.create_index(
    [("shop_id", 1), ("year", 1), ("month", 1)],
    unique=True
)

# REDIS
r = redis.Redis(host="localhost", port=6379, decode_responses=True)


# ===============================
# ADD SHOP VIEW (REAL TIME)
# ===============================
@router.post("/shop/view/{shop_id}/")
def shop_view(shop_id: str, request: Request):

    now = datetime.utcnow()
    year, month = now.year, now.month

    ip = request.client.host if request.client else "0.0.0.0"
    ua = request.headers.get("user-agent", "unknown")
    viewer_id = f"{ip}:{ua}"

    redis_key = f"shop:view:{shop_id}:{year}:{month}"

    try:
        is_new = r.sadd(redis_key, viewer_id)

        if r.ttl(redis_key) == -1:
            r.expire(redis_key, 60 * 60 * 24 * 40)

    except Exception as e:
        print("❌ Redis error:", e)
        is_new = 1  # fallback: count anyway

    # DUPLICATE VIEW
    if is_new == 0:
        doc = col_views.find_one(
            {"shop_id": shop_id, "year": year, "month": month},
            {"_id": 0, "count": 1}
        )
        return {
            "status": True,
            "new_view_added": False,
            "total_views": doc["count"] if doc else 0
        }

    # NEW VIEW
    doc = col_views.find_one_and_update(
        {"shop_id": shop_id, "year": year, "month": month},
        {"$inc": {"count": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )

    return {
        "status": True,
        "new_view_added": True,
        "total_views": doc["count"]
    }


# ===============================
# GET CURRENT MONTH VIEWS
# ===============================
@router.get("/shop/views/{shop_id}/")
def get_shop_views(shop_id: str):

    now = datetime.utcnow()

    doc = col_views.find_one(
        {"shop_id": shop_id, "year": now.year, "month": now.month},
        {"_id": 0, "count": 1}
    )

    return {
        "status": True,
        "total_views": doc["count"] if doc else 0
    }
