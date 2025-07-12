from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash
from datetime import datetime
import uuid

team_bp = Blueprint("team", __name__)

def get_supabase():
    """Get Supabase client from Flask app config"""
    if hasattr(current_app, 'config') and 'SUPABASE' in current_app.config:
        return current_app.config['SUPABASE']
    return None

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

@team_bp.route("/", methods=["POST"])
@jwt_required()
def create_team_member():
    """
    Create a new team member (Admin or Salesperson) for the owner.
    Implements:
    - Subscription inheritance (plan, status, trial_ends_at)
    - Referral code logic
    - Data consistency for all relevant fields
    - Improved error messaging
    """
    try:
        supabase = get_supabase()
        if not supabase:
            return error_response("SUPABASE", "Database not available", status_code=500)

        owner_id = get_jwt_identity()
        data = request.get_json()

        # For development mode without Supabase, return mock success
        if not supabase:
            return success_response(
                message="Team member created successfully (mock)",
                data={
                    "team_member": {
                        "id": str(uuid.uuid4()),
                        "email": data.get("email"),
                        "full_name": data.get("full_name"),
                        "role": data.get("role", "Salesperson")
                    }
                },
                status_code=201
            )

        # Check if the current user is an Owner
        owner_result = supabase.table("users").select("role, subscription_plan, trial_ends_at, referral_code, id").eq("id", owner_id).single().execute()
        if not owner_result.data or owner_result.data["role"] != "Owner":
            return error_response("Only owners can create team members", status_code=403)

        required_fields = ["full_name", "email", "password", "role"]
        for field in required_fields:
            if not data.get(field):
                return error_response(f"{field} is required", message=f"Missing required field: {field}", status_code=400)

        if data["role"] not in ["Admin", "Salesperson"]:
            return error_response("Invalid role specified", message="Role must be Admin or Salesperson", status_code=400)

        existing_user = supabase.table("users").select("*").eq("email", data["email"]).execute()
        if existing_user.data:
            return error_response("Email already exists", message="A user with this email already exists", status_code=400)

        password_hash = generate_password_hash(data["password"])
        first_name, last_name = data["full_name"].split(" ", 1) if " " in data["full_name"] else (data["full_name"], "")

        # Referral code logic
        referral_code = data.get("referral_code")
        referred_by = None
        if referral_code:
            ref_owner = supabase.table("users").select("id").eq("referral_code", referral_code).single().execute()
            if ref_owner.data:
                referred_by = ref_owner.data["id"]
            else:
                return error_response("Invalid referral code", message="Referral code does not exist", status_code=400)

        # Compose team member data for users table
        team_member_data = {
            "id": str(uuid.uuid4()),
            "email": data["email"],
            "password_hash": password_hash,
            "full_name": data["full_name"],
            "first_name": first_name,
            "last_name": last_name,
            "phone": data.get("phone", ""),
            "role": data["role"],
            "owner_id": owner_id,
            "subscription_plan": owner_result.data["subscription_plan"],
            "subscription_status": "active",
            "trial_ends_at": owner_result.data["trial_ends_at"],
            "active": True,
            "is_deactivated": False,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "created_by": owner_id,
            "referred_by": referred_by,
            # Optionally, store the referral code if needed
            "referral_code": data.get("referral_code")
        }

        result = supabase.table("users").insert(team_member_data).execute()

        if result.data:
            team_member = result.data[0]
            team_data = {
                "id": str(uuid.uuid4()),
                "owner_id": owner_id,
                "team_member_id": team_member["id"],
                "role": team_member["role"],
                "active": True,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            supabase.table("team").insert(team_data).execute()

            return success_response(
                message="Team member created successfully",
                data={
                    "team_member": {
                        "id": team_member["id"],
                        "email": team_member["email"],
                        "full_name": team_member["full_name"],
                        "role": team_member["role"],
                        "referred_by": team_member.get("referred_by"),
                        "referral_code": team_member.get("referral_code")
                    }
                },
                status_code=201
            )

    except Exception as e:
        return error_response(str(e), status_code=500)

@team_bp.route("/", methods=["GET"])
@jwt_required()
def get_team_members():
    try:
        supabase = get_supabase()
        if not supabase:
            # Return mock data for development
            return success_response(
                data={
                    "team_members": []
                }
            )
            
        owner_id = get_jwt_identity()

        team_members = supabase.table("users").select("*").eq("owner_id", owner_id).execute()

        return success_response(
            data={
                "team_members": team_members.data
            }
        )

    except Exception as e:
        return error_response(str(e), status_code=500)

@team_bp.route("/<team_member_id>", methods=["PUT"])
@jwt_required()
def update_team_member(team_member_id):
    try:
        supabase = get_supabase()
        if not supabase:
            return error_response("SUPABASE", "Database not available", status_code=500)
            
        owner_id = get_jwt_identity()
        data = request.get_json()

        # Check if the current user is an Owner
        owner_result = supabase.table("users").select("role").eq("id", owner_id).single().execute()
        if not owner_result.data or owner_result.data["role"] != "Owner":
            return error_response("Only owners can update team members", status_code=403)

        team_member = supabase.table("users").select("*").eq("id", team_member_id).eq("owner_id", owner_id).single().execute()
        if not team_member.data:
            return error_response("Team member not found", status_code=404)

        update_data = {"updated_at": datetime.now().isoformat()}

        if data.get("full_name"):
            update_data["full_name"] = data["full_name"]
            first_name, last_name = data["full_name"].split(" ", 1) if " " in data["full_name"] else (data["full_name"], "")
            update_data["first_name"] = first_name
            update_data["last_name"] = last_name

        if data.get("role"):
            if data["role"] not in ["Admin", "Salesperson"]:
                return error_response("Invalid role specified", status_code=400)
            update_data["role"] = data["role"]

        supabase.table("users").update(update_data).eq("id", team_member_id).execute()

        return success_response(message="Team member updated successfully")

    except Exception as e:
        return error_response(str(e), status_code=500)

@team_bp.route("/<team_member_id>", methods=["DELETE"])
@jwt_required()
def delete_team_member(team_member_id):
    """
    Soft-deactivate a team member instead of hard deleting.
    Sets is_deactivated and active to False in users and team tables.
    """
    try:
        supabase = get_supabase()
        if not supabase:
            return error_response("SUPABASE", "Database not available", status_code=500)

        owner_id = get_jwt_identity()

        # Check if the current user is an Owner
        owner_result = supabase.table("users").select("role").eq("id", owner_id).single().execute()
        if not owner_result.data or owner_result.data["role"] != "Owner":
            return error_response("Only owners can deactivate team members", status_code=403)

        team_member = supabase.table("users").select("*").eq("id", team_member_id).eq("owner_id", owner_id).single().execute()
        if not team_member.data:
            return error_response("Team member not found", status_code=404)

        # Soft deactivate in users table
        supabase.table("users").update({"is_deactivated": True, "active": False, "updated_at": datetime.now().isoformat()}).eq("id", team_member_id).execute()
        # Soft deactivate in team table
        supabase.table("team").update({"active": False, "updated_at": datetime.now().isoformat()}).eq("team_member_id", team_member_id).execute()

        return success_response(message="Team member deactivated successfully")

    except Exception as e:
        return error_response(str(e), status_code=500)

@team_bp.route("/<team_member_id>/activate", methods=["POST"])
@jwt_required()
def activate_team_member(team_member_id):
    """
    Activate a deactivated team member.
    Sets is_deactivated to False and active to True in users and team tables.
    """
    try:
        supabase = get_supabase()
        if not supabase:
            return error_response("SUPABASE", "Database not available", status_code=500)

        owner_id = get_jwt_identity()

        # Check if the current user is an Owner
        owner_result = supabase.table("users").select("role").eq("id", owner_id).single().execute()
        if not owner_result.data or owner_result.data["role"] != "Owner":
            return error_response("Only owners can activate team members", status_code=403)

        team_member = supabase.table("users").select("*").eq("id", team_member_id).eq("owner_id", owner_id).single().execute()
        if not team_member.data:
            return error_response("Team member not found", status_code=404)

        # Activate in users table
        supabase.table("users").update({"is_deactivated": False, "active": True, "updated_at": datetime.now().isoformat()}).eq("id", team_member_id).execute()
        # Activate in team table
        supabase.table("team").update({"active": True, "updated_at": datetime.now().isoformat()}).eq("team_member_id", team_member_id).execute()

        return success_response(message="Team member activated successfully")

    except Exception as e:
        return error_response(str(e), status_code=500)

@team_bp.route("/<team_member_id>/reset-password", methods=["POST"])
@jwt_required()
def reset_team_member_password(team_member_id):
    """
    Reset a team member's password and generate a temporary password.
    """
    try:
        import secrets
        import string
        
        supabase = get_supabase()
        if not supabase:
            return error_response("SUPABASE", "Database not available", status_code=500)

        owner_id = get_jwt_identity()

        # Check if the current user is an Owner
        owner_result = supabase.table("users").select("role").eq("id", owner_id).single().execute()
        if not owner_result.data or owner_result.data["role"] != "Owner":
            return error_response("Only owners can reset team member passwords", status_code=403)

        team_member = supabase.table("users").select("*").eq("id", team_member_id).eq("owner_id", owner_id).single().execute()
        if not team_member.data:
            return error_response("Team member not found", status_code=404)

        # Generate a temporary password
        alphabet = string.ascii_letters + string.digits
        temp_password = ''.join(secrets.choice(alphabet) for i in range(12))
        
        # Hash the temporary password
        password_hash = generate_password_hash(temp_password)

        # Update the password in the database
        supabase.table("users").update({
            "password_hash": password_hash, 
            "updated_at": datetime.now().isoformat()
        }).eq("id", team_member_id).execute()

        return success_response(
            message="Password reset successfully",
            data={
                "temporary_password": temp_password,
                "team_member_id": team_member_id
            }
        )

    except Exception as e:
        return error_response(str(e), status_code=500)

