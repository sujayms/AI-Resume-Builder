import jwt
from datetime import datetime, timezone, timedelta
from flask import request, jsonify, current_app, g
from functools import wraps
from app.extensions import db
from app.models.user import User

def generate_token(user_id):
    """Generate a stateless JWT token for a user."""
    try:
        # Expiry set in config (defaults to 24 hours)
        expires_hours = current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES', 24)
        payload = {
            'sub': str(user_id),
            'iat': datetime.now(timezone.utc),
            'exp': datetime.now(timezone.utc) + timedelta(hours=expires_hours)
        }
        token = jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')
        return token
    except Exception as e:
        return None

def decode_token(token):
    """Decode a JWT token and return payload, or None if invalid/expired."""
    try:
        payload = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None  # Token expired
    except jwt.InvalidTokenError:
        return None  # Token invalid

def login_required(f):
    """Decorator to require JWT Bearer authentication on endpoints."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({
                "success": False,
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "Authorization header is missing."
                }
            }), 401

        parts = auth_header.split()
        if parts[0].lower() != 'bearer' or len(parts) != 2:
            return jsonify({
                "success": False,
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "Authorization header format must be: Bearer <token>"
                }
            }), 401

        token = parts[1]
        payload = decode_token(token)
        if not payload:
            return jsonify({
                "success": False,
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "Token is invalid or has expired."
                }
            }), 401

        user_id = payload.get('sub')
        # Use SQLAlchemy 2.0 compatible get method
        user = db.session.get(User, user_id)
        if not user or not user.is_active or user.deleted_at is not None:
            return jsonify({
                "success": False,
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "User not found or account is deactivated."
                }
            }), 401

        # Inject current user into flask globals
        g.current_user = user
        return f(*args, **kwargs)
    return decorated
