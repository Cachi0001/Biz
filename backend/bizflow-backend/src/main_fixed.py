from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from supabase import create_client
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import uuid
import re

load_dotenv()

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

CORS(app, origins=["*"], methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
jwt = JWTManager(app)

# Initialize Supabase client with proper error handling
try:
    supabase = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_KEY")
    )
except Exception as e:
    print(f"Failed to initialize Supabase client: {e}")
    supabase = None

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(400)
def bad_request(error):
    return jsonify({
        'error': 'Bad request',
        'message': 'Invalid request data',
        'status': 400
    }), 400

@app.errorhandler(401)
def unauthorized(error):
    return jsonify({
        'error': 'Unauthorized',
        'message': 'Authentication required',
        'status': 401
    }), 401

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Not found',
        'message': 'Resource not found',
        'status': 404
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error',
        'message': 'Something went wrong on our end',
        'status': 500
    }), 500

# ============================================================================
# VALIDATION HELPERS
# ============================================================================

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone):
    # Nigerian phone number validation
    pattern = r'^(\+234|234|0)?[789][01]\d{8}$'
    return re.match(pattern, phone) is not None

def validate_password(password):
    # At least 6 characters
    return len(password) >= 6

def standardize_phone(phone):
    # Convert to standard format +234XXXXXXXXXX
    phone = re.sub(r'[^\d+]', '', phone)
    if phone.startswith('0'):
        phone = '+234' + phone[1:]
    elif phone.startswith('234'):
        phone = '+' + phone
    elif not phone.startswith('+234'):
        phone = '+234' + phone
    return phone

# ============================================================================
# HEALTH & TEST ENDPOINTS
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health():
    try:
        return jsonify({
            'status': 'healthy',
            'message': 'SabiOps SME Nigeria API is running',
            'timestamp': datetime.now().isoformat(),
            'version': '1.0.0'
        }), 200
    except Exception as e:
        return jsonify({
            'error': 'Health check failed',
            'message': str(e),
            'status': 500
        }), 500

@app.route('/api/test-db', methods=['GET'])
def test_database():
    try:
        if not supabase:
            return jsonify({
                'status': 'error',
                'message': 'Database client not initialized',
                'error': 'Supabase connection failed'
            }), 500
        
        result = supabase.table('users').select('id').limit(1).execute()
        return jsonify({
            'status': 'success',
            'message': 'Database connection working!',
            'tables_accessible': True
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Database connection failed',
            'error': str(e)
        }), 500

# ============================================================================
# AUTHENTICATION ENDPOINTS WITH PROPER ERROR HANDLING
# ============================================================================

@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Check if Supabase is available
        if not supabase:
            return jsonify({
                'error': 'Database unavailable',
                'message': 'Unable to connect to database. Please try again later.',
                'status': 500
            }), 500
        
        # Get and validate request data
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'Invalid request',
                'message': 'Request body must be valid JSON',
                'status': 400
            }), 400
        
        # Validate required fields
        required_fields = ['email', 'phone', 'password', 'first_name', 'last_name', 'business_name']
        missing_fields = []
        
        for field in required_fields:
            if not data.get(field) or not str(data.get(field)).strip():
                missing_fields.append(field.replace('_', ' ').title())
        
        if missing_fields:
            return jsonify({
                'error': 'Missing required fields',
                'message': f'Please provide: {", ".join(missing_fields)}',
                'status': 400
            }), 400
        
        # Validate email format
        email = data['email'].strip().lower()
        if not validate_email(email):
            return jsonify({
                'error': 'Invalid email',
                'message': 'Please enter a valid email address',
                'status': 400
            }), 400
        
        # Validate phone format
        phone = data['phone'].strip()
        if not validate_phone(phone):
            return jsonify({
                'error': 'Invalid phone number',
                'message': 'Please enter a valid Nigerian phone number (e.g., +2348012345678)',
                'status': 400
            }), 400
        
        # Standardize phone number
        phone = standardize_phone(phone)
        
        # Validate password
        password = data['password']
        if not validate_password(password):
            return jsonify({
                'error': 'Invalid password',
                'message': 'Password must be at least 6 characters long',
                'status': 400
            }), 400
        
        # Check if user already exists
        try:
            existing_user = supabase.table('users').select('email, phone').or_(
                f"email.eq.{email},phone.eq.{phone}"
            ).execute()
            
            if existing_user.data:
                existing = existing_user.data[0]
                if existing.get('email') == email:
                    return jsonify({
                        'error': 'Email already exists',
                        'message': 'An account with this email already exists. Please login instead.',
                        'status': 409
                    }), 409
                else:
                    return jsonify({
                        'error': 'Phone number already exists',
                        'message': 'An account with this phone number already exists. Please login instead.',
                        'status': 409
                    }), 409
        
        except Exception as e:
            return jsonify({
                'error': 'Database error',
                'message': 'Unable to check existing users. Please try again.',
                'status': 500
            }), 500
        
        # Hash password
        try:
            password_hash = generate_password_hash(password)
        except Exception as e:
            return jsonify({
                'error': 'Password processing error',
                'message': 'Unable to process password. Please try again.',
                'status': 500
            }), 500
        
        # Create user data
        user_data = {
            'id': str(uuid.uuid4()),
            'email': email,
            'phone': phone,
            'password_hash': password_hash,
            'first_name': data['first_name'].strip(),
            'last_name': data['last_name'].strip(),
            'business_name': data['business_name'].strip(),
            'role': 'Owner',
            'subscription_plan': 'weekly',
            'subscription_status': 'trial',
            'active': True
        }
        
        # Insert user into database
        try:
            result = supabase.table('users').insert(user_data).execute()
            
            if not result.data:
                return jsonify({
                    'error': 'Registration failed',
                    'message': 'Unable to create account. Please try again.',
                    'status': 500
                }), 500
            
            user = result.data[0]
            
            # Create access token
            try:
                access_token = create_access_token(identity=user['id'])
            except Exception as e:
                return jsonify({
                    'error': 'Token generation failed',
                    'message': 'Account created but login failed. Please try logging in.',
                    'status': 500
                }), 500
            
            return jsonify({
                'success': True,
                'message': 'Account created successfully! Welcome to SabiOps.',
                'access_token': access_token,
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'phone': user['phone'],
                    'first_name': user['first_name'],
                    'last_name': user['last_name'],
                    'business_name': user['business_name'],
                    'role': user['role'],
                    'subscription_plan': user['subscription_plan'],
                    'subscription_status': user['subscription_status']
                }
            }), 201
            
        except Exception as e:
            error_msg = str(e).lower()
            if 'unique' in error_msg or 'duplicate' in error_msg:
                return jsonify({
                    'error': 'Account already exists',
                    'message': 'An account with this email or phone number already exists.',
                    'status': 409
                }), 409
            else:
                return jsonify({
                    'error': 'Database error',
                    'message': 'Unable to create account. Please try again later.',
                    'status': 500
                }), 500
            
    except Exception as e:
        return jsonify({
            'error': 'Registration failed',
            'message': 'An unexpected error occurred. Please try again.',
            'status': 500
        }), 500

@app.route('/api/auth/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Check if Supabase is available
        if not supabase:
            return jsonify({
                'error': 'Database unavailable',
                'message': 'Unable to connect to database. Please try again later.',
                'status': 500
            }), 500
        
        # Get and validate request data
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'Invalid request',
                'message': 'Request body must be valid JSON',
                'status': 400
            }), 400
        
        # Validate required fields
        login_field = data.get('login', '').strip()
        password = data.get('password', '')
        
        if not login_field:
            return jsonify({
                'error': 'Login required',
                'message': 'Please enter your email or phone number',
                'status': 400
            }), 400
        
        if not password:
            return jsonify({
                'error': 'Password required',
                'message': 'Please enter your password',
                'status': 400
            }), 400
        
        # Determine if login is email or phone
        is_email = '@' in login_field
        
        if is_email:
            login_field = login_field.lower()
            if not validate_email(login_field):
                return jsonify({
                    'error': 'Invalid email format',
                    'message': 'Please enter a valid email address',
                    'status': 400
                }), 400
        else:
            if not validate_phone(login_field):
                return jsonify({
                    'error': 'Invalid phone format',
                    'message': 'Please enter a valid phone number',
                    'status': 400
                }), 400
            login_field = standardize_phone(login_field)
        
        # Find user in database
        try:
            if is_email:
                user_result = supabase.table('users').select('*').eq('email', login_field).execute()
            else:
                user_result = supabase.table('users').select('*').eq('phone', login_field).execute()
            
            if not user_result.data:
                return jsonify({
                    'error': 'Account not found',
                    'message': 'No account found with this email or phone number. Please register first.',
                    'status': 404
                }), 404
            
            user = user_result.data[0]
            
        except Exception as e:
            return jsonify({
                'error': 'Database error',
                'message': 'Unable to verify account. Please try again.',
                'status': 500
            }), 500
        
        # Check if account is active
        if not user.get('active', True):
            return jsonify({
                'error': 'Account disabled',
                'message': 'Your account has been disabled. Please contact support.',
                'status': 403
            }), 403
        
        # Verify password
        try:
            if not user.get('password_hash'):
                return jsonify({
                    'error': 'Account setup incomplete',
                    'message': 'Please contact support to complete your account setup.',
                    'status': 500
                }), 500
            
            if not check_password_hash(user['password_hash'], password):
                return jsonify({
                    'error': 'Invalid password',
                    'message': 'Incorrect password. Please try again.',
                    'status': 401
                }), 401
        
        except Exception as e:
            return jsonify({
                'error': 'Authentication error',
                'message': 'Unable to verify password. Please try again.',
                'status': 500
            }), 500
        
        # Update last login
        try:
            supabase.table('users').update({
                'last_login': datetime.now().isoformat()
            }).eq('id', user['id']).execute()
        except:
            # Don't fail login if we can't update last_login
            pass
        
        # Create access token
        try:
            access_token = create_access_token(identity=user['id'])
        except Exception as e:
            return jsonify({
                'error': 'Token generation failed',
                'message': 'Login verified but session creation failed. Please try again.',
                'status': 500
            }), 500
        
        return jsonify({
            'success': True,
            'message': f'Welcome back, {user["first_name"]}!',
            'access_token': access_token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'phone': user['phone'],
                'first_name': user['first_name'],
                'last_name': user['last_name'],
                'business_name': user['business_name'],
                'role': user['role'],
                'subscription_plan': user['subscription_plan'],
                'subscription_status': user['subscription_status']
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Login failed',
            'message': 'An unexpected error occurred. Please try again.',
            'status': 500
        }), 500

# ============================================================================
# ADDITIONAL ENDPOINTS FOR COMPLETE FUNCTIONALITY
# ============================================================================

@app.route('/api/auth/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        if not supabase:
            return jsonify({
                'error': 'Database unavailable',
                'message': 'Unable to connect to database',
                'status': 500
            }), 500
        
        user_id = get_jwt_identity()
        
        user_result = supabase.table('users').select('*').eq('id', user_id).execute()
        
        if not user_result.data:
            return jsonify({
                'error': 'User not found',
                'message': 'Your account could not be found',
                'status': 404
            }), 404
        
        user = user_result.data[0]
        
        return jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'phone': user['phone'],
                'first_name': user['first_name'],
                'last_name': user['last_name'],
                'business_name': user['business_name'],
                'role': user['role'],
                'subscription_plan': user['subscription_plan'],
                'subscription_status': user['subscription_status'],
                'referral_code': user.get('referral_code'),
                'trial_ends_at': user.get('trial_ends_at')
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Profile fetch failed',
            'message': 'Unable to load profile information',
            'status': 500
        }), 500

@app.route('/api/customers', methods=['GET'])
@jwt_required()
def get_customers():
    try:
        if not supabase:
            return jsonify({
                'error': 'Database unavailable',
                'message': 'Unable to connect to database',
                'status': 500
            }), 500
        
        user_id = get_jwt_identity()
        result = supabase.table('customers').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
        
        return jsonify({
            'success': True,
            'customers': result.data,
            'total': len(result.data)
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to load customers',
            'message': 'Unable to retrieve customer data',
            'status': 500
        }), 500

@app.route('/api/customers', methods=['POST'])
@jwt_required()
def create_customer():
    try:
        if not supabase:
            return jsonify({
                'error': 'Database unavailable',
                'message': 'Unable to connect to database',
                'status': 500
            }), 500
        
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or not data.get('name', '').strip():
            return jsonify({
                'error': 'Customer name required',
                'message': 'Please provide a customer name',
                'status': 400
            }), 400
        
        customer_data = {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'business_id': user_id,
            'name': data['name'].strip(),
            'email': data.get('email', '').strip() or None,
            'phone': data.get('phone', '').strip() or None,
            'address': data.get('address', '').strip() or None
        }
        
        result = supabase.table('customers').insert(customer_data).execute()
        
        return jsonify({
            'success': True,
            'message': 'Customer created successfully',
            'customer': result.data[0]
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to create customer',
            'message': 'Unable to save customer information',
            'status': 500
        }), 500

@app.route('/api/products', methods=['GET'])
@jwt_required()
def get_products():
    try:
        if not supabase:
            return jsonify({
                'error': 'Database unavailable',
                'message': 'Unable to connect to database',
                'status': 500
            }), 500
        
        user_id = get_jwt_identity()
        result = supabase.table('products').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
        
        return jsonify({
            'success': True,
            'products': result.data,
            'total': len(result.data)
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to load products',
            'message': 'Unable to retrieve product data',
            'status': 500
        }), 500

@app.route('/api/products', methods=['POST'])
@jwt_required()
def create_product():
    try:
        if not supabase:
            return jsonify({
                'error': 'Database unavailable',
                'message': 'Unable to connect to database',
                'status': 500
            }), 500
        
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or not data.get('name', '').strip():
            return jsonify({
                'error': 'Product name required',
                'message': 'Please provide a product name',
                'status': 400
            }), 400
        
        if not data.get('price'):
            return jsonify({
                'error': 'Product price required',
                'message': 'Please provide a product price',
                'status': 400
            }), 400
        
        try:
            price = float(data['price'])
            if price < 0:
                raise ValueError("Price cannot be negative")
        except (ValueError, TypeError):
            return jsonify({
                'error': 'Invalid price',
                'message': 'Please enter a valid price',
                'status': 400
            }), 400
        
        try:
            quantity = int(data.get('quantity', 0))
            if quantity < 0:
                raise ValueError("Quantity cannot be negative")
        except (ValueError, TypeError):
            return jsonify({
                'error': 'Invalid quantity',
                'message': 'Please enter a valid quantity',
                'status': 400
            }), 400
        
        product_data = {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'business_id': user_id,
            'name': data['name'].strip(),
            'description': data.get('description', '').strip() or None,
            'price': price,
            'quantity': quantity,
            'active': True
        }
        
        result = supabase.table('products').insert(product_data).execute()
        
        return jsonify({
            'success': True,
            'message': 'Product created successfully',
            'product': result.data[0]
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to create product',
            'message': 'Unable to save product information',
            'status': 500
        }), 500

@app.route('/api/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    try:
        if not supabase:
            return jsonify({
                'error': 'Database unavailable',
                'message': 'Unable to connect to database',
                'status': 500
            }), 500
        
        user_id = get_jwt_identity()
        
        # Get counts with error handling
        try:
            customers_result = supabase.table('customers').select('*', count='exact').eq('user_id', user_id).execute()
            total_customers = customers_result.count or 0
        except:
            total_customers = 0
        
        try:
            products_result = supabase.table('products').select('*', count='exact').eq('user_id', user_id).execute()
            total_products = products_result.count or 0
        except:
            total_products = 0
        
        try:
            products = supabase.table('products').select('price, quantity').eq('user_id', user_id).execute()
            total_inventory_value = sum(float(p.get('price', 0)) * int(p.get('quantity', 0)) for p in products.data)
        except:
            total_inventory_value = 0
        
        return jsonify({
            'success': True,
            'stats': {
                'total_customers': total_customers,
                'total_products': total_products,
                'total_inventory_value': total_inventory_value,
                'active_invoices': 0,
                'monthly_revenue': 0
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to load dashboard',
            'message': 'Unable to retrieve dashboard statistics',
            'status': 500
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)