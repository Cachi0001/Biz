from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from src.models.product import Product
from src.services.cloudinary_service import CloudinaryService

product_bp = Blueprint("product_bp", __name__)

@product_bp.route("/")
@jwt_required()
def get_products():
    user_id = get_jwt_identity()
    products = Product.query.filter_by(user_id=user_id).all()
    return jsonify([product.to_dict() for product in products])

@product_bp.route("/<int:product_id>/upload-image", methods=["POST"])
@jwt_required()
def upload_product_image(product_id):
    user_id = get_jwt_identity()
    product = Product.query.filter_by(id=product_id, user_id=user_id).first()

    if not product:
        return jsonify({"error": "Product not found"}), 404

    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    try:
        upload_result = CloudinaryService.upload_image(file, folder="product_images")
        product.image_url = upload_result["secure_url"]
        product.image_public_id = upload_result["public_id"]
        product.save()
        return jsonify(product.to_dict())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


