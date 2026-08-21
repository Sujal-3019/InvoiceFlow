from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Product, User, Company
from ..schemas import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
)
from ..security import get_current_user


router = APIRouter(
    prefix="/products",
    tags=["Products"],
)


# ============================================================
# VERIFY COMPANY OWNERSHIP
# ============================================================

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
            detail="Company not found",
        )

    return company


# ============================================================
# CREATE PRODUCT
# ============================================================

@router.post(
    "/",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_product(
    product_data: ProductCreate,
    company_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # --------------------------------------------------------
    # Verify company ownership
    # --------------------------------------------------------

    company = get_user_company(
        company_id=company_id,
        current_user=current_user,
        db=db,
    )

    # --------------------------------------------------------
    # Create product
    # --------------------------------------------------------

    new_product = Product(
        company_id=company.id,
        name=product_data.name,
        description=product_data.description,
        price=product_data.price,
        gst_percent=product_data.gst_percent,
        is_active=product_data.is_active,
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product


# ============================================================
# GET ALL PRODUCTS
# ============================================================

@router.get(
    "/",
    response_model=list[ProductResponse],
)
def get_products(
    company_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # --------------------------------------------------------
    # Verify company ownership
    # --------------------------------------------------------

    company = get_user_company(
        company_id=company_id,
        current_user=current_user,
        db=db,
    )

    # --------------------------------------------------------
    # Get only products belonging to this company
    # --------------------------------------------------------

    products = (
        db.query(Product)
        .filter(
            Product.company_id == company.id
        )
        .order_by(Product.id.desc())
        .all()
    )

    return products


# ============================================================
# GET SINGLE PRODUCT
# ============================================================

@router.get(
    "/{product_id}",
    response_model=ProductResponse,
)
def get_product(
    product_id: int,
    company_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # --------------------------------------------------------
    # Verify company ownership
    # --------------------------------------------------------

    company = get_user_company(
        company_id=company_id,
        current_user=current_user,
        db=db,
    )

    # --------------------------------------------------------
    # Find product inside this company only
    # --------------------------------------------------------

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
            detail="Product not found",
        )

    return product


# ============================================================
# UPDATE PRODUCT
# ============================================================

@router.put(
    "/{product_id}",
    response_model=ProductResponse,
)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    company_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # --------------------------------------------------------
    # Verify company ownership
    # --------------------------------------------------------

    company = get_user_company(
        company_id=company_id,
        current_user=current_user,
        db=db,
    )

    # --------------------------------------------------------
    # Find product inside this company only
    # --------------------------------------------------------

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
            detail="Product not found",
        )

    # --------------------------------------------------------
    # Update only provided fields
    # --------------------------------------------------------

    update_data = product_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)

    return product


# ============================================================
# DELETE PRODUCT
# ============================================================

@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_product(
    product_id: int,
    company_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # --------------------------------------------------------
    # Verify company ownership
    # --------------------------------------------------------

    company = get_user_company(
        company_id=company_id,
        current_user=current_user,
        db=db,
    )

    # --------------------------------------------------------
    # Find product inside this company only
    # --------------------------------------------------------

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
            detail="Product not found",
        )

    # --------------------------------------------------------
    # If product has been used in an invoice,
    # deactivate it instead of physically deleting it.
    # --------------------------------------------------------

    if product.invoice_items:
        product.is_active = False

        db.commit()

        return None

    # --------------------------------------------------------
    # Otherwise physically delete the product
    # --------------------------------------------------------

    db.delete(product)
    db.commit()

    return None
