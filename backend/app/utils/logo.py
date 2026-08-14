# utils/logo.py

import os
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from ..models import User


UPLOAD_DIR = "uploads/logos"

ALLOWED_LOGO_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

MAX_LOGO_SIZE = 5 * 1024 * 1024  # 5 MB


async def save_user_logo(
    file: UploadFile,
    current_user: User,
    db: Session,
) -> str:

    # --------------------------------------------------------
    # Validate file type
    # --------------------------------------------------------

    if file.content_type not in ALLOWED_LOGO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid logo format. "
                "Only JPG, PNG and WEBP images are allowed."
            ),
        )

    # --------------------------------------------------------
    # Read file
    # --------------------------------------------------------

    contents = await file.read()

    # --------------------------------------------------------
    # Validate file size
    # --------------------------------------------------------

    if len(contents) > MAX_LOGO_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Logo file size cannot exceed 5 MB.",
        )

    # --------------------------------------------------------
    # Create directory
    # --------------------------------------------------------

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # --------------------------------------------------------
    # Delete previous logo
    # --------------------------------------------------------

    if current_user.logo_url:
        old_logo_path = current_user.logo_url.lstrip("/")

        if os.path.exists(old_logo_path):
            try:
                os.remove(old_logo_path)
            except OSError:
                pass

    # --------------------------------------------------------
    # Extension
    # --------------------------------------------------------

    extension_map = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }

    extension = extension_map[file.content_type]

    # --------------------------------------------------------
    # Generate filename
    # --------------------------------------------------------

    filename = (
        f"user_{current_user.id}_"
        f"{uuid4().hex}"
        f"{extension}"
    )

    file_path = os.path.join(
        UPLOAD_DIR,
        filename,
    )

    # --------------------------------------------------------
    # Save file
    # --------------------------------------------------------

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    # --------------------------------------------------------
    # Save URL to USER PROFILE
    # --------------------------------------------------------

    current_user.logo_url = (
        f"/uploads/logos/{filename}"
    )

    db.commit()
    db.refresh(current_user)

    return current_user.logo_url