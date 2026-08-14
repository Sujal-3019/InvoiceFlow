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
)
from ..security import get_current_user


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


# ============================================================
# DASHBOARD SUMMARY
# ============================================================

@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # --------------------------------------------------------
    # Total clients
    # --------------------------------------------------------

    total_clients = (
        db.query(func.count(Client.id))
        .filter(
            Client.user_id == current_user.id
        )
        .scalar()
    ) or 0

    # --------------------------------------------------------
    # Total products
    # --------------------------------------------------------

    total_products = (
        db.query(func.count(Product.id))
        .filter(
            Product.user_id == current_user.id
        )
        .scalar()
    ) or 0

    # --------------------------------------------------------
    # Total invoices
    # --------------------------------------------------------

    total_invoices = (
        db.query(func.count(Invoice.id))
        .filter(
            Invoice.user_id == current_user.id
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
            Invoice.user_id == current_user.id,
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
            Invoice.user_id == current_user.id,
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
            Invoice.user_id == current_user.id,
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
            Invoice.user_id == current_user.id,
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
            Invoice.user_id == current_user.id,
            Invoice.status == "draft",
        )
        .scalar()
    ) or 0

    sent_invoices = (
        db.query(func.count(Invoice.id))
        .filter(
            Invoice.user_id == current_user.id,
            Invoice.status == "sent",
        )
        .scalar()
    ) or 0

    cancelled_invoices = (
        db.query(func.count(Invoice.id))
        .filter(
            Invoice.user_id == current_user.id,
            Invoice.status == "cancelled",
        )
        .scalar()
    ) or 0

    paid_invoices = (
        db.query(func.count(Invoice.id))
        .filter(
            Invoice.user_id == current_user.id,
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
            Invoice.user_id == current_user.id,
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
            Invoice.user_id == current_user.id,
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
