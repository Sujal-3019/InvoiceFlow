from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import os

from google.oauth2 import id_token
from google.auth.transport import requests

from ..database import get_db
from ..models import User, Company
from ..schemas import UserCreate, UserLogin, SetPassword
from ..security import (
    hash_password,
    verify_password,
    create_token,
    get_current_user,
)


router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
)


GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")


# ============================================================
# GOOGLE LOGIN
# ============================================================

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

    # ========================================================
    # VERIFY GOOGLE TOKEN
    # ========================================================

    try:
        google_user = id_token.verify_oauth2_token(
            google_token,
            requests.Request(),
            GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10,
        )

    except ValueError as e:
        print(
            "GOOGLE TOKEN VALIDATION ERROR:",
            repr(e),
        )

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

    # ========================================================
    # FIND USER BY GOOGLE ID
    # ========================================================

    db_user = (
        db.query(User)
        .filter(User.google_id == google_id)
        .first()
    )

    # ========================================================
    # IF NOT FOUND, FIND USER BY EMAIL
    # ========================================================

    if not db_user:
        db_user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

    # ========================================================
    # EXISTING USER
    # ========================================================

    if db_user:

        # ----------------------------------------------------
        # Link Google account if not already linked
        # ----------------------------------------------------

        if not db_user.google_id:
            db_user.google_id = google_id

        db.commit()
        db.refresh(db_user)

    # ========================================================
    # NEW GOOGLE USER
    # ========================================================

    else:

        # ----------------------------------------------------
        # Create User
        # ----------------------------------------------------

        db_user = User(
            name=name or email.split("@")[0],
            email=email,
            google_id=google_id,
            password=None,
        )

        db.add(db_user)
        db.flush()

        # ----------------------------------------------------
        # Create initial Company
        # ----------------------------------------------------

        new_company = Company(
            user_id=db_user.id,

            # Default values
            business_name=None,
            phone=None,
        )

        db.add(new_company)

        db.commit()
        db.refresh(db_user)

        # Set the new company as the user's active company
        db_user.active_company_id = new_company.id
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    # ========================================================
    # SAFETY CHECK
    # ========================================================
    #
    # Existing users created before the company architecture
    # change may not have a company.
    #
    # Since we are resetting the database this should normally
    # not happen, but this keeps the authentication flow safe.
    #
    # ========================================================

    if not db_user.companies:

        new_company = Company(
            user_id=db_user.id,
        )

        db.add(new_company)
        db.commit()
        db.refresh(db_user)

    # ========================================================
    # CHECK WHETHER PASSWORD EXISTS
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
    # PASSWORD ALREADY EXISTS
    # ========================================================

    token = create_token(
        {
            "sub": db_user.email,
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


# ============================================================
# SET PASSWORD
# ============================================================

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
            "sub": current_user.email,
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


# ============================================================
# REGISTER
# ============================================================

@router.post("/register")
def register(
    user: UserCreate,
    db: Session = Depends(get_db),
):
    # ========================================================
    # CHECK EXISTING USER
    # ========================================================

    existing = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already exists",
        )

    # ========================================================
    # CREATE USER
    # ========================================================

    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
    )

    db.add(new_user)

    # --------------------------------------------------------
    # Flush so new_user.id is available
    # --------------------------------------------------------

    db.flush()

    # ========================================================
    # CREATE INITIAL COMPANY
    # ========================================================

    new_company = Company(
        user_id=new_user.id,

        # These fields are used only for the initial company.
        company=user.company,
        phone=user.phone,
    )

    db.add(new_company)

    # ========================================================
    # SAVE BOTH
    # ========================================================

    db.commit()

    db.refresh(new_user)
    db.refresh(new_company)

    # Set the initial company as the user's active company
    new_user.active_company_id = new_company.id
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "message": "User created",
    }


# ============================================================
# LOGIN
# ============================================================

@router.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db),
):
    # ========================================================
    # FIND USER
    # ========================================================

    db_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
        )

    # ========================================================
    # VERIFY PASSWORD
    # ========================================================

    if not db_user.password:
        raise HTTPException(
            status_code=401,
            detail="Password login is not available for this account",
        )

    if not verify_password(
        user.password,
        db_user.password,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
        )

    # ========================================================
    # CREATE JWT
    # ========================================================

    token = create_token(
        {
            "sub": db_user.email,
        }
    )

    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
        },
    }

