from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import os

from google.oauth2 import id_token
from google.auth.transport import requests
from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserLogin , SetPassword
from ..security import (
    hash_password,
    verify_password,
    create_token,
    get_current_user,
    create_password_setup_token,
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
            clock_skew_in_seconds=10,
        )

    except ValueError as e:
        print("GOOGLE TOKEN VALIDATION ERROR:", repr(e))

        raise HTTPException(
            status_code=401,
            detail="Invalid Google token",
        )

    google_user = id_token.verify_oauth2_token(
        google_token,
        requests.Request(),
        GOOGLE_CLIENT_ID,
    ) 

    google_id = google_user.get("sub")
    email = google_user.get("email")
    name = google_user.get("name")

    if not google_id or not email:
        raise HTTPException(
            status_code=400,
            detail="Google account information is incomplete",
        )

    # ========================================================
    # 1. FIND USER BY GOOGLE ID
    # ========================================================

    db_user = (
        db.query(User)
        .filter(User.google_id == google_id)
        .first()
    )

    # ========================================================
    # 2. IF NOT FOUND, FIND USER BY EMAIL
    # ========================================================

    if not db_user:
        db_user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

    # ========================================================
    # 3. EXISTING USER
    # ========================================================

    if db_user:

        # Link Google account if not already linked
        if not db_user.google_id:
            db_user.google_id = google_id

        db.commit()
        db.refresh(db_user)

    # ========================================================
    # 4. NEW GOOGLE USER
    # ========================================================

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

    # ========================================================
    # 5. CHECK WHETHER PASSWORD EXISTS
    # ========================================================

    if db_user.password is None:

        setup_token = create_token(
            {
                "sub": db_user.email,
                "purpose": "password_setup",
            }
        )

        return {
            "requires_password_setup": True,
            "setup_token": setup_token,
            "user": {
                "id": db_user.id,
                "name": db_user.name,
                "email": db_user.email,
            },
        }

    # ========================================================
    # 6. PASSWORD ALREADY EXISTS
    # ========================================================

    token = create_token(
        {
            "sub": db_user.email
        }
    )

    return {
        "requires_password_setup": False,
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
        },
    }

@router.post("/set-password")
def set_password(
    data: SetPassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # ========================================================
    # VALIDATE PASSWORD
    # ========================================================

    if len(data.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters",
        )

    if data.password != data.confirm_password:
        raise HTTPException(
            status_code=400,
            detail="Passwords do not match",
        )

    # ========================================================
    # CHECK IF PASSWORD ALREADY EXISTS
    # ========================================================

    if current_user.password:
        raise HTTPException(
            status_code=400,
            detail="Password has already been set",
        )

    # ========================================================
    # SAVE HASHED PASSWORD
    # ========================================================

    current_user.password = hash_password(
        data.password
    )

    db.commit()
    db.refresh(current_user)

    # ========================================================
    # CREATE NORMAL JWT
    # ========================================================

    token = create_token(
        {
            "sub": current_user.email
        }
    )

    return {
        "message": "Password created successfully",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
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