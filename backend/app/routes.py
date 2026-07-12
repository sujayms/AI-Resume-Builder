from flask import Blueprint, jsonify

main_bp = Blueprint('main', __name__)

@main_bp.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify backend status."""
    return jsonify({
        "status": "healthy",
        "milestone": 1,
        "message": "AI Resume Builder Flask API is running locally!"
    }), 200
