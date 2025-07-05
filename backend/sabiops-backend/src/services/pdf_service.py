import os
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from datetime import datetime
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)

class PDFService:
    """
    Comprehensive PDF generation service for invoices, reports, and other business documents
    """
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#2563eb')
        ))
        
        self.styles.add(ParagraphStyle(
            name='CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=16,
            spaceAfter=12,
            textColor=colors.HexColor('#1f2937')
        ))
        
        self.styles.add(ParagraphStyle(
            name='RightAlign',
            parent=self.styles['Normal'],
            alignment=TA_RIGHT
        ))
        
        self.styles.add(ParagraphStyle(
            name='CenterAlign',
            parent=self.styles['Normal'],
            alignment=TA_CENTER
        ))
    
    def generate_invoice_pdf(self, invoice_data: Dict[str, Any], output_path: str) -> bool:
        """
        Generate invoice PDF
        
        Args:
            invoice_data: Dictionary containing invoice information
            output_path: Path where PDF will be saved
        
        Returns:
            Boolean indicating success
        """
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            doc = SimpleDocTemplate(output_path, pagesize=A4)
            story = []
            
            # Company Header
            story.append(Paragraph("BIZFLOW SME NIGERIA", self.styles['CustomTitle']))
            story.append(Paragraph("Business Management Platform", self.styles['CenterAlign']))
            story.append(Spacer(1, 20))
            
            # Invoice Title and Number
            story.append(Paragraph(f"INVOICE #{invoice_data.get('invoice_number', 'N/A')}", self.styles['CustomHeading']))
            story.append(Spacer(1, 12))
            
            # Invoice Details Table
            invoice_details = [
                ['Invoice Date:', invoice_data.get('invoice_date', datetime.now().strftime('%Y-%m-%d'))],
                ['Due Date:', invoice_data.get('due_date', 'N/A')],
                ['Status:', invoice_data.get('status', 'Draft').title()],
            ]
            
            details_table = Table(invoice_details, colWidths=[2*inch, 3*inch])
            details_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            story.append(details_table)
            story.append(Spacer(1, 20))
            
            # Bill To Section
            story.append(Paragraph("Bill To:", self.styles['CustomHeading']))
            customer = invoice_data.get('customer', {})
            bill_to_text = f"""
            <b>{customer.get('name', 'N/A')}</b><br/>
            {customer.get('email', '')}<br/>
            {customer.get('phone', '')}<br/>
            {customer.get('address', '')}
            """
            story.append(Paragraph(bill_to_text, self.styles['Normal']))
            story.append(Spacer(1, 20))
            
            # Invoice Items Table
            story.append(Paragraph("Invoice Items:", self.styles['CustomHeading']))
            
            # Table headers
            items_data = [['Description', 'Quantity', 'Unit Price', 'Total']]
            
            # Add invoice items
            items = invoice_data.get('items', [])
            subtotal = 0
            
            for item in items:
                quantity = item.get('quantity', 0)
                unit_price = item.get('unit_price', 0)
                total = quantity * unit_price
                subtotal += total
                
                items_data.append([
                    item.get('description', 'N/A'),
                    str(quantity),
                    f"₦{unit_price:,.2f}",
                    f"₦{total:,.2f}"
                ])
            
            # Calculate totals
            tax_rate = invoice_data.get('tax_rate', 0) / 100
            tax_amount = subtotal * tax_rate
            discount_amount = invoice_data.get('discount_amount', 0)
            total_amount = subtotal + tax_amount - discount_amount
            
            # Add summary rows
            items_data.extend([
                ['', '', 'Subtotal:', f"₦{subtotal:,.2f}"],
                ['', '', f'Tax ({invoice_data.get("tax_rate", 0)}%):', f"₦{tax_amount:,.2f}"],
                ['', '', 'Discount:', f"-₦{discount_amount:,.2f}"],
                ['', '', 'Total:', f"₦{total_amount:,.2f}"]
            ])
            
            items_table = Table(items_data, colWidths=[3*inch, 1*inch, 1.5*inch, 1.5*inch])
            items_table.setStyle(TableStyle([
                # Header row
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                
                # Data rows
                ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
                ('ALIGN', (0, 1), (0, -1), 'LEFT'),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('GRID', (0, 0), (-1, -4), 1, colors.black),
                
                # Summary rows
                ('FONTNAME', (2, -4), (-1, -1), 'Helvetica-Bold'),
                ('BACKGROUND', (2, -1), (-1, -1), colors.HexColor('#f3f4f6')),
                ('LINEABOVE', (2, -4), (-1, -4), 1, colors.black),
                ('LINEABOVE', (2, -1), (-1, -1), 2, colors.black),
            ]))
            
            story.append(items_table)
            story.append(Spacer(1, 30))
            
            # Notes section
            if invoice_data.get('notes'):
                story.append(Paragraph("Notes:", self.styles['CustomHeading']))
                story.append(Paragraph(invoice_data['notes'], self.styles['Normal']))
                story.append(Spacer(1, 20))
            
            # Payment Terms
            story.append(Paragraph("Payment Terms:", self.styles['CustomHeading']))
            payment_terms = invoice_data.get('payment_terms', 'Payment is due within 30 days of invoice date.')
            story.append(Paragraph(payment_terms, self.styles['Normal']))
            story.append(Spacer(1, 20))
            
            # Footer
            footer_text = """
            <para align="center">
            Thank you for your business!<br/>
            For questions about this invoice, please contact us at support@bizflow.ng
            </para>
            """
            story.append(Paragraph(footer_text, self.styles['Normal']))
            
            # Build PDF
            doc.build(story)
            logger.info(f"Invoice PDF generated successfully: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to generate invoice PDF: {str(e)}")
            return False
    
    def generate_customer_report_pdf(self, customers_data: List[Dict], output_path: str) -> bool:
        """
        Generate customer report PDF
        
        Args:
            customers_data: List of customer data dictionaries
            output_path: Path where PDF will be saved
        
        Returns:
            Boolean indicating success
        """
        try:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            doc = SimpleDocTemplate(output_path, pagesize=A4)
            story = []
            
            # Header
            story.append(Paragraph("CUSTOMER REPORT", self.styles['CustomTitle']))
            story.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y')}", self.styles['CenterAlign']))
            story.append(Spacer(1, 30))
            
            # Summary
            total_customers = len(customers_data)
            active_customers = len([c for c in customers_data if c.get('status') == 'active'])
            
            summary_data = [
                ['Total Customers:', str(total_customers)],
                ['Active Customers:', str(active_customers)],
                ['Inactive Customers:', str(total_customers - active_customers)],
            ]
            
            summary_table = Table(summary_data, colWidths=[2*inch, 2*inch])
            summary_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 12),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            story.append(summary_table)
            story.append(Spacer(1, 30))
            
            # Customer Details Table
            story.append(Paragraph("Customer Details:", self.styles['CustomHeading']))
            
            customer_table_data = [['Name', 'Email', 'Phone', 'Status', 'Total Revenue']]
            
            for customer in customers_data:
                customer_table_data.append([
                    customer.get('name', 'N/A'),
                    customer.get('email', 'N/A'),
                    customer.get('phone', 'N/A'),
                    customer.get('status', 'N/A').title(),
                    f"₦{customer.get('total_revenue', 0):,.2f}"
                ])
            
            customer_table = Table(customer_table_data, colWidths=[1.5*inch, 2*inch, 1.2*inch, 0.8*inch, 1.2*inch])
            customer_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('ALIGN', (-1, 1), (-1, -1), 'RIGHT'),
            ]))
            
            story.append(customer_table)
            
            doc.build(story)
            logger.info(f"Customer report PDF generated successfully: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to generate customer report PDF: {str(e)}")
            return False
    
    def generate_financial_report_pdf(self, financial_data: Dict[str, Any], output_path: str) -> bool:
        """
        Generate financial report PDF
        
        Args:
            financial_data: Dictionary containing financial information
            output_path: Path where PDF will be saved
        
        Returns:
            Boolean indicating success
        """
        try:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            doc = SimpleDocTemplate(output_path, pagesize=A4)
            story = []
            
            # Header
            story.append(Paragraph("FINANCIAL REPORT", self.styles['CustomTitle']))
            story.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y')}", self.styles['CenterAlign']))
            story.append(Spacer(1, 30))
            
            # Revenue Summary
            story.append(Paragraph("Revenue Summary:", self.styles['CustomHeading']))
            
            revenue_data = [
                ['Total Revenue:', f"₦{financial_data.get('total_revenue', 0):,.2f}"],
                ['This Month:', f"₦{financial_data.get('revenue_this_month', 0):,.2f}"],
                ['Last Month:', f"₦{financial_data.get('revenue_last_month', 0):,.2f}"],
                ['Outstanding Amount:', f"₦{financial_data.get('outstanding_amount', 0):,.2f}"],
            ]
            
            revenue_table = Table(revenue_data, colWidths=[2.5*inch, 2.5*inch])
            revenue_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 12),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ]))
            story.append(revenue_table)
            story.append(Spacer(1, 30))
            
            # Invoice Summary
            story.append(Paragraph("Invoice Summary:", self.styles['CustomHeading']))
            
            invoice_data = [
                ['Total Invoices:', str(financial_data.get('total_invoices', 0))],
                ['Paid Invoices:', str(financial_data.get('paid_invoices', 0))],
                ['Pending Invoices:', str(financial_data.get('pending_invoices', 0))],
                ['Overdue Invoices:', str(financial_data.get('overdue_invoices', 0))],
            ]
            
            invoice_table = Table(invoice_data, colWidths=[2.5*inch, 2.5*inch])
            invoice_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 12),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ]))
            story.append(invoice_table)
            story.append(Spacer(1, 30))
            
            # Top Customers
            if financial_data.get('top_customers'):
                story.append(Paragraph("Top Customers by Revenue:", self.styles['CustomHeading']))
                
                top_customers_data = [['Customer Name', 'Revenue']]
                for customer in financial_data['top_customers'][:10]:
                    top_customers_data.append([
                        customer.get('name', 'N/A'),
                        f"₦{customer.get('total_revenue', 0):,.2f}"
                    ])
                
                top_customers_table = Table(top_customers_data, colWidths=[3*inch, 2*inch])
                top_customers_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
                ]))
                story.append(top_customers_table)
            
            doc.build(story)
            logger.info(f"Financial report PDF generated successfully: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to generate financial report PDF: {str(e)}")
            return False

# Create a singleton instance
pdf_service = PDFService()

