from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# JWT CONFIG
SECRET_KEY = "kada!ai"
REFRESH_SECRET_KEY = "Kadai@"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# FastAPI HTTP Bearer
bearer_scheme = HTTPBearer()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({
        "exp": expire,
        "type": "access"
    })

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# CREATE REFRESH TOKEN
def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES)

    to_encode.update({
        "exp": expire,
        "type": "refresh"
    })

    return jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)


# VERIFY ACCESS TOKEN (Depends)
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    token = credentials.credentials  # remove Bearer prefix

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid access token")

        user_id = payload.get("user_id")

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        return user_id

    except JWTError:
        raise HTTPException(status_code=401, detail="Access token expired or invalid")


# VERIFY REFRESH TOKEN
def verify_refresh_token(refresh_token: str):
    try:
        payload = jwt.decode(refresh_token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        user_id = payload.get("user_id")

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid refresh token payload")

        return user_id

    except JWTError:
        raise HTTPException(status_code=401, detail="Refresh token expired or invalid")
