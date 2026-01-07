from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime

from common_urldb import db
from auth_jwt import verify_token
from FullstakFastAPI.api.utils.email_sender import send_email

# ---------------- ROUTER ----------------
router = APIRouter()

col_user = db["user"]
col_notifications = db["notifications"]

# ---------------- REQUEST MODEL ----------------
class NotificationSettingsBody(BaseModel):
    email: bool
    push: bool

# =================================================
# SAVE / UPDATE NOTIFICATION SETTINGS
# =================================================
@router.post("/user/notification-settings/", operation_id="saveNotificationSettings")
def save_notification_settings(
    data: NotificationSettingsBody,
    user_id: str = Depends(verify_token)
):
    try:
        u_oid = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user id")

    user = col_user.find_one({"_id": u_oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    col_user.update_one(
        {"_id": u_oid},
        {"$set": {
            "notification_settings.email": data.email,
            "notification_settings.push": data.push,
            "notification_settings.updated_at": datetime.utcnow()
        }}
    )

    return {
        "status": True,
        "message": "Notification settings updated successfully"
    }

# =================================================
# INTERNAL HELPER – SEND NOTIFICATION
# =================================================
def send_user_notification(
    user_id: ObjectId,
    title: str,
    message: str,
    notif_type: str = "general",
    related_id: str = None
):
    """
    In-app notification ONLY.
    No email here.
    """
    user = col_user.find_one({"_id": user_id})
    if not user:
        return

    settings = user.get("notification_settings", {})
    push_enabled = settings.get("push", True)

    if push_enabled:
        col_notifications.insert_one({
            "user_id": user_id,
            "type": notif_type,
            "title": title,
            "message": message,
            "related_id": related_id,
            "is_read": False,
            "created_at": datetime.utcnow()
        })

# =================================================
# GET NOTIFICATION SETTINGS
# =================================================
@router.get("/user/notification-settings/", operation_id="getNotificationSettings")
def get_notification_settings(
    user_id: str = Depends(verify_token)
):
    try:
        u_oid = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user id")

    user = col_user.find_one(
        {"_id": u_oid},
        {"notification_settings": 1}
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    settings = user.get("notification_settings", {})

    return {
        "status": True,
        "data": {
            "email": settings.get("email", True),
            "push": settings.get("push", True)
        }
    }

