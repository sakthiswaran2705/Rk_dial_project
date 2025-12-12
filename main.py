from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import Routers (corrected paths)
from api.search_shops import router as search_router
from api.shop_owner_details import router as owner_router
from api.searched_detail_showhome import router as searched_detail_router
from api.offers_city import router as slideshow_router
from api.offers_list import router as offer_router
from api.offfers_for_particular_shop import router as particular_offer_router
app = FastAPI(
    title="RK-DIAL API",
    description="API endpoints for RK-Dial Application",
    version="1.0.0",
    docs_url="/api/",
    redoc_url=None
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router include
app.include_router(search_router)
app.include_router(owner_router)
app.include_router(searched_detail_router)
app.include_router(slideshow_router)
app.include_router(offer_router)
app.include_router(particular_offer_router)
# Root
@app.get("/")
def root():
    return {"message": "Multiple APIs running!"}
