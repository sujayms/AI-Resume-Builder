import re
from flask import Blueprint, request, jsonify, g
from app.extensions import db, bcrypt
from app.models.user import User
from app.utils.auth import generate_token, login_required

auth_bp = Blueprint('auth', __name__)

EMAIL_REGEX = re.compile(r'^[\w\.\+-]+@[\w\.-]+\.\w+$')

@auth_bp.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user account."""
    data = request.get_json() or {}
    
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    
    # 1. Validate required fields
    errors = []
    if not name or not isinstance(name, str) or not name.strip():
        errors.append({"field": "name", "issue": "Name is required."})
    
    if not email or not isinstance(email, str) or not email.strip():
        errors.append({"field": "email", "issue": "Email is required."})
    elif not EMAIL_REGEX.match(email):
        errors.append({"field": "email", "issue": "Invalid email format."})
        
    if not password or not isinstance(password, str):
        errors.append({"field": "password", "issue": "Password is required."})
    elif len(password) < 8:
        errors.append({"field": "password", "issue": "Password must be at least 8 characters long."})
        
    if errors:
        return jsonify({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Input validation failed.",
                "details": errors
            }
        }), 422
        
    # Standardize email to lowercase for case-insensitivity
    email_clean = email.strip().lower()
    name_clean = name.strip()
    
    # 2. Check if email already exists
    existing_user = db.session.execute(
        db.select(User).filter_by(email=email_clean)
    ).scalar_one_or_none()
    
    if existing_user:
        return jsonify({
            "success": False,
            "error": {
                "code": "EMAIL_ALREADY_EXISTS",
                "message": "An account with this email address already exists."
            }
        }), 409
        
    try:
        # 3. Create user
        password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        user = User(
            name=name_clean,
            email=email_clean,
            password_hash=password_hash
        )
        db.session.add(user)
        db.session.commit()
        
        # 4. Generate token
        token = generate_token(user.id)
        
        return jsonify({
            "success": True,
            "data": {
                "user": user.to_dict(),
                "token": token
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": {
                "code": "SERVER_ERROR",
                "message": "An unexpected error occurred during registration."
            }
        }), 500


@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate an existing user and return a token."""
    data = request.get_json() or {}
    
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({
            "success": False,
            "error": {
                "code": "BAD_REQUEST",
                "message": "Both email and password are required."
            }
        }), 400
        
    email_clean = email.strip().lower()
    
    # Query database for user
    user = db.session.execute(
        db.select(User).filter_by(email=email_clean, deleted_at=None)
    ).scalar_one_or_none()
    
    # Verify user exists and password is correct
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({
            "success": False,
            "error": {
                "code": "INVALID_CREDENTIALS",
                "message": "Invalid email or password."
            }
        }), 401
        
    if not user.is_active:
        return jsonify({
            "success": False,
            "error": {
                "code": "ACCOUNT_DEACTIVATED",
                "message": "This account is deactivated."
            }
        }), 403
        
    try:
        # Generate token
        token = generate_token(user.id)
        
        return jsonify({
            "success": True,
            "data": {
                "user": user.to_dict(),
                "token": token
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": {
                "code": "SERVER_ERROR",
                "message": "An unexpected error occurred during login."
            }
        }), 500


@auth_bp.route('/api/auth/me', methods=['GET'])
@login_required
def get_me():
    """Fetch the currently authenticated user details."""
    return jsonify({
        "success": True,
        "data": {
            "user": g.current_user.to_dict()
        }
    }), 200
