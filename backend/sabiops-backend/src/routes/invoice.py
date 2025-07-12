from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
import uuid
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
import io
from src.services.supabase_service import SupabaseService

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

def error_response(error, message="Error", status_code=400):
    return jsonify({
        "success": False,
        "error": error,
        "message": message
    }), status_code

@invoice_bp.route("/", methods=["GET"])
@jwt_required()
def get_invoices():
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        
        query = get_supabase().table("invoices").select("*").eq("owner_id", owner_id)
        
        status = request.args.get("status")
        customer_id = request.args.get("customer_id")
        
        if status:
            query = query.eq("status", status)
        
        if customer_id:
            query = query.eq("customer_id", customer_id)
        
        invoices = query.order("created_at", desc=True).execute()
        
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
        supabase = get_supabase()
        owner_id = get_jwt_identity()
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
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get("customer_id"):
            return error_response("Customer ID is required", status_code=400)
        
        customer = get_supabase().table("customers").select("*").eq("id", data["customer_id"]).eq("owner_id", owner_id).single().execute()
        if not customer.data:
            return error_response("Customer not found", status_code=404)
        
        # Generate unique invoice number
        invoice_number = f"INV-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        invoice_data = {
            "id": str(uuid.uuid4()),
            "owner_id": owner_id,
            "customer_id": data["customer_id"],
            "customer_name": customer.data["name"],
            "invoice_number": invoice_number,
            "amount": float(data.get("amount", 0)),
            "tax_amount": float(data.get("tax_amount", 0)),
            "total_amount": float(data.get("total_amount", 0)),
            "status": "draft",
            "due_date": data.get("due_date"),
            "notes": data.get("notes", ""),
            "items": data.get("items", []),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # Calculate totals from items
        total_amount = 0
        total_cogs = 0
        if data.get("items"):
            for item in data["items"]:
                item_total = float(item.get("quantity", 0)) * float(item.get("unit_price", 0))
                total_amount += item_total
                # Calculate COGS for each item
                cost_price = 0
                if item.get("product_id"):
                    product_result = get_supabase().table("products").select("cost_price").eq("id", item["product_id"]).single().execute()
                    if product_result.data and product_result.data.get("cost_price") is not None:
                        cost_price = float(product_result.data["cost_price"])
                item_cogs = float(item.get("quantity", 0)) * cost_price
                total_cogs += item_cogs
        
        invoice_data["amount"] = total_amount
        invoice_data["total_amount"] = total_amount + invoice_data["tax_amount"]
        invoice_data["total_cogs"] = total_cogs
        invoice_data["gross_profit"] = total_amount - total_cogs

        result = get_supabase().table("invoices").insert(invoice_data).execute()

        return success_response(
            message="Invoice created successfully",
            data={
                "invoice": result.data[0]
            },
            status_code=201
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@invoice_bp.route("/<invoice_id>", methods=["PUT"])
@jwt_required()
def update_invoice(invoice_id):
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        invoice_result = get_supabase().table("invoices").select("*").eq("id", invoice_id).eq("owner_id", owner_id).single().execute()
        
        if not invoice_result.data:
            return error_response("Invoice not found", status_code=404)
        
        invoice = invoice_result.data
        
        if invoice["status"] == "paid":
            return error_response("Cannot update paid invoice", status_code=400)
        
        data = request.get_json()
        
        update_data = {"updated_at": datetime.now().isoformat()}
        
        if data.get("issue_date"):
            update_data["issue_date"] = data["issue_date"]
        if data.get("due_date"):
            update_data["due_date"] = data["due_date"]
        if data.get("payment_terms"):
            update_data["payment_terms"] = data["payment_terms"]
        if data.get("notes"):
            update_data["notes"] = data["notes"]
        if data.get("terms_and_conditions"):
            update_data["terms_and_conditions"] = data["terms_and_conditions"]
        if data.get("currency"):
            update_data["currency"] = data["currency"]
        if data.get("discount_amount") is not None:
            update_data["discount_amount"] = float(data["discount_amount"])
        
        if "items" in data:
            # Delete existing items
            get_supabase().table("invoice_items").delete().eq("invoice_id", invoice_id).execute()
            
            # Add new items and recalculate total_amount
            new_invoice_items_data = []
            new_total_amount = 0
            for item_data in data["items"]:
                if not item_data.get("description") or not item_data.get("quantity") or not item_data.get("unit_price"):
                    return error_response("Item description, quantity, and unit_price are required", status_code=400)
                
                item_quantity = int(item_data["quantity"])
                item_unit_price = float(item_data["unit_price"])
                item_tax_rate = float(item_data.get("tax_rate", 0))
                item_discount_rate = float(item_data.get("discount_rate", 0))

                item_total = item_quantity * item_unit_price
                item_total -= item_total * (item_discount_rate / 100)
                item_total += item_total * (item_tax_rate / 100)

                new_invoice_items_data.append({
                    "id": str(uuid.uuid4()),
                    "invoice_id": invoice_id,
                    "product_id": item_data.get("product_id"),
                    "description": item_data["description"],
                    "quantity": item_quantity,
                    "unit_price": item_unit_price,
                    "tax_rate": item_tax_rate,
                    "discount_rate": item_discount_rate,
                    "total": item_total
                })
                new_total_amount += item_total
            
            get_supabase().table("invoice_items").insert(new_invoice_items_data).execute()
            update_data["total_amount"] = new_total_amount
            update_data["amount_due"] = new_total_amount - update_data.get("discount_amount", invoice["discount_amount"])

        get_supabase().table("invoices").update(update_data).eq("id", invoice_id).execute()
        
        return success_response(
            message="Invoice updated successfully"
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@invoice_bp.route("/<invoice_id>", methods=["DELETE"])
@jwt_required()
def delete_invoice(invoice_id):
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        invoice = get_supabase().table("invoices").select("*").eq("id", invoice_id).eq("owner_id", owner_id).single().execute()
        
        if not invoice.data:
            return error_response("Invoice not found", status_code=404)
        
        if invoice.data["status"] == "paid":
            return error_response("Cannot delete paid invoice", status_code=400)
        
        get_supabase().table("invoice_items").delete().eq("invoice_id", invoice_id).execute()
        get_supabase().table("invoices").delete().eq("id", invoice_id).execute()
        
        return success_response(
            message="Invoice deleted successfully"
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@invoice_bp.route("/<invoice_id>/status", methods=["PUT"])
@jwt_required()
def update_invoice_status(invoice_id):
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        invoice_result = get_supabase().table("invoices").select("*").eq("id", invoice_id).eq("owner_id", owner_id).single().execute()
        
        if not invoice_result.data:
            return error_response("Invoice not found", status_code=404)
        
        invoice = invoice_result.data
        data = request.get_json()
        new_status = data.get("status")
        
        if new_status not in ["draft", "sent", "paid", "overdue", "cancelled"]:
            return error_response("Invalid status", status_code=400)
        
        update_data = {"status": new_status, "updated_at": datetime.now().isoformat()}

        if new_status == "sent" and not invoice.get("sent_at"):
            update_data["sent_at"] = datetime.now().isoformat()
        elif new_status == "paid":
            update_data["amount_paid"] = invoice["total_amount"]
            update_data["amount_due"] = 0
            update_data["paid_at"] = datetime.now().isoformat()
        
        get_supabase().table("invoices").update(update_data).eq("id", invoice_id).execute()
        
        return success_response(
            message="Invoice status updated successfully"
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@invoice_bp.route("/<invoice_id>/send", methods=["POST"])
@jwt_required()
def send_invoice(invoice_id):
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
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

        # Items Table Rows
        p.setFont("Helvetica", 10)
        for item in invoice["items"]:
            p.drawString(inch, y_position, item["description"])
            p.drawString(4 * inch, y_position, str(item["quantity"]))
            p.drawString(5 * inch, y_position, f"₦{item['unit_price']:,.2f}")
            p.drawString(6.5 * inch, y_position, f"₦{item['total']:,.2f}")
            y_position -= 0.2 * inch

        # Totals
        y_position -= 0.3 * inch
        p.line(inch, y_position, width - inch, y_position) # Horizontal line
        y_position -= 0.2 * inch

        p.setFont("Helvetica-Bold", 10)
        p.drawString(5 * inch, y_position, "Subtotal:")
        p.drawString(6.5 * inch, y_position, f"₦{invoice['total_amount']:,.2f}")
        y_position -= 0.2 * inch

        if invoice["discount_amount"] > 0:
            p.drawString(5 * inch, y_position, "Discount:")
            p.drawString(6.5 * inch, y_position, f"-₦{invoice['discount_amount']:,.2f}")
            y_position -= 0.2 * inch

        p.setFont("Helvetica-Bold", 12)
        p.drawString(5 * inch, y_position, "Amount Due:")
        p.drawString(6.5 * inch, y_position, f"₦{invoice['amount_due']:,.2f}")

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
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        
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
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        
        today = date.today().isoformat()
        
        overdue_invoices_result = get_supabase().table("invoices").select("*").eq("owner_id", owner_id).neq("status", "paid").lt("due_date", today).execute()
        overdue_invoices = overdue_invoices_result.data
        
        for invoice in overdue_invoices:
            if invoice["status"] != "overdue":
                get_supabase().table("invoices").update({"status": "overdue", "updated_at": datetime.now().isoformat()}).eq("id", invoice["id"]).execute()
                # Notify owner of overdue invoice
                supa_service = SupabaseService()
                supa_service.notify_user(
                    str(owner_id),
                    "Invoice Overdue!",
                    f"Invoice {invoice['invoice_number']} for ₦{invoice['total_amount']:,.2f} is overdue.",
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



