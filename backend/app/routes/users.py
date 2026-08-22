from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    status,
)
from sqlalchemy.orm import Session
from sqlalchemy import func
import os
import uuid

from ..database import get_db
from ..models import User, Company
from ..schemas import UserResponse , ChangePasswordRequest
from ..security import get_current_user , hash_password, verify_password


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


UPLOAD_DIR = "uploads/logos"

ALLOWED_LOGO_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

MAX_LOGO_SIZE = 2 * 1024 * 1024


def get_payload_value(data: dict, snake_name: str, camel_name: str | None = None, default=None):
    if snake_name in data:
        return data.get(snake_name)

    if camel_name and camel_name in data:
        return data.get(camel_name)

    return default


def get_current_company(
    company_id: int | None,
    current_user: User,
    db: Session,
):
    # If client doesn't provide a company_id, prefer the user's
    # active_company_id (if it exists). Otherwise fall back to the
    # first company the user owns (existing behavior).
    if company_id is None:
        active_id = getattr(current_user, "active_company_id", None)
        if active_id is not None:
            company_id = active_id

    query = db.query(Company).filter(
        Company.user_id == current_user.id,
    )

    if company_id is not None:
        query = query.filter(
            Company.id == company_id,
        )

    company = (
        query
        .order_by(Company.id.asc())
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )

    return company


# ============================================================
# GET CURRENT USER
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
# UPDATE CURRENT USER
# ============================================================
#
# Only account-level information belongs here.
#
# Company information is NOT updated through this endpoint.
#
# ============================================================

@router.put(
    "/profile",
    response_model=UserResponse,
)
def update_profile(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # --------------------------------------------------------
    # ACCOUNT INFORMATION
    # --------------------------------------------------------

    if "name" in data and data["name"] is not None:
        current_user.name = data["name"]

    if "email" in data and data["email"] is not None:
        # ----------------------------------------------------
        # Check whether another user already has this email
        # ----------------------------------------------------

        existing_user = (
            db.query(User)
            .filter(
                User.email == data["email"],
                User.id != current_user.id,
            )
            .first()
        )

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already exists",
            )

        current_user.email = data["email"]

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
# GET ALL COMPANIES OF CURRENT USER
# ============================================================

@router.get(
    "/companies",
)
def get_user_companies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    companies = (
        db.query(Company)
        .filter(
            Company.user_id == current_user.id
        )
        .order_by(Company.company_number.asc())
        .all()
    )

    return {
        "companies": companies
    }


# ============================================================
# GET ONE COMPANY
# ============================================================

@router.get(
    "/companies/{company_id}",
)
def get_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company = (
        db.query(Company)
        .filter(
            Company.id == company_id,
            Company.user_id == current_user.id,
        )
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )

    return company


# ============================================================
# CREATE COMPANY
# ============================================================

@router.post(
    "/companies",
)
def create_company(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Determine the company's per-user number (1 for first company, etc.)
    max_number = (
        db.query(func.max(Company.company_number))
        .filter(Company.user_id == current_user.id)
        .scalar()
    )

    next_number = 1 if max_number is None else int(max_number) + 1

    company = Company(
        user_id=current_user.id,
        company_number=next_number,

        company=get_payload_value(data, "company"),
        business_name=get_payload_value(
            data,
            "business_name",
            "businessName",
        ),
        business_type=get_payload_value(
            data,
            "business_type",
            "businessType",
        ),

        website=get_payload_value(data, "website"),
        bio=get_payload_value(data, "bio"),
        phone=get_payload_value(data, "phone"),

        address=get_payload_value(data, "address"),
        city=get_payload_value(data, "city"),
        state=get_payload_value(data, "state"),
        zip=get_payload_value(data, "zip"),
        country=get_payload_value(data, "country"),

        tax_id=get_payload_value(data, "tax_id", "taxId"),
        gst_number=get_payload_value(data, "gst_number", "gstNumber"),
        pan_number=get_payload_value(data, "pan_number", "panNumber"),
        registration_number=get_payload_value(
            data,
            "registration_number",
            "registrationNumber",
        ),

        invoice_prefix=get_payload_value(
            data,
            "invoice_prefix",
            "invoicePrefix",
            "INV-",
        ),

        invoice_starting_number=get_payload_value(
            data,
            "invoice_starting_number",
            "invoiceStartingNumber",
            1001,
        ),

        currency=get_payload_value(
            data,
            "currency",
            None,
            "INR",
        ),

        payment_terms=get_payload_value(
            data,
            "payment_terms",
            "paymentTerms",
            "Net 30",
        ),

        invoice_notes=get_payload_value(
            data,
            "invoice_notes",
            "invoiceNotes",
        ),

        invoice_terms=get_payload_value(
            data,
            "invoice_terms",
            "invoiceTerms",
        ),
    )

    db.add(company)
    db.commit()
    db.refresh(company)

    # If the user doesn't yet have an active company, set this new
    # company as their active company so the frontend can rely on it.
    if getattr(current_user, "active_company_id", None) is None:
        current_user.active_company_id = company.id
        try:
            db.add(current_user)
            db.commit()
            db.refresh(current_user)
        except Exception:
            db.rollback()
            # Not critical; company creation already succeeded.

    return company


@router.post(
    "/companies/{company_id}/switch",
)
def switch_active_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Ensure company belongs to user
    company = (
        db.query(Company)
        .filter(
            Company.id == company_id,
            Company.user_id == current_user.id,
        )
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )

    current_user.active_company_id = company.id

    try:
        db.add(current_user)
        db.commit()
        db.refresh(current_user)
    except Exception:
        db.rollback()
        raise

    return {"message": "Active company switched", "active_company_id": company.id}


# ============================================================
# UPDATE COMPANY
# ============================================================

@router.put(
    "/companies/{company_id}",
)
def update_company(
    company_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # --------------------------------------------------------
    # IMPORTANT:
    #
    # The company must belong to the logged-in user.
    #
    # This prevents:
    #
    # User A → accessing User B's company
    #
    # --------------------------------------------------------

    company = (
        db.query(Company)
        .filter(
            Company.id == company_id,
            Company.user_id == current_user.id,
        )
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )

    # --------------------------------------------------------
    # BUSINESS IDENTITY
    # --------------------------------------------------------

    if "company" in data:
        company.company = data["company"]

    if "business_name" in data or "businessName" in data:
        company.business_name = get_payload_value(
            data,
            "business_name",
            "businessName",
        )

    if "business_type" in data or "businessType" in data:
        company.business_type = get_payload_value(
            data,
            "business_type",
            "businessType",
        )

    if "website" in data:
        company.website = data["website"]

    if "bio" in data:
        company.bio = data["bio"]

    if "phone" in data:
        company.phone = data["phone"]

    # --------------------------------------------------------
    # ADDRESS
    # --------------------------------------------------------

    if "address" in data:
        company.address = data["address"]

    if "city" in data:
        company.city = data["city"]

    if "state" in data:
        company.state = data["state"]

    if "zip" in data:
        company.zip = data["zip"]

    if "country" in data:
        company.country = data["country"]

    # --------------------------------------------------------
    # TAX & LEGAL
    # --------------------------------------------------------

    if "tax_id" in data or "taxId" in data:
        company.tax_id = get_payload_value(data, "tax_id", "taxId")

    if "gst_number" in data or "gstNumber" in data:
        company.gst_number = get_payload_value(data, "gst_number", "gstNumber")

    if "pan_number" in data or "panNumber" in data:
        company.pan_number = get_payload_value(data, "pan_number", "panNumber")

    if "registration_number" in data or "registrationNumber" in data:
        company.registration_number = get_payload_value(
            data,
            "registration_number",
            "registrationNumber",
        )

    # --------------------------------------------------------
    # INVOICE NUMBERING
    # --------------------------------------------------------

    if "invoice_prefix" in data or "invoicePrefix" in data:
        company.invoice_prefix = get_payload_value(
            data,
            "invoice_prefix",
            "invoicePrefix",
        )

    if "invoice_starting_number" in data or "invoiceStartingNumber" in data:
        company.invoice_starting_number = get_payload_value(
            data,
            "invoice_starting_number",
            "invoiceStartingNumber",
        )

    # --------------------------------------------------------
    # INVOICE DEFAULTS
    # --------------------------------------------------------

    if "currency" in data:
        company.currency = data["currency"]

    if "payment_terms" in data or "paymentTerms" in data:
        company.payment_terms = get_payload_value(
            data,
            "payment_terms",
            "paymentTerms",
        )

    if "invoice_notes" in data or "invoiceNotes" in data:
        company.invoice_notes = get_payload_value(
            data,
            "invoice_notes",
            "invoiceNotes",
        )

    if "invoice_terms" in data or "invoiceTerms" in data:
        company.invoice_terms = get_payload_value(
            data,
            "invoice_terms",
            "invoiceTerms",
        )

    # --------------------------------------------------------
    # SAVE
    # --------------------------------------------------------

    try:
        db.commit()
        db.refresh(company)

    except Exception:
        db.rollback()
        raise

    return company


# ============================================================
# COMPANY LOGO
# ============================================================

@router.post(
    "/logo",
)
async def upload_company_logo(
    company_id: int | None = None,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company = get_current_company(
        company_id=company_id,
        current_user=current_user,
        db=db,
    )

    if file.content_type not in ALLOWED_LOGO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Logo must be JPG, PNG, or WebP.",
        )

    contents = await file.read()

    if len(contents) > MAX_LOGO_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Logo must be smaller than 2MB.",
        )

    os.makedirs(
        UPLOAD_DIR,
        exist_ok=True,
    )

    extension = ALLOWED_LOGO_TYPES[file.content_type]
    filename = (
        f"company_{company.id}_"
        f"{uuid.uuid4().hex}"
        f"{extension}"
    )
    filepath = os.path.join(
        UPLOAD_DIR,
        filename,
    )

    try:
        with open(filepath, "wb") as buffer:
            buffer.write(contents)
    except OSError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save logo file.",
        )

    old_logo_url = company.logo_url
    company.logo_url = f"/uploads/logos/{filename}"

    try:
        db.commit()
        db.refresh(company)
    except Exception:
        db.rollback()

        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except OSError:
                pass

        raise

    if old_logo_url and old_logo_url != company.logo_url:
        old_logo_path = old_logo_url.lstrip("/")

        if os.path.exists(old_logo_path):
            try:
                os.remove(old_logo_path)
            except OSError:
                pass

    return company


@router.delete(
    "/logo",
)
def remove_company_logo(
    company_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company = get_current_company(
        company_id=company_id,
        current_user=current_user,
        db=db,
    )

    old_logo_url = company.logo_url
    company.logo_url = None

    db.commit()
    db.refresh(company)

    if old_logo_url:
        old_logo_path = old_logo_url.lstrip("/")

        if os.path.exists(old_logo_path):
            try:
                os.remove(old_logo_path)
            except OSError:
                pass

    return company


# ============================================================
# DELETE COMPANY
# ============================================================

@router.delete(
    "/companies/{company_id}",
)
def delete_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company = (
        db.query(Company)
        .filter(
            Company.id == company_id,
            Company.user_id == current_user.id,
        )
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )

    # --------------------------------------------------------
    # Prevent deleting the last company
    # --------------------------------------------------------

    company_count = (
        db.query(Company)
        .filter(
            Company.user_id == current_user.id
        )
        .count()
    )

    if company_count <= 1:
        raise HTTPException(
            status_code=400,
            detail="You must have at least one company",
        )

    # capture whether deleted company was active
    was_active = (
        getattr(current_user, "active_company_id", None) == company.id
    )

    db.delete(company)
    db.commit()

    # If the deleted company was the user's active company,
    # set a new active company (first available) to avoid leaving
    # the user's active_company_id pointing to a deleted row.
    if was_active:
        new_company = (
            db.query(Company)
            .filter(
                Company.user_id == current_user.id,
            )
            .order_by(Company.id.asc())
            .first()
        )

        current_user.active_company_id = (
            new_company.id if new_company else None
        )
        try:
            db.add(current_user)
            db.commit()
            db.refresh(current_user)
        except Exception:
            db.rollback()

    return {
        "message": "Company deleted successfully"
    }

# ============================================================
# CHANGE PASSWORD
# ============================================================

@router.put("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # ========================================================
    # CHECK WHETHER USER HAS A PASSWORD
    # ========================================================

    if not current_user.password:
        raise HTTPException(
            status_code=400,
            detail="Password is not set for this account",
        )

    # ========================================================
    # VERIFY CURRENT PASSWORD
    # ========================================================

    if not verify_password(
        data.current_password,
        current_user.password,
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect",
        )

    # ========================================================
    # VALIDATE NEW PASSWORD
    # ========================================================

    if len(data.new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="New password must be at least 8 characters",
        )

    # ========================================================
    # CONFIRM NEW PASSWORD
    # ========================================================

    if data.new_password != data.confirm_password:
        raise HTTPException(
            status_code=400,
            detail="New passwords do not match",
        )

    # ========================================================
    # PREVENT SAME PASSWORD
    # ========================================================

    if verify_password(
        data.new_password,
        current_user.password,
    ):
        raise HTTPException(
            status_code=400,
            detail="New password must be different from current password",
        )

    # ========================================================
    # HASH AND SAVE NEW PASSWORD
    # ========================================================

    current_user.password = hash_password(
        data.new_password
    )

    db.commit()
    db.refresh(current_user)

    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "message": "Password changed successfully"
    }