from flask import current_app

def get_user_context(user_id):
    """Gets the user's role and the effective owner_id for queries."""
    supabase = current_app.config['SUPABASE']
    if not supabase:
        raise Exception("Database connection not available")

    user_res = supabase.table("users").select("id, role, owner_id").eq("id", user_id).single().execute()

    if not user_res.data:
        raise Exception("User not found")

    user = user_res.data
    role = user.get("role")
    
    if role == "Owner":
        return user["id"], role
    elif role in ["Admin", "Salesperson"] and user.get("owner_id"):
        return user["owner_id"], role
    else:
        raise Exception("User does not have a valid role or owner assignment")
