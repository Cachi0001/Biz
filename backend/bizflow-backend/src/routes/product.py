@product_bp.route('/<int:product_id>/upload-image', methods=['POST'])
@jwt_required()
def upload_product_image(product_id):
    """Upload product image using Cloudinary"""
    try:
        user_id = get_jwt_identity()
        product = Product.query.filter_by(id=product_id, user_id=user_id).first()
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        
        # Import Cloudinary service
        from src.services.cloudinary_service import CloudinaryService, PRODUCT_IMAGE_EXTENSIONS
        
        # Validate file
        validation = CloudinaryService.validate_file(
            file, 
            allowed_extensions=PRODUCT_IMAGE_EXTENSIONS,
            max_size_mb=10
        )
        
        if not validation['valid']:
            return jsonify({'error': validation['error']}), 400
        
        # Delete old image if exists
        if product.image_public_id:
            CloudinaryService.delete_file(product.image_public_id, "image")
        
        # Upload to Cloudinary
        upload_result = CloudinaryService.upload_product_image(file, user_id, product_id)
        
        if not upload_result['success']:
            return jsonify({'error': f'Upload failed: {upload_result["error"]}'}), 500
        
        # Update product with image info
        product.image_url = upload_result['url']
        product.image_public_id = upload_result['public_id']
        product.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Product image uploaded successfully',
            'image_url': product.image_url,
            'optimized_url': CloudinaryService.get_optimized_image_url(
                upload_result['public_id'], 
                width=400, 
                height=400
            )
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@product_bp.route('/<int:product_id>/delete-image', methods=['DELETE'])
@jwt_required()
def delete_product_image(product_id):
    """Delete product image from Cloudinary"""
    try:
        user_id = get_jwt_identity()
        product = Product.query.filter_by(id=product_id, user_id=user_id).first()
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        if not product.image_public_id:
            return jsonify({'error': 'No image to delete'}), 400
        
        # Import Cloudinary service
        from src.services.cloudinary_service import CloudinaryService
        
        # Delete from Cloudinary
        delete_result = CloudinaryService.delete_file(product.image_public_id, "image")
        
        if delete_result['success']:
            # Clear image info from product
            product.image_url = None
            product.image_public_id = None
            product.updated_at = datetime.utcnow()
            
            db.session.commit()
            
            return jsonify({'message': 'Product image deleted successfully'})
        else:
            return jsonify({'error': 'Failed to delete image from storage'}), 500
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

