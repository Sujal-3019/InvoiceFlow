import os
import smtplib

from email.message import EmailMessage


def get_smtp_connection():
    smtp_host = os.getenv(
        "SMTP_HOST",
        "smtp.gmail.com",
    )

    smtp_port = int(
        os.getenv(
            "SMTP_PORT",
            "587",
        )
    )

    smtp_username = os.getenv(
        "SMTP_USERNAME",
    )

    smtp_password = os.getenv(
        "SMTP_PASSWORD",
    )

    if not smtp_username or not smtp_password:
        raise RuntimeError(
            "SMTP credentials are not configured"
        )

    server = smtplib.SMTP(
        smtp_host,
        smtp_port,
    )

    server.starttls()

    server.login(
        smtp_username,
        smtp_password,
    )

    return server, smtp_username

# ============================================================
# EMAIL VERIFICATION EMAIL
# ============================================================

def send_verification_email(
    recipient_email: str,
    verification_token: str,
):
    frontend_url = os.getenv(
        "FRONTEND_URL",
        "http://localhost:5173",
    )

    verification_link = (
        f"{frontend_url}/verify-email"
        f"?token={verification_token}"
    )

    message = EmailMessage()

    message["Subject"] = "Verify Your InvoiceFlow Email"
    message["From"] = os.getenv("SMTP_USERNAME")
    message["To"] = recipient_email

    message.set_content(
        f"""
Hello,

Welcome to InvoiceFlow!

Please verify your email address by clicking the link below:

{verification_link}

This verification link will expire in 15 minutes.

If you did not create an InvoiceFlow account, you can safely ignore this email.

Regards,
InvoiceFlow Team
"""
    )

    server, _ = get_smtp_connection()

    try:
        server.send_message(message)
    finally:
        server.quit()


# ============================================================
# PASSWORD RESET EMAIL
# ============================================================

def send_password_reset_email(
    recipient_email: str,
    reset_token: str,
):
    frontend_url = os.getenv(
        "FRONTEND_URL",
        "http://localhost:5173",
    )

    reset_link = (
        f"{frontend_url}/reset-password"
        f"?token={reset_token}"
    )

    message = EmailMessage()

    message["Subject"] = "Reset Your InvoiceFlow Password"
    message["From"] = os.getenv("SMTP_USERNAME")
    message["To"] = recipient_email

    message.set_content(
        f"""
Hello,

We received a request to reset your InvoiceFlow password.

Click the link below to create a new password:

{reset_link}

This link will expire in 15 minutes.

If you did not request this password reset, you can safely ignore this email.

Regards,
InvoiceFlow Team
"""
    )

    server, _ = get_smtp_connection()

    try:
        server.send_message(message)
    finally:
        server.quit()


# ============================================================
# SEND INVOICE EMAIL
# ============================================================

def send_invoice_email(
    recipient_email: str,
    invoice_number: str,
    invoice_date: str,
    due_date: str,
    amount: str,
    payment_status: str,
    pdf_bytes: bytes,
    pdf_filename: str,
    company_name: str,
    client_name: str,
):
    message = EmailMessage()

    message["Subject"] = (
        f"Invoice {invoice_number} from {company_name}"
    )

    message["From"] = os.getenv(
        "SMTP_USERNAME"
    )

    message["To"] = recipient_email

    message.set_content(
        f"""
Hello {client_name},

Please find your invoice attached to this email.

Invoice Number: {invoice_number}
Invoice Date: {invoice_date}
Due Date: {due_date if due_date is not None else "NO Due Date"} 
Amount: {amount}
Payment Status: {payment_status}

Thank you for your business.

Regards,
{company_name}

Sent via InvoiceFlow
"""
    )

    # --------------------------------------------------------
    # Attach PDF
    # --------------------------------------------------------

    message.add_attachment(
        pdf_bytes,
        maintype="application",
        subtype="pdf",
        filename=pdf_filename,
    )

    server, _ = get_smtp_connection()

    try:
        server.send_message(message)

    finally:
        server.quit()


# ============================================================
# SEND PAYMENT REMINDER EMAIL
# ============================================================

def send_payment_reminder_email(
    recipient_email: str,
    client_name: str,
    invoice_details: str,
    total_pending: str,
    company_name: str,
    pdf_attachments: list[tuple[bytes, str]],
):

    message = EmailMessage()

    message["Subject"] = (
        "Payment Reminder - Outstanding Invoice(s)"
    )

    message["From"] = os.getenv(
        "SMTP_USERNAME"
    )

    message["To"] = recipient_email

    message.set_content(
        f"""
Hello {client_name},

This is a friendly reminder regarding the following
outstanding invoice(s):

{invoice_details}

----------------------------------------
Total Amount Due: {total_pending}
----------------------------------------

Kindly arrange the payment at your earliest convenience.

The relevant invoice(s) are attached to this email
for your reference.

If you have already made the payment, please ignore
this reminder.

If you have any questions regarding these invoices,
please feel free to contact us.

Thank you for your business.

Regards,
{company_name}

Sent via InvoiceFlow
"""
    )

    # --------------------------------------------------------
    # ATTACH INVOICE PDFs
    # --------------------------------------------------------

    for pdf_bytes, pdf_filename in pdf_attachments:

        message.add_attachment(
            pdf_bytes,
            maintype="application",
            subtype="pdf",
            filename=pdf_filename,
        )

    # --------------------------------------------------------
    # SEND EMAIL
    # --------------------------------------------------------

    server, _ = get_smtp_connection()

    try:

        server.send_message(message)

    finally:

        server.quit()

