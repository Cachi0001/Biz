from flask import Blueprint
from infrastructure.web.controllers.product_controller import ProductController
from infrastructure.web.middleware.authentication_middleware import subscription_required

product_bp = Blueprint('product', __name__, url_prefix='/api/products')
product_controller = ProductController()

@product_bp.route('/', methods=['POST'])
@subscription_required
async def create_product():
    return await product_controller.create_product()

@product_bp.route('/', methods=['GET'])
@subscription_required
async def get_products():
    return await product_controller.get_products()

@product_bp.route('/<string:product_id>', methods=['GET'])
@subscription_required
async def get_product(product_id):
    return await product_controller.get_product(product_id)

@product_bp.route('/<string:product_id>', methods=['PUT'])
@subscription_required
async def update_product(product_id):
    return await product_controller.update_product(product_id)

@product_bp.route('/<string:product_id>', methods=['DELETE'])
@subscription_required
async def delete_product(product_id):
    return await product_controller.delete_product(product_id)