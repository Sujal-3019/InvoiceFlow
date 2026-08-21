from typing import Optional
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# USER SCHEMAS
# ============================================================

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

    # These are used only when creating
    # the user's initial company.
    company: Optional[str] = None
    phone: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class SetPassword(BaseModel):
    password: str
    confirm_password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
    )


class UserResponse(BaseModel):
    id: int
    name: str
    email: str

    # ID of the user's currently selected company (if any)
    active_company_id: Optional[int] = None

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )


# ============================================================
# COMPANY SCHEMAS
# ============================================================

class CompanyCreate(BaseModel):
    # --------------------------------------------------------
    # BUSINESS IDENTITY
    # --------------------------------------------------------

    company: Optional[str] = None

    businessName: Optional[str] = Field(
        default=None,
        validation_alias="business_name",
    )

    businessType: Optional[str] = Field(
        default=None,
        validation_alias="business_type",
    )

    website: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None

    # --------------------------------------------------------
    # ADDRESS
    # --------------------------------------------------------

    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    country: Optional[str] = None

    # --------------------------------------------------------
    # TAX & LEGAL
    # --------------------------------------------------------

    taxId: Optional[str] = Field(
        default=None,
        validation_alias="tax_id",
    )

    gstNumber: Optional[str] = Field(
        default=None,
        validation_alias="gst_number",
    )

    panNumber: Optional[str] = Field(
        default=None,
        validation_alias="pan_number",
    )

    registrationNumber: Optional[str] = Field(
        default=None,
        validation_alias="registration_number",
    )

    # --------------------------------------------------------
    # INVOICE NUMBERING
    # --------------------------------------------------------

    invoicePrefix: Optional[str] = Field(
        default="INV-",
        validation_alias="invoice_prefix",
    )

    invoiceStartingNumber: Optional[int] = Field(
        default=1001,
        validation_alias="invoice_starting_number",
    )

    # --------------------------------------------------------
    # INVOICE DEFAULTS
    # --------------------------------------------------------

    currency: Optional[str] = "INR"

    paymentTerms: Optional[str] = Field(
        default="Net 30",
        validation_alias="payment_terms",
    )

    invoiceNotes: Optional[str] = Field(
        default=None,
        validation_alias="invoice_notes",
    )

    invoiceTerms: Optional[str] = Field(
        default=None,
        validation_alias="invoice_terms",
    )

    model_config = ConfigDict(
        populate_by_name=True,
    )


class CompanyUpdate(BaseModel):
    # --------------------------------------------------------
    # BUSINESS IDENTITY
    # --------------------------------------------------------

    company: Optional[str] = None

    businessName: Optional[str] = Field(
        default=None,
        validation_alias="business_name",
    )

    businessType: Optional[str] = Field(
        default=None,
        validation_alias="business_type",
    )

    website: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None

    # --------------------------------------------------------
    # ADDRESS
    # --------------------------------------------------------

    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    country: Optional[str] = None

    # --------------------------------------------------------
    # TAX & LEGAL
    # --------------------------------------------------------

    taxId: Optional[str] = Field(
        default=None,
        validation_alias="tax_id",
    )

    gstNumber: Optional[str] = Field(
        default=None,
        validation_alias="gst_number",
    )

    panNumber: Optional[str] = Field(
        default=None,
        validation_alias="pan_number",
    )

    registrationNumber: Optional[str] = Field(
        default=None,
        validation_alias="registration_number",
    )

    # --------------------------------------------------------
    # INVOICE NUMBERING
    # --------------------------------------------------------

    invoicePrefix: Optional[str] = Field(
        default=None,
        validation_alias="invoice_prefix",
    )

    invoiceStartingNumber: Optional[int] = Field(
        default=None,
        validation_alias="invoice_starting_number",
    )

    # --------------------------------------------------------
    # INVOICE DEFAULTS
    # --------------------------------------------------------

    currency: Optional[str] = None

    paymentTerms: Optional[str] = Field(
        default=None,
        validation_alias="payment_terms",
    )

    invoiceNotes: Optional[str] = Field(
        default=None,
        validation_alias="invoice_notes",
    )

    invoiceTerms: Optional[str] = Field(
        default=None,
        validation_alias="invoice_terms",
    )

    model_config = ConfigDict(
        populate_by_name=True,
    )


class CompanyResponse(BaseModel):
    id: int
    user_id: int

    # Per-user company index (1 for the user's first company, 2 for second, ...)
    companyNumber: Optional[int] = Field(
        default=None,
        validation_alias="company_number",
    )

    # --------------------------------------------------------
    # BUSINESS IDENTITY
    # --------------------------------------------------------

    company: Optional[str] = None

    businessName: Optional[str] = Field(
        default=None,
        validation_alias="business_name",
    )

    businessType: Optional[str] = Field(
        default=None,
        validation_alias="business_type",
    )

    website: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None

    logo_url: Optional[str] = None

    # --------------------------------------------------------
    # ADDRESS
    # --------------------------------------------------------

    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    country: Optional[str] = None

    # --------------------------------------------------------
    # TAX & LEGAL
    # --------------------------------------------------------

    taxId: Optional[str] = Field(
        default=None,
        validation_alias="tax_id",
    )

    gstNumber: Optional[str] = Field(
        default=None,
        validation_alias="gst_number",
    )

    panNumber: Optional[str] = Field(
        default=None,
        validation_alias="pan_number",
    )

    registrationNumber: Optional[str] = Field(
        default=None,
        validation_alias="registration_number",
    )

    # --------------------------------------------------------
    # INVOICE NUMBERING
    # --------------------------------------------------------

    invoicePrefix: Optional[str] = Field(
        default=None,
        validation_alias="invoice_prefix",
    )

    invoiceStartingNumber: Optional[int] = Field(
        default=None,
        validation_alias="invoice_starting_number",
    )

    # --------------------------------------------------------
    # INVOICE DEFAULTS
    # --------------------------------------------------------

    currency: Optional[str] = None

    paymentTerms: Optional[str] = Field(
        default=None,
        validation_alias="payment_terms",
    )

    invoiceNotes: Optional[str] = Field(
        default=None,
        validation_alias="invoice_notes",
    )

    invoiceTerms: Optional[str] = Field(
        default=None,
        validation_alias="invoice_terms",
    )

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )


# ============================================================
# CLIENT SCHEMAS
# ============================================================

class ClientCreate(BaseModel):
    company_name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    gst_number: Optional[str] = None
    address: Optional[str] = None


class ClientUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    gst_number: Optional[str] = None
    address: Optional[str] = None


class ClientResponse(BaseModel):
    id: int
    company_id: int

    company_name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    gst_number: Optional[str] = None
    address: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True,
    )


# ============================================================
# PRODUCT SCHEMAS
# ============================================================

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: Decimal
    gst_percent: Decimal = Decimal("0")
    is_active: bool = True


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    gst_percent: Optional[Decimal] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    id: int
    company_id: int

    name: str
    description: Optional[str] = None
    price: Decimal
    gst_percent: Decimal
    is_active: bool

    model_config = ConfigDict(
        from_attributes=True,
    )


# ============================================================
# INVOICE ITEM SCHEMAS
# ============================================================

class InvoiceItemCreate(BaseModel):
    product_id: int
    quantity: Decimal


class InvoiceItemUpdate(BaseModel):
    """
    Used when editing an existing invoice item.

    Existing item:
        send its id

    New item:
        don't send id
    """

    id: Optional[int] = None
    product_id: int
    quantity: Decimal


class InvoiceItemResponse(BaseModel):
    id: int
    invoice_id: int
    product_id: Optional[int] = None

    description: Optional[str] = None
    quantity: Decimal
    unit_price: Decimal
    gst_percent: Decimal
    tax_amount: Decimal
    line_total: Decimal

    model_config = ConfigDict(
        from_attributes=True,
    )


# ============================================================
# INVOICE SCHEMAS
# ============================================================

class InvoiceCreate(BaseModel):
    client_id: int
    invoice_number: str
    invoice_date: date

    currency: str = "INR"

    due_date: Optional[date] = None
    logo_url: Optional[str] = None

    discount: Decimal = Decimal("0")

    # Amount already paid by the client.
    amount_paid: Decimal = Decimal("0")

    notes: Optional[str] = None
    terms: Optional[str] = None

    items: list[InvoiceItemCreate]


class InvoiceUpdate(BaseModel):
    client_id: Optional[int] = None

    invoice_date: Optional[date] = None
    due_date: Optional[date] = None

    logo_url: Optional[str] = None

    discount: Optional[Decimal] = None

    # Optional when editing an invoice.
    amount_paid: Optional[Decimal] = None

    status: Optional[str] = None

    notes: Optional[str] = None
    terms: Optional[str] = None

    items: Optional[list[InvoiceItemUpdate]] = None


class InvoiceClientResponse(BaseModel):
    id: int
    company_name: str

    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    gst_number: Optional[str] = None
    address: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True,
    )


class InvoiceResponse(BaseModel):
    id: int
    company_id: int

    client_id: int
    client: Optional[ClientResponse] = None

    invoice_number: str
    invoice_date: date
    currency: str
    due_date: Optional[date] = None

    logo_url: Optional[str] = None

    subtotal: Decimal
    discount: Decimal
    tax_amount: Decimal
    grand_total: Decimal

    amount_paid: Decimal
    amount_due: Decimal

    status: str
    payment_status: str

    notes: Optional[str] = None
    terms: Optional[str] = None

    items: list[InvoiceItemResponse] = []

    model_config = ConfigDict(
        from_attributes=True,
    )