import os
import logging
from typing import Dict, Optional, List, Union
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

load_dotenv()
SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_USER = os.getenv('SMTP_USER')
SMTP_PASS = os.getenv('SMTP_PASS')
FROM_EMAIL = os.getenv('FROM_EMAIL', SMTP_USER)


def send_email(
    to_emails: Union[str, List[str]],
    subject: str,
    html_content: str,
    text_content: Optional[str] = None,
    from_email: Optional[str] = None,
    cc: Optional[Union[str, List[str]]] = None,
    bcc: Optional[Union[str, List[str]]] = None,
    attachments: Optional[List[Dict[str, str]]] = None
) -> bool:
    """
    Send an email with HTML and/or text content.
    
    Args:
        to_emails: Email address or list of email addresses to send to
        subject: Email subject
        html_content: HTML content of the email
        text_content: Plain text content of the email (optional)
        from_email: Sender email address (defaults to SMTP_USERNAME)
        cc: CC email address or list of addresses (optional)
        bcc: BCC email address or list of addresses (optional)
        attachments: List of attachments in format [{'filename': 'name', 'content': 'content', 'mimetype': 'type'}]
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    if not all([SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS]):
        logger.error("Email configuration is incomplete. Please check your environment variables.")
        return False

    if not from_email:
        from_email = DEFAULT_FROM_EMAIL

    if isinstance(to_emails, str):
        to_emails = [to_emails]
    if cc and isinstance(cc, str):
        cc = [cc]
    if bcc and isinstance(bcc, str):
        bcc = [bcc]

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = from_email
    msg['To'] = ', '.join(to_emails)
    
    if cc:
        msg['Cc'] = ', '.join(cc)
    if bcc:
        msg['Bcc'] = ', '.join(bcc)

    if text_content:
        part1 = MIMEText(text_content, 'plain')
        msg.attach(part1)
    
    part2 = MIMEText(html_content, 'html')
    msg.attach(part2)

    if attachments:
        for attachment in attachments:
            part = MIMEText(attachment['content'], _subtype=attachment.get('mimetype', 'plain'))
            part.add_header('Content-Disposition', 'attachment', filename=attachment['filename'])
            msg.attach(part)

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        
        logger.info(f"Email sent successfully to {', '.join(to_emails)}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return False


def send_invoice_notification(
    to_email: str,
    customer_name: str,
    invoice_number: str,
    amount_due: float,
    due_date: str,
    invoice_url: str,
    company_name: str = "Your Business Name"
) -> bool:
    """
    Send an invoice notification email to a customer.
    
    Args:
        to_email: Customer's email address
        customer_name: Customer's name
        invoice_number: Invoice number
        amount_due: Amount due (formatted as currency string)
        due_date: Due date (formatted as string)
        invoice_url: URL to view the invoice
        company_name: Name of the company sending the invoice
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    subject = f"Invoice #{invoice_number} from {company_name}"
    
    # HTML content for the email
    html_content = f"""
    <html>
        <body>
            <h2>Hello {customer_name},</h2>
            <p>Your invoice <strong>#{invoice_number}</strong> is ready.</p>
            <p><strong>Amount Due:</strong> {amount_due}</p>
            <p><strong>Due Date:</strong> {due_date}</p>
            <p>You can view and pay your invoice by clicking the button below:</p>
            <p>
                <a href="{invoice_url}" style="
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #4CAF50;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 10px 0;
                ">View Invoice</a>
            </p>
            <p>Thank you for your business!</p>
            <p>Best regards,<br>{company_name}</p>
        </body>
    </html>
    """
    
    # Plain text version for email clients that don't support HTML
    text_content = f"""
    Hello {customer_name},

    Your invoice #{invoice_number} is ready.
    
    Amount Due: {amount_due}
    Due Date: {due_date}
    
    You can view and pay your invoice at: {invoice_url}
    
    Thank you for your business!
    
    Best regards,
    {company_name}
    """.format(
        customer_name=customer_name,
        invoice_number=invoice_number,
        amount_due=amount_due,
        due_date=due_date,
        invoice_url=invoice_url,
        company_name=company_name
    )
    
    return send_email(
        to_emails=to_email,
        subject=subject,
        html_content=html_content,
        text_content=text_content
    )
