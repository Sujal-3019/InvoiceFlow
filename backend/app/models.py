from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    Text,
    Date,
    DateTime,
    LargeBinary,
    Numeric,
    Boolean,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from .database import Base


# ============================================================
# USER
# ============================================================

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # ========================================================
    # ACCOUNT
    # ========================================================

    name = Column(
        String,
        nullable=False,
    )

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )

    password = Column(
        String,
        nullable=True,
    )
    google_id = Column(
        String,
        unique=True,
        index=True,
        nullable=True,
    )

    # ========================================================
    # BUSINESS IDENTITY
    # ========================================================

    company = Column(
        String,
        nullable=True,
    )

    business_name = Column(
        String,
        nullable=True,
    )

    business_type = Column(
        String,
        nullable=True,
    )

    website = Column(
        String,
        nullable=True,
    )

    bio = Column(
        Text,
        nullable=True,
    )

    phone = Column(
        String,
        nullable=True,
    )

    # --------------------------------------------------------
    # Current company/profile logo
    #
    # Example:
    # /uploads/invoice_logos/user_1_xxxxx.png
    #
    # This is the user's CURRENT logo.
    #
    # Existing generated PDFs are independent snapshots
    # because the PDF binary is stored in Invoice.pdf_data.
    # --------------------------------------------------------

    logo_url = Column(
        String(500),
        nullable=True,
    )

    # ========================================================
    # BUSINESS ADDRESS
    # ========================================================

    address = Column(
        Text,
        nullable=True,
    )

    city = Column(
        String,
        nullable=True,
    )

    state = Column(
        String,
        nullable=True,
    )

    zip = Column(
        String,
        nullable=True,
    )

    country = Column(
        String,
        nullable=True,
    )

    # ========================================================
    # TAX & LEGAL
    # ========================================================

    tax_id = Column(
        String,
        nullable=True,
    )

    gst_number = Column(
        String,
        nullable=True,
    )

    pan_number = Column(
        String,
        nullable=True,
    )

    registration_number = Column(
        String,
        nullable=True,
    )

    # ========================================================
    # INVOICE NUMBERING
    # ========================================================

    invoice_prefix = Column(
        String,
        nullable=True,
        default="INV-",
    )

    invoice_starting_number = Column(
        Integer,
        nullable=True,
        default=1001,
    )

    # ========================================================
    # INVOICE DEFAULTS
    # ========================================================

    currency = Column(
        String,
        nullable=True,
        default="INR",
    )

    payment_terms = Column(
        String,
        nullable=True,
        default="Net 30",
    )

    invoice_notes = Column(
        Text,
        nullable=True,
    )

    invoice_terms = Column(
        Text,
        nullable=True,
    )

    # ========================================================
    # RELATIONSHIPS
    # ========================================================

    clients = relationship(
        "Client",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    products = relationship(
        "Product",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    invoices = relationship(
        "Invoice",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


# ============================================================
# CLIENT
# ============================================================

class Client(Base):
    __tablename__ = "clients"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    company_name = Column(
        String,
        nullable=False,
    )

    contact_person = Column(
        String,
        nullable=True,
    )

    email = Column(
        String,
        nullable=True,
    )

    phone = Column(
        String,
        nullable=True,
    )

    gst_number = Column(
        String,
        nullable=True,
    )

    address = Column(
        Text,
        nullable=True,
    )

    # ========================================================
    # RELATIONSHIPS
    # ========================================================

    user = relationship(
        "User",
        back_populates="clients",
    )

    invoices = relationship(
        "Invoice",
        back_populates="client",
    )


# ============================================================
# PRODUCT
# ============================================================

class Product(Base):
    __tablename__ = "products"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    name = Column(
        String,
        nullable=False,
    )

    description = Column(
        Text,
        nullable=True,
    )

    price = Column(
        Numeric(
            12,
            2,
        ),
        nullable=False,
    )

    gst_percent = Column(
        Numeric(
            5,
            2,
        ),
        nullable=False,
        default=0,
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
    )

    # ========================================================
    # RELATIONSHIPS
    # ========================================================

    user = relationship(
        "User",
        back_populates="products",
    )

    invoice_items = relationship(
        "InvoiceItem",
        back_populates="product",
    )


# ============================================================
# INVOICE
# ============================================================

class Invoice(Base):
    __tablename__ = "invoices"

    # ========================================================
    # TABLE CONSTRAINTS
    # ========================================================

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "invoice_number",
            name="uq_user_invoice_number",
        ),
    )

    # ========================================================
    # PRIMARY KEY
    # ========================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # ========================================================
    # OWNERSHIP
    # ========================================================

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    client_id = Column(
        Integer,
        ForeignKey(
            "clients.id",
        ),
        nullable=False,
        index=True,
    )

    # ========================================================
    # INVOICE INFORMATION
    # ========================================================

    invoice_number = Column(
        String,
        nullable=False,
        index=True,
    )

    invoice_date = Column(
        Date,
        nullable=False,
    )

    due_date = Column(
        Date,
        nullable=True,
    )

    # ========================================================
    # LOGO SNAPSHOT REFERENCE
    # ========================================================

    logo_url = Column(
        String(500),
        nullable=True,
    )

    # ========================================================
    # FINANCIAL TOTALS
    # ========================================================

    subtotal = Column(
        Numeric(
            12,
            2,
        ),
        nullable=False,
        default=0,
    )

    discount = Column(
        Numeric(
            12,
            2,
        ),
        nullable=False,
        default=0,
    )

    tax_amount = Column(
        Numeric(
            12,
            2,
        ),
        nullable=False,
        default=0,
    )

    grand_total = Column(
        Numeric(
            12,
            2,
        ),
        nullable=False,
        default=0,
    )

    # ========================================================
    # PAYMENT
    # ========================================================

    amount_paid = Column(
        Numeric(
            12,
            2,
        ),
        nullable=False,
        default=0,
    )

    status = Column(
        String,
        nullable=False,
        default="draft",
    )

    payment_status = Column(
        String,
        nullable=False,
        default="unpaid",
    )

    # ========================================================
    # NOTES
    # ========================================================

    notes = Column(
        Text,
        nullable=True,
    )

    # ========================================================
    # TERMS
    # ========================================================

    terms = Column(
        Text,
        nullable=True,
    )

    # ========================================================
    # STORED PDF SNAPSHOT
    # ========================================================
    #
    # The generated invoice PDF is stored directly in the DB.
    #
    # This is intentional:
    #
    # 1. Changing the company logo does not change old PDFs.
    # 2. Changing the client does not change old PDFs.
    # 3. Changing products does not change old PDFs.
    # 4. Changing invoice information does not change old PDFs.
    # 5. Changing payment information does not change old PDFs.
    #
    # The PDF only changes when:
    #
    # POST /invoices/{invoice_id}/pdf
    #
    # is explicitly called.
    #
    # ========================================================

    pdf_data = Column(
        LargeBinary,
        nullable=True,
    )

    pdf_filename = Column(
        String(255),
        nullable=True,
    )

    pdf_generated_at = Column(
        DateTime,
        nullable=True,
    )

    # ========================================================
    # RELATIONSHIPS
    # ========================================================

    user = relationship(
        "User",
        back_populates="invoices",
    )

    client = relationship(
        "Client",
        back_populates="invoices",
    )

    items = relationship(
        "InvoiceItem",
        back_populates="invoice",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


# ============================================================
# INVOICE ITEM
# ============================================================

class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    # ========================================================
    # PRIMARY KEY
    # ========================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # ========================================================
    # INVOICE RELATIONSHIP
    # ========================================================

    invoice_id = Column(
        Integer,
        ForeignKey(
            "invoices.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    # ========================================================
    # PRODUCT RELATIONSHIP
    # ========================================================
    #
    # IMPORTANT:
    #
    # product_id is nullable intentionally.
    #
    # An invoice must preserve its historical item even if
    # the original product is deleted.
    #
    # Therefore:
    #
    # Product deleted
    #       ↓
    # InvoiceItem remains
    #       ↓
    # product_id becomes NULL
    #
    # The historical description, quantity, unit_price and
    # gst_percent remain stored on the InvoiceItem itself.
    #
    # ========================================================

    product_id = Column(
        Integer,
        ForeignKey(
            "products.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    # ========================================================
    # HISTORICAL ITEM INFORMATION
    # ========================================================

    description = Column(
        Text,
        nullable=True,
    )

    quantity = Column(
        Numeric(
            12,
            2,
        ),
        nullable=False,
        default=1,
    )

    unit_price = Column(
        Numeric(
            12,
            2,
        ),
        nullable=False,
    )

    gst_percent = Column(
        Numeric(
            5,
            2,
        ),
        nullable=False,
        default=0,
    )

    tax_amount = Column(
        Numeric(
            12,
            2,
        ),
        nullable=False,
        default=0,
    )

    line_total = Column(
        Numeric(
            12,
            2,
        ),
        nullable=False,
    )

    # ========================================================
    # RELATIONSHIPS
    # ========================================================

    invoice = relationship(
        "Invoice",
        back_populates="items",
    )

    product = relationship(
        "Product",
        back_populates="invoice_items",
    )