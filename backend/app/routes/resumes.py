from flask import Blueprint, request, jsonify, g
from datetime import datetime, timezone
from app.extensions import db
from app.models.resume import Resume
from app.utils.auth import login_required

resumes_bp = Blueprint('resumes', __name__)

@resumes_bp.route('/api/resumes', methods=['POST'])
@login_required
def create_resume():
    """Create a new resume for the authenticated user."""
    data = request.get_json() or {}
    
    title = data.get('title')
    description = data.get('description', '')
    content = data.get('content', {})
    
    # 1. Validate required fields
    errors = []
    if not title or not isinstance(title, str) or not title.strip():
        errors.append({"field": "title", "issue": "Resume title is required."})
        
    if errors:
        return jsonify({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Input validation failed.",
                "details": errors
            }
        }), 422
        
    # Set default structure for content if not already populated
    default_content = {
        "fullName": "",
        "email": "",
        "phone": "",
        "summary": "",
        "skills": ""
    }
    # Merge provided content with defaults
    merged_content = {**default_content, **content}
    
    try:
        resume = Resume(
            user_id=g.current_user.id,
            title=title.strip(),
            description=description.strip() if description else "",
            content=merged_content
        )
        db.session.add(resume)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "data": resume.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": {
                "code": "SERVER_ERROR",
                "message": "An unexpected error occurred during resume creation."
            }
        }), 500


@resumes_bp.route('/api/resumes', methods=['GET'])
@login_required
def get_resumes():
    """Get all resumes for the authenticated user."""
    try:
        resumes = db.session.execute(
            db.select(Resume).filter_by(user_id=g.current_user.id, deleted_at=None).order_by(Resume.updated_at.desc())
        ).scalars().all()
        
        return jsonify({
            "success": True,
            "data": [resume.to_dict() for resume in resumes]
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": {
                "code": "SERVER_ERROR",
                "message": "An unexpected error occurred while retrieving resumes."
            }
        }), 500


@resumes_bp.route('/api/resumes/<uuid:resume_id>', methods=['GET'])
@login_required
def get_resume(resume_id):
    """Get a specific resume by ID, ensuring ownership."""
    try:
        resume = db.session.get(Resume, resume_id)
        
        if not resume or resume.deleted_at is not None:
            return jsonify({
                "success": False,
                "error": {
                    "code": "NOT_FOUND",
                    "message": "Resume not found."
                }
            }), 404
            
        # Verify ownership
        if resume.user_id != g.current_user.id:
            return jsonify({
                "success": False,
                "error": {
                    "code": "FORBIDDEN",
                    "message": "You do not have permission to access this resume."
                }
            }), 403
            
        return jsonify({
            "success": True,
            "data": resume.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": {
                "code": "SERVER_ERROR",
                "message": "An unexpected error occurred while retrieving the resume."
            }
        }), 500


@resumes_bp.route('/api/resumes/<uuid:resume_id>', methods=['PUT'])
@login_required
def update_resume(resume_id):
    """Update an existing resume, ensuring ownership."""
    try:
        resume = db.session.get(Resume, resume_id)
        
        if not resume or resume.deleted_at is not None:
            return jsonify({
                "success": False,
                "error": {
                    "code": "NOT_FOUND",
                    "message": "Resume not found."
                }
            }), 404
            
        # Verify ownership
        if resume.user_id != g.current_user.id:
            return jsonify({
                "success": False,
                "error": {
                    "code": "FORBIDDEN",
                    "message": "You do not have permission to modify this resume."
                }
            }), 403
            
        data = request.get_json() or {}
        title = data.get('title')
        description = data.get('description')
        content = data.get('content')
        
        # Validate fields if they are sent
        errors = []
        if 'title' in data:
            if not title or not isinstance(title, str) or not title.strip():
                errors.append({"field": "title", "issue": "Resume title is required."})
                
        if errors:
            return jsonify({
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Input validation failed.",
                    "details": errors
                }
            }), 422
            
        # Update fields
        if 'title' in data:
            resume.title = title.strip()
        if 'description' in data:
            resume.description = description.strip() if description else ""
        if 'content' in data:
            # Maintain default structure keys even on update
            default_content = {
                "fullName": "",
                "email": "",
                "phone": "",
                "summary": "",
                "skills": ""
            }
            resume.content = {**default_content, **(content or {})}
            
        resume.updated_at = datetime.now(timezone.utc)
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "data": resume.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": {
                "code": "SERVER_ERROR",
                "message": "An unexpected error occurred during resume update."
            }
        }), 500


@resumes_bp.route('/api/resumes/<uuid:resume_id>', methods=['DELETE'])
@login_required
def delete_resume(resume_id):
    """Delete a resume, ensuring ownership."""
    try:
        resume = db.session.get(Resume, resume_id)
        
        if not resume or resume.deleted_at is not None:
            return jsonify({
                "success": False,
                "error": {
                    "code": "NOT_FOUND",
                    "message": "Resume not found."
                }
            }), 404
            
        # Verify ownership
        if resume.user_id != g.current_user.id:
            return jsonify({
                "success": False,
                "error": {
                    "code": "FORBIDDEN",
                    "message": "You do not have permission to delete this resume."
                }
            }), 403
            
        # Hard delete
        db.session.delete(resume)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Resume deleted successfully."
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": {
                "code": "SERVER_ERROR",
                "message": "An unexpected error occurred during resume deletion."
            }
        }), 500
