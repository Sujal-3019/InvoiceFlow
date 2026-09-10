from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.responses import Response
from sqlalchemy.orm import Session, joinedload

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
)

from ..database import get_db
from ..models import (
    User,
    Company,
    Client,
    Product,
    Quotation,
    QuotationItem,
)
from ..security import get_current_user
from ..email_utils import send_quotation_email

router = APIRouter(
    prefix="/quotations",
    tags=["Quotations"],
)


# ============================================================
# CONSTANTS
# ============================================================

UPLOAD_DIR = Path("uploads")
QUOTATION_LOGO_DIR = UPLOAD_DIR / "quotation_logos"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
QUOTATION_LOGO_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# HELPERS
# ============================================================

def money(value) -> Decimal:
    """
    Convert a value into a Decimal rounded to 2 decimal places.
    """
    if value is None:
        return Decimal("0.00")

    return Decimal(str(value)).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )


def get_user_company(
    db: Session,
    current_user: User,
) -> Company:
    """
    Return the currently active company for the logged-in user.
    """

    if not current_user.active_company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active company selected.",
        )

    company = (
        db.query(Company)
        .filter(
            Company.id == current_user.active_company_id,
            Company.user_id == current_user.id,
        )
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active company not found.",
        )

    return company


def get_quotation_for_company(
    db: Session,
    quotation_id: int,
    company_id: int,
) -> Quotation:
    """
    Fetch a quotation while ensuring it belongs to the
    currently active company.
    """

    quotation = (
        db.query(Quotation)
        .options(
            joinedload(Quotation.client),
            joinedload(Quotation.company),
            joinedload(Quotation.items),
        )
        .filter(
            Quotation.id == quotation_id,
            Quotation.company_id == company_id,
        )
        .first()
    )

    if not quotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quotation not found.",
        )

    return quotation


def calculate_item_totals(
    quantity: Decimal,
    unit_price: Decimal,
    gst_percent: Decimal,
):
    """
    Calculate subtotal, GST and final line total.
    """

    quantity = money(quantity)
    unit_price = money(unit_price)
    gst_percent = money(gst_percent)

    base_amount = money(quantity * unit_price)

    tax_amount = money(
        base_amount * gst_percent / Decimal("100")
    )

    line_total = money(
        base_amount + tax_amount
    )

    return base_amount, tax_amount, line_total


def calculate_quotation_totals(
    items_data,
    discount: Decimal,
):
    """
    Calculate quotation subtotal, discount, tax and grand total.
    """

    subtotal = Decimal("0.00")
    tax_amount = Decimal("0.00")

    for item in items_data:
        subtotal += money(item["base_amount"])
        tax_amount += money(item["tax_amount"])

    subtotal = money(subtotal)
    tax_amount = money(tax_amount)
    discount = money(discount)

    if discount < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Discount cannot be negative.",
        )

    if discount > subtotal:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Discount cannot be greater than subtotal.",
        )

    # GST is recalculated proportionally after discount,
    # matching the invoice behaviour.
    if subtotal > 0 and discount > 0:
        taxable_ratio = (
            subtotal - discount
        ) / subtotal

        tax_amount = money(
            tax_amount * taxable_ratio
        )

    grand_total = money(
        subtotal - discount + tax_amount
    )

    return (
        subtotal,
        discount,
        tax_amount,
        grand_total,
    )


def quotation_to_response(
    quotation: Quotation,
):
    """
    Convert a quotation SQLAlchemy object into a frontend-friendly
    dictionary.
    """

    return {
        "id": quotation.id,
        "company_id": quotation.company_id,
        "client_id": quotation.client_id,

        "quotation_number": quotation.quotation_number,
        "quotation_date": quotation.quotation_date,
        "valid_until": quotation.valid_until,

        "currency": quotation.currency,
        "logo_url": quotation.logo_url,

        "subtotal": money(quotation.subtotal),
        "discount": money(quotation.discount),
        "tax_amount": money(quotation.tax_amount),
        "grand_total": money(quotation.grand_total),

        "notes": quotation.notes,
        "terms": quotation.terms,

        "pdf_filename": quotation.pdf_filename,
        "pdf_generated_at": quotation.pdf_generated_at,

        "company": {
            "id": quotation.company.id,
            "company": quotation.company.company,
            "business_name": quotation.company.business_name,
            "business_type": quotation.company.business_type,
            "website": quotation.company.website,
            "phone": quotation.company.phone,
            "address": quotation.company.address,
            "city": quotation.company.city,
            "state": quotation.company.state,
            "zip": quotation.company.zip,
            "country": quotation.company.country,
            "tax_id": quotation.company.tax_id,
            "gst_number": quotation.company.gst_number,
            "pan_number": quotation.company.pan_number,
            "registration_number": quotation.company.registration_number,
            "logo_url": quotation.company.logo_url,
            "currency": quotation.company.currency,
        }
        if quotation.company
        else None,

        "client": {
            "id": quotation.client.id,
            "company_name": quotation.client.company_name,
            "contact_person": quotation.client.contact_person,
            "email": quotation.client.email,
            "phone": quotation.client.phone,
            "phone_country": quotation.client.phone_country,
            "gst_number": quotation.client.gst_number,
            "address": quotation.client.address,
        }
        if quotation.client
        else None,

        "items": [
            {
                "id": item.id,
                "quotation_id": item.quotation_id,
                "product_id": item.product_id,

                "product_name": item.product_name,
                "name": item.name,
                "description": item.description,

                "quantity": money(item.quantity),
                "unit_price": money(item.unit_price),
                "gst_percent": money(item.gst_percent),
                "tax_amount": money(item.tax_amount),
                "line_total": money(item.line_total),
            }
            for item in quotation.items
        ],
    }


# ============================================================
# NEXT QUOTATION NUMBER
# ============================================================

@router.get("/next-number")
def get_next_quotation_number(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate the next quotation number for the active company.

    Example:
        QT-1001
        QT-1002
        QT-1003
    """

    company = get_user_company(
        db,
        current_user,
    )

    prefix = (
        company.quotation_prefix
        or "QT-"
    )

    starting_number = (
        company.quotation_starting_number
        or 1001
    )

    latest = (
        db.query(Quotation)
        .filter(
            Quotation.company_id == company.id
        )
        .order_by(
            Quotation.id.desc()
        )
        .first()
    )

    if not latest:
        next_number = starting_number
    else:
        # Try to extract the numeric part from the latest
        # quotation number.
        numeric_part = ""

        for character in reversed(
            latest.quotation_number
        ):
            if character.isdigit():
                numeric_part = character + numeric_part
            else:
                break

        if numeric_part:
            next_number = int(numeric_part) + 1
        else:
            next_number = starting_number

    quotation_number = (
        f"{prefix}{next_number}"
    )

    return {
        "quotation_number": quotation_number
    }


# ============================================================
# CREATE QUOTATION
# ============================================================

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
def create_quotation(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a quotation and its quotation items.
    """

    company = get_user_company(
        db,
        current_user,
    )

    client_id = payload.get("client_id")

    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Client is required.",
        )

    client = (
        db.query(Client)
        .filter(
            Client.id == client_id,
            Client.company_id == company.id,
        )
        .first()
    )

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found.",
        )

    quotation_number = str(
        payload.get("quotation_number", "")
    ).strip()

    if not quotation_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quotation number is required.",
        )

    existing = (
        db.query(Quotation)
        .filter(
            Quotation.company_id == company.id,
            Quotation.quotation_number
            == quotation_number,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quotation number already exists.",
        )

    quotation_date = payload.get(
        "quotation_date"
    )

    if not quotation_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quotation date is required.",
        )

    try:
        quotation_date = (
            datetime.strptime(
                quotation_date,
                "%Y-%m-%d",
            ).date()
        )
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid quotation date.",
        )

    valid_until = payload.get(
        "valid_until"
    )

    if valid_until:
        try:
            valid_until = (
                datetime.strptime(
                    valid_until,
                    "%Y-%m-%d",
                ).date()
            )
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid valid_until date.",
            )

    if (
        valid_until
        and valid_until < quotation_date
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid until date cannot be before quotation date.",
        )

    items = payload.get("items") or []

    if not items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quotation must contain at least one item.",
        )

    processed_items = []

    for item_data in items:

        product_id = item_data.get(
            "product_id"
        )

        if not product_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product is required for every quotation item.",
            )

        product = (
            db.query(Product)
            .filter(
                Product.id == product_id,
                Product.company_id == company.id,
            )
            .first()
        )

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {product_id} not found.",
            )

        if not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product '{product.name}' is inactive.",
            )

        try:
            quantity = Decimal(
                str(
                    item_data.get(
                        "quantity",
                        1,
                    )
                )
            )
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid quantity for product '{product.name}'.",
            )

        if quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Quantity must be greater than zero for '{product.name}'.",
            )

        unit_price = money(
            product.price
        )

        gst_percent = money(
            product.gst_percent
        )

        base_amount, tax_amount, line_total = (
            calculate_item_totals(
                quantity,
                unit_price,
                gst_percent,
            )
        )

        processed_items.append(
            {
                "product": product,
                "quantity": quantity,
                "unit_price": unit_price,
                "gst_percent": gst_percent,
                "base_amount": base_amount,
                "tax_amount": tax_amount,
                "line_total": line_total,
            }
        )

    try:
        discount = Decimal(
            str(
                payload.get(
                    "discount",
                    0,
                )
            )
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid discount.",
        )

    (
        subtotal,
        discount,
        tax_amount,
        grand_total,
    ) = calculate_quotation_totals(
        processed_items,
        discount,
    )

    quotation = Quotation(
        company_id=company.id,
        client_id=client.id,

        quotation_number=quotation_number,
        quotation_date=quotation_date,
        valid_until=valid_until,

        currency=(
            payload.get("currency")
            or company.currency
            or "INR"
        )[:3].upper(),

        logo_url=(
            company.logo_url
        ),

        subtotal=subtotal,
        discount=discount,
        tax_amount=tax_amount,
        grand_total=grand_total,

        notes=payload.get("notes"),
        terms=payload.get("terms"),
    )

    db.add(quotation)
    db.flush()

    for item_data in processed_items:

        product = item_data["product"]

        quotation_item = QuotationItem(
            quotation_id=quotation.id,

            product_id=product.id,

            product_name=product.name,
            name=product.name,
            description=product.description,

            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            gst_percent=item_data["gst_percent"],

            tax_amount=item_data["tax_amount"],
            line_total=item_data["line_total"],
        )

        db.add(quotation_item)

    db.commit()

    quotation = get_quotation_for_company(
        db,
        quotation.id,
        company.id,
    )

    return quotation_to_response(
        quotation
    )


# ============================================================
# GET ALL QUOTATIONS
# ============================================================

@router.get("")
def get_quotations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return all quotations for the active company.
    """

    company = get_user_company(
        db,
        current_user,
    )

    quotations = (
        db.query(Quotation)
        .options(
            joinedload(Quotation.client),
            joinedload(Quotation.company),
            joinedload(Quotation.items),
        )
        .filter(
            Quotation.company_id == company.id
        )
        .order_by(
            Quotation.id.desc()
        )
        .all()
    )

    return [
        quotation_to_response(
            quotation
        )
        for quotation in quotations
    ]


# ============================================================
# GET SINGLE QUOTATION
# ============================================================

@router.get("/{quotation_id}")
def get_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return one quotation.
    """

    company = get_user_company(
        db,
        current_user,
    )

    quotation = get_quotation_for_company(
        db,
        quotation_id,
        company.id,
    )

    return quotation_to_response(
        quotation
    )


# ============================================================
# UPDATE QUOTATION
# ============================================================

@router.put("/{quotation_id}")
def update_quotation(
    quotation_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update quotation details and items.
    """

    company = get_user_company(
        db,
        current_user,
    )

    quotation = get_quotation_for_company(
        db,
        quotation_id,
        company.id,
    )

    # --------------------------------------------------------
    # CLIENT
    # --------------------------------------------------------

    client_id = payload.get(
        "client_id",
        quotation.client_id,
    )

    client = (
        db.query(Client)
        .filter(
            Client.id == client_id,
            Client.company_id == company.id,
        )
        .first()
    )

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found.",
        )

    # --------------------------------------------------------
    # QUOTATION NUMBER
    # --------------------------------------------------------

    quotation_number = str(
        payload.get(
            "quotation_number",
            quotation.quotation_number,
        )
    ).strip()

    if not quotation_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quotation number is required.",
        )

    duplicate = (
        db.query(Quotation)
        .filter(
            Quotation.company_id == company.id,
            Quotation.quotation_number
            == quotation_number,
            Quotation.id != quotation.id,
        )
        .first()
    )

    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quotation number already exists.",
        )

    # --------------------------------------------------------
    # DATES
    # --------------------------------------------------------

    quotation_date_value = payload.get(
        "quotation_date"
    )

    if quotation_date_value:
        try:
            quotation_date = datetime.strptime(
                quotation_date_value,
                "%Y-%m-%d",
            ).date()
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid quotation date.",
            )
    else:
        quotation_date = quotation.quotation_date

    valid_until_value = payload.get(
        "valid_until"
    )

    if valid_until_value:
        try:
            valid_until = datetime.strptime(
                valid_until_value,
                "%Y-%m-%d",
            ).date()
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid valid_until date.",
            )
    else:
        valid_until = None

    if (
        valid_until
        and valid_until < quotation_date
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid until date cannot be before quotation date.",
        )

    # --------------------------------------------------------
    # ITEMS
    # --------------------------------------------------------

    items = payload.get("items")

    if items is None:
        items = [
            {
                "product_id": item.product_id,
                "quantity": item.quantity,
            }
            for item in quotation.items
        ]

    if not items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quotation must contain at least one item.",
        )

    processed_items = []

    for item_data in items:

        product_id = item_data.get(
            "product_id"
        )

        product = (
            db.query(Product)
            .filter(
                Product.id == product_id,
                Product.company_id == company.id,
            )
            .first()
        )

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {product_id} not found.",
            )

        if not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product '{product.name}' is inactive.",
            )

        try:
            quantity = Decimal(
                str(
                    item_data.get(
                        "quantity",
                        1,
                    )
                )
            )
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid quantity for '{product.name}'.",
            )

        if quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Quantity must be greater than zero for '{product.name}'.",
            )

        unit_price = money(
            product.price
        )

        gst_percent = money(
            product.gst_percent
        )

        base_amount, item_tax, line_total = (
            calculate_item_totals(
                quantity,
                unit_price,
                gst_percent,
            )
        )

        processed_items.append(
            {
                "product": product,
                "quantity": quantity,
                "unit_price": unit_price,
                "gst_percent": gst_percent,
                "base_amount": base_amount,
                "tax_amount": item_tax,
                "line_total": line_total,
            }
        )

    try:
        discount = Decimal(
            str(
                payload.get(
                    "discount",
                    quotation.discount,
                )
            )
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid discount.",
        )

    (
        subtotal,
        discount,
        tax_amount,
        grand_total,
    ) = calculate_quotation_totals(
        processed_items,
        discount,
    )

    # --------------------------------------------------------
    # UPDATE HEADER
    # --------------------------------------------------------

    quotation.client_id = client.id
    quotation.quotation_number = quotation_number
    quotation.quotation_date = quotation_date
    quotation.valid_until = valid_until

    quotation.currency = (
        payload.get("currency")
        or quotation.currency
        or company.currency
        or "INR"
    )[:3].upper()

    quotation.subtotal = subtotal
    quotation.discount = discount
    quotation.tax_amount = tax_amount
    quotation.grand_total = grand_total

    quotation.notes = payload.get(
        "notes"
    )

    quotation.terms = payload.get(
        "terms"
    )

    # --------------------------------------------------------
    # REPLACE ITEMS
    # --------------------------------------------------------

    quotation.items.clear()

    for item_data in processed_items:

        product = item_data["product"]

        quotation.items.append(
            QuotationItem(
                product_id=product.id,

                product_name=product.name,
                name=product.name,
                description=product.description,

                quantity=item_data["quantity"],
                unit_price=item_data["unit_price"],
                gst_percent=item_data["gst_percent"],

                tax_amount=item_data["tax_amount"],
                line_total=item_data["line_total"],
            )
        )

    # Stored PDF is now outdated.
    quotation.pdf_data = None
    quotation.pdf_filename = None
    quotation.pdf_generated_at = None

    db.commit()

    quotation = get_quotation_for_company(
        db,
        quotation.id,
        company.id,
    )

    return quotation_to_response(
        quotation
    )


# ============================================================
# DELETE QUOTATION
# ============================================================

@router.delete("/{quotation_id}")
def delete_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a quotation.
    """

    company = get_user_company(
        db,
        current_user,
    )

    quotation = get_quotation_for_company(
        db,
        quotation_id,
        company.id,
    )

    db.delete(quotation)
    db.commit()

    return {
        "message": "Quotation deleted successfully."
    }


# ============================================================
# PDF GENERATION
# ============================================================

def generate_quotation_pdf(
    quotation: Quotation,
) -> bytes:
    """
    Generate a professional quotation PDF.
    """

    from io import BytesIO

    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "QuotationTitle",
        parent=styles["Heading1"],
        fontSize=22,
        leading=26,
        alignment=TA_RIGHT,
        spaceAfter=5,
    )

    company_style = ParagraphStyle(
        "Company",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        alignment=TA_LEFT,
    )

    normal_style = ParagraphStyle(
        "NormalQuotation",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
    )

    small_style = ParagraphStyle(
        "SmallQuotation",
        parent=styles["Normal"],
        fontSize=8,
        leading=10,
    )

    right_style = ParagraphStyle(
        "RightQuotation",
        parent=normal_style,
        alignment=TA_RIGHT,
    )

    center_style = ParagraphStyle(
        "CenterQuotation",
        parent=normal_style,
        alignment=TA_CENTER,
    )

    story = []

    # --------------------------------------------------------
    # HEADER
    # --------------------------------------------------------

    company_name = (
        quotation.company.business_name
        or quotation.company.company
        or "Company"
    )

    company_lines = [
        f"<b>{company_name}</b>",
    ]

    if quotation.company.address:
        company_lines.append(
            quotation.company.address
        )

    address_parts = [
        quotation.company.city,
        quotation.company.state,
        quotation.company.zip,
        quotation.company.country,
    ]

    address_line = ", ".join(
        part
        for part in address_parts
        if part
    )

    if address_line:
        company_lines.append(
            address_line
        )

    if quotation.company.phone:
        company_lines.append(
            f"Phone: {quotation.company.phone}"
        )

    if quotation.company.gst_number:
        company_lines.append(
            f"GSTIN: {quotation.company.gst_number}"
        )

    company_text = "<br/>".join(
        company_lines
    )

    header_data = [
        [
            Paragraph(
                company_text,
                company_style,
            ),
            Paragraph(
                "QUOTATION",
                title_style,
            ),
        ]
    ]

    header_table = Table(
        header_data,
        colWidths=[
            105 * mm,
            65 * mm,
        ],
    )

    header_table.setStyle(
        TableStyle(
            [
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP",
                ),
                (
                    "ALIGN",
                    (1, 0),
                    (1, 0),
                    "RIGHT",
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    10,
                ),
            ]
        )
    )

    story.append(
        header_table
    )

    # --------------------------------------------------------
    # QUOTATION DETAILS
    # --------------------------------------------------------

    client = quotation.client

    client_text = (
        f"<b>Prepared For</b><br/>"
        f"{client.company_name}"
    )

    if client.contact_person:
        client_text += (
            f"<br/>Contact: "
            f"{client.contact_person}"
        )

    if client.email:
        client_text += (
            f"<br/>{client.email}"
        )

    if client.phone:
        client_text += (
            f"<br/>{client.phone}"
        )

    if client.address:
        client_text += (
            f"<br/>{client.address}"
        )

    details_text = (
        f"<b>Quotation No:</b> "
        f"{quotation.quotation_number}<br/>"
        f"<b>Quotation Date:</b> "
        f"{quotation.quotation_date.strftime('%d %b %Y')}<br/>"
        f"<b>Valid Until:</b> "
        f"{quotation.valid_until.strftime('%d %b %Y') if quotation.valid_until else 'Not specified'}"
    )

    details_table = Table(
        [
            [
                Paragraph(
                    client_text,
                    normal_style,
                ),
                Paragraph(
                    details_text,
                    right_style,
                ),
            ]
        ],
        colWidths=[
            105 * mm,
            65 * mm,
        ],
    )

    details_table.setStyle(
        TableStyle(
            [
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP",
                ),
                (
                    "ALIGN",
                    (1, 0),
                    (1, 0),
                    "RIGHT",
                ),
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    colors.HexColor("#F7F7F7"),
                ),
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.HexColor("#DDDDDD"),
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
            ]
        )
    )

    story.append(
        details_table
    )

    story.append(
        Spacer(1, 8)
    )

    # --------------------------------------------------------
    # ITEMS
    # --------------------------------------------------------

    item_rows = [
        [
            Paragraph(
                "<b>#</b>",
                center_style,
            ),
            Paragraph(
                "<b>Item</b>",
                normal_style,
            ),
            Paragraph(
                "<b>Qty</b>",
                center_style,
            ),
            Paragraph(
                "<b>Rate</b>",
                right_style,
            ),
            Paragraph(
                "<b>GST</b>",
                center_style,
            ),
            Paragraph(
                "<b>Total</b>",
                right_style,
            ),
        ]
    ]

    for index, item in enumerate(
        quotation.items,
        start=1,
    ):

        item_name = (
            item.name
            or item.product_name
            or "Item"
        )

        description = ""

        if item.description:
            description = (
                f"<br/><font size='7'>"
                f"{item.description}"
                f"</font>"
            )

        item_rows.append(
            [
                Paragraph(
                    str(index),
                    center_style,
                ),
                Paragraph(
                    f"<b>{item_name}</b>"
                    f"{description}",
                    normal_style,
                ),
                Paragraph(
                    str(money(item.quantity)),
                    center_style,
                ),
                Paragraph(
                    f"{money(item.unit_price):,.2f}",
                    right_style,
                ),
                Paragraph(
                    f"{money(item.gst_percent):,.2f}%",
                    center_style,
                ),
                Paragraph(
                    f"{money(item.line_total):,.2f}",
                    right_style,
                ),
            ]
        )

    items_table = Table(
        item_rows,
        colWidths=[
            10 * mm,
            65 * mm,
            18 * mm,
            25 * mm,
            20 * mm,
            32 * mm,
        ],
        repeatRows=1,
    )

    items_table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    colors.HexColor("#EEEEEE"),
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.4,
                    colors.HexColor("#CCCCCC"),
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP",
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),
            ]
        )
    )

    story.append(
        items_table
    )

    story.append(
        Spacer(1, 8)
    )

    # --------------------------------------------------------
    # TOTALS
    # --------------------------------------------------------

    totals_rows = [
        [
            "",
            Paragraph(
                "Subtotal",
                right_style,
            ),
            Paragraph(
                f"{quotation.currency} "
                f"{money(quotation.subtotal):,.2f}",
                right_style,
            ),
        ],
        [
            "",
            Paragraph(
                "Discount",
                right_style,
            ),
            Paragraph(
                f"- {quotation.currency} "
                f"{money(quotation.discount):,.2f}",
                right_style,
            ),
        ],
        [
            "",
            Paragraph(
                "Tax",
                right_style,
            ),
            Paragraph(
                f"{quotation.currency} "
                f"{money(quotation.tax_amount):,.2f}",
                right_style,
            ),
        ],
        [
            "",
            Paragraph(
                "<b>Grand Total</b>",
                right_style,
            ),
            Paragraph(
                f"<b>{quotation.currency} "
                f"{money(quotation.grand_total):,.2f}</b>",
                right_style,
            ),
        ],
    ]

    totals_table = Table(
        totals_rows,
        colWidths=[
            90 * mm,
            40 * mm,
            40 * mm,
        ],
    )

    totals_table.setStyle(
        TableStyle(
            [
                (
                    "ALIGN",
                    (1, 0),
                    (-1, -1),
                    "RIGHT",
                ),
                (
                    "LINEABOVE",
                    (1, 3),
                    (-1, 3),
                    1,
                    colors.black,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    4,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    4,
                ),
            ]
        )
    )

    story.append(
        totals_table
    )

    story.append(
        Spacer(1, 12)
    )

    # --------------------------------------------------------
    # NOTES
    # --------------------------------------------------------

    if quotation.notes:

        notes_block = [
            Paragraph(
                "<b>Notes</b>",
                normal_style,
            ),
            Spacer(1, 3),
            Paragraph(
                quotation.notes.replace(
                    "\n",
                    "<br/>",
                ),
                small_style,
            ),
        ]

        story.append(
            KeepTogether(
                notes_block
            )
        )

        story.append(
            Spacer(1, 8)
        )

    # --------------------------------------------------------
    # TERMS
    # --------------------------------------------------------

    if quotation.terms:

        terms_block = [
            Paragraph(
                "<b>Terms & Conditions</b>",
                normal_style,
            ),
            Spacer(1, 3),
            Paragraph(
                quotation.terms.replace(
                    "\n",
                    "<br/>",
                ),
                small_style,
            ),
        ]

        story.append(
            KeepTogether(
                terms_block
            )
        )

    story.append(
        Spacer(1, 15)
    )

    story.append(
        Paragraph(
            "This quotation is subject to the terms and conditions mentioned above.",
            center_style,
        )
    )

    doc.build(story)

    return buffer.getvalue()


# ============================================================
# GENERATE / STORE PDF
# ============================================================

@router.post("/{quotation_id}/pdf")
def generate_quotation_pdf_endpoint(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate a fresh quotation PDF and store it.
    """

    company = get_user_company(
        db,
        current_user,
    )

    quotation = get_quotation_for_company(
        db,
        quotation_id,
        company.id,
    )

    pdf_bytes = generate_quotation_pdf(
        quotation
    )

    filename = (
        f"{quotation.quotation_number}.pdf"
    )

    quotation.pdf_data = pdf_bytes
    quotation.pdf_filename = filename
    quotation.pdf_generated_at = (
        datetime.utcnow()
    )

    db.commit()

    return {
        "message": "Quotation PDF generated successfully.",
        "filename": filename,
    }


# ============================================================
# DOWNLOAD STORED PDF
# ============================================================

@router.get("/{quotation_id}/pdf")
def download_quotation_pdf(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Download the stored quotation PDF.
    """

    company = get_user_company(
        db,
        current_user,
    )

    quotation = get_quotation_for_company(
        db,
        quotation_id,
        company.id,
    )

    if not quotation.pdf_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quotation PDF has not been generated yet.",
        )

    filename = (
        quotation.pdf_filename
        or f"{quotation.quotation_number}.pdf"
    )

    return Response(
        content=quotation.pdf_data,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        },
    )


# ============================================================
# UPLOAD QUOTATION LOGO
# ============================================================

@router.post("/{quotation_id}/logo")
async def upload_quotation_logo(
    quotation_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a logo for a quotation.
    """

    company = get_user_company(
        db,
        current_user,
    )

    quotation = get_quotation_for_company(
        db,
        quotation_id,
        company.id,
    )

    allowed_types = {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/webp": ".webp",
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PNG, JPG, JPEG and WEBP images are allowed.",
        )

    contents = await file.read()

    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Logo size cannot exceed 5MB.",
        )

    extension = allowed_types[
        file.content_type
    ]

    filename = (
        f"quotation_{quotation.id}_"
        f"{int(datetime.utcnow().timestamp())}"
        f"{extension}"
    )

    filepath = (
        QUOTATION_LOGO_DIR
        / filename
    )

    with open(filepath, "wb") as output_file:
        output_file.write(contents)

    logo_url = (
        f"/uploads/quotation_logos/"
        f"{filename}"
    )

    quotation.logo_url = logo_url

    # A newly uploaded logo means the old PDF is stale.
    quotation.pdf_data = None
    quotation.pdf_filename = None
    quotation.pdf_generated_at = None

    db.commit()

    return {
        "message": "Quotation logo uploaded successfully.",
        "logo_url": logo_url,
    }

# ============================================================
# SEND QUOTATION EMAIL
# ============================================================

@router.post(
    "/{quotation_id}/send",
)
def send_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # --------------------------------------------------------
    # GET USER COMPANY
    # --------------------------------------------------------

    company = get_user_company(
        db,
        current_user,
    )

    company_id = company.id

    # --------------------------------------------------------
    # GET QUOTATION
    # --------------------------------------------------------

    quotation = (
        db.query(Quotation)
        .options(
            joinedload(Quotation.company),
            joinedload(Quotation.client),
            joinedload(Quotation.items),
        )
        .filter(
            Quotation.id == quotation_id,
            Quotation.company_id == company_id,
        )
        .first()
    )

    if not quotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quotation not found.",
        )

    # --------------------------------------------------------
    # CHECK CLIENT
    # --------------------------------------------------------

    if not quotation.client:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This quotation does not have a client.",
        )

    client_email = quotation.client.email

    if not client_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This client does not have an email address.",
        )

    # --------------------------------------------------------
    # COMPANY NAME
    # --------------------------------------------------------

    company_name = (
        company.business_name
        or getattr(company, "company", None)
        or "Your Company"
    )

    # --------------------------------------------------------
    # CLIENT NAME
    # --------------------------------------------------------

    client_name = (
        getattr(quotation.client, "contact_person", None)
        or getattr(quotation.client, "company_name", None)
        or client_email.split("@")[0]
    )

    # --------------------------------------------------------
    # GENERATE QUOTATION PDF
    # --------------------------------------------------------

    try:

        pdf_bytes = generate_quotation_pdf(
            quotation
        )

    except Exception as exc:

        print(
            "QUOTATION PDF GENERATION ERROR:",
            repr(exc),
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate quotation PDF.",
        ) from exc

    # --------------------------------------------------------
    # PDF FILENAME
    # --------------------------------------------------------

    filename = (
        f"quotation_"
        f"{quotation.quotation_number}"
        f".pdf"
    )

    # --------------------------------------------------------
    # FORMAT QUOTATION DATA
    # --------------------------------------------------------

    quotation_date = (
        quotation.quotation_date.strftime("%d/%m/%Y")
        if quotation.quotation_date
        else "-"
    )

    valid_until = (
        quotation.valid_until.strftime("%d/%m/%Y")
        if quotation.valid_until
        else "NO EXPIRY"
    )

    amount = str(
        quotation.grand_total
        if quotation.grand_total is not None
        else "0"
    )

    # --------------------------------------------------------
    # SEND EMAIL
    # --------------------------------------------------------

    try:

        send_quotation_email(
            recipient_email=client_email,
            quotation_number=quotation.quotation_number,
            quotation_date=quotation_date,
            valid_until=valid_until,
            amount=amount,
            pdf_bytes=pdf_bytes,
            pdf_filename=filename,
            company_name=company_name,
            client_name=client_name,
        )

    except Exception as exc:

        print(
            "QUOTATION EMAIL ERROR:",
            repr(exc),
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to send quotation email.",
        ) from exc

    # --------------------------------------------------------
    # SUCCESS
    # --------------------------------------------------------

    return {
        "message": "Quotation sent successfully.",
        "quotation_id": quotation.id,
        "quotation_number": quotation.quotation_number,
        "recipient": client_email,
        "filename": filename,
    }