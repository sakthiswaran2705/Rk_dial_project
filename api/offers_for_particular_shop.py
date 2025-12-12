from fastapi import APIRouter
from bson import ObjectId
from api.common_db_url import db

router = APIRouter()

col_offers = db["offers"]   

@router.get("/offers/shop/{shop_id}/", summary="Get offers for a shop")
def get_offers_for_shop(shop_id: str):

    try:
        oid = ObjectId(shop_id)
    except:
        oid = None

    # Match both ObjectId or string
    offers_doc = col_offers.find_one({
        "$or": [
            {"shop_id": shop_id},
            {"shop_id": oid}
        ]
    })

    # No offers for this shop
    if not offers_doc:
        return {"status": True, "offers": []}

    offers_list = []

    for offer in offers_doc.get("offers", []):
        offers_list.append({
            "offer_id": offer.get("offer_id"),
            "title": offer.get("title"),
            "percentage": offer.get("percentage"),
            "file_type": offer.get("file_type"),
            "file_base64": offer.get("file_base64"),
            "filename": offer.get("filename"),
            "description": offer.get("description"),
            "start_date": offer.get("start_date"),
            "end_date": offer.get("end_date"),
            "fee": offer.get("fee")

        })

    return {
        "status": True,
        "offers": offers_list
    }
