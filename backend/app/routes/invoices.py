from decimal import Decimal, ROUND_HALF_UP
from io import BytesIO
from datetime import datetime
import os
import uuid
from app.models import (
    Invoice,
    InvoiceItem,
    Client,
    Product,
    User,
    Company,
)
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
    Response,
)
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

# ReportLab
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import (
    getSampleStyleSheet,
    ParagraphStyle,
)
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    KeepTogether,
)

from ..database import get_db
from ..models import (
    Invoice,
    InvoiceItem,
    Client,
    Product,
    User,
    Company,
)
from ..schemas import (
    InvoiceCreate,
    InvoiceUpdate,
    InvoiceResponse,
    InvoiceReminderRequest,
)
from ..security import get_current_user
from ..email_utils import send_invoice_email , send_payment_reminder_email


router = APIRouter(
    prefix="/invoices",
    tags=["Invoices"],
)


# ============================================================
# CONSTANTS
# ============================================================

ZERO = Decimal("0.00")
TWO_PLACES = Decimal("0.01")

ALLOWED_INVOICE_STATUSES = {
    "draft",
    "sent",
    "cancelled",
}

ALLOWED_PAYMENT_STATUSES = {
    "unpaid",
    "partial",
    "paid",
    "overdue",
}


# ============================================================
# INVOICE LOGO CONSTANTS
# ============================================================

UPLOAD_DIR = "uploads/invoice_logos"

ALLOWED_INVOICE_LOGO_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

MAX_INVOICE_LOGO_SIZE = 5 * 1024 * 1024  # 5 MB


# ============================================================
# PDF CONSTANTS
# ============================================================

PDF_MIME_TYPE = "application/pdf"

PDF_MAX_LOGO_WIDTH = 45 * mm
PDF_MAX_LOGO_HEIGHT = 25 * mm


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def money(value: Decimal) -> Decimal:
    """
    Round monetary values to two decimal places.
    """

    return Decimal(value).quantize(
        TWO_PLACES,
        rounding=ROUND_HALF_UP,
    )


def calculate_payment_status(
    amount_paid: Decimal,
    grand_total: Decimal,
    due_date=None,
 ):
    """
    Calculate amount due and payment status.
    """

    amount_paid = money(amount_paid)
    grand_total = money(grand_total)

    if amount_paid < ZERO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Paid amount cannot be negative.",
        )

    if amount_paid > grand_total:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Paid amount cannot be greater than the invoice total.",
        )

    amount_due = money(
        grand_total - amount_paid
    )

    # Fully paid
    if amount_paid == grand_total:
        payment_status = "paid"

    # Payment is still pending
    elif due_date is not None and due_date < datetime.now().date():
        payment_status = "overdue"

    # Partially paid but not overdue
    elif amount_paid > ZERO:
        payment_status = "partial"

    # Not paid and not overdue
    else:
        payment_status = "unpaid"

    return (
        amount_paid,
        amount_due,
        payment_status,
    )

def update_payment_status(invoice: Invoice):
    """
    Update invoice payment status based on:
    - amount_paid
    - grand_total
    - due_date
    """

    amount_paid = money(
        Decimal(invoice.amount_paid or 0)
    )

    grand_total = money(
        Decimal(invoice.grand_total or 0)
    )

    # Fully paid
    if amount_paid >= grand_total:
        invoice.payment_status = "paid"

    # Unpaid/partial invoice past due date
    elif (
        invoice.due_date is not None
        and invoice.due_date < datetime.now().date()
    ):
        invoice.payment_status = "overdue"

    # Partially paid
    elif amount_paid > ZERO:
        invoice.payment_status = "partial"

    # Not paid
    else:
        invoice.payment_status = "unpaid"

    return invoice.payment_status


def calculate_item_totals(
    quantity: Decimal,
    unit_price: Decimal,
    gst_percent: Decimal,
):
    """
    Calculate subtotal, GST and total for one invoice item.
    """

    line_subtotal = money(
        quantity * unit_price
    )

    tax_amount = money(
        line_subtotal
        * gst_percent
        / Decimal("100")
    )

    line_total = money(
        line_subtotal + tax_amount
    )

    return (
        line_subtotal,
        tax_amount,
        line_total,
    )


def delete_logo_file(
    logo_url: str | None,
):
    """
    Delete a previously saved logo file from disk.

    The database stores paths such as:

        /uploads/logos/filename.png
        /uploads/invoice_logos/filename.png
    """

    if not logo_url:
        return

    logo_path = logo_url.lstrip("/")

    if os.path.exists(logo_path):
        try:
            os.remove(logo_path)
        except OSError:
            pass


def get_optional_value(
    obj,
    *field_names,
    default="",
):
    """
    Safely get the first available attribute from an object.

    This lets the PDF work with different User/Client model
    naming conventions.
    """

    for field_name in field_names:

        value = getattr(
            obj,
            field_name,
            None,
        )

        if value is not None:
            value = str(value).strip()

            if value:
                return value

    return default


def format_date(value):
    """
    Format date/datetime values for PDF display.
    """

    if value is None:
        return ""

    if hasattr(value, "strftime"):
        return value.strftime("%d-%m-%Y")

    return str(value)


def format_money(value):
    """
    Format Decimal money for PDF.
    """

    return f"{money(Decimal(value or 0)):.2f}"


def get_logo_file_path(
    logo_url: str | None,
):
    """
    Convert stored logo URL into a local filesystem path.

    Example:

        /uploads/invoice_logos/file.png

    becomes:

        uploads/invoice_logos/file.png
    """

    if not logo_url:
        return None

    path = logo_url.lstrip("/")

    if not os.path.isfile(path):
        return None

    return path


def get_user_company(
    company_id: int | None,
    current_user: User,
    db: Session,
):
    # Prefer the user's active company when company_id is not supplied.
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
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found.",
        )

    return company


# ============================================================
# PDF GENERATION
# ============================================================

def generate_invoice_pdf(invoice: Invoice) -> bytes:
    """
    Generate a professional invoice PDF snapshot.

    The generated PDF is a snapshot of the invoice at the
    moment this function is called.

    Existing stored PDFs are not affected unless this function
    is explicitly called again.
    """

    from xml.sax.saxutils import escape

    buffer = BytesIO()

    # ========================================================
    # PAGE
    # ========================================================

    PAGE_WIDTH, PAGE_HEIGHT = A4

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=14 * mm,
        leftMargin=14 * mm,
        topMargin=12 * mm,
        bottomMargin=14 * mm,
        title=f"Invoice {invoice.invoice_number}",
        author="Invoice System",
    )

    # ========================================================
    # COLORS
    # ========================================================

    PRIMARY = colors.HexColor("#2563EB")
    PRIMARY_DARK = colors.HexColor("#1E40AF")

    TEXT = colors.HexColor("#1F2937")
    MUTED = colors.HexColor("#6B7280")

    BORDER = colors.HexColor("#D1D5DB")
    LIGHT_BORDER = colors.HexColor("#E5E7EB")

    LIGHT_BLUE = colors.HexColor("#EFF6FF")
    LIGHT_GRAY = colors.HexColor("#F9FAFB")
    WHITE = colors.white

    GREEN = colors.HexColor("#15803D")
    LIGHT_GREEN = colors.HexColor("#F0FDF4")

    ORANGE = colors.HexColor("#B45309")
    LIGHT_ORANGE = colors.HexColor("#FFFBEB")

    RED = colors.HexColor("#B91C1C")
    LIGHT_RED = colors.HexColor("#FEF2F2")

    # ========================================================
    # STYLES
    # ========================================================

    styles = getSampleStyleSheet()

    company_style = ParagraphStyle(
        "CompanyName",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=21,
        textColor=TEXT,
        spaceAfter=2,
    )

    company_detail_style = ParagraphStyle(
        "CompanyDetail",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=MUTED,
    )

    invoice_title_style = ParagraphStyle(
        "InvoiceTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=25,
        leading=28,
        alignment=TA_RIGHT,
        textColor=PRIMARY_DARK,
    )

    invoice_meta_style = ParagraphStyle(
        "InvoiceMeta",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        alignment=TA_RIGHT,
        textColor=TEXT,
    )

    section_title_style = ParagraphStyle(
        "SectionTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=11,
        textColor=PRIMARY_DARK,
    )

    normal_style = ParagraphStyle(
        "InvoiceNormal",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=TEXT,
    )

    small_style = ParagraphStyle(
        "InvoiceSmall",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        textColor=MUTED,
    )

    bold_style = ParagraphStyle(
        "InvoiceBold",
        parent=normal_style,
        fontName="Helvetica-Bold",
    )

    center_style = ParagraphStyle(
        "InvoiceCenter",
        parent=normal_style,
        alignment=TA_CENTER,
    )

    right_style = ParagraphStyle(
        "InvoiceRight",
        parent=normal_style,
        alignment=TA_RIGHT,
    )

    # IMPORTANT:
    # This style explicitly uses white text.
    # This fixes your current dark-on-dark table header problem.
    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=WHITE,
        alignment=TA_LEFT,
    )

    table_header_center_style = ParagraphStyle(
        "TableHeaderCenter",
        parent=table_header_style,
        alignment=TA_CENTER,
    )

    table_header_right_style = ParagraphStyle(
        "TableHeaderRight",
        parent=table_header_style,
        alignment=TA_RIGHT,
    )

    total_label_style = ParagraphStyle(
        "TotalLabel",
        parent=normal_style,
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        alignment=TA_RIGHT,
    )

    grand_total_label_style = ParagraphStyle(
        "GrandTotalLabel",
        parent=normal_style,
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        alignment=TA_RIGHT,
        textColor=PRIMARY_DARK,
    )

    grand_total_value_style = ParagraphStyle(
        "GrandTotalValue",
        parent=normal_style,
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        alignment=TA_RIGHT,
        textColor=PRIMARY_DARK,
    )

    amount_due_label_style = ParagraphStyle(
        "AmountDueLabel",
        parent=normal_style,
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        alignment=TA_RIGHT,
        textColor=RED,
    )

    amount_due_value_style = ParagraphStyle(
        "AmountDueValue",
        parent=normal_style,
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        alignment=TA_RIGHT,
        textColor=RED,
    )

    footer_style = ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=9,
        alignment=TA_CENTER,
        textColor=MUTED,
    )

    story = []

    # ========================================================
    # DATA
    # ========================================================

    company = invoice.company
    client = invoice.client

    company_name = get_optional_value(
        company,
        "company",
        "business_name",
        "shop_name",
        "name",
        "full_name",
        default="Company",
    )

    company_email = get_optional_value(
        company,
        "company_email",
        "email",
        default="",
    )

    company_phone = get_optional_value(
        company,
        "company_phone",
        "phone",
        "mobile",
        default="",
    )

    company_address = get_optional_value(
        company,
        "company_address",
        "address",
        "business_address",
        default="",
    )
    company_gst = get_optional_value(
        company,
        "gst_number",
        "gstin",
        "gst_no",
        "GSTIN",
        default="",
    )

    client_name = get_optional_value(
        client,
        "name",
        "company_name",
        "full_name",
        default="Client",
    )

    client_email = get_optional_value(
        client,
        "email",
        default="",
    )

    client_phone = get_optional_value(
        client,
        "phone",
        "mobile",
        default="",
    )

    client_address = get_optional_value(
        client,
        "address",
        "billing_address",
        default="",
    )
    client_gst = get_optional_value(
        client,
        "gst_number",
        "gstin",
        "gst_no",
        "GSTIN",
        default="",
    )

    # ========================================================
    # ESCAPED TEXT
    # ========================================================

    def safe(value):
        if value is None:
            return ""
        return escape(str(value))

    # ========================================================
    # LOGO
    # ========================================================

    logo_path = get_logo_file_path(
        invoice.logo_url
    )

    logo_element = Spacer(
        1,
        1,
    )

    if logo_path:

        try:
            logo_element = Image(
                logo_path,
                width=42 * mm,
                height=25 * mm,
                kind="proportional",
            )

        except Exception:
            logo_element = Spacer(
                1,
                1,
            )

    # ========================================================
    # COMPANY INFORMATION
    # ========================================================

    company_lines = [
        Paragraph(
            safe(company_name),
            company_style,
        )
    ]

    if company_address:
        company_lines.append(
            Paragraph(
                safe(company_address),
                company_detail_style,
            )
        )

    if company_phone:
        company_lines.append(
            Paragraph(
                f"Phone: {safe(company_phone)}",
                company_detail_style,
            )
        )

    if company_email:
        company_lines.append(
            Paragraph(
                f"Email: {safe(company_email)}",
                company_detail_style,
            )
        )
    if company_gst:
        company_lines.append(
            Paragraph(
                f"GSTIN: {safe(company_gst)}",
                company_detail_style,
            )
        )

    # ========================================================
    # INVOICE INFORMATION
    # ========================================================

    invoice_information = [
        Paragraph(
            "INVOICE",
            invoice_title_style,
        ),

        Spacer(
            1,
            5,
        ),

        Paragraph(
            f"<b>Invoice No:</b> "
            f"{safe(invoice.invoice_number)}",
            invoice_meta_style,
        ),

        Paragraph(
            f"<b>Invoice Date:</b> "
            f"{safe(format_date(invoice.invoice_date))}",
            invoice_meta_style,
        ),

        Paragraph(
            f"<b>Due Date:</b> "
            f"{safe(format_date(invoice.due_date))if invoice.due_date else 'No Due Date'}",
            invoice_meta_style,
        ),

        Spacer(
            1,
            3,
        ),

        Paragraph(
            f"<b>Status:</b> "
            f"{safe(str(invoice.status).upper())}",
            invoice_meta_style,
        ),
    ]

    # ========================================================
    # COMPANY HEADER
    # ========================================================

    # Logo + company details together
    # ========================================================
    # COMPANY HEADER
    # ========================================================

    if logo_path:

        company_header = Table(
            [
                [
                    logo_element,
                    company_lines,
                ]
            ],
            colWidths=[
                40 * mm,
                80 * mm,
            ],
        )

    else:

        company_header = Table(
            [
                [
                    company_lines,
                ]
            ],
            colWidths=[
                120 * mm,
            ],
        )
    company_header.setStyle(
        TableStyle(
            [
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
                    0,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    0,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    0,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    0,
                ),
            ]
        )
    )


    # ========================================================
    # MAIN HEADER
    # ========================================================

    header_table = Table(
        [
            [
                company_header,
                invoice_information,
            ]
        ],
        colWidths=[
            120 * mm,
            60 * mm,
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
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    0,
                ),

                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    0,
                ),

                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    0,
                ),

                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    0,
                ),
            ]
        )
    )

    story.append(header_table)

    # ========================================================
    # BILL TO
    # ========================================================

    bill_to = [
        Paragraph(
            "BILL TO",
            section_title_style,
        ),
        Spacer(
            1,
            4,
        ),
        Paragraph(
            f"<b>{safe(client_name)}</b>",
            normal_style,
        ),
    ]

    if client_address:
        bill_to.append(
            Paragraph(
                safe(client_address),
                small_style,
            )
        )

    if client_phone:
        bill_to.append(
            Paragraph(
                f"Phone: {safe(client_phone)}",
                small_style,
            )
        )

    if client_email:
        bill_to.append(
            Paragraph(
                f"Email: {safe(client_email)}",
                small_style,
            )
        )
    if client_gst:
        bill_to.append(
            Paragraph(
                f"GSTIN: {safe(client_gst)}",
                small_style,
            )
        )

    bill_table = Table(
        [
            [bill_to]
        ],
        colWidths=[
            180 * mm
        ],
    )

    bill_table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    LIGHT_BLUE,
                ),

                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.7,
                    colors.HexColor("#BFDBFE"),
                ),

                (
                    "LINEBEFORE",
                    (0, 0),
                    (0, -1),
                    3,
                    PRIMARY,
                ),

                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    10,
                ),

                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    10,
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

    story.append(bill_table)

    story.append(
        Spacer(
            1,
            14,
        )
    )

    # ========================================================
    # ITEMS TABLE
    # ========================================================

    item_rows = [
        [
            Paragraph(
                "#",
                table_header_center_style,
            ),

            Paragraph(
                "Product / Service Name",
                table_header_style,
            ),

            Paragraph(
                "QTY",
                table_header_center_style,
            ),

            Paragraph(
                "UNIT PRICE",
                table_header_right_style,
            ),

            Paragraph(
                "GST %",
                table_header_right_style,
            ),

            Paragraph(
                "GST Amount",
                table_header_right_style,
            ),

            Paragraph(
                "TOTAL",
                table_header_right_style,
            ),
        ]
    ]

    for index, item in enumerate(
        invoice.items,
        start=1,
    ):

        quantity = Decimal(
            item.quantity or 0
        )

        unit_price = Decimal(
            item.unit_price or 0
        )

        gst_percent = Decimal(
            item.gst_percent or 0
        )

        tax_amount = Decimal(
            item.tax_amount or 0
        )

        line_total = Decimal(
            item.line_total or 0
        )

        # ====================================================
        # ITEM NAME + DESCRIPTION
        # ====================================================

        item_name = item.name or ""
        item_description = item.description or ""

        if item_description:

            product_content = (
                f"<b>{safe(item_name)}</b><br/>"
                f"<font size='7' color='#6B7280'>"
                f"{safe(item_description)}"
                f"</font>"
            )

        else:

            product_content = safe(item_name)

        item_rows.append(
            [
                Paragraph(
                    str(index),
                    center_style,
                ),

                Paragraph(
                    product_content,
                    normal_style,
                ),

                Paragraph(
                    f"{quantity:.2f}",
                    center_style,
                ),

                Paragraph(
                    format_money(unit_price),
                    right_style,
                ),

                Paragraph(
                    f"{gst_percent:.2f}%",
                    right_style,
                ),

                Paragraph(
                    format_money(tax_amount),
                    right_style,
                ),

                Paragraph(
                    format_money(line_total),
                    right_style,
                ),
            ]
        )

    items_table = Table(
        item_rows,
        colWidths=[
            10 * mm,
            66 * mm,
            18 * mm,
            25 * mm,
            17 * mm,
            22 * mm,
            22 * mm,
        ],
        repeatRows=1,
    )

    items_table.setStyle(
        TableStyle(
            [
                # Header
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    PRIMARY_DARK,
                ),

                (
                    "TEXTCOLOR",
                    (0, 0),
                    (-1, 0),
                    WHITE,
                ),

                # Borders
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.35,
                    BORDER,
                ),

                # Alignment
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),

                # Padding
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

                # Alternating rows
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [
                        WHITE,
                        LIGHT_GRAY,
                    ],
                ),

                # Strong bottom border
                (
                    "LINEBELOW",
                    (0, -1),
                    (-1, -1),
                    0.8,
                    BORDER,
                ),
            ]
        )
    )

    story.append(items_table)

    story.append(
        Spacer(
            1,
            10,
        )
    )

    # ========================================================
    # TOTALS
    # ========================================================

    subtotal = money(
        Decimal(invoice.subtotal or 0)
    )

    discount = money(
        Decimal(invoice.discount or 0)
    )

    tax_amount = money(
        Decimal(invoice.tax_amount or 0)
    )

    grand_total = money(
        Decimal(invoice.grand_total or 0)
    )

    amount_paid = money(
        Decimal(invoice.amount_paid or 0)
    )

    amount_due = money(
        grand_total - amount_paid
    )

    totals_rows = [
        [
            "",
            Paragraph(
                "Subtotal",
                total_label_style,
            ),
            Paragraph(
                format_money(subtotal),
                right_style,
            ),
        ],

        [
            "",
            Paragraph(
                "Discount",
                total_label_style,
            ),
            Paragraph(
                f"- {format_money(discount)}",
                right_style,
            ),
        ],

        [
            "",
            Paragraph(
                "GST / Tax",
                total_label_style,
            ),
            Paragraph(
                format_money(tax_amount),
                right_style,
            ),
        ],

        [
            "",
            Paragraph(
                "GRAND TOTAL",
                grand_total_label_style,
            ),
            Paragraph(
                format_money(grand_total),
                grand_total_value_style,
            ),
        ],

        [
            "",
            Paragraph(
                "Amount Paid",
                total_label_style,
            ),
            Paragraph(
                format_money(amount_paid),
                right_style,
            ),
        ],

        [
            "",
            Paragraph(
                "AMOUNT DUE",
                amount_due_label_style,
            ),
            Paragraph(
                format_money(amount_due),
                amount_due_value_style,
            ),
        ],
    ]
    totals_table = Table(
        totals_rows,
        colWidths=[
            92 * mm,
            48 * mm,
            40 * mm,
        ],
        hAlign="RIGHT",
    )

    totals_table.setStyle(
        TableStyle(
            [
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
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
                    4,
                ),

                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    4,
                ),

                # Grand total row
                (
                    "BACKGROUND",
                    (1, 3),
                    (-1, 3),
                    LIGHT_BLUE,
                ),

                (
                    "LINEABOVE",
                    (1, 3),
                    (-1, 3),
                    1,
                    PRIMARY,
                ),

                (
                    "LINEBELOW",
                    (1, 3),
                    (-1, 3),
                    0.5,
                    PRIMARY,
                ),

                # Amount due
                (
                    "BACKGROUND",
                    (1, 5),
                    (-1, 5),
                    LIGHT_RED,
                ),

                (
                    "LINEABOVE",
                    (1, 5),
                    (-1, 5),
                    1,
                    RED,
                ),

                (
                    "LINEBELOW",
                    (1, 5),
                    (-1, 5),
                    1,
                    RED,
                ),
            ]
        )
    )

    story.append(totals_table)

    story.append(
        Spacer(
            1,
            12,
        )
    )

    # ========================================================
    # PAYMENT STATUS
    # ========================================================

    payment_status = str(
        invoice.payment_status
        or "unpaid"
    ).lower()

    if payment_status == "paid":

        payment_bg = LIGHT_GREEN
        payment_border = GREEN

    elif payment_status == "partial":

        payment_bg = LIGHT_ORANGE
        payment_border = ORANGE

    else:

        payment_bg = LIGHT_RED
        payment_border = RED

    payment_table = Table(
        [
            [
                Paragraph(
                    f"<b>PAYMENT STATUS</b>",
                    section_title_style,
                ),

                Paragraph(
                    safe(
                        payment_status.upper()
                    ),
                    ParagraphStyle(
                        "PaymentStatus",
                        parent=normal_style,
                        fontName="Helvetica-Bold",
                        alignment=TA_RIGHT,
                        textColor=payment_border,
                    ),
                ),
            ]
        ],
        colWidths=[
            90 * mm,
            90 * mm,
        ],
    )

    payment_table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    payment_bg,
                ),

                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.8,
                    payment_border,
                ),

                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    10,
                ),

                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    10,
                ),

                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),

                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
            ]
        )
    )

    story.append(payment_table)

    # ========================================================
    # NOTES
    # ========================================================

    if invoice.notes:

        story.append(
            Spacer(
                1,
                12,
            )
        )

        notes_table = Table(
            [
                [
                    Paragraph(
                        "NOTES",
                        section_title_style,
                    )
                ],

                [
                    Paragraph(
                        safe(invoice.notes),
                        normal_style,
                    )
                ],
            ],
            colWidths=[
                180 * mm
            ],
        )

        notes_table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        LIGHT_GRAY,
                    ),

                    (
                        "BACKGROUND",
                        (0, 1),
                        (-1, 1),
                        WHITE,
                    ),

                    (
                        "BOX",
                        (0, 0),
                        (-1, -1),
                        0.6,
                        BORDER,
                    ),

                    (
                        "LINEBELOW",
                        (0, 0),
                        (-1, 0),
                        0.5,
                        BORDER,
                    ),

                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        10,
                    ),

                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        10,
                    ),

                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        7,
                    ),

                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        7,
                    ),
                ]
            )
        )

        story.append(notes_table)
    # ========================================================
    # TERMS
    # ========================================================

    if invoice.terms:

        story.append(
            Spacer(
                1,
                12,
            )
        )

        terms_table = Table(
            [
                [
                    Paragraph(
                        "TERMS",
                        section_title_style,
                    )
                ],

                [
                    Paragraph(
                        safe(invoice.terms),
                        normal_style,
                    )
                ],
            ],
            colWidths=[
                180 * mm
            ],
        )

        terms_table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        LIGHT_GRAY,
                    ),

                    (
                        "BACKGROUND",
                        (0, 1),
                        (-1, 1),
                        WHITE,
                    ),

                    (
                        "BOX",
                        (0, 0),
                        (-1, -1),
                        0.6,
                        BORDER,
                    ),

                    (
                        "LINEBELOW",
                        (0, 0),
                        (-1, 0),
                        0.5,
                        BORDER,
                    ),

                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        10,
                    ),

                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        10,
                    ),

                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        7,
                    ),

                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        7,
                    ),
                ]
            )
        )

        story.append(terms_table)

    # ========================================================
    # FOOTER
    # ========================================================

    story.append(
        Spacer(
            1,
            18,
        )
    )

    story.append(
        Paragraph(
            "Thank you for your business.",
            footer_style,
        )
    )

    story.append(
        Spacer(
            1,
            3,
        )
    )

    story.append(
        Paragraph(
            f"Invoice {safe(invoice.invoice_number)}",
            footer_style,
        )
    )

    # ========================================================
    # BUILD
    # ========================================================

    doc.build(story)

    pdf_bytes = buffer.getvalue()

    buffer.close()

    return pdf_bytes


# ============================================================
# CREATE INVOICE
# ============================================================

@router.post(
    "/",
    response_model=InvoiceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_invoice(
    invoice_data: InvoiceCreate,
    company_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    company = get_user_company(
        company_id=company_id,
        current_user=current_user,
        db=db,
    )
    company_id = company.id

    # --------------------------------------------------------
    # Validate items
    # --------------------------------------------------------

    if not invoice_data.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invoice must contain at least one item.",
        )

    # --------------------------------------------------------
    # Validate discount
    # --------------------------------------------------------

    discount = money(
        invoice_data.discount
    )

    if discount < ZERO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Discount cannot be negative.",
        )

    # --------------------------------------------------------
    # Check client ownership
    # --------------------------------------------------------

    client = (
        db.query(Client)
        .filter(
            Client.id == invoice_data.client_id,
            Client.company_id == company_id,
        )
        .first()
    )

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found.",
        )

    # --------------------------------------------------------
    # Check invoice number
    # --------------------------------------------------------

    existing_invoice = (
        db.query(Invoice)
        .filter(
            Invoice.company_id == company_id,
            Invoice.invoice_number == invoice_data.invoice_number,
        )
        .first()
    )

    if existing_invoice:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invoice number already exists.",
        )

    # --------------------------------------------------------
    # Create invoice
    #
    # The current logo is copied as a URL reference.
    #
    # IMPORTANT:
    # This does NOT affect an already generated PDF.
    #
    # When PDF generation happens, the image is physically
    # embedded into the PDF.
    # --------------------------------------------------------

    invoice = Invoice(
        company_id=company_id,
        client_id=client.id,
        invoice_number=invoice_data.invoice_number,
        currency=invoice_data.currency,
        invoice_date=invoice_data.invoice_date,
        due_date=invoice_data.due_date,
        logo_url=invoice_data.logo_url or company.logo_url,
        subtotal=ZERO,
        discount=discount,
        tax_amount=ZERO,
        grand_total=ZERO,
        amount_paid=ZERO,
        status="draft",
        payment_status="unpaid",
        notes=invoice_data.notes,
        terms=invoice_data.terms,

        pdf_data=None,
        pdf_filename=None,
        pdf_generated_at=None,
    )

    db.add(invoice)

    subtotal = ZERO
    total_tax = ZERO

    created_items = []

    # --------------------------------------------------------
    # Process products
    # --------------------------------------------------------

    for item_data in invoice_data.items:

        quantity = Decimal(
            item_data.quantity
        )

        if quantity <= ZERO:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity must be greater than zero.",
            )

        # ----------------------------------------------------
        # Check product ownership
        # ----------------------------------------------------

        product = (
            db.query(Product)
            .filter(
                Product.id == item_data.product_id,
                Product.company_id == company_id,
            )
            .first()
        )

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    f"Product {item_data.product_id} "
                    "not found."
                ),
            )

        # ----------------------------------------------------
        # Check product active
        # ----------------------------------------------------

        if not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Product '{product.name}' "
                    "is not active."
                ),
            )

        # ----------------------------------------------------
        # Current product price/GST
        # ----------------------------------------------------

        unit_price = money(
            Decimal(product.price)
        )

        gst_percent = Decimal(
            product.gst_percent
        )

        # ----------------------------------------------------
        # Calculate item
        # ----------------------------------------------------

        (
            line_subtotal,
            tax_amount,
            line_total,
        ) = calculate_item_totals(
            quantity,
            unit_price,
            gst_percent,
        )

        subtotal += line_subtotal
        total_tax += tax_amount

        # ----------------------------------------------------
        # Create invoice item
        # ----------------------------------------------------

        invoice_item = InvoiceItem(
            product_id=product.id,
            product_name=product.name,
            name=product.name,
            description=product.description,
            quantity=quantity,
            unit_price=unit_price,
            gst_percent=gst_percent,
            tax_amount=tax_amount,
            line_total=line_total,
        )

        created_items.append(
            invoice_item
        )

        invoice.items.append(
            invoice_item
        )

    # --------------------------------------------------------
    # Calculate invoice totals
    # --------------------------------------------------------

    subtotal = money(subtotal)

    if discount > subtotal:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Discount cannot be greater than "
                "the invoice subtotal."
            ),
        )

    taxable_amount = money(
        subtotal - discount
    )

    # --------------------------------------------------------
    # Recalculate GST after discount
    # --------------------------------------------------------

    if discount > ZERO:

        if subtotal == ZERO:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invoice subtotal cannot be zero.",
            )

        discount_ratio = (
            discount / subtotal
        )

        total_tax = ZERO

        for item in created_items:

            original_subtotal = money(
                item.quantity
                * item.unit_price
            )

            item_discount = money(
                original_subtotal
                * discount_ratio
            )

            discounted_subtotal = money(
                original_subtotal
                - item_discount
            )

            item.tax_amount = money(
                discounted_subtotal
                * item.gst_percent
                / Decimal("100")
            )

            item.line_total = money(
                discounted_subtotal
                + item.tax_amount
            )

            total_tax += item.tax_amount

    total_tax = money(total_tax)

    # --------------------------------------------------------
    # Grand total
    # --------------------------------------------------------

    grand_total = money(
        taxable_amount
        + total_tax
    )

    invoice.subtotal = subtotal
    invoice.discount = discount
    invoice.tax_amount = total_tax
    invoice.grand_total = grand_total

    # --------------------------------------------------------
    # Payment
    # --------------------------------------------------------

    amount_paid = money(
        invoice_data.amount_paid
    )

    if amount_paid < ZERO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Paid amount cannot be negative.",
        )

    if amount_paid > grand_total:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Paid amount cannot be greater than "
                "the invoice total."
            ),
        )

    invoice.amount_paid = amount_paid

    update_payment_status(invoice)

    # --------------------------------------------------------
    # Save
    # --------------------------------------------------------

    try:

        db.commit()

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not create invoice.",
        )

    db.refresh(invoice)

    return invoice_to_response(
        invoice
    )


# ============================================================
# Generate Invoice number
# ============================================================
@router.get("/next-number")
def get_next_invoice_number(
    company_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    company = get_user_company(
        company_id=company_id,
        current_user=current_user,
        db=db,
    )
    company_id = company.id
    
    prefix = company.invoice_prefix or "INV-"
    starting_number = company.invoice_starting_number or 1001

    # Get the latest invoice number for this user
    latest_invoice = (
        db.query(Invoice)
        .filter(
            Invoice.company_id == company_id,
            Invoice.invoice_number.isnot(None),
        )
        .order_by(Invoice.id.desc())
        .first()
    )

    if not latest_invoice:
        next_number = starting_number
    else:
        invoice_number = latest_invoice.invoice_number

        # Remove prefix
        number_part = invoice_number.replace(prefix, "", 1)

        try:
            current_number = int(number_part)
            next_number = current_number + 1
        except ValueError:
            next_number = starting_number

    return {
        "invoice_number": f"{prefix}{next_number}"
    }

# ============================================================
# GET ALL INVOICES
# ============================================================

@router.get(
    "/",
    response_model=list[InvoiceResponse],
)
def get_invoices(
    company_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    company = get_user_company(
        company_id=company_id,
        current_user=current_user,
        db=db,
    )
    company_id = company.id

    invoices = (
        db.query(Invoice)
        .options(
            joinedload(Invoice.company),
            joinedload(Invoice.client),
            joinedload(Invoice.items),
        )
        .filter(
            Invoice.company_id == company_id,
        )
        .order_by(
            Invoice.id.desc()
        )
        .all()
    )

    status_changed = False

    for invoice in invoices:

        old_status = invoice.payment_status

        update_payment_status(invoice)

        if old_status != invoice.payment_status:
            status_changed = True

    if status_changed:
        db.commit()

    return [
        invoice_to_response(invoice)
        for invoice in invoices
    ]


# ============================================================
# GENERATE / REGENERATE INVOICE PDF
#
# IMPORTANT:
#
# This endpoint is MANUAL.
#
# The PDF does not regenerate automatically when:
#
# - user changes logo
# - client changes
# - product changes
# - invoice changes
# - payment changes
#
# The user must explicitly call this endpoint.
#
# Calling it again replaces the old stored PDF with a new
# snapshot.
# ============================================================

@router.post(
    "/{invoice_id}/pdf",
)
def generate_invoice_pdf_endpoint(
    invoice_id: int,
    company_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    company = get_user_company(
        company_id=company_id,
        current_user=current_user,
        db=db,
    )
    company_id = company.id

    invoice = (
        db.query(Invoice)
        .options(
            joinedload(Invoice.company),
            joinedload(Invoice.client),
            joinedload(Invoice.items),
        )
        .filter(
            Invoice.id == invoice_id,
            Invoice.company_id == company_id,
        )
        .first()
    )

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found.",
        )

    # --------------------------------------------------------
    # Generate PDF from CURRENT invoice values.
    #
    # This includes the current logo image.
    # --------------------------------------------------------

    try:

        pdf_bytes = generate_invoice_pdf(
            invoice
        )

    except Exception as exc:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Could not generate invoice PDF."
            ),
        ) from exc

    # --------------------------------------------------------
    # Save PDF in database.
    #
    # This becomes the permanent snapshot until the user
    # explicitly regenerates it.
    # --------------------------------------------------------

    filename = (
        f"invoice_"
        f"{invoice.invoice_number}"
        f".pdf"
    )

    invoice.pdf_data = pdf_bytes
    invoice.pdf_filename = filename
    invoice.pdf_generated_at = datetime.utcnow()

    try:

        db.commit()

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not save invoice PDF.",
        )

    return {
        "message": "Invoice PDF generated successfully.",
        "invoice_id": invoice.id,
        "filename": filename,
        "pdf_generated_at": invoice.pdf_generated_at,
    }


# ============================================================
# DOWNLOAD SAVED INVOICE PDF
#
# This NEVER regenerates the PDF.
#
# It simply returns the binary PDF already stored in the
# database.
# ============================================================

@router.get(
    "/{invoice_id}/pdf",
)
def download_invoice_pdf(
    invoice_id: int,
    company_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    company = get_user_company(
        company_id=company_id,
        current_user=current_user,
        db=db,
    )
    company_id = company.id

    invoice = (
        db.query(Invoice)
        .filter(
            Invoice.id == invoice_id,
            Invoice.company_id == company_id,
        )
        .first()
    )

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found.",
        )

    # --------------------------------------------------------
    # No PDF generated yet
    # --------------------------------------------------------

    if not invoice.pdf_data:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Invoice PDF has not been generated yet. "
                "Generate the PDF first."
            ),
        )

    filename = (
        invoice.pdf_filename
        or f"invoice_{invoice.invoice_number}.pdf"
    )

    return Response(
        content=invoice.pdf_data,
        media_type=PDF_MIME_TYPE,
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        },
    )


# ============================================================
# SEND PAYMENT REMINDERS
# ============================================================

@router.post("/reminders/send")
def send_payment_reminders(
    reminder_data: InvoiceReminderRequest,
    company_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # --------------------------------------------------------
    # GET USER COMPANY
    # --------------------------------------------------------

    company = get_user_company(
        company_id=company_id,
        current_user=current_user,
        db=db,
    )

    company_id = company.id

    # --------------------------------------------------------
    # GET COMPANY NAME
    # --------------------------------------------------------

    company_name = (
        company.business_name
        or getattr(company, "company", None)
        or "Your Company"
    )

    # --------------------------------------------------------
    # GET SELECTED INVOICES
    # --------------------------------------------------------

    invoices = (
        db.query(Invoice)
        .options(
            joinedload(Invoice.client)
        )
        .filter(
            Invoice.id.in_(
                reminder_data.invoice_ids
            ),
            Invoice.company_id == company_id,
        )
        .all()
    )

    # --------------------------------------------------------
    # CHECK WHETHER INVOICES EXIST
    # --------------------------------------------------------

    if not invoices:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No invoices found.",
        )

    # --------------------------------------------------------
    # CHECK FOR MISSING INVOICE IDs
    # --------------------------------------------------------

    found_ids = {
        invoice.id
        for invoice in invoices
    }

    missing_ids = [
        invoice_id
        for invoice_id in reminder_data.invoice_ids
        if invoice_id not in found_ids
    ]

    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Invoice(s) not found: "
                f"{missing_ids}"
            ),
        )

    # --------------------------------------------------------
    # GROUP INVOICES BY CLIENT EMAIL
    # --------------------------------------------------------

    grouped_by_email = {}

    for invoice in invoices:

        if not invoice.client:
            continue

        client_email = invoice.client.email

        if not client_email:
            continue

        if client_email not in grouped_by_email:

            grouped_by_email[client_email] = []

        grouped_by_email[
            client_email
        ].append(invoice)

    # --------------------------------------------------------
    # CHECK EMAIL AVAILABILITY
    # --------------------------------------------------------

    if not grouped_by_email:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "None of the selected invoices have "
                "a client with an email address."
            ),
        )

    # --------------------------------------------------------
    # SEND REMINDERS
    # --------------------------------------------------------

    sent_to = []
    failed = []

    for (
        client_email,
        client_invoices,
    ) in grouped_by_email.items():

        try:

            # ------------------------------------------------
            # CLIENT NAME
            # ------------------------------------------------

            client = client_invoices[0].client

            client_name = (
                getattr(
                    client,
                    "name",
                    None,
                )
                or getattr(
                    client,
                    "company_name",
                    None,
                )
                or client_email.split("@")[0]
            )

            # ------------------------------------------------
            # BUILD INVOICE DETAILS
            # ------------------------------------------------

            invoice_lines = []

            pdf_attachments = []

            total_pending = Decimal("0")

            for invoice in client_invoices:

                grand_total = Decimal(
                    invoice.grand_total or 0
                )

                amount_paid = Decimal(
                    invoice.amount_paid or 0
                )

                pending = max(
                    Decimal("0"),
                    grand_total - amount_paid,
                )

                total_pending += pending

                # --------------------------------------------
                # INVOICE DATE
                # --------------------------------------------

                invoice_date = (
                    invoice.invoice_date.strftime(
                        "%d/%m/%Y"
                    )
                    if invoice.invoice_date
                    else "-"
                )

                # --------------------------------------------
                # DUE DATE
                # --------------------------------------------

                due_date = (
                    invoice.due_date.strftime(
                        "%d/%m/%Y"
                    )
                    if invoice.due_date
                    else "NO Due Date"
                )

                # --------------------------------------------
                # PAYMENT STATUS
                # --------------------------------------------

                payment_status = (
                    invoice.payment_status
                    or "Unpaid"
                )

                invoice_lines.append(
                    f"""
Invoice Number: {invoice.invoice_number}
Invoice Date: {invoice_date}
Due Date: {due_date}
Amount Due: {pending:.2f}
Payment Status: {payment_status}
"""
                )


                # ------------------------------------------------
                # GENERATE INVOICE PDF
                # ------------------------------------------------

                try:

                    pdf_bytes = generate_invoice_pdf(
                        invoice
                    )

                except Exception as exc:

                    print(
                        "INVOICE PDF GENERATION ERROR:",
                        repr(exc),
                    )

                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=(
                            f"Could not generate PDF for "
                            f"invoice {invoice.invoice_number}."
                        ),
                    )

                pdf_filename = (
                    f"invoice_"
                    f"{invoice.invoice_number}"
                    f".pdf"
                )

                pdf_attachments.append(
                    (
                        pdf_bytes,
                        pdf_filename,
                    )
                )

            # ------------------------------------------------
            # JOIN INVOICE DETAILS
            # ------------------------------------------------

            invoice_details = (
                "\n"
                "-------------------------\n"
            ).join(
                invoice_lines
            )

            # ------------------------------------------------
            # SEND EMAIL
            # ------------------------------------------------

            send_payment_reminder_email(
                recipient_email=client_email,
                client_name=client_name,
                invoice_details=invoice_details,
                total_pending=f"{total_pending:.2f}",
                company_name=company_name,
                pdf_attachments=pdf_attachments,
            )

            sent_to.append(
                client_email
            )

        except Exception as exc:

            print(
                "PAYMENT REMINDER EMAIL ERROR:",
                repr(exc),
            )

            failed.append(
                client_email
            )

    # --------------------------------------------------------
    # CHECK WHETHER ANY EMAIL WAS SENT
    # --------------------------------------------------------

    if not sent_to:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Unable to send payment reminders."
            ),
        )

    # --------------------------------------------------------
    # SUCCESS RESPONSE
    # --------------------------------------------------------

    return {
        "message": (
            "Payment reminder(s) sent successfully."
        ),
        "sent_to": sent_to,
        "failed": failed,
    }

# ============================================================
# SEND INVOICE BY EMAIL
#
# Generates the invoice PDF and sends it directly to the
# client's email address as an attachment.
# ============================================================

@router.post(
    "/{invoice_id}/send",
)
def send_invoice(
    invoice_id: int,
    company_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # --------------------------------------------------------
    # GET USER COMPANY
    # --------------------------------------------------------

    company = get_user_company(
        company_id=company_id,
        current_user=current_user,
        db=db,
    )

    company_id = company.id

    # --------------------------------------------------------
    # GET INVOICE
    # --------------------------------------------------------

    invoice = (
        db.query(Invoice)
        .options(
            joinedload(Invoice.company),
            joinedload(Invoice.client),
            joinedload(Invoice.items),
        )
        .filter(
            Invoice.id == invoice_id,
            Invoice.company_id == company_id,
        )
        .first()
    )

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found.",
        )

    # --------------------------------------------------------
    # CHECK CLIENT
    # --------------------------------------------------------

    if not invoice.client:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invoice does not have a client.",
        )

    client_email = invoice.client.email

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
        getattr(invoice.client, "name", None)
        or getattr(invoice.client, "company_name", None)
        or client_email.split("@")[0]
    )

    # --------------------------------------------------------
    # GENERATE PDF
    # --------------------------------------------------------

    try:

        pdf_bytes = generate_invoice_pdf(
            invoice
        )

    except Exception as exc:

        print(
            "INVOICE PDF GENERATION ERROR:",
            repr(exc),
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate invoice PDF.",
        ) from exc

    # --------------------------------------------------------
    # PDF FILENAME
    # --------------------------------------------------------

    filename = (
        f"invoice_"
        f"{invoice.invoice_number}"
        f".pdf"
    )

    # --------------------------------------------------------
    # FORMAT EMAIL DATA
    # --------------------------------------------------------

    invoice_date = (
        invoice.invoice_date.strftime("%d/%m/%Y")
        if invoice.invoice_date
        else "-"
    )

    due_date = (
        invoice.due_date.strftime("%d/%m/%Y")
        if invoice.due_date
        else "-"
    )

    amount = str(
        invoice.grand_total
        if invoice.grand_total is not None
        else "0"
    )

    payment_status = (
        invoice.payment_status
        or "Unpaid"
    )

    # --------------------------------------------------------
    # SEND EMAIL
    # --------------------------------------------------------

    try:

        send_invoice_email(
            recipient_email=client_email,
            invoice_number=invoice.invoice_number,
            invoice_date=invoice_date,
            due_date=due_date,
            amount=amount,
            payment_status=payment_status,
            pdf_bytes=pdf_bytes,
            pdf_filename=filename,
            company_name=company_name,
            client_name=client_name,
        )
        invoice.status = "sent"

        db.commit()
        db.refresh(invoice)

    except Exception as exc:

        print(
            "INVOICE EMAIL ERROR:",
            repr(exc),
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to send invoice email.",
        ) from exc

    # --------------------------------------------------------
    # SUCCESS
    # --------------------------------------------------------

    return {
        "message": "Invoice sent successfully.",
        "invoice_id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "recipient": client_email,
        "filename": filename,
    }


# ============================================================
# GET SINGLE INVOICE
# ============================================================

@router.get(
    "/{invoice_id}",
    response_model=InvoiceResponse,
)
def get_invoice(
    invoice_id: int,
    company_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    company = get_user_company(
        company_id=company_id,
        current_user=current_user,
        db=db,
    )
    company_id = company.id

    invoice = (
        db.query(Invoice)
        .options(
            joinedload(Invoice.client),
            joinedload(Invoice.items).joinedload(InvoiceItem.product),
            joinedload(Invoice.company),
        )
        .filter(
            Invoice.id == invoice_id,
            Invoice.company_id == company_id,
        )
        .first()
    )

    if not invoice:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found.",
        )

    old_status = invoice.payment_status

    update_payment_status(invoice)

    if old_status != invoice.payment_status:
        db.commit()
        db.refresh(invoice)

    return invoice_to_response(invoice)


# ============================================================
# UPLOAD COMPANY LOGO FROM INVOICE PAGE
# ============================================================

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True,
)


@router.post(
    "/{invoice_id}/logo",
    response_model=InvoiceResponse,
)
async def upload_invoice_logo(
    invoice_id: int,
    company_id: int | None = None,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    company = get_user_company(
        company_id=company_id,
        current_user=current_user,
        db=db,
    )
    company_id = company.id

    # --------------------------------------------------------
    # Find invoice belonging to current user
    # --------------------------------------------------------

    invoice = (
        db.query(Invoice)
        .filter(
            Invoice.id == invoice_id,
            Invoice.company_id == company_id,
        )
        .first()
    )

    if not invoice:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found.",
        )

    # --------------------------------------------------------
    # Validate file type
    # --------------------------------------------------------

    if (
        file.content_type
        not in ALLOWED_INVOICE_LOGO_TYPES
    ):

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Logo must be JPG, PNG, or WebP.",
        )

    # --------------------------------------------------------
    # Read file
    # --------------------------------------------------------

    contents = await file.read()

    # --------------------------------------------------------
    # Validate file size
    # --------------------------------------------------------

    if len(contents) > MAX_INVOICE_LOGO_SIZE:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Logo must be smaller than 5 MB.",
        )

    # --------------------------------------------------------
    # Save old company logo
    # --------------------------------------------------------

    old_company_logo_url = company.logo_url

    # --------------------------------------------------------
    # Create unique filename
    # --------------------------------------------------------

    extension = (
        ALLOWED_INVOICE_LOGO_TYPES[
            file.content_type
        ]
    )

    filename = (
        f"user_{current_user.id}_"
        f"{uuid.uuid4().hex}"
        f"{extension}"
    )

    filepath = os.path.join(
        UPLOAD_DIR,
        filename,
    )

    # --------------------------------------------------------
    # Save new logo
    # --------------------------------------------------------

    try:

        with open(
            filepath,
            "wb",
        ) as buffer:

            buffer.write(contents)

    except OSError:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save logo file.",
        )

    logo_url = (
        f"/uploads/invoice_logos/{filename}"
    )

    # --------------------------------------------------------
    # Save new logo to:
    #
    # 1. Current invoice
    # 2. Company profile
    #
    # IMPORTANT:
    #
    # Existing generated PDFs are NOT changed.
    #
    # They contain the old logo physically inside the PDF.
    # --------------------------------------------------------

    invoice.logo_url = logo_url
    company.logo_url = logo_url

    try:

        db.commit()

    except IntegrityError:

        db.rollback()

        if os.path.exists(filepath):

            try:
                os.remove(filepath)
            except OSError:
                pass

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not save invoice logo.",
        )

    # --------------------------------------------------------
    # Delete OLD company logo only after successful commit
    # --------------------------------------------------------

    if (
        old_company_logo_url
        and old_company_logo_url != logo_url
    ):

        delete_logo_file(
            old_company_logo_url
        )

    db.refresh(invoice)

    return invoice_to_response(
        invoice
    )


# ============================================================
# UPDATE INVOICE
# ============================================================

@router.put(
    "/{invoice_id}",
    response_model=InvoiceResponse,
)
def update_invoice(
    invoice_id: int,
    invoice_data: InvoiceUpdate,
    company_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    company = get_user_company(
        company_id=company_id,
        current_user=current_user,
        db=db,
    )
    company_id = company.id
    # --------------------------------------------------------
    # Find invoice
    # --------------------------------------------------------

    invoice = (
        db.query(Invoice)
        .options(
            joinedload(Invoice.items)
        )
        .filter(
            Invoice.id == invoice_id,
            Invoice.company_id == company_id,
        )
        .first()
    )

    if not invoice:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found.",
        )
    # --------------------------------------------------------
    # CANCELLED INVOICE IS READ-ONLY
    # --------------------------------------------------------
    
    if invoice.status == "cancelled":
    
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Cancelled invoices cannot be edited."
            ),
        )
    

    # --------------------------------------------------------
    # Get update data
    # --------------------------------------------------------

    update_data = invoice_data.model_dump(
        exclude_unset=True
    )

    # --------------------------------------------------------
    # Update amount paid
    # --------------------------------------------------------

    if "amount_paid" in update_data:

        amount_paid = money(
            Decimal(
                update_data["amount_paid"]
            )
        )

        if amount_paid < ZERO:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Paid amount cannot be negative.",
            )

        invoice.amount_paid = amount_paid

    # --------------------------------------------------------
    # Validate client
    # --------------------------------------------------------

    if "client_id" in update_data:

        client = (
            db.query(Client)
            .filter(
                Client.id == update_data["client_id"],
                Client.company_id == company_id,
            )
            .first()
        )

        if not client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client not found.",
            )
        
    # --------------------------------------------------------
    # Validate discount
    # --------------------------------------------------------

    discount = money(
        Decimal(invoice.discount or 0)
    )

    if "discount" in update_data:

        discount = money(
            Decimal(
                update_data["discount"]
            )
        )

        if discount < ZERO:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Discount cannot be negative.",
            )

    # --------------------------------------------------------
    # Update basic invoice information
    #
    # DO NOT update pdf_data here.
    #
    # The existing PDF must remain unchanged.
    # --------------------------------------------------------

    basic_fields = [
        "client_id",
        "invoice_date",
        "due_date",
        "status",
        "notes",
        "terms",
        "logo_url",
    ]

    for field in basic_fields:

        if field in update_data:

            setattr(
                invoice,
                field,
                update_data[field],
            )

    # --------------------------------------------------------
    # If items NOT included:
    # metadata/payment-only update.
    # --------------------------------------------------------

    if "items" not in update_data:

        if "discount" in update_data:

            if discount > invoice.subtotal:

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Discount cannot be greater than "
                        "the invoice subtotal."
                    ),
                )

            invoice.discount = discount

        # ----------------------------------------------------
        # Recalculate payment status against current
        # grand_total.
        #
        # No item changes happened in this branch, so the
        # existing grand_total is already the final total.
        # ----------------------------------------------------

        amount_paid = money(
            Decimal(
                invoice.amount_paid or 0
            )
        )

        grand_total = money(
            Decimal(
                invoice.grand_total or 0
            )
        )

        if amount_paid < ZERO:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Paid amount cannot be negative.",
            )

        if amount_paid > grand_total:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Paid amount cannot be greater than "
                    "the invoice total."
                ),
            )

        update_payment_status(invoice)

        try:

            db.commit()

        except IntegrityError:

            db.rollback()

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not update invoice.",
            )

        db.refresh(invoice)

        return invoice_to_response(
            invoice
        )

    # --------------------------------------------------------
    # ITEMS WERE INCLUDED
    # --------------------------------------------------------

    items_data = update_data["items"]

    if not items_data:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invoice must contain at least one item."
            ),
        )

    # --------------------------------------------------------
    # Existing invoice items
    # --------------------------------------------------------

    existing_items = {
        item.id: item
        for item in invoice.items
    }

    submitted_existing_ids = set()

    subtotal = ZERO

    # --------------------------------------------------------
    # Process submitted items
    # --------------------------------------------------------

    for item_data in items_data:

        item_id = item_data.get("id")

        quantity = Decimal(
            item_data["quantity"]
        )

        # ----------------------------------------------------
        # Validate quantity
        # ----------------------------------------------------

        if quantity <= ZERO:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Quantity must be greater than zero."
                ),
            )

        # ----------------------------------------------------
        # EXISTING ITEM
        # ----------------------------------------------------

        if item_id is not None:

            if item_id in submitted_existing_ids:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Invoice item {item_id} "
                        "was submitted more than once."
                    ),
                )

            existing_item = existing_items.get(item_id)

            if not existing_item:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=(
                        f"Invoice item {item_id} "
                        "does not belong to this invoice."
                    ),
                )

            submitted_existing_ids.add(item_id)

            # ------------------------------------------------
            # Existing item keeps historical price/GST/name/
            # description.
            # ------------------------------------------------

            unit_price = money(
                Decimal(
                    existing_item.unit_price
                )
            )

            gst_percent = Decimal(
                existing_item.gst_percent
            )

            line_subtotal = money(
                quantity * unit_price
            )

            subtotal += line_subtotal

            # Only quantity changes here.
            # Historical product information remains unchanged.
            existing_item.quantity = quantity

        # ----------------------------------------------------
        # New item
        # ----------------------------------------------------

        else:

            product_id = item_data["product_id"]

            product = (
                db.query(Product)
                .filter(
                    Product.id == product_id,
                    Product.company_id == company_id,
                )
                .first()
            )

            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=(
                        f"Product {product_id} "
                        "not found."
                    ),
                )

            if not product.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Product '{product.name}' "
                        "is not active."
                    ),
                )

            unit_price = money(
                Decimal(product.price)
            )

            gst_percent = Decimal(
                product.gst_percent
            )

            line_subtotal = money(
                quantity * unit_price
            )

            subtotal += line_subtotal

            new_item = InvoiceItem(
                product_id=product.id,
                product_name=product.name,
                description=product.description,
                quantity=quantity,
                unit_price=unit_price,
                gst_percent=gst_percent,
                tax_amount=ZERO,
                line_total=ZERO,
            )

            invoice.items.append(new_item)
    # --------------------------------------------------------
    # Remove existing items not submitted
    # --------------------------------------------------------

    for (
        item_id,
        existing_item,
    ) in existing_items.items():

        if (
            item_id
            not in submitted_existing_ids
        ):

            db.delete(
                existing_item
            )

    # --------------------------------------------------------
    # Calculate subtotal
    # --------------------------------------------------------

    subtotal = money(subtotal)

    if discount > subtotal:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Discount cannot be greater than "
                "the invoice subtotal."
            ),
        )

    if subtotal == ZERO:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invoice subtotal cannot be zero."
            ),
        )

    # --------------------------------------------------------
    # Set invoice discount
    # --------------------------------------------------------

    invoice.discount = discount

    # --------------------------------------------------------
    # Recalculate GST after discount
    # --------------------------------------------------------

    taxable_amount = money(
        subtotal - discount
    )

    discount_ratio = (
        discount / subtotal
    )

    total_tax = ZERO

    # --------------------------------------------------------
    # Recalculate every invoice item
    # --------------------------------------------------------

    for item in invoice.items:

        original_subtotal = money(
            Decimal(item.quantity)
            * Decimal(item.unit_price)
        )

        item_discount = money(
            original_subtotal
            * discount_ratio
        )

        discounted_subtotal = money(
            original_subtotal
            - item_discount
        )

        item.tax_amount = money(
            discounted_subtotal
            * Decimal(item.gst_percent)
            / Decimal("100")
        )

        item.line_total = money(
            discounted_subtotal
            + item.tax_amount
        )

        total_tax += item.tax_amount

    # --------------------------------------------------------
    # Final totals
    # --------------------------------------------------------

    total_tax = money(total_tax)

    grand_total = money(
        taxable_amount
        + total_tax
    )

    invoice.subtotal = subtotal
    invoice.tax_amount = total_tax
    invoice.grand_total = grand_total

    # --------------------------------------------------------
    # Recalculate payment status AFTER final grand_total
    # --------------------------------------------------------

    amount_paid = money(
        Decimal(
            invoice.amount_paid or 0
        )
    )

    # --------------------------------------------------------
    # Validate existing paid amount against new total
    # --------------------------------------------------------

    if amount_paid < ZERO:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Paid amount cannot be negative.",
        )

    if amount_paid > grand_total:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Paid amount cannot be greater than "
                "the invoice total."
            ),
        )

    # --------------------------------------------------------
    # Calculate payment status
    # --------------------------------------------------------

    update_payment_status(invoice)

    # --------------------------------------------------------
    # IMPORTANT:
    #
    # Do NOT regenerate the PDF.
    #
    # Existing PDF remains exactly as it was.
    #
    # User can manually regenerate it using:
    #
    # POST /invoices/{invoice_id}/pdf
    #
    # --------------------------------------------------------

    try:

        db.commit()

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not update invoice.",
        )

    db.refresh(invoice)

    return invoice_to_response(
        invoice
    )


# ============================================================
# UPDATE INVOICE STATUS
# ============================================================

@router.patch(
    "/{invoice_id}/status",
    response_model=InvoiceResponse,
)
def update_invoice_status(
    invoice_id: int,
    new_status: str,
    company_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    company = get_user_company(
        company_id=company_id,
        current_user=current_user,
        db=db,
    )
    company_id = company.id

    invoice = (
        db.query(Invoice)
        .filter(
            Invoice.id == invoice_id,
            Invoice.company_id == company_id,
        )
        .first()
    )
    

    if not invoice:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found.",
        )

    if (
        new_status
        not in ALLOWED_INVOICE_STATUSES
    ):

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid invoice status. "
                "Allowed values: "
                "draft, sent, cancelled."
            ),
        )
    # --------------------------------------------------------
    # CANCELLED INVOICE CANNOT BE REOPENED
    # --------------------------------------------------------

    if (
        invoice.status == "cancelled"
        and new_status != "cancelled"
    ):

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "A cancelled invoice cannot be reopened."
            ),
        )

    invoice.status = new_status

    try:

        db.commit()

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not update invoice status.",
        )

    db.refresh(invoice)

    return invoice_to_response(
        invoice
    )


# ============================================================
# UPDATE INVOICE PAYMENT
# ============================================================

@router.patch(
    "/{invoice_id}/payment",
    response_model=InvoiceResponse,
)
def update_invoice_payment(
    invoice_id: int,
    amount_paid: Decimal,
    company_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    company = get_user_company(
        company_id=company_id,
        current_user=current_user,
        db=db,
    )
    company_id = company.id

    invoice = (
        db.query(Invoice)
        .filter(
            Invoice.id == invoice_id,
            Invoice.company_id == company_id,
        )
        .first()
    )

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found.",
        )

    if invoice.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment cannot be updated for a cancelled invoice.",
        )

    amount_paid = money(amount_paid)

    grand_total = money(
        Decimal(invoice.grand_total or 0)
    )

    if amount_paid < ZERO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Paid amount cannot be negative.",
        )

    if amount_paid > grand_total:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Paid amount cannot be greater than the invoice total.",
        )

    invoice.amount_paid = amount_paid

    # Calculate payment status
    update_payment_status(invoice)

    try:
        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not update payment.",
        )

    db.refresh(invoice)

    return invoice_to_response(invoice)
# ============================================================
# DELETE INVOICE
# ============================================================

@router.delete(
    "/{invoice_id}",
)
def delete_invoice(
    invoice_id: int,
    company_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    company = get_user_company(
        company_id=company_id,
        current_user=current_user,
        db=db,
    )
    company_id = company.id

    # --------------------------------------------------------
    # Find invoice belonging to current user
    # --------------------------------------------------------

    invoice = (
        db.query(Invoice)
        .filter(
            Invoice.id == invoice_id,
            Invoice.company_id == company_id,
        )
        .first()
    )

    if not invoice:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found.",
        )

    # --------------------------------------------------------
    # Delete invoice items first
    # --------------------------------------------------------

    db.query(InvoiceItem).filter(
        InvoiceItem.invoice_id == invoice_id
    ).delete(
        synchronize_session=False
    )

    # --------------------------------------------------------
    # Delete invoice
    # --------------------------------------------------------

    db.delete(invoice)

    try:

        db.commit()

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not delete invoice.",
        )

    return {
        "message": "Invoice deleted successfully."
    }

# ============================================================
# INVOICE RESPONSE
# ============================================================

# ============================================================
# INVOICE RESPONSE
# ============================================================

def invoice_to_response(
    invoice: Invoice,
):

    amount_paid = money(
        Decimal(
            invoice.amount_paid or 0
        )
    )

    grand_total = money(
        Decimal(
            invoice.grand_total or 0
        )
    )

    (
        amount_paid,
        amount_due,
        payment_status,
    ) = calculate_payment_status(
        amount_paid,
        grand_total,
        invoice.due_date,
    )

    # Keep database value synchronized
    invoice.payment_status = payment_status

    return {
        "id": invoice.id,
        "company_id": invoice.company_id,
        "client_id": invoice.client_id,

        "invoice_number": invoice.invoice_number,
        "invoice_date": invoice.invoice_date,
        "currency": invoice.currency,
        "due_date": invoice.due_date,

        "logo_url": invoice.logo_url,

        "subtotal": invoice.subtotal,
        "discount": invoice.discount,
        "tax_amount": invoice.tax_amount,
        "grand_total": invoice.grand_total,

        "amount_paid": amount_paid,
        "amount_due": amount_due,

        "status": invoice.status,
        "payment_status": payment_status,
        "notes": invoice.notes,
        "terms": invoice.terms,

        # ----------------------------------------------------
        # INVOICE ITEMS
        # ----------------------------------------------------
        "items": [
            {
                "id": item.id,
                "invoice_id": item.invoice_id,
                "product_id": item.product_id,

                # Get product name from Product table
                "name": item.name,
                "description": item.description,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "gst_percent": item.gst_percent,
                "tax_amount": item.tax_amount,
                "line_total": item.line_total,
            }
            for item in invoice.items
        ],
    }