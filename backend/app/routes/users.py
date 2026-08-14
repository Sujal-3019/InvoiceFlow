import os
import shutil
from uuid import uuid4
from ..schemas import UserResponse, UserUpdate
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    status,
)
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import UserResponse
from ..security import get_current_user
from ..utils.logo import save_user_logo

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


# ============================================================
# CONSTANTS
# ============================================================

UPLOAD_DIR = "uploads/logos"

ALLOWED_LOGO_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

MAX_LOGO_SIZE = 5 * 1024 * 1024  # 5 MB


# ============================================================
# GET CURRENT USER PROFILE
# ============================================================

@router.get(
    "/profile",
    response_model=UserResponse,
)
def get_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user


# ============================================================
# UPDATE USER PROFILE
# ============================================================

@router.put(
    "/profile",
    response_model=UserResponse,
)
def update_profile(
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # --------------------------------------------------------
    # ACCOUNT
    # --------------------------------------------------------

    if user_data.name is not None:
        current_user.name = user_data.name


    if user_data.phone is not None:
        current_user.phone = user_data.phone

    # --------------------------------------------------------
    # BUSINESS IDENTITY
    # --------------------------------------------------------

    if user_data.company is not None:
        current_user.company = user_data.company

    if user_data.businessName is not None:
        current_user.business_name = user_data.businessName

    if user_data.businessType is not None:
        current_user.business_type = user_data.businessType

    if user_data.website is not None:
        current_user.website = user_data.website

    if user_data.bio is not None:
        current_user.bio = user_data.bio

    # --------------------------------------------------------
    # BUSINESS ADDRESS
    # --------------------------------------------------------

    if user_data.address is not None:
        current_user.address = user_data.address

    if user_data.city is not None:
        current_user.city = user_data.city

    if user_data.state is not None:
        current_user.state = user_data.state

    if user_data.zip is not None:
        current_user.zip = user_data.zip

    if user_data.country is not None:
        current_user.country = user_data.country

    # --------------------------------------------------------
    # TAX & LEGAL
    # --------------------------------------------------------

    if user_data.taxId is not None:
        current_user.tax_id = user_data.taxId

    if user_data.gstNumber is not None:
        current_user.gst_number = user_data.gstNumber

    if user_data.panNumber is not None:
        current_user.pan_number = user_data.panNumber

    if user_data.registrationNumber is not None:
        current_user.registration_number = (
            user_data.registrationNumber
        )

    # --------------------------------------------------------
    # INVOICE NUMBERING
    # --------------------------------------------------------

    if user_data.invoicePrefix is not None:
        current_user.invoice_prefix = user_data.invoicePrefix

    if user_data.invoiceStartingNumber is not None:
        current_user.invoice_starting_number = (
            user_data.invoiceStartingNumber
        )

    # --------------------------------------------------------
    # INVOICE DEFAULTS
    # --------------------------------------------------------

    if user_data.currency is not None:
        current_user.currency = user_data.currency

    if user_data.paymentTerms is not None:
        current_user.payment_terms = user_data.paymentTerms

    if user_data.invoiceNotes is not None:
        current_user.invoice_notes = user_data.invoiceNotes

    if user_data.invoiceTerms is not None:
        current_user.invoice_terms = user_data.invoiceTerms

    # --------------------------------------------------------
    # SAVE
    # --------------------------------------------------------

    try:
        db.commit()
        db.refresh(current_user)

    except Exception:
        db.rollback()
        raise

    return current_user

# ============================================================
# UPLOAD COMPANY LOGO
# ============================================================

@router.post(
    "/logo",
    response_model=UserResponse,
)
async def upload_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await save_user_logo(
        file=file,
        current_user=current_user,
        db=db,
    )

    return current_user

# ============================================================
# REMOVE COMPANY LOGO
# ============================================================

@router.delete(
    "/logo",
    response_model=UserResponse,
)
def remove_logo(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.logo_url:

        logo_path = current_user.logo_url.lstrip("/")

        if os.path.exists(logo_path):
            try:
                os.remove(logo_path)
            except OSError:
                pass

    current_user.logo_url = None

    db.commit()
    db.refresh(current_user)

    return current_user
