"""Authentication endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from app.database import db
from app.schemas.auth import Token, UserLogin, UserRegister, UserResponse
from app.utils.security import (
    create_access_token,
    get_current_user,
    get_optional_user,
    get_password_hash,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister):
    existing = await db.find_one("users", {"email": user_in.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    user_doc = {
        "email": user_in.email.lower(),
        "full_name": user_in.full_name,
        "hashed_password": get_password_hash(user_in.password)
    }
    user_id = await db.insert_one("users", user_doc)
    user_doc["_id"] = user_id

    access_token = create_access_token(data={"sub": user_id, "email": user_doc["email"]})
    user_resp = UserResponse(id=user_id, email=user_doc["email"], full_name=user_doc["full_name"], created_at=user_doc.get("created_at"))
    return Token(access_token=access_token, token_type="bearer", user=user_resp)

@router.post("/login", response_model=Token)
async def login(user_in: UserLogin):
    user = await db.find_one("users", {"email": user_in.email.lower()})
    if not user or not verify_password(user_in.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    user_id = str(user["_id"])
    access_token = create_access_token(data={"sub": user_id, "email": user["email"]})
    user_resp = UserResponse(id=user_id, email=user["email"], full_name=user["full_name"], created_at=user.get("created_at"))
    return Token(access_token=access_token, token_type="bearer", user=user_resp)

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        full_name=current_user["full_name"],
        created_at=current_user.get("created_at")
    )