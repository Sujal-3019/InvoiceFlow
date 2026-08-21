from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    User,
    Client,
    Product,
    Invoice,
    Company,
)
from ..security import get_current_user


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


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

    return (
        query
        .order_by(Company.id.asc())
        .first()
    )


# ============================================================
# DASHBOARD SUMMARY
# ============================================================

@router.get("/summary")
def get_dashboard_summary(
    company_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company = get_user_company(
        company_id=company_id,
        current_user=current_user,
        db=db,
    )

    if not company:
        return {
            "total_clients": 0,
            "total_products": 0,
            "total_invoices": 0,
            "total_revenue": "0.00",
            "paid_amount": "0.00",
            "partial_amount": "0.00",
            "unpaid_amount": "0.00",
            "draft_invoices": 0,
            "sent_invoices": 0,
            "cancelled_invoices": 0,
            "paid_invoices": 0,
            "partial_invoices": 0,
            "unpaid_invoices": 0,
        }

    # --------------------------------------------------------
    # Total clients
    # --------------------------------------------------------

    total_clients = (
        db.query(func.count(Client.id))
        .filter(
            Client.company_id == company.id
        )
        .scalar()
    ) or 0

    # --------------------------------------------------------
    # Total products
    # --------------------------------------------------------

    total_products = (
        db.query(func.count(Product.id))
        .filter(
            Product.company_id == company.id
        )
        .scalar()
    ) or 0

    # --------------------------------------------------------
    # Total invoices
    # --------------------------------------------------------

    total_invoices = (
        db.query(func.count(Invoice.id))
        .filter(
            Invoice.company_id == company.id
        )
        .scalar()
    ) or 0

    # --------------------------------------------------------
    # Total revenue
    #
    # We exclude cancelled invoices.
    # --------------------------------------------------------

    total_revenue = (
        db.query(
            func.coalesce(
                func.sum(Invoice.grand_total),
                0,
            )
        )
        .filter(
            Invoice.company_id == company.id,
            Invoice.status != "cancelled",
        )
        .scalar()
    ) or Decimal("0.00")

    # --------------------------------------------------------
    # Paid amount
    # --------------------------------------------------------

    paid_amount = (
        db.query(
            func.coalesce(
                func.sum(Invoice.grand_total),
                0,
            )
        )
        .filter(
            Invoice.company_id == company.id,
            Invoice.payment_status == "paid",
            Invoice.status != "cancelled",
        )
        .scalar()
    ) or Decimal("0.00")

    # --------------------------------------------------------
    # Partial amount
    #
    # IMPORTANT:
    #
    # Since your current Invoice model does not have a
    # "amount_paid" column, we cannot know how much money
    # was actually paid on a partial invoice.
    #
    # For now this represents the grand total of invoices
    # whose payment_status is "partial".
    # --------------------------------------------------------

    partial_amount = (
        db.query(
            func.coalesce(
                func.sum(Invoice.grand_total),
                0,
            )
        )
        .filter(
            Invoice.company_id == company.id,
            Invoice.payment_status == "partial",
            Invoice.status != "cancelled",
        )
        .scalar()
    ) or Decimal("0.00")

    # --------------------------------------------------------
    # Unpaid amount
    # --------------------------------------------------------

    unpaid_amount = (
        db.query(
            func.coalesce(
                func.sum(Invoice.grand_total),
                0,
            )
        )
        .filter(
            Invoice.company_id == company.id,
            Invoice.payment_status == "unpaid",
            Invoice.status != "cancelled",
        )
        .scalar()
    ) or Decimal("0.00")

    # --------------------------------------------------------
    # Invoice counts by status
    # --------------------------------------------------------

    draft_invoices = (
        db.query(func.count(Invoice.id))
        .filter(
            Invoice.company_id == company.id,
            Invoice.status == "draft",
        )
        .scalar()
    ) or 0

    sent_invoices = (
        db.query(func.count(Invoice.id))
        .filter(
            Invoice.company_id == company.id,
            Invoice.status == "sent",
        )
        .scalar()
    ) or 0

    cancelled_invoices = (
        db.query(func.count(Invoice.id))
        .filter(
            Invoice.company_id == company.id,
            Invoice.status == "cancelled",
        )
        .scalar()
    ) or 0

    paid_invoices = (
        db.query(func.count(Invoice.id))
        .filter(
            Invoice.company_id == company.id,
            Invoice.payment_status == "paid",
            Invoice.status != "cancelled",
        )
        .scalar()
    ) or 0

    # --------------------------------------------------------
    # Unpaid invoices
    # --------------------------------------------------------

    unpaid_invoices = (
        db.query(func.count(Invoice.id))
        .filter(
            Invoice.company_id == company.id,
            Invoice.payment_status == "unpaid",
            Invoice.status != "cancelled",
        )
        .scalar()
    ) or 0

    # --------------------------------------------------------
    # Partial invoices
    # --------------------------------------------------------

    partial_invoices = (
        db.query(func.count(Invoice.id))
        .filter(
            Invoice.company_id == company.id,
            Invoice.payment_status == "partial",
            Invoice.status != "cancelled",
        )
        .scalar()
    ) or 0

    # --------------------------------------------------------
    # Return dashboard data
    # --------------------------------------------------------

    return {
        "total_clients": total_clients,
        "total_products": total_products,
        "total_invoices": total_invoices,

        "total_revenue": str(
            Decimal(total_revenue).quantize(
                Decimal("0.01")
            )
        ),

        "paid_amount": str(
            Decimal(paid_amount).quantize(
                Decimal("0.01")
            )
        ),

        "partial_amount": str(
            Decimal(partial_amount).quantize(
                Decimal("0.01")
            )
        ),

        "unpaid_amount": str(
            Decimal(unpaid_amount).quantize(
                Decimal("0.01")
            )
        ),

        "draft_invoices": draft_invoices,
        "sent_invoices": sent_invoices,
        "cancelled_invoices": cancelled_invoices,

        "paid_invoices": paid_invoices,
        "partial_invoices": partial_invoices,
        "unpaid_invoices": unpaid_invoices,
    }
