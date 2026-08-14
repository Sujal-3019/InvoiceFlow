from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import os

from google.oauth2 import id_token
from google.auth.transport import requests
from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserLogin
from ..security import (
    hash_password,
    verify_password,
    create_token
)


router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
@router.post("/google")
def google_login(
    data: dict,
    db: Session = Depends(get_db),
):
    google_token = data.get("token")

    if not google_token:
        raise HTTPException(
            status_code=400,
            detail="Google token is required",
        )

    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="Google authentication is not configured",
        )

    try:
        google_user = id_token.verify_oauth2_token(
            google_token,
            requests.Request(),
            GOOGLE_CLIENT_ID,
        )

    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid Google token",
        )

    google_id = google_user.get("sub")
    email = google_user.get("email")
    name = google_user.get("name")

    if not google_id or not email:
        raise HTTPException(
            status_code=400,
            detail="Google account information is incomplete",
        )

    # Find user using Google ID
    db_user = (
        db.query(User)
        .filter(User.google_id == google_id)
        .first()
    )

    # If Google ID isn't linked yet, check email
    if not db_user:
        db_user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

    # Existing user
    if db_user:

        if not db_user.google_id:
            db_user.google_id = google_id

        db.commit()
        db.refresh(db_user)

    # New Google user
    else:

        db_user = User(
            name=name or email.split("@")[0],
            email=email,
            google_id=google_id,
            password=None,
        )

        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    # Create InvoiceFlow JWT
    token = create_token(
        {
            "sub": db_user.email
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
        },
    }


@router.post("/register")
def register(
    user:UserCreate,
    db:Session=Depends(get_db)
):

    existing=db.query(User).filter(
        User.email==user.email
    ).first()


    if existing:
        raise HTTPException(
            400,
            "Email already exists"
        )


    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
        company=user.company,
        phone=user.phone,
    )


    db.add(new_user)
    db.commit()
    db.refresh(new_user)


    return {
        "message":"User created"
    }




@router.post("/login")
def login(
    user:UserLogin,
    db:Session=Depends(get_db)
):

    db_user=db.query(User).filter(
        User.email==user.email
    ).first()


    if not db_user:
        raise HTTPException(
            401,
            "Invalid credentials"
        )


    if not verify_password(
        user.password,
        db_user.password
    ):
        raise HTTPException(
            401,
            "Invalid credentials"
        )


    token=create_token(
        {
            "sub":db_user.email
        }
    )


    return {

        "access_token":token,

        "token_type":"bearer",

        "user":{
            "id":db_user.id,
            "name":db_user.name,
            "email":db_user.email
        }

    }