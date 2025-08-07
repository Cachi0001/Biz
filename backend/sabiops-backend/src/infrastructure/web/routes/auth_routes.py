from flask import Blueprint, request
from infrastructure.web.controllers.auth_controller import AuthController
from infrastructure.web.middleware.rate_limiting_middleware import rate_limit

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
auth_controller = AuthController()

@auth_bp.route('/login', methods=['POST'])
@rate_limit('login')
async def login():
    return await auth_controller.login()

@auth_bp.route('/register', methods=['POST'])
@rate_limit('register')
async def register():
    return await auth_controller.register()

@auth_bp.route('/refresh', methods=['POST'])
async def refresh_token():
    return await auth_controller.refresh_token()

@auth_bp.route('/logout', methods=['POST'])
async def logout():
    return await auth_controller.logout()

@auth_bp.route('/verify-email', methods=['POST'])
async def verify_email():
    return await auth_controller.verify_email()

@auth_bp.route('/resend-verification', methods=['POST'])
async def resend_verification():
    return await auth_controller.resend_verification()