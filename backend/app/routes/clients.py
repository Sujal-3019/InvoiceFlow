from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Client, User, Company
from ..schemas import ClientCreate, ClientUpdate, ClientResponse
from ..security import get_current_user


router = APIRouter(
    prefix="/clients",
    tags=["Clients"],
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
# CREATE CLIENT
# ============================================================

@router.post(
    "/",
    response_model=ClientResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_client(
    client_data: ClientCreate,
    company_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # --------------------------------------------------------
    # Verify that the company belongs to the logged-in user
    # --------------------------------------------------------

    company = get_user_company(
        company_id=company_id,
        current_user=current_user,
        db=db,
    )

    # --------------------------------------------------------
    # Create client
    # --------------------------------------------------------

    new_client = Client(
        company_id=company.id,
        company_name=client_data.company_name,
        contact_person=client_data.contact_person,
        email=client_data.email,
        phone=client_data.phone,
        gst_number=client_data.gst_number,
        address=client_data.address,
    )

    db.add(new_client)
    db.commit()
    db.refresh(new_client)

    return new_client


# ============================================================
# GET ALL CLIENTS
# ============================================================

@router.get(
    "/",
    response_model=list[ClientResponse],
)
def get_clients(
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
    # Get only clients belonging to this company
    # --------------------------------------------------------

    clients = (
        db.query(Client)
        .filter(
            Client.company_id == company.id
        )
        .order_by(Client.id.desc())
        .all()
    )

    return clients


# ============================================================
# GET SINGLE CLIENT
# ============================================================

@router.get(
    "/{client_id}",
    response_model=ClientResponse,
)
def get_client(
    client_id: int,
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
    # Find client inside this company only
    # --------------------------------------------------------

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
            detail="Client not found",
        )

    return client


# ============================================================
# UPDATE CLIENT
# ============================================================

@router.put(
    "/{client_id}",
    response_model=ClientResponse,
)
def update_client(
    client_id: int,
    client_data: ClientUpdate,
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
    # Find client inside this company only
    # --------------------------------------------------------

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
            detail="Client not found",
        )

    # --------------------------------------------------------
    # Update only provided fields
    # --------------------------------------------------------

    update_data = client_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(client, field, value)

    db.commit()
    db.refresh(client)

    return client


# ============================================================
# DELETE CLIENT
# ============================================================

@router.delete(
    "/{client_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_client(
    client_id: int,
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
    # Find client inside this company only
    # --------------------------------------------------------

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
            detail="Client not found",
        )

    # --------------------------------------------------------
    # Prevent deleting a client with invoices
    # --------------------------------------------------------

    if client.invoices:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "This client cannot be deleted because "
                "invoices are associated with the client."
            ),
        )

    db.delete(client)
    db.commit()

    return None
