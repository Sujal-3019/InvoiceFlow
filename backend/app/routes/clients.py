from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Client, User
from ..schemas import ClientCreate, ClientUpdate, ClientResponse
from ..security import get_current_user


router = APIRouter(
    prefix="/clients",
    tags=["Clients"],
)


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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_client = Client(
        user_id=current_user.id,
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    clients = (
        db.query(Client)
        .filter(
            Client.user_id == current_user.id
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    client = (
        db.query(Client)
        .filter(
            Client.id == client_id,
            Client.user_id == current_user.id,
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    client = (
        db.query(Client)
        .filter(
            Client.id == client_id,
            Client.user_id == current_user.id,
        )
        .first()
    )

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )

    # Only update fields that were actually provided.
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    client = (
        db.query(Client)
        .filter(
            Client.id == client_id,
            Client.user_id == current_user.id,
        )
        .first()
    )

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )

    # Prevent deleting a client that already
    # has invoices associated with it.
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
