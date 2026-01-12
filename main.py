from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
# Import Routers
from api.search_shops import router as search_router
from api.shop_owner_details import router as owner_router
from api.searched_detail_showhome import router as searched_detail_router
from api.offers_city import router as slideshow_router
from api.offers_list import router as offer_router
from api.offers_for_particular_shop import router as particular_offer_router
from api.jobs_get import router as jobs_router
from api.uravugal import router as uravugal_router
from api.payments import  router as payment_router
from dotenv import load_dotenv
from api.otp_mail import router as otp_router
from api.notifications_setting import router as notification_settings_router
from api.shop_views import router as shop_views_router
from api.register_automatic import router as register_auto
app = FastAPI(
    title="RK-DIAL API",
    description="API endpoints for RK-Dial Application",
    version="1.0.0",
    docs_url="/api/",
    redoc_url=None
)


MEDIA_DIR = "media"
if not os.path.exists(MEDIA_DIR):
    os.makedirs(MEDIA_DIR)

app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
DOWNLOAD_DIR = PROJECT_ROOT / "downloads"
DOWNLOAD_DIR.mkdir(exist_ok=True)



app.mount(
    "/downloads",
    StaticFiles(directory=str(DOWNLOAD_DIR)),
    name="downloads"
)

# Routers
app.include_router(search_router)
app.include_router(owner_router)
app.include_router(searched_detail_router)
app.include_router(slideshow_router)
app.include_router(offer_router)
app.include_router(particular_offer_router)
app.include_router(jobs_router)
app.include_router(uravugal_router)
app.include_router(payment_router)
app.include_router(otp_router)
app.include_router(notification_settings_router)
app.include_router(shop_views_router)
app.include_router(register_auto)
# Root
@app.get("/")
def root():
    return {"message": "Multiple APIs running!"}


