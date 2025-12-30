from fastapi import APIRouter, Query
from bson import ObjectId
from datetime import datetime
from api.common_urldb import db

from api.translator import ta_to_en, en_to_ta
from api.cache import get_cached, set_cache

router = APIRouter()
col_jobs = db["jobs"]

# ---------------- SAFE OBJECT ----------------
def safe(doc):
    if not doc:
        return None
    for k, v in list(doc.items()):
        if isinstance(v, ObjectId):
            doc[k] = str(v)
        if isinstance(v, datetime):
            doc[k] = v.isoformat()
    return doc


# ---------------- TRANSLATION ----------------
def to_en(text):
    if not text:
        return text
    cached = get_cached(f"ta_en:{text}")
    if cached:
        return cached
    try:
        res = ta_to_en(text)
        set_cache(f"ta_en:{text}", res)
        return res
    except:
        return text


def to_ta(text):
    if not text:
        return text
    cached = get_cached(f"en_ta:{text}")
    if cached:
        return cached
    try:
        res = en_to_ta(text)
        set_cache(f"en_ta:{text}", res)
        return res
    except:
        return text


# ===============================
# GET JOBS (CITY WISE)
# ===============================
@router.get("/jobs/", operation_id="getJobs")
def get_jobs(
    city_id: str | None = Query(None),
    city_name: str | None = Query(None),
    job_title: str | None = Query(None),
    lang: str = Query("en")
):
    query = {}

    # ---------- CITY FILTER ----------
    if city_id:
        try:
            query["city_id"] = ObjectId(city_id)
        except:
            return {
                "status": False,
                "message": "Invalid city id",
                "jobs": []
            }

    if city_name:
        if lang == "ta":
            city_name = to_en(city_name)
        query["city_name"] = {"$regex": city_name, "$options": "i"}

    # ---------- JOB TITLE SEARCH ----------
    if job_title:
        if lang == "ta":
            job_title = to_en(job_title)
        query["job_title"] = {"$regex": job_title, "$options": "i"}

    # ---------- FETCH ----------
    jobs = list(col_jobs.find(query).sort("created_at", -1))

    # ---------- TRANSLATE OUTPUT ----------
    output = []
    for job in jobs:
        job = safe(job)

        if lang == "ta":
            job["job_title"] = to_ta(job.get("job_title"))
            job["job_description"] = to_ta(job.get("job_description"))
            job["shop_name"] = to_ta(job.get("shop_name"))
            job["address"] = to_ta(job.get("address"))
            job["city_name"] = to_ta(job.get("city_name"))

        output.append(job)

    return {
        "status": True,
        "count": len(output),
        "jobs": output
    }


# ===============================
# GET SINGLE JOB
# ===============================
@router.get("/job/{job_id}/", operation_id="getJobById")
def get_job_by_id(job_id: str, lang: str = Query("en")):
    try:
        job = col_jobs.find_one({"_id": ObjectId(job_id)})
    except:
        return {"status": False, "message": "Invalid job id"}

    if not job:
        return {"status": False, "message": "Job not found"}

    job = safe(job)

    if lang == "ta":
        job["job_title"] = to_ta(job.get("job_title"))
        job["job_description"] = to_ta(job.get("job_description"))
        job["shop_name"] = to_ta(job.get("shop_name"))
        job["address"] = to_ta(job.get("address"))
        job["city_name"] = to_ta(job.get("city_name"))

    return {
        "status": True,
        "job": job
    }
