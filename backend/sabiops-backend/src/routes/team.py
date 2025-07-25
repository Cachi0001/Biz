from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash
from datetime import datetime
import uuid
import traceback
import logging
import secrets
import string

team_bp = Blueprint("team", __name__)

def get_supabase():
    """Get Supabase client from Flask app config"""
    return current_app.config.get('SUPABASE')

def success_response(data=None, message="Success", status_code=200):
    return jsonify({"success": True, "data": data, "message": message}), status_code

def error_response(error, message="Error", status_code=400):
    logging.error(f"Error: {message} - {error}")
    return jsonify({"success": False, "error": str(error), "message": message}), status_code

@team_bp.route("/", methods=["POST"])
@jwt_required()
def create_team_member():
    """Creates a new team member under the currently authenticated owner."""
    supabase = get_supabase()
    if not supabase:
        return error_response("Database connection failed", status_code=500)

    try:
        owner_id = get_jwt_identity()
        data = request.get_json()

        owner_res = supabase.table("users").select("role, subscription_plan, subscription_status, trial_ends_at").eq("id", owner_id).single().execute()
        if not owner_res.data or owner_res.data.get("role") != "Owner":
            return error_response("Forbidden", "Only owners can create team members.", 403)

        required_fields = ["full_name", "email", "password", "role"]
        if any(field not in data for field in required_fields):
            return error_response("Missing fields", f"Required fields are: {', '.join(required_fields)}", 400)

        if data["role"] not in ["Admin", "Salesperson"]:
            return error_response("Invalid role", "Role must be 'Admin' or 'Salesperson'.", 400)

        if supabase.table("users").select("id").eq("email", data["email"]).execute().data:
            return error_response("Conflict", "A user with this email already exists.", 409)

        new_user_data = {
            "owner_id": owner_id,
            "full_name": data["full_name"],
            "email": data["email"].lower(),
            "phone": data.get("phone"),
            "raw_pass" : data["password"],
            "password_hash": generate_password_hash(data["password"]),
            "role": data["role"],
            "email_confirmed": True,
            "email_confirmed_at": datetime.now().isoformat(),
            "active": True,
            "subscription_plan": owner_res.data.get("subscription_plan"),
            "subscription_status": owner_res.data.get("subscription_status"),
            "trial_ends_at": owner_res.data.get("trial_ends_at"),
        }

        inserted_user = supabase.table("users").insert(new_user_data).execute()
        if not inserted_user.data:
            raise Exception("Failed to create team member in database.")

        return success_response(inserted_user.data[0], "Team member created successfully.", 201)

    except Exception as e:
        return error_response(e, "An unexpected error occurred.", 500)

@team_bp.route("/", methods=["GET"])
@jwt_required()
def get_team_members():
    """Fetches all team members for the currently authenticated owner."""
    supabase = get_supabase()
    if not supabase:
        return error_response("Database connection failed", status_code=500)

    try:
        owner_id = get_jwt_identity()
        team_members = supabase.table("users").select("id, full_name, email, phone, role, active, is_deactivated").eq("owner_id", owner_id).execute()
        return success_response(team_members.data)

    except Exception as e:
        return error_response(e, "Failed to fetch team members.", 500)

@team_bp.route("/<uuid:team_member_id>", methods=["PUT"])
@jwt_required()
def update_team_member(team_member_id):
    """Updates a specific team member's details."""
    supabase = get_supabase()
    if not supabase:
        return error_response("Database connection failed", status_code=500)

    try:
        owner_id = get_jwt_identity()
        data = request.get_json()

        update_data = {
            "full_name": data.get("full_name"),
            "phone": data.get("phone"),
            "role": data.get("role"),
            "updated_at": datetime.now().isoformat()
        }
        update_data = {k: v for k, v in update_data.items() if v is not None}

        if "password" in data and data["password"]:
            update_data["password_hash"] = generate_password_hash(data["password"])

        updated_user = supabase.table("users").update(update_data).eq("id", team_member_id).eq("owner_id", owner_id).execute()
        if not updated_user.data:
            return error_response("Not Found", "Team member not found or you don't have permission to update.", 404)

        return success_response(updated_user.data[0], "Team member updated successfully.")

    except Exception as e:
        return error_response(e, "Failed to update team member.", 500)

@team_bp.route("/<uuid:team_member_id>", methods=["DELETE"])
@jwt_required()
def delete_team_member(team_member_id):
    """Soft-deactivates a team member."""
    supabase = get_supabase()
    if not supabase:
        return error_response("Database connection failed", status_code=500)

    try:
        owner_id = get_jwt_identity()
        update_data = {"active": False, "is_deactivated": True, "updated_at": datetime.now().isoformat()}
        
        deactivated_user = supabase.table("users").update(update_data).eq("id", team_member_id).eq("owner_id", owner_id).execute()
        if not deactivated_user.data:
            return error_response("Not Found", "Team member not found or you don't have permission to deactivate.", 404)

        return success_response(message="Team member deactivated successfully.")

    except Exception as e:
        return error_response(e, "Failed to deactivate team member.", 500)

@team_bp.route("/<uuid:team_member_id>/activate", methods=["POST"])
@jwt_required()
def activate_team_member(team_member_id):
    """Activates a previously deactivated team member."""
    supabase = get_supabase()
    if not supabase:
        return error_response("Database connection failed", status_code=500)

    try:
        owner_id = get_jwt_identity()
        update_data = {"active": True, "is_deactivated": False, "updated_at": datetime.now().isoformat()}

        activated_user = supabase.table("users").update(update_data).eq("id", team_member_id).eq("owner_id", owner_id).execute()
        if not activated_user.data:
            return error_response("Not Found", "Team member not found or you don't have permission to activate.", 404)

        return success_response(message="Team member activated successfully.")

    except Exception as e:
        return error_response(e, "Failed to activate team member.", 500)

@team_bp.route("/<uuid:team_member_id>/reset-password", methods=["POST"])
@jwt_required()
def reset_team_member_password(team_member_id):
    """Resets a team member's password and returns a new temporary password."""
    supabase = get_supabase()
    if not supabase:
        return error_response("Database connection failed", status_code=500)

    try:
        owner_id = get_jwt_identity()

        user_to_reset = supabase.table("users").select("id").eq("id", team_member_id).eq("owner_id", owner_id).execute()
        if not user_to_reset.data:
            return error_response("Not Found", "Team member not found or you don't have permission.", 404)

        alphabet = string.ascii_letters + string.digits
        temp_password = ''.join(secrets.choice(alphabet) for _ in range(12))
        password_hash = generate_password_hash(temp_password)

        supabase.table("users").update({
            "password_hash": password_hash,
            "updated_at": datetime.now().isoformat()
        }).eq("id", team_member_id).execute()

        return success_response(
            data={"temporary_password": temp_password},
            message="Password has been reset successfully. Please share the new password securely."
        )

    except Exception as e:
        return error_response(e, "Failed to reset password.", 500)
