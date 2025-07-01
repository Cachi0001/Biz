import os
import cloudinary
import cloudinary.uploader
import cloudinary.api
from werkzeug.utils import secure_filename
from datetime import datetime
import uuid

class CloudinaryService:
    """Service for handling file uploads to Cloudinary"""
    
    def __init__(self):
        # Cloudinary is initialized in main.py
        pass
    
    @staticmethod
    def upload_file(file, folder="bizflow", resource_type="auto"):
        """
        Upload a file to Cloudinary
        
        Args:
            file: File object from request.files
            folder: Cloudinary folder to upload to
            resource_type: Type of resource (auto, image, video, raw)
        
        Returns:
            dict: Upload result with URL and public_id
        """
        try:
            if not file:
                raise ValueError("No file provided")
            
            # Generate unique filename
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            unique_id = str(uuid.uuid4())[:8]
            original_filename = secure_filename(file.filename)
            filename_without_ext = os.path.splitext(original_filename)[0]
            
            # Create public_id for Cloudinary
            public_id = f"{folder}/{timestamp}_{unique_id}_{filename_without_ext}"
            
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(
                file,
                public_id=public_id,
                resource_type=resource_type,
                folder=folder,
                overwrite=False,
                unique_filename=True,
                use_filename=True
            )
            
            return {
                'success': True,
                'url': result.get('secure_url'),
                'public_id': result.get('public_id'),
                'format': result.get('format'),
                'resource_type': result.get('resource_type'),
                'bytes': result.get('bytes'),
                'width': result.get('width'),
                'height': result.get('height'),
                'original_filename': original_filename
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def upload_receipt(file, user_id, expense_id=None):
        """
        Upload expense receipt to Cloudinary
        
        Args:
            file: File object
            user_id: ID of the user
            expense_id: ID of the expense (optional)
        
        Returns:
            dict: Upload result
        """
        folder = f"bizflow/receipts/user_{user_id}"
        if expense_id:
            folder += f"/expense_{expense_id}"
        
        return CloudinaryService.upload_file(file, folder, "auto")
    
    @staticmethod
    def upload_product_image(file, user_id, product_id=None):
        """
        Upload product image to Cloudinary
        
        Args:
            file: File object
            user_id: ID of the user
            product_id: ID of the product (optional)
        
        Returns:
            dict: Upload result
        """
        folder = f"bizflow/products/user_{user_id}"
        if product_id:
            folder += f"/product_{product_id}"
        
        return CloudinaryService.upload_file(file, folder, "image")
    
    @staticmethod
    def upload_invoice_attachment(file, user_id, invoice_id=None):
        """
        Upload invoice attachment to Cloudinary
        
        Args:
            file: File object
            user_id: ID of the user
            invoice_id: ID of the invoice (optional)
        
        Returns:
            dict: Upload result
        """
        folder = f"bizflow/invoices/user_{user_id}"
        if invoice_id:
            folder += f"/invoice_{invoice_id}"
        
        return CloudinaryService.upload_file(file, folder, "auto")
    
    @staticmethod
    def upload_user_avatar(file, user_id):
        """
        Upload user avatar to Cloudinary
        
        Args:
            file: File object
            user_id: ID of the user
        
        Returns:
            dict: Upload result
        """
        folder = f"bizflow/avatars/user_{user_id}"
        return CloudinaryService.upload_file(file, folder, "image")
    
    @staticmethod
    def delete_file(public_id, resource_type="image"):
        """
        Delete a file from Cloudinary
        
        Args:
            public_id: Public ID of the file to delete
            resource_type: Type of resource (image, video, raw)
        
        Returns:
            dict: Deletion result
        """
        try:
            result = cloudinary.uploader.destroy(
                public_id,
                resource_type=resource_type
            )
            
            return {
                'success': result.get('result') == 'ok',
                'result': result
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def get_file_info(public_id, resource_type="image"):
        """
        Get information about a file in Cloudinary
        
        Args:
            public_id: Public ID of the file
            resource_type: Type of resource
        
        Returns:
            dict: File information
        """
        try:
            result = cloudinary.api.resource(
                public_id,
                resource_type=resource_type
            )
            
            return {
                'success': True,
                'info': result
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def generate_transformation_url(public_id, transformations=None, resource_type="image"):
        """
        Generate a transformed URL for an image
        
        Args:
            public_id: Public ID of the image
            transformations: List of transformations to apply
            resource_type: Type of resource
        
        Returns:
            str: Transformed URL
        """
        try:
            if not transformations:
                transformations = []
            
            url = cloudinary.CloudinaryImage(public_id).build_url(
                transformation=transformations,
                resource_type=resource_type
            )
            
            return url
            
        except Exception as e:
            return None
    
    @staticmethod
    def get_optimized_image_url(public_id, width=None, height=None, quality="auto", format="auto"):
        """
        Get an optimized image URL
        
        Args:
            public_id: Public ID of the image
            width: Desired width
            height: Desired height
            quality: Image quality (auto, best, good, eco, low)
            format: Image format (auto, jpg, png, webp)
        
        Returns:
            str: Optimized image URL
        """
        transformations = [
            {'quality': quality},
            {'fetch_format': format}
        ]
        
        if width:
            transformations.append({'width': width})
        if height:
            transformations.append({'height': height})
        
        return CloudinaryService.generate_transformation_url(
            public_id, 
            transformations, 
            "image"
        )
    
    @staticmethod
    def validate_file(file, allowed_extensions=None, max_size_mb=16):
        """
        Validate uploaded file
        
        Args:
            file: File object
            allowed_extensions: List of allowed file extensions
            max_size_mb: Maximum file size in MB
        
        Returns:
            dict: Validation result
        """
        if not file:
            return {'valid': False, 'error': 'No file provided'}
        
        if file.filename == '':
            return {'valid': False, 'error': 'No file selected'}
        
        # Check file extension
        if allowed_extensions:
            filename = secure_filename(file.filename)
            if '.' not in filename:
                return {'valid': False, 'error': 'File must have an extension'}
            
            ext = filename.rsplit('.', 1)[1].lower()
            if ext not in allowed_extensions:
                return {
                    'valid': False, 
                    'error': f'File type not allowed. Allowed types: {", ".join(allowed_extensions)}'
                }
        
        # Check file size
        file.seek(0, 2)  # Seek to end of file
        file_size = file.tell()
        file.seek(0)  # Reset file pointer
        
        max_size_bytes = max_size_mb * 1024 * 1024
        if file_size > max_size_bytes:
            return {
                'valid': False, 
                'error': f'File too large. Maximum size: {max_size_mb}MB'
            }
        
        return {'valid': True}

# Common file type configurations
IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'}
DOCUMENT_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt'}
RECEIPT_EXTENSIONS = IMAGE_EXTENSIONS | DOCUMENT_EXTENSIONS | {'pdf'}
PRODUCT_IMAGE_EXTENSIONS = IMAGE_EXTENSIONS

