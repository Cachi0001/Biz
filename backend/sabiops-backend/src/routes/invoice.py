from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
import uuid

invoice_bp = Blueprint("invoice", __name__)

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
        supabase = current_app.config["SUPABASE_CLIENT"]
        user_id = get_jwt_identity()
        
        query = supabase.table("invoices").select("*").eq("user_id", user_id)
        
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
        supabase = current_app.config["SUPABASE_CLIENT"]
        user_id = get_jwt_identity()
        invoice = supabase.table("invoices").select("*").eq("id", invoice_id).eq("user_id", user_id).single().execute()
        
        if not invoice.data:
            return error_response("Invoice not found", status_code=404)
        
        return success_response(
            data={
                "invoice": invoice.data
            }
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@invoice_bp.route("/", methods=["POST"])
@jwt_required()
def create_invoice():
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get("customer_id"):
            return error_response("Customer ID is required", status_code=400)
        
        customer = supabase.table("customers").select("*").eq("id", data["customer_id"]).eq("user_id", user_id).single().execute()
        if not customer.data:
            return error_response("Customer not found", status_code=404)
        
        issue_date = data.get("issue_date", date.today().isoformat())
        due_date = data.get("due_date")

        invoice_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "customer_id": data["customer_id"],
            "issue_date": issue_date,
            "due_date": due_date,
            "payment_terms": data.get("payment_terms", "Net 30"),
            "notes": data.get("notes", ""),
            "terms_and_conditions": data.get("terms_and_conditions", ""),
            "currency": data.get("currency", "NGN"),
            "discount_amount": float(data.get("discount_amount", 0)),
            "status": "draft",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        invoice_items_data = []
        total_amount = 0
        if data.get("items"):
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
                
                invoice_items_data.append({
                    "id": str(uuid.uuid4()),
                    "product_id": item_data.get("product_id"),
                    "description": item_data["description"],
                    "quantity": item_quantity,
                    "unit_price": item_unit_price,
                    "tax_rate": item_tax_rate,
                    "discount_rate": item_discount_rate,
                    "total": item_total
                })
                total_amount += item_total
        
        invoice_data["total_amount"] = total_amount
        invoice_data["amount_due"] = total_amount - float(invoice_data["discount_amount"])

        result = supabase.table("invoices").insert(invoice_data).execute()
        
        if result.data and invoice_items_data:
            invoice_id = result.data[0]["id"]
            for item in invoice_items_data:
                item["invoice_id"] = invoice_id
            supabase.table("invoice_items").insert(invoice_items_data).execute()

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
        supabase = current_app.config["SUPABASE_CLIENT"]
        user_id = get_jwt_identity()
        invoice_result = supabase.table("invoices").select("*").eq("id", invoice_id).eq("user_id", user_id).single().execute()
        
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
            supabase.table("invoice_items").delete().eq("invoice_id", invoice_id).execute()
            
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
            
            supabase.table("invoice_items").insert(new_invoice_items_data).execute()
            update_data["total_amount"] = new_total_amount
            update_data["amount_due"] = new_total_amount - update_data.get("discount_amount", invoice["discount_amount"])

        supabase.table("invoices").update(update_data).eq("id", invoice_id).execute()
        
        return success_response(
            message="Invoice updated successfully"
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@invoice_bp.route("/<invoice_id>", methods=["DELETE"])
@jwt_required()
def delete_invoice(invoice_id):
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        user_id = get_jwt_identity()
        invoice = supabase.table("invoices").select("*").eq("id", invoice_id).eq("user_id", user_id).single().execute()
        
        if not invoice.data:
            return error_response("Invoice not found", status_code=404)
        
        if invoice.data["status"] == "paid":
            return error_response("Cannot delete paid invoice", status_code=400)
        
        supabase.table("invoice_items").delete().eq("invoice_id", invoice_id).execute()
        supabase.table("invoices").delete().eq("id", invoice_id).execute()
        
        return success_response(
            message="Invoice deleted successfully"
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@invoice_bp.route("/<invoice_id>/status", methods=["PUT"])
@jwt_required()
def update_invoice_status(invoice_id):
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        user_id = get_jwt_identity()
        invoice_result = supabase.table("invoices").select("*").eq("id", invoice_id).eq("user_id", user_id).single().execute()
        
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
        
        supabase.table("invoices").update(update_data).eq("id", invoice_id).execute()
        
        return success_response(
            message="Invoice status updated successfully"
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@invoice_bp.route("/<invoice_id>/send", methods=["POST"])
@jwt_required()
def send_invoice(invoice_id):
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        user_id = get_jwt_identity()
        invoice_result = supabase.table("invoices").select("*").eq("id", invoice_id).eq("user_id", user_id).single().execute()
        
        if not invoice_result.data:
            return error_response("Invoice not found", status_code=404)
        
        invoice = invoice_result.data
        
        customer_result = supabase.table("customers").select("email").eq("id", invoice["customer_id"]).single().execute()
        if not customer_result.data or not customer_result.data["email"]:
            return error_response("Customer email is required to send invoice", status_code=400)
        
        supabase.table("invoices").update({"status": "sent", "sent_at": datetime.now().isoformat(), "updated_at": datetime.now().isoformat()}).eq("id", invoice_id).execute()
        
        return success_response(
            message="Invoice sent successfully"
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@invoice_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_invoice_stats():
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        user_id = get_jwt_identity()
        
        all_invoices_result = supabase.table("invoices").select("*").eq("user_id", user_id).execute()
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
        supabase = current_app.config["SUPABASE_CLIENT"]
        user_id = get_jwt_identity()
        
        today = date.today().isoformat()
        
        overdue_invoices_result = supabase.table("invoices").select("*").eq("user_id", user_id).neq("status", "paid").lt("due_date", today).execute()
        overdue_invoices = overdue_invoices_result.data
        
        for invoice in overdue_invoices:
            if invoice["status"] != "overdue":
                supabase.table("invoices").update({"status": "overdue", "updated_at": datetime.now().isoformat()}).eq("id", invoice["id"]).execute()
        
        # Re-fetch to get updated statuses
        overdue_invoices_result = supabase.table("invoices").select("*").eq("user_id", user_id).eq("status", "overdue").execute()
        overdue_invoices = overdue_invoices_result.data

        return success_response(
            data={
                "invoices": overdue_invoices,
                "count": len(overdue_invoices)
            }
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)


