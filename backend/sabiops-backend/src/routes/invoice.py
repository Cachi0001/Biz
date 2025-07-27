from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.utils.user_context import get_user_context
from src.utils.invoice_status_manager import InvoiceStatusManager
from src.utils.transaction_service import TransactionService
from src.utils.invoice_inventory_manager import InvoiceInventoryManager
from datetime import datetime, date, timedelta
import uuid
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
import io
from src.services.supabase_service import SupabaseService
from src.routes.create_sale_from_invoice import create_sale_from_invoice

invoice_bp = Blueprint("invoice", __name__)

def get_supabase():
    """Get Supabase client from Flask app config"""
    return current_app.config['SUPABASE']

def success_response(data=None, message="Success", status_code=200):
    return jsonify({
        "success": True,
        "data": data,
        "message": message
    }), status_code

def error_response(error, message="Error", status_code=400, include_toast=True):
    response_data = {
        "success": False,
        "error": error,
        "message": message
    }
    
    # Add toast notification for client-side display
    if include_toast:
        response_data["toast"] = {
            "type": "error",
            "message": message if isinstance(message, str) else str(error),
            "timeout": 4000
        }
    
    return jsonify(response_data), status_code

def generate_invoice_number(owner_id):
    """Generate unique invoice number with format INV-YYYYMMDD-XXXX"""
    try:
        supabase = get_supabase()
        today = datetime.now().strftime('%Y%m%d')
        
        # Get count of invoices created today for this owner
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        result = supabase.table("invoices").select("id").eq("owner_id", owner_id).gte("created_at", today_start.isoformat()).lt("created_at", today_end.isoformat()).execute()
        
        count = len(result.data) + 1
        invoice_number = f"INV-{today}-{count:04d}"
        
        # Ensure uniqueness by checking if it already exists
        existing = supabase.table("invoices").select("id").eq("invoice_number", invoice_number).execute()
        while existing.data:
            count += 1
            invoice_number = f"INV-{today}-{count:04d}"
            existing = supabase.table("invoices").select("id").eq("invoice_number", invoice_number).execute()
        
        return invoice_number
    except Exception as e:
        # Fallback to UUID-based number if there's an error
        return f"INV-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"

def create_transaction_for_invoice(invoice_data, transaction_type="money_in"):
    """Create a transaction record when invoice is paid"""
    try:
        supabase = get_supabase()
        
        transaction_data = {
            "id": str(uuid.uuid4()),
            "owner_id": invoice_data["owner_id"],
            "type": transaction_type,
            "amount": float(invoice_data["total_amount"]),
            "category": "Invoice Payment",
            "description": f"Payment for Invoice {invoice_data['invoice_number']} - {invoice_data['customer_name']}",
            "payment_method": "invoice",
            "reference_id": invoice_data["id"],
            "reference_type": "invoice",
            "date": datetime.now().isoformat(),
            "created_at": datetime.now().isoformat()
        }
        
        result = supabase.table("transactions").insert(transaction_data).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        print(f"Error creating transaction for invoice: {str(e)}")
        return None

@invoice_bp.route("/", methods=["GET"])
@jwt_required()
def get_invoices():
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
        supabase = get_supabase()
        
        query = get_supabase().table("invoices").select("*").eq("owner_id", owner_id)
        
        status = request.args.get("status")
        customer_id = request.args.get("customer_id")
        
        if status:
            query = query.eq("status", status)
        
        if customer_id:
            query = query.eq("customer_id", customer_id)
        
        invoices = query.order("created_at", desc=True).execute()

        # Mark invoices as overdue on-the-fly if due_date has passed and not paid/cancelled/overdue
        now = datetime.now()
        for inv in invoices.data:
            due_date = inv.get("due_date")
            status = inv.get("status")
            if due_date and status not in ["paid", "overdue", "cancelled"]:
                try:
                    due_dt = datetime.fromisoformat(due_date)
                    if due_dt < now:
                        inv["status"] = "overdue"
                except Exception:
                    pass

        return success_response(
            data={
                "invoices": invoices.data
            }
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@invoice_bp.route("/<invoice_id>", methods=["GET"])
@jwt_required()
def get_invoice(invoice_id):
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
        supabase = get_supabase()
        invoice = get_supabase().table("invoices").select("*").eq("id", invoice_id).eq("owner_id", owner_id).single().execute()
        
        if not invoice.data:
            return error_response("Invoice not found", status_code=404)
        
        # Get invoice items from the JSONB items field or from separate table if it exists
        if invoice.data.get("items"):
            # Items are stored as JSONB in the invoice table
            invoice_data = invoice.data
        else:
            # Try to get items from separate invoice_items table (if it exists)
            try:
                invoice_items = get_supabase().table("invoice_items").select("*").eq("invoice_id", invoice_id).execute()
                invoice.data["items"] = invoice_items.data if invoice_items.data else []
            except:
                # invoice_items table doesn't exist or other error, use empty items
                invoice.data["items"] = []
            invoice_data = invoice.data

        # Get customer info
        try:
            customer = get_supabase().table("customers").select("*").eq("id", invoice.data["customer_id"]).single().execute()
            invoice_data["customer"] = customer.data if customer.data else None
        except:
            invoice_data["customer"] = None

        return success_response(
            data={
                "invoice": invoice_data
            }
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@invoice_bp.route("/", methods=["POST"])
@jwt_required()
def create_invoice():
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
        supabase = get_supabase()
        data = request.get_json()
        data['owner_id'] = owner_id
        
        # Validate required fields
        if not data.get("customer_id"):
            return error_response("Customer ID is required", status_code=400)
        
        if not data.get("items") or len(data["items"]) == 0:
            return error_response("At least one item is required", status_code=400)
        
        # Validate customer exists
        customer = supabase.table("customers").select("*").eq("id", data["customer_id"]).eq("owner_id", owner_id).single().execute()
        if not customer.data:
            return error_response("Customer not found", status_code=404)
        
        # Generate unique invoice number
        invoice_number = generate_invoice_number(owner_id)
        
        # Set default due date if not provided (30 days from now)
        due_date = data.get("due_date")
        if not due_date:
            due_date = (datetime.now() + timedelta(days=30)).isoformat()
        
        # Process and validate items
        processed_items = []
        subtotal = 0
        
        for item in data["items"]:
            if not item.get("description"):
                return error_response("Item description is required", status_code=400)
            if not item.get("quantity") or float(item["quantity"]) <= 0:
                return error_response("Item quantity must be greater than 0", status_code=400)
            if not item.get("unit_price") or float(item["unit_price"]) < 0:
                return error_response("Item unit price must be 0 or greater", status_code=400)
            
            quantity = float(item["quantity"])
            unit_price = float(item["unit_price"])
            item_total = quantity * unit_price
            
            processed_item = {
                "product_id": item.get("product_id"),
                "description": item["description"],
                "quantity": quantity,
                "unit_price": unit_price,
                "total": item_total
            }
            
            processed_items.append(processed_item)
            subtotal += item_total
        
        # Calculate tax and total
        tax_amount = float(data.get("tax_amount", 0))
        total_amount = subtotal + tax_amount
        
        invoice_data = {
            "id": str(uuid.uuid4()),
            "owner_id": owner_id,
            "customer_id": data["customer_id"],
            "customer_name": customer.data["name"],
            "invoice_number": invoice_number,
            "amount": subtotal,
            "tax_amount": tax_amount,
            "total_amount": total_amount,
            "status": "draft",
            "due_date": due_date,
            "notes": data.get("notes", ""),
            "currency": data.get("currency", "NGN"),
            "payment_terms": data.get("payment_terms", "Net 30"),
            "terms_and_conditions": data.get("terms_and_conditions", "Payment is due within 30 days of invoice date."),
            "discount_amount": float(data.get("discount_amount", 0)),
            "items": processed_items,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }

        result = supabase.table("invoices").insert(invoice_data).execute()
        
        if not result.data:
            return error_response("Failed to create invoice", status_code=500)

        return success_response(
            data={"invoice": result.data[0]},
            message=f"Invoice {invoice_number} created successfully!",
            status_code=201
        )

    except Exception as e:
        current_app.logger.error(f"Error creating invoice: {e}", exc_info=True)
        return error_response(str(e), "Failed to create invoice", status_code=500)

@invoice_bp.route("/<invoice_id>", methods=["PUT"])
@jwt_required()
def update_invoice(invoice_id):
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
        supabase = get_supabase()
        invoice_result = supabase.table("invoices").select("*").eq("id", invoice_id).eq("owner_id", owner_id).single().execute()
        
        if not invoice_result.data:
            return error_response("Invoice not found", status_code=404)
        
        invoice = invoice_result.data
        
        if invoice["status"] == "paid":
            return error_response("Cannot update paid invoice", status_code=400)
        
        data = request.get_json()
        
        update_data = {"updated_at": datetime.now().isoformat()}
        
        # Update basic fields
        if data.get("due_date"):
            update_data["due_date"] = data["due_date"]
        if data.get("notes") is not None:
            update_data["notes"] = data["notes"]
        if data.get("tax_amount") is not None:
            update_data["tax_amount"] = float(data["tax_amount"])
        if data.get("currency") is not None:
            update_data["currency"] = data["currency"]
        if data.get("payment_terms") is not None:
            update_data["payment_terms"] = data["payment_terms"]
        if data.get("terms_and_conditions") is not None:
            update_data["terms_and_conditions"] = data["terms_and_conditions"]
        if data.get("discount_amount") is not None:
            update_data["discount_amount"] = float(data["discount_amount"])
        
        # Update items and recalculate totals
        if "items" in data:
            if not data["items"] or len(data["items"]) == 0:
                return error_response("At least one item is required", status_code=400)
            
            # Process and validate items
            processed_items = []
            subtotal = 0
            
            for item in data["items"]:
                if not item.get("description"):
                    return error_response("Item description is required", status_code=400)
                if not item.get("quantity") or float(item["quantity"]) <= 0:
                    return error_response("Item quantity must be greater than 0", status_code=400)
                if not item.get("unit_price") or float(item["unit_price"]) < 0:
                    return error_response("Item unit price must be 0 or greater", status_code=400)
                
                quantity = float(item["quantity"])
                unit_price = float(item["unit_price"])
                item_total = quantity * unit_price
                
                processed_item = {
                    "product_id": item.get("product_id"),
                    "description": item["description"],
                    "quantity": quantity,
                    "unit_price": unit_price,
                    "total": item_total
                }
                
                processed_items.append(processed_item)
                subtotal += item_total
            
            # Update items and amounts
            update_data["items"] = processed_items
            update_data["amount"] = subtotal
            
            # Calculate total with tax
            tax_amount = update_data.get("tax_amount", invoice.get("tax_amount", 0))
            update_data["total_amount"] = subtotal + tax_amount

        result = supabase.table("invoices").update(update_data).eq("id", invoice_id).execute()
        
        if not result.data:
            return error_response("Failed to update invoice", status_code=500)
        
        # Success response with toast notification data
        return jsonify({
            "success": True,
            "message": "Invoice updated successfully",
            "data": {
                "invoice": result.data[0]
            },
            "toast": {
                "type": "success",
                "message": f"Invoice {invoice['invoice_number']} updated successfully!",
                "timeout": 3000
            }
        }), 200
        
    except Exception as e:
        return error_response(str(e), "Failed to update invoice", status_code=500)

@invoice_bp.route("/<invoice_id>", methods=["DELETE"])
@jwt_required()
def delete_invoice(invoice_id):
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
        supabase = get_supabase()
        invoice = supabase.table("invoices").select("*").eq("id", invoice_id).eq("owner_id", owner_id).single().execute()
        
        if not invoice.data:
            return error_response("Invoice not found", status_code=404)
        
        if invoice.data["status"] == "paid":
            return error_response("Cannot delete paid invoice", status_code=400)
        
        # Delete the invoice (items are stored as JSONB, so no separate table to clean up)
        result = supabase.table("invoices").delete().eq("id", invoice_id).execute()
        
        if not result.data:
            return error_response("Failed to delete invoice", status_code=500)
        
        # Success response with toast notification data
        return jsonify({
            "success": True,
            "message": "Invoice deleted successfully",
            "toast": {
                "type": "success",
                "message": f"Invoice {invoice.data['invoice_number']} deleted successfully!",
                "timeout": 3000
            }
        }), 200
        
    except Exception as e:
        return error_response(str(e), "Failed to delete invoice", status_code=500)

@invoice_bp.route("/<invoice_id>/status", methods=["PUT"])
@jwt_required()
def update_invoice_status(invoice_id):
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
        
        supabase = get_supabase()
        data = request.get_json()
        new_status = data.get("status")
        
        # Use InvoiceStatusManager for proper status management
        status_manager = InvoiceStatusManager(supabase)
        result = status_manager.update_status(invoice_id, new_status, owner_id)
        
        if not result["success"]:
            return error_response(result["message"], status_code=400)
        
        # Handle notifications for paid invoices
        if new_status == "paid":
            try:
                invoice = result["data"]
                supa_service = SupabaseService()
                currency = invoice.get("currency", "NGN")
                currency_symbols = {
                    'NGN': '₦', 'USD': '$', 'EUR': '€', 'GBP': '£', 
                    'ZAR': 'R', 'GHS': '₵', 'KES': 'KSh'
                }
                symbol = currency_symbols.get(currency, '₦')
                amount_str = f"{symbol} {invoice['total_amount']:,.2f}" if currency == 'KES' else f"{symbol}{invoice['total_amount']:,.2f}"
                
                supa_service.notify_user(
                    str(owner_id),
                    "Invoice Paid!",
                    f"Invoice {invoice['invoice_number']} for {amount_str} has been marked as paid.",
                    "success"
                )
                
                # Create sale from invoice
                create_sale_from_invoice(invoice)
            except Exception as e:
                current_app.logger.warning(f"Error sending notification or creating sale: {str(e)}")
        
        return success_response(
            message=result["message"],
            data={"invoice": result["data"]}
        )
        
    except Exception as e:
        return error_response(str(e), "Failed to update invoice status", status_code=500)

@invoice_bp.route("/<invoice_id>/send", methods=["POST"])
@jwt_required()
def send_invoice(invoice_id):
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
        supabase = get_supabase()
        invoice_result = get_supabase().table("invoices").select("*").eq("id", invoice_id).eq("owner_id", owner_id).single().execute()
        
        if not invoice_result.data:
            return error_response("Invoice not found", status_code=404)
        
        invoice = invoice_result.data
        
        customer_result = get_supabase().table("customers").select("email").eq("id", invoice["customer_id"]).single().execute()
        if not customer_result.data or not customer_result.data["email"]:
            return error_response("Customer email is required to send invoice", status_code=400)
        
        # Generate PDF
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        # Header
        p.setFont("Helvetica-Bold", 24)
        p.setFillColor(HexColor("#28a745")) # Green color
        p.drawString(inch, height - inch, "INVOICE")

        p.setFont("Helvetica", 10)
        p.setFillColor(HexColor("#343a40")) # Dark gray
        p.drawString(inch, height - inch - 0.3 * inch, f"Invoice #: {invoice['id'][:8].upper()}")
        p.drawString(inch, height - inch - 0.5 * inch, f"Date: {invoice['issue_date']}")
        p.drawString(inch, height - inch - 0.7 * inch, f"Due Date: {invoice['due_date']}")

        # Customer Info
        p.setFont("Helvetica-Bold", 12)
        p.drawString(inch, height - 2 * inch, "Bill To:")
        p.setFont("Helvetica", 10)
        p.drawString(inch, height - 2.2 * inch, customer_result.data["name"])
        p.drawString(inch, height - 2.4 * inch, customer_result.data["email"])
        p.drawString(inch, height - 2.6 * inch, customer_result.data["phone"])
        p.drawString(inch, height - 2.8 * inch, customer_result.data["address"])

        # Items Table Header
        y_position = height - 3.5 * inch
        p.setFont("Helvetica-Bold", 10)
        p.drawString(inch, y_position, "Description")
        p.drawString(4 * inch, y_position, "Qty")
        p.drawString(5 * inch, y_position, "Unit Price")
        p.drawString(6.5 * inch, y_position, "Total")
        y_position -= 0.2 * inch
        p.line(inch, y_position, width - inch, y_position) # Horizontal line
        y_position -= 0.2 * inch

        # Get currency symbol
        currency = invoice.get("currency", "NGN")
        currency_symbols = {
            'NGN': '₦',
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'ZAR': 'R',
            'GHS': '₵',
            'KES': 'KSh'
        }
        symbol = currency_symbols.get(currency, '₦')
        
        # Items Table Rows
        p.setFont("Helvetica", 10)
        for item in invoice["items"]:
            p.drawString(inch, y_position, item["description"])
            p.drawString(4 * inch, y_position, str(item["quantity"]))
            if currency == 'KES':
                p.drawString(5 * inch, y_position, f"{symbol} {item['unit_price']:,.2f}")
                p.drawString(6.5 * inch, y_position, f"{symbol} {item['total']:,.2f}")
            else:
                p.drawString(5 * inch, y_position, f"{symbol}{item['unit_price']:,.2f}")
                p.drawString(6.5 * inch, y_position, f"{symbol}{item['total']:,.2f}")
            y_position -= 0.2 * inch

        # Totals
        y_position -= 0.3 * inch
        p.line(inch, y_position, width - inch, y_position) # Horizontal line
        y_position -= 0.2 * inch

        p.setFont("Helvetica-Bold", 10)
        p.drawString(5 * inch, y_position, "Subtotal:")
        if currency == 'KES':
            p.drawString(6.5 * inch, y_position, f"{symbol} {invoice['total_amount']:,.2f}")
        else:
            p.drawString(6.5 * inch, y_position, f"{symbol}{invoice['total_amount']:,.2f}")
        y_position -= 0.2 * inch

        if invoice.get("discount_amount", 0) > 0:
            p.drawString(5 * inch, y_position, "Discount:")
            if currency == 'KES':
                p.drawString(6.5 * inch, y_position, f"-{symbol} {invoice['discount_amount']:,.2f}")
            else:
                p.drawString(6.5 * inch, y_position, f"-{symbol}{invoice['discount_amount']:,.2f}")
            y_position -= 0.2 * inch

        p.setFont("Helvetica-Bold", 12)
        p.drawString(5 * inch, y_position, "Amount Due:")
        amount_due = invoice.get('amount_due', invoice['total_amount'])
        if currency == 'KES':
            p.drawString(6.5 * inch, y_position, f"{symbol} {amount_due:,.2f}")
        else:
            p.drawString(6.5 * inch, y_position, f"{symbol}{amount_due:,.2f}")

        # Footer
        p.setFont("Helvetica", 8)
        p.setFillColor(HexColor("#6c757d")) # Light gray
        p.drawString(inch, inch, "Thank you for your business!")
        p.drawString(inch, inch - 0.2 * inch, invoice["terms_and_conditions"])

        p.showPage()
        p.save()
        buffer.seek(0)
        
        # Update invoice status to sent
        get_supabase().table("invoices").update({"status": "sent", "sent_at": datetime.now().isoformat(), "updated_at": datetime.now().isoformat()}).eq("id", invoice_id).execute()
        
        return send_file(buffer, as_attachment=True, download_name=f"invoice_{invoice_id}.pdf", mimetype="application/pdf")
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@invoice_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_invoice_stats():
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
        supabase = get_supabase()
        
        all_invoices_result = get_supabase().table("invoices").select("*").eq("owner_id", owner_id).execute()
        all_invoices = all_invoices_result.data
        
        total_invoices = len(all_invoices)
        draft_invoices = sum(1 for inv in all_invoices if inv["status"] == "draft")
        sent_invoices = sum(1 for inv in all_invoices if inv["status"] == "sent")
        paid_invoices = sum(1 for inv in all_invoices if inv["status"] == "paid")
        overdue_invoices = sum(1 for inv in all_invoices if inv["status"] == "overdue")
        
        total_amount = sum(float(inv["total_amount"]) for inv in all_invoices)
        paid_amount = sum(float(inv.get("amount_paid", 0)) for inv in all_invoices)
        outstanding_amount = total_amount - paid_amount
        
        return success_response(
            data={
                "total_invoices": total_invoices,
                "draft_invoices": draft_invoices,
                "sent_invoices": sent_invoices,
                "paid_invoices": paid_invoices,
                "overdue_invoices": overdue_invoices,
                "total_amount": total_amount,
                "paid_amount": paid_amount,
                "outstanding_amount": outstanding_amount
            }
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@invoice_bp.route("/overdue", methods=["GET"])
@jwt_required()
def get_overdue_invoices():
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
        supabase = get_supabase()
        
        today = date.today().isoformat()
        
        overdue_invoices_result = get_supabase().table("invoices").select("*").eq("owner_id", owner_id).neq("status", "paid").lt("due_date", today).execute()
        overdue_invoices = overdue_invoices_result.data
        
        for invoice in overdue_invoices:
            if invoice["status"] != "overdue":
                get_supabase().table("invoices").update({"status": "overdue", "updated_at": datetime.now().isoformat()}).eq("id", invoice["id"]).execute()
                # Notify owner of overdue invoice
                supa_service = SupabaseService()
                currency = invoice.get("currency", "NGN")
                currency_symbols = {
                    'NGN': '₦', 'USD': '$', 'EUR': '€', 'GBP': '£', 
                    'ZAR': 'R', 'GHS': '₵', 'KES': 'KSh'
                }
                symbol = currency_symbols.get(currency, '₦')
                amount_str = f"{symbol} {invoice['total_amount']:,.2f}" if currency == 'KES' else f"{symbol}{invoice['total_amount']:,.2f}"
                
                supa_service.notify_user(
                    str(owner_id),
                    "Invoice Overdue!",
                    f"Invoice {invoice['invoice_number']} for {amount_str} is overdue.",
                    "warning"
                )
        
        # Re-fetch to get updated statuses
        overdue_invoices_result = get_supabase().table("invoices").select("*").eq("owner_id", owner_id).eq("status", "overdue").execute()
        overdue_invoices = overdue_invoices_result.data

        return success_response(
            data={
                "invoices": overdue_invoices,
                "count": len(overdue_invoices)
            }
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)