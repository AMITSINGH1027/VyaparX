import smtplib
from email.message import EmailMessage

from app.core.config import settings


def send_password_reset_email(
    recipient_email: str,
    reset_url: str,
) -> None:
    message = EmailMessage()

    message["Subject"] = "Reset Your VyaparX Password"
    message["From"] = (
        f"{settings.SMTP_FROM_NAME} "
        f"<{settings.SMTP_FROM_EMAIL}>"
    )
    message["To"] = recipient_email

    message.set_content(
        f"""
Hello,

We received a request to reset your VyaparX account password.

Click the link below to create a new password:

{reset_url}

This link is for your password reset request.

If you did not request a password reset, you can safely ignore this email.

Regards,

VyaparX Team
"""
    )

    with smtplib.SMTP(
        settings.SMTP_HOST,
        settings.SMTP_PORT,
        timeout=30,
    ) as server:
        server.starttls()
        server.login(
            settings.SMTP_USERNAME,
            settings.SMTP_PASSWORD,
        )
        server.send_message(message)