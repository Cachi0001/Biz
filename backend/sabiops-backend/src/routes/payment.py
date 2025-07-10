from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
import requests
from datetime import datetime
import uuid
from src.services.supabase_service import SupabaseService

payment_bp = Blueprint("payment", __name__)

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

@payment_bp.route("/", methods=["GET"])
@jwt_required()
def get_payments():
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        
        query = get_supabase().table("payments").select("*").eq("owner_id", owner_id)
        
        status = request.args.get("status")
        if status:
            query = query.eq("status", status)
        
        payments = query.order("created_at", desc=True).execute()
        
        return success_response(
            data={
                "payments": payments.data
            }
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@payment_bp.route("/<payment_id>", methods=["GET"])
@jwt_required()
def get_payment(payment_id):
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        payment = get_supabase().table("payments").select("*").eq("id", payment_id).eq("owner_id", owner_id).single().execute()
        
        if not payment.data:
            return error_response("Payment not found", status_code=404)
        
        return success_response(
            data={
                "payment": payment.data
            }
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@payment_bp.route("/initialize", methods=["POST"])
@jwt_required()
def initialize_payment():
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        data = request.get_json()
        
        required_fields = ["amount", "email"]
        for field in required_fields:
            if not data.get(field):
                return error_response(f"{field} is required", status_code=400)
        
        invoice = None
        if data.get("invoice_id"):
            invoice_result = get_supabase().table("invoices").select("*").eq("id", data["invoice_id"]).eq("owner_id", owner_id).single().execute()
            if not invoice_result.data:
                return error_response("Invoice not found", status_code=404)
            invoice = invoice_result.data
        
        payment_data = {
            "id": str(uuid.uuid4()),
            "owner_id": owner_id,
            "invoice_id": data.get("invoice_id"),
            "amount": float(data["amount"]),
            "currency": data.get("currency", "NGN"),
            "customer_email": data["email"],
            "customer_name": data.get("customer_name"),
            "customer_phone": data.get("customer_phone"),
            "description": data.get("description", "Payment for services"),
            "payment_gateway": "paystack",
            "status": "pending",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        payment_result = get_supabase().table("payments").insert(payment_data).execute()
        payment = payment_result.data[0]
        
        PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY")
        PAYSTACK_BASE_URL = "https://api.paystack.co"

        paystack_data = {
            "email": data["email"],
            "amount": int(float(data["amount"]) * 100),
            "currency": data.get("currency", "NGN"),
            "reference": payment["id"], # Use payment ID as reference
            "callback_url": data.get("callback_url"),
            "metadata": {
                "payment_id": payment["id"],
                "owner_id": owner_id,
                "invoice_id": data.get("invoice_id")
            }
        }
        
        headers = {
            "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(
            f"{PAYSTACK_BASE_URL}/transaction/initialize",
            json=paystack_data,
            headers=headers
        )
        
        if response.status_code == 200:
            paystack_response = response.json()
            
            if paystack_response["status"]:
                return success_response(
                    message="Payment initialized successfully",
                    data={
                        "payment": payment,
                        "authorization_url": paystack_response["data"]["authorization_url"],
                        "access_code": paystack_response["data"]["access_code"],
                        "reference": paystack_response["data"]["reference"]
                    }
                )
            else:
                return error_response(paystack_response["message"], status_code=400)
        else:
            return error_response("Failed to initialize payment with Paystack", status_code=500)
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@payment_bp.route("/verify/<reference>", methods=["GET"])
@jwt_required()
def verify_payment(reference):
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        
        payment_result = get_supabase().table("payments").select("*").eq("id", reference).eq("owner_id", owner_id).single().execute()
        
        if not payment_result.data:
            return error_response("Payment not found", status_code=404)
        
        payment = payment_result.data
        
        PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY")
        PAYSTACK_BASE_URL = "https://api.paystack.co"

        headers = {
            "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(
            f"{PAYSTACK_BASE_URL}/transaction/verify/{reference}",
            headers=headers
        )
        
        if response.status_code == 200:
            paystack_response = response.json()
            
            if paystack_response["status"] and paystack_response["data"]["status"] == "success":
                update_data = {
                    "status": "successful",
                    "gateway_reference": paystack_response["data"]["reference"],
                    "gateway_response": str(paystack_response["data"]),
                    "payment_method": paystack_response["data"]["channel"],
                    "fees": paystack_response["data"]["fees"] / 100,
                    "paid_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
                get_supabase().table("payments").update(update_data).eq("id", payment["id"]).execute()
                # Notify owner of payment received
                supa_service = SupabaseService()
                supa_service.notify_user(
                    str(owner_id),
                    "Payment Received!",
                    f"A payment of ₦{payment['amount']:,.2f} was received.",
                    "success"
                )
                
                if payment["invoice_id"]:
                    invoice_result = get_supabase().table("invoices").select("*").eq("id", payment["invoice_id"]).single().execute()
                    if invoice_result.data:
                        invoice = invoice_result.data
                        new_amount_paid = invoice.get("amount_paid", 0) + payment["amount"]
                        invoice_update_data = {"amount_paid": new_amount_paid}
                        if new_amount_paid >= invoice["total_amount"]:
                            invoice_update_data["status"] = "paid"
                            invoice_update_data["amount_due"] = 0
                            invoice_update_data["paid_at"] = datetime.now().isoformat()
                        get_supabase().table("invoices").update(invoice_update_data).eq("id", invoice["id"]).execute()
                
                return success_response(
                    message="Payment verified successfully",
                    data={
                        "payment": payment,
                        "paystack_data": paystack_response["data"]
                    }
                )
            else:
                update_data = {
                    "status": "failed",
                    "gateway_response": str(paystack_response["data"]),
                    "updated_at": datetime.now().isoformat()
                }
                get_supabase().table("payments").update(update_data).eq("id", payment["id"]).execute()
                
                return error_response(
                    "Payment verification failed",
                    data={
                        "payment": payment
                    },
                    status_code=400
                )
        else:
            return error_response("Failed to verify payment with Paystack", status_code=500)
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@payment_bp.route("/webhook", methods=["POST"])
def paystack_webhook():
    try:
        supabase = get_supabase()
        
        data = request.get_json()
        
        if data["event"] == "charge.success":
            reference = data["data"]["reference"]
            
            payment_result = get_supabase().table("payments").select("*").eq("id", reference).single().execute()
            
            if payment_result.data and payment_result.data["status"] == "pending":
                payment = payment_result.data
                update_data = {
                    "status": "successful",
                    "gateway_reference": data["data"]["reference"],
                    "gateway_response": str(data["data"]),
                    "payment_method": data["data"]["channel"],
                    "fees": data["data"]["fees"] / 100,
                    "paid_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
                get_supabase().table("payments").update(update_data).eq("id", payment["id"]).execute()
                # Notify owner of payment received (webhook)
                supa_service = SupabaseService()
                supa_service.notify_user(
                    str(payment["owner_id"]),
                    "Payment Received!",
                    f"A payment of ₦{payment['amount']:,.2f} was received.",
                    "success"
                )
                
                if payment["invoice_id"]:
                    invoice_result = get_supabase().table("invoices").select("*").eq("id", payment["invoice_id"]).single().execute()
                    if invoice_result.data:
                        invoice = invoice_result.data
                        new_amount_paid = invoice.get("amount_paid", 0) + payment["amount"]
                        invoice_update_data = {"amount_paid": new_amount_paid}
                        if new_amount_paid >= invoice["total_amount"]:
                            invoice_update_data["status"] = "paid"
                            invoice_update_data["amount_due"] = 0
                            invoice_update_data["paid_at"] = datetime.now().isoformat()
                        get_supabase().table("invoices").update(invoice_update_data).eq("id", invoice["id"]).execute()
        
        return jsonify({"status": "success"}), 200
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@payment_bp.route("/manual", methods=["POST"])
@jwt_required()
def record_manual_payment():
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        data = request.get_json()
        
        required_fields = ["amount", "payment_method"]
        for field in required_fields:
            if not data.get(field):
                return error_response(f"{field} is required", status_code=400)
        
        invoice = None
        if data.get("invoice_id"):
            invoice_result = get_supabase().table("invoices").select("*").eq("id", data["invoice_id"]).eq("owner_id", owner_id).single().execute()
            if not invoice_result.data:
                return error_response("Invoice not found", status_code=404)
            invoice = invoice_result.data
        
        payment_data = {
            "id": str(uuid.uuid4()),
            "owner_id": owner_id,
            "invoice_id": data.get("invoice_id"),
            "amount": float(data["amount"]),
            "currency": data.get("currency", "NGN"),
            "payment_method": data["payment_method"],
            "customer_email": data.get("customer_email"),
            "customer_name": data.get("customer_name"),
            "customer_phone": data.get("customer_phone"),
            "description": data.get("description", "Manual payment"),
            "notes": data.get("notes"),
            "status": "successful",
            "paid_at": datetime.now().isoformat(),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        payment_result = get_supabase().table("payments").insert(payment_data).execute()
        payment = payment_result.data[0]
        
        if invoice:
            new_amount_paid = invoice.get("amount_paid", 0) + payment["amount"]
            invoice_update_data = {"amount_paid": new_amount_paid}
            if new_amount_paid >= invoice["total_amount"]:
                invoice_update_data["status"] = "paid"
                invoice_update_data["amount_due"] = 0
                invoice_update_data["paid_at"] = datetime.now().isoformat()
            get_supabase().table("invoices").update(invoice_update_data).eq("id", invoice["id"]).execute()
        
        return success_response(
            message="Manual payment recorded successfully",
            data={
                "payment": payment
            },
            status_code=201
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@payment_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_payment_stats():
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        
        all_payments_result = get_supabase().table("payments").select("*").eq("owner_id", owner_id).execute()
        all_payments = all_payments_result.data
        
        total_payments = len(all_payments)
        successful_payments = sum(1 for p in all_payments if p["status"] == "successful")
        pending_payments = sum(1 for p in all_payments if p["status"] == "pending")
        failed_payments = sum(1 for p in all_payments if p["status"] == "failed")
        
        successful_payment_records = [p for p in all_payments if p["status"] == "successful"]
        total_revenue = sum(float(p["amount"]) for p in successful_payment_records)
        total_fees = sum(float(p.get("fees", 0)) for p in successful_payment_records)
        
        recent_payments = get_supabase().table("payments").select("*").eq("owner_id", owner_id).order("created_at", desc=True).limit(5).execute().data
        
        return success_response(
            data={
                "total_payments": total_payments,
                "successful_payments": successful_payments,
                "pending_payments": pending_payments,
                "failed_payments": failed_payments,
                "total_revenue": total_revenue,
                "total_fees": total_fees,
                "net_revenue": total_revenue - total_fees,
                "recent_payments": recent_payments
            }
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)


