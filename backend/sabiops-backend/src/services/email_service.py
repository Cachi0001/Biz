import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from email.utils import formataddr
from typing import List, Optional, Dict, Any
from jinja2 import Template
import logging

logger = logging.getLogger(__name__)


logging.warning(f"[DEBUG] SMTP_USER: {os.environ.get('SMTP_USER')}")
logging.warning(f"[DEBUG] SMTP_PASS: {'***' if os.environ.get('SMTP_PASS') else None}")
logging.warning(f"[DEBUG] SMTP_HOST: {os.environ.get('SMTP_HOST')}")
logging.warning(f"[DEBUG] SMTP_PORT: {os.environ.get('SMTP_PORT')}")
logging.warning(f"[DEBUG] MAIL_FROM: {os.environ.get('MAIL_FROM')}")

class EmailService:
    """
    Comprehensive email service for sending notifications, invoices, and other business communications
    """
    
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.from_email = os.getenv('FROM_EMAIL', self.smtp_username)
        self.from_name = os.getenv('FROM_NAME', 'Bizflow SME Nigeria')
        
        if not self.smtp_username or not self.smtp_password:
            logger.warning("Email service not configured. SMTP credentials missing.")
    
    def _create_message(self, to_email: str, subject: str, html_content: str = None, 
                       text_content: str = None, attachments: List[str] = None) -> MIMEMultipart:
        """
        Create email message with optional attachments
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML email content
            text_content: Plain text email content
            attachments: List of file paths to attach
        
        Returns:
            MIMEMultipart message object
        """
        message = MIMEMultipart('alternative')
        formatted_from = formataddr((self.from_name, self.from_email))
        message['From'] = formatted_from
        message['To'] = to_email
        message['Subject'] = subject
        
        # Add text content
        if text_content:
            text_part = MIMEText(text_content, 'plain')
            message.attach(text_part)
        
        # Add HTML content
        if html_content:
            html_part = MIMEText(html_content, 'html')
            message.attach(html_part)
        
        # Add attachments
        if attachments:
            for file_path in attachments:
                if os.path.exists(file_path):
                    with open(file_path, 'rb') as attachment:
                        part = MIMEBase('application', 'octet-stream')
                        part.set_payload(attachment.read())
                    
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename= {os.path.basename(file_path)}'
                    )
                    message.attach(part)
        
        return message
    
    def send_email(self, to_email: str, subject: str, html_content: str = None, 
                   text_content: str = None, attachments: List[str] = None) -> bool:
        """
        Send email with optional attachments
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML email content
            text_content: Plain text email content
            attachments: List of file paths to attach
        
        Returns:
            Boolean indicating success
        """
        if not self.smtp_username or not self.smtp_password:
            logger.error("Email service not configured")
            return False
        
        try:
            message = self._create_message(to_email, subject, html_content, text_content, attachments)
            
            # Connect to SMTP server and send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(message)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    def send_welcome_email(self, user_email: str, user_name: str) -> bool:
        """
        Send welcome email to new users
        
        Args:
            user_email: User's email address
            user_name: User's full name
        
        Returns:
            Boolean indicating success
        """
        subject = "Welcome to Bizflow SME Nigeria!"
        
        html_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .footer { padding: 20px; text-align: center; color: #666; }
                .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to Bizflow!</h1>
                </div>
                <div class="content">
                    <h2>Hello {{ user_name }}!</h2>
                    <p>Thank you for joining Bizflow SME Nigeria, your comprehensive business management platform.</p>
                    <p>With Bizflow, you can:</p>
                    <ul>
                        <li>Manage customers and track relationships</li>
                        <li>Handle inventory and product management</li>
                        <li>Create and send professional invoices</li>
                        <li>Process payments securely with Paystack</li>
                        <li>Generate business reports and analytics</li>
                        <li>Track business performance and growth</li>
                    </ul>
                    <p>Get started by logging into your dashboard and exploring the features.</p>
                    <p style="text-align: center;">
                        <a href="#" class="button">Go to Dashboard</a>
                    </p>
                </div>
                <div class="footer">
                    <p>Best regards,<br>The Bizflow Team</p>
                    <p><small>This email was sent from Bizflow SME Nigeria. If you have any questions, please contact our support team.</small></p>
                </div>
            </div>
        </body>
        </html>
        """
        
        template = Template(html_template)
        html_content = template.render(user_name=user_name)
        
        text_content = f"""
        Welcome to Bizflow SME Nigeria!
        
        Hello {user_name}!
        
        Thank you for joining Bizflow SME Nigeria, your comprehensive business management platform.
        
        With Bizflow, you can manage customers, handle inventory, create invoices, process payments, and track business performance.
        
        Get started by logging into your dashboard and exploring the features.
        
        Best regards,
        The Bizflow Team
        """
        
        return self.send_email(user_email, subject, html_content, text_content)
    
    def send_invoice_email(self, customer_email: str, customer_name: str, 
                          invoice_number: str, invoice_amount: float, 
                          invoice_pdf_path: str = None) -> bool:
        """
        Send invoice email to customer
        
        Args:
            customer_email: Customer's email address
            customer_name: Customer's name
            invoice_number: Invoice number
            invoice_amount: Invoice amount
            invoice_pdf_path: Path to invoice PDF file
        
        Returns:
            Boolean indicating success
        """
        subject = f"Invoice #{invoice_number} from Bizflow"
        
        html_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .footer { padding: 20px; text-align: center; color: #666; }
                .invoice-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .amount { font-size: 24px; font-weight: bold; color: #2563eb; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Invoice from Bizflow</h1>
                </div>
                <div class="content">
                    <h2>Hello {{ customer_name }}!</h2>
                    <p>Please find your invoice details below:</p>
                    <div class="invoice-details">
                        <p><strong>Invoice Number:</strong> {{ invoice_number }}</p>
                        <p><strong>Amount:</strong> <span class="amount">₦{{ "%.2f"|format(invoice_amount) }}</span></p>
                    </div>
                    <p>Please review the attached invoice and process payment at your earliest convenience.</p>
                    <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
                </div>
                <div class="footer">
                    <p>Thank you for your business!<br>The Bizflow Team</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        template = Template(html_template)
        html_content = template.render(
            customer_name=customer_name,
            invoice_number=invoice_number,
            invoice_amount=invoice_amount
        )
        
        text_content = f"""
        Invoice from Bizflow
        
        Hello {customer_name}!
        
        Please find your invoice details below:
        
        Invoice Number: {invoice_number}
        Amount: ₦{invoice_amount:.2f}
        
        Please review the attached invoice and process payment at your earliest convenience.
        
        Thank you for your business!
        The Bizflow Team
        """
        
        attachments = [invoice_pdf_path] if invoice_pdf_path else None
        return self.send_email(customer_email, subject, html_content, text_content, attachments)
    
    def send_payment_confirmation_email(self, customer_email: str, customer_name: str,
                                      payment_amount: float, invoice_number: str,
                                      payment_reference: str) -> bool:
        """
        Send payment confirmation email
        
        Args:
            customer_email: Customer's email address
            customer_name: Customer's name
            payment_amount: Payment amount
            invoice_number: Invoice number
            payment_reference: Payment reference
        
        Returns:
            Boolean indicating success
        """
        subject = f"Payment Confirmation - Invoice #{invoice_number}"
        
        html_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .footer { padding: 20px; text-align: center; color: #666; }
                .payment-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .amount { font-size: 24px; font-weight: bold; color: #10b981; }
                .success { color: #10b981; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✓ Payment Confirmed</h1>
                </div>
                <div class="content">
                    <h2>Hello {{ customer_name }}!</h2>
                    <p class="success">Your payment has been successfully processed!</p>
                    <div class="payment-details">
                        <p><strong>Invoice Number:</strong> {{ invoice_number }}</p>
                        <p><strong>Amount Paid:</strong> <span class="amount">₦{{ "%.2f"|format(payment_amount) }}</span></p>
                        <p><strong>Payment Reference:</strong> {{ payment_reference }}</p>
                    </div>
                    <p>Thank you for your prompt payment. Your invoice has been marked as paid in our system.</p>
                    <p>If you need a receipt or have any questions, please contact us.</p>
                </div>
                <div class="footer">
                    <p>Thank you for your business!<br>The Bizflow Team</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        template = Template(html_template)
        html_content = template.render(
            customer_name=customer_name,
            invoice_number=invoice_number,
            payment_amount=payment_amount,
            payment_reference=payment_reference
        )
        
        text_content = f"""
        Payment Confirmation - Invoice #{invoice_number}
        
        Hello {customer_name}!
        
        Your payment has been successfully processed!
        
        Invoice Number: {invoice_number}
        Amount Paid: ₦{payment_amount:.2f}
        Payment Reference: {payment_reference}
        
        Thank you for your prompt payment. Your invoice has been marked as paid in our system.
        
        Thank you for your business!
        The Bizflow Team
        """
        
        return self.send_email(customer_email, subject, html_content, text_content)
    
    def send_overdue_invoice_reminder(self, customer_email: str, customer_name: str,
                                    invoice_number: str, invoice_amount: float,
                                    days_overdue: int) -> bool:
        """
        Send overdue invoice reminder
        
        Args:
            customer_email: Customer's email address
            customer_name: Customer's name
            invoice_number: Invoice number
            invoice_amount: Invoice amount
            days_overdue: Number of days overdue
        
        Returns:
            Boolean indicating success
        """
        subject = f"Payment Reminder - Invoice #{invoice_number} (Overdue)"
        
        html_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .footer { padding: 20px; text-align: center; color: #666; }
                .invoice-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #dc2626; }
                .amount { font-size: 24px; font-weight: bold; color: #dc2626; }
                .overdue { color: #dc2626; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Payment Reminder</h1>
                </div>
                <div class="content">
                    <h2>Hello {{ customer_name }}!</h2>
                    <p class="overdue">This is a friendly reminder that your invoice is now overdue.</p>
                    <div class="invoice-details">
                        <p><strong>Invoice Number:</strong> {{ invoice_number }}</p>
                        <p><strong>Amount Due:</strong> <span class="amount">₦{{ "%.2f"|format(invoice_amount) }}</span></p>
                        <p><strong>Days Overdue:</strong> <span class="overdue">{{ days_overdue }} days</span></p>
                    </div>
                    <p>Please arrange payment as soon as possible to avoid any service interruptions.</p>
                    <p>If you have already made payment, please disregard this reminder. If you have any questions or need to discuss payment arrangements, please contact us immediately.</p>
                </div>
                <div class="footer">
                    <p>Thank you for your attention to this matter.<br>The Bizflow Team</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        template = Template(html_template)
        html_content = template.render(
            customer_name=customer_name,
            invoice_number=invoice_number,
            invoice_amount=invoice_amount,
            days_overdue=days_overdue
        )
        
        text_content = f"""
        Payment Reminder - Invoice #{invoice_number} (Overdue)
        
        Hello {customer_name}!
        
        This is a friendly reminder that your invoice is now overdue.
        
        Invoice Number: {invoice_number}
        Amount Due: ₦{invoice_amount:.2f}
        Days Overdue: {days_overdue} days
        
        Please arrange payment as soon as possible to avoid any service interruptions.
        
        If you have already made payment, please disregard this reminder.
        
        Thank you for your attention to this matter.
        The Bizflow Team
        """
        
        return self.send_email(customer_email, subject, html_content, text_content)

# Create a singleton instance
email_service = EmailService()

