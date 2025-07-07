from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash
from datetime import datetime
import uuid

team_bp = Blueprint("team", __name__)

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

@team_bp.route("/", methods=["POST"])
@jwt_required()
def create_team_member():
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        data = request.get_json()

        # Check if the current user is an Owner
        owner_result = get_supabase().table("users").select("role, subscription_plan, trial_ends_at").eq("id", owner_id).single().execute()
        if not owner_result.data or owner_result.data["role"] != "Owner":
            return error_response("Only owners can create team members", status_code=403)

        required_fields = ["full_name", "email", "password", "role"]
        for field in required_fields:
            if not data.get(field):
                return error_response(f"{field} is required", status_code=400)

        if data["role"] not in ["Admin", "Salesperson"]:
            return error_response("Invalid role specified", status_code=400)

        existing_user = get_supabase().table("users").select("*").eq("email", data["email"]).execute()
        if existing_user.data:
            return error_response("Email already exists", status_code=400)

        password_hash = generate_password_hash(data["password"])
        first_name, last_name = data["full_name"].split(" ", 1) if " " in data["full_name"] else (data["full_name"], "")

        team_member_data = {
            "id": str(uuid.uuid4()),
            "email": data["email"],
            "password_hash": password_hash,
            "full_name": data["full_name"],
            "first_name": first_name,
            "last_name": last_name,
            "role": data["role"],
            "owner_id": owner_id,
            "subscription_plan": owner_result.data["subscription_plan"],
            "subscription_status": "active",
            "trial_ends_at": owner_result.data["trial_ends_at"],
            "active": True,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }

        result = get_supabase().table("users").insert(team_member_data).execute()

        if result.data:
            team_member = result.data[0]
            team_data = {
                "id": str(uuid.uuid4()),
                "owner_id": owner_id,
                "team_member_id": team_member["id"],
                "role": team_member["role"],
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            get_supabase().table("team").insert(team_data).execute()

            return success_response(
                message="Team member created successfully",
                data={
                    "team_member": {
                        "id": team_member["id"],
                        "email": team_member["email"],
                        "full_name": team_member["full_name"],
                        "role": team_member["role"]
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
        owner_id = get_jwt_identity()

        team_members = get_supabase().table("users").select("*").eq("owner_id", owner_id).execute()

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
        owner_id = get_jwt_identity()
        data = request.get_json()

        # Check if the current user is an Owner
        owner_result = get_supabase().table("users").select("role").eq("id", owner_id).single().execute()
        if not owner_result.data or owner_result.data["role"] != "Owner":
            return error_response("Only owners can update team members", status_code=403)

        team_member = get_supabase().table("users").select("*").eq("id", team_member_id).eq("owner_id", owner_id).single().execute()
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

        get_supabase().table("users").update(update_data).eq("id", team_member_id).execute()
        get_supabase().table("team").update({"role": update_data["role"]}).eq("team_member_id", team_member_id).execute()

        return success_response(
            message="Team member updated successfully"
        )

    except Exception as e:
        return error_response(str(e), status_code=500)

@team_bp.route("/<team_member_id>", methods=["DELETE"])
@jwt_required()
def delete_team_member(team_member_id):
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()

        # Check if the current user is an Owner
        owner_result = get_supabase().table("users").select("role").eq("id", owner_id).single().execute()
        if not owner_result.data or owner_result.data["role"] != "Owner":
            return error_response("Only owners can delete team members", status_code=403)

        team_member = get_supabase().table("users").select("*").eq("id", team_member_id).eq("owner_id", owner_id).single().execute()
        if not team_member.data:
            return error_response("Team member not found", status_code=404)

        get_supabase().table("users").delete().eq("id", team_member_id).execute()
        get_supabase().table("team").delete().eq("team_member_id", team_member_id).execute()

        return success_response(
            message="Team member deleted successfully"
        )

    except Exception as e:
        return error_response(str(e), status_code=500)


