from fastapi import APIRouter
from bson import ObjectId
from common_urldb import db

router = APIRouter()

col_offers = db["offers"]


@router.get(
    "/offers/shop/{shop_id}/",
    operation_id="getOffersForShop",
    summary="Get approved offers for a shop (image & video supported)"
)
def get_offers_for_shop(shop_id: str):

    # ---------- TRY OBJECT ID ----------
    try:
        shop_oid = ObjectId(shop_id)
    except:
        shop_oid = None


    offers_doc = col_offers.find_one({
        "$or": [
            {"shop_id": shop_id},
            {"shop_id": shop_oid}
        ]
    })

    if not offers_doc:
        return {
            "status": True,
            "offers": []
        }

    approved_offers = []

    
    for offer in offers_doc.get("offers", []):

        if offer.get("status") != "approved":
            continue

        approved_offers.append({
            "offer_id": str(offer.get("offer_id")),
            "title": offer.get("title"),
            "description": offer.get("description"),
            "percentage": offer.get("percentage"),
            "fee": offer.get("fee"),

      
            "media_type": offer.get("media_type"),     # image | video
            "media_path": offer.get("media_path"),     # media/....

            "filename": offer.get("filename"),
            "start_date": offer.get("start_date"),
            "end_date": offer.get("end_date"),
            "status": offer.get("status")
        })

    return {
        "status": True,
        "offers": approved_offers
    }
