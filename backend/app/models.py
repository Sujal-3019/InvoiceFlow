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

    # --------------------------------------------------------
    # ACTIVE COMPANY
    #
    # A user may have multiple companies. Keep track of the
    # currently-selected company so the frontend can omit
    # sending company_id on every request.
    # --------------------------------------------------------
    active_company_id = Column(
        Integer,
        ForeignKey(
            "companies.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    active_company = relationship(
        "Company",
        foreign_keys=[active_company_id],
        post_update=True,
    )

    # ========================================================
    # RELATIONSHIPS
    # ========================================================

    companies = relationship(
        "Company",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
        foreign_keys="[Company.user_id]",
    )

    password_reset_tokens = relationship(
        "PasswordResetToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )


# ============================================================
# COMPANY
# ============================================================

class Company(Base):
    __tablename__ = "companies"

    # Ensure per-user company numbering is unique
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "company_number",
            name="uq_user_company_number",
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # ========================================================
    # OWNER
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

    # ========================================================
    # PER-USER COMPANY NUMBER
    #
    # This numbers companies relative to their owner (1, 2, 3...).
    # Useful when each user wants their own company indices.
    # ========================================================

    company_number = Column(
        Integer,
        nullable=False,
        default=1,
        index=True,
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

    # ========================================================
    # COMPANY LOGO
    # ========================================================

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

    user = relationship(
        "User",
        back_populates="companies",
        foreign_keys=[user_id],
    )

    clients = relationship(
        "Client",
        back_populates="company",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    products = relationship(
        "Product",
        back_populates="company",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    invoices = relationship(
        "Invoice",
        back_populates="company",
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

    # ========================================================
    # COMPANY OWNERSHIP
    # ========================================================

    company_id = Column(
        Integer,
        ForeignKey(
            "companies.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    # ========================================================
    # CLIENT INFORMATION
    # ========================================================

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

    company = relationship(
        "Company",
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

    # ========================================================
    # COMPANY OWNERSHIP
    # ========================================================

    company_id = Column(
        Integer,
        ForeignKey(
            "companies.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    # ========================================================
    # PRODUCT INFORMATION
    # ========================================================

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

    company = relationship(
        "Company",
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
            "company_id",
            "invoice_number",
            name="uq_company_invoice_number",
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
    # COMPANY OWNERSHIP
    # ========================================================

    company_id = Column(
        Integer,
        ForeignKey(
            "companies.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    # ========================================================
    # CLIENT
    # ========================================================

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

    currency = Column(
        String(3),
        nullable=False,
        default="INR",
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

    company = relationship(
        "Company",
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

    product_name = Column(
        String,
        nullable=True,
    )

    name = Column(
        String,
        nullable=False,
    )

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

# ============================================================
# PASSWORD RESET TOKEN
# ============================================================

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # ========================================================
    # USER
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

    # ========================================================
    # TOKEN
    # ========================================================

    token_hash = Column(
        String(128),
        nullable=False,
        unique=True,
        index=True,
    )

    # ========================================================
    # EXPIRATION
    # ========================================================

    expires_at = Column(
        DateTime,
        nullable=False,
        index=True,
    )

    # ========================================================
    # TOKEN STATUS
    # ========================================================

    used = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    # ========================================================
    # CREATED
    # ========================================================

    created_at = Column(
        DateTime,
        nullable=False,
    )

    # ========================================================
    # RELATIONSHIP
    # ========================================================

    user = relationship(
        "User",
        back_populates="password_reset_tokens",
    )