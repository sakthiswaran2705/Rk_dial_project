from fastapi import APIRouter, Query
from bson import ObjectId
from common_urldb import db
from translator import en_to_ta
from cache import get_cached, set_cache

router = APIRouter()

col_shop = db["shop"]
col_city = db["city"]
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
def translate_to_ta_logic(text: str):
    if not text or not isinstance(text, str):
        return text
    key = f"en_ta:{text}"
    cached = get_cached(key)
    if cached:
        return cached
    try:
        translated = en_to_ta(text)
        set_cache(key, translated)
        return translated
    except:
        return text


@router.get(
    "/offer/details/{offer_id}/",
    operation_id="getOfferDetails",
    summary="Get offer details"
)
def get_offer_details(
    offer_id: str,
    lang: str = Query("en")
):

    # 🔍 Find offer document that contains this offer_id
    offer_doc = col_offers.find_one({
        "offers.offer_id": offer_id
    })

    if not offer_doc:
        return {
            "status": False,
            "message": translate_to_ta_logic("Offer not found") if lang == "ta" else "Offer not found"
        }

    shop_id = offer_doc.get("shop_id")

    # 🔍 Fetch shop
    try:
        shop = col_shop.find_one({
            "$or": [
                {"_id": ObjectId(shop_id)},
                {"_id": shop_id}
            ]
        })
    except:
        shop = col_shop.find_one({"_id": shop_id})

    if not shop:
        return {
            "status": False,
            "message": "Shop not found"
        }

    # 🔍 Fetch city
    city = None
    try:
        if shop.get("city_id"):
            city = col_city.find_one({"_id": ObjectId(shop.get("city_id"))})
    except:
        pass

    # ---------------- MAIN OFFER ----------------
    main_offer = None
    other_offers = []

    for off in offer_doc.get("offers", []):

        if off.get("offer_id") == offer_id:
            main_offer = {
                "offer_id": off.get("offer_id"),
                "title": off.get("title"),
                "percentage": off.get("percentage"),
                "fee": off.get("fee"),
                "description": off.get("description"),
                "start_date": off.get("start_date"),
                "end_date": off.get("end_date"),
                "media_type": off.get("media_type"),
                "media_path": off.get("media_path"),
                "status": off.get("status"),
                "uploaded_at": off.get("uploaded_at")
            }
        else:
            if off.get("status") == "approved":
                other_offers.append({
                    "offer_id": off.get("offer_id"),
                    "title": off.get("title"),
                    "percentage": off.get("percentage"),
                    "fee": off.get("fee"),
                    "start_date": off.get("start_date"),
                    "end_date": off.get("end_date"),
                    "media_type": off.get("media_type"),
                    "media_path": off.get("media_path")
                })

    if not main_offer:
        return {
            "status": False,
            "message": "Offer not found"
        }

    shop_safe = safe(shop)
    city_safe = safe(city)

    # ---------------- TRANSLATION ----------------
    if lang == "ta":
        main_offer["title"] = translate_to_ta_logic(main_offer.get("title"))
        main_offer["description"] = translate_to_ta_logic(main_offer.get("description"))

        for o in other_offers:
            o["title"] = translate_to_ta_logic(o.get("title"))

        if shop_safe:
            shop_safe["shop_name"] = translate_to_ta_logic(shop_safe.get("shop_name"))
            shop_safe["description"] = translate_to_ta_logic(shop_safe.get("description"))
            shop_safe["address"] = translate_to_ta_logic(shop_safe.get("address"))

        if city_safe:
            city_safe["city_name"] = translate_to_ta_logic(city_safe.get("city_name"))

    return {
        "status": True,
        "main_offer": main_offer,
        "other_offers": other_offers,
        "shop": shop_safe,
        "city": city_safe
    }
