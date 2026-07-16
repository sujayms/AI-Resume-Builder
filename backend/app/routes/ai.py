from flask import Blueprint, request, jsonify
from app.utils.auth import login_required
from app.services.ai_service import AIService, AIServiceError
from app.services.prompts import (
    PROMPT_IMPROVE_SUMMARY,
    PROMPT_IMPROVE_EXPERIENCE,
    PROMPT_GRAMMAR
)

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/api/ai/improve-summary', methods=['POST'])
@login_required
def improve_summary():
    """Enhance professional summary to be ATS-friendly and professional."""
    data = request.get_json() or {}
    summary = data.get('summary')

    if not summary or not isinstance(summary, str) or not summary.strip():
        return jsonify({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Input validation failed.",
                "details": [
                    {
                        "field": "summary",
                        "issue": "Professional summary is required and must be a non-empty string."
                    }
                ]
            }
        }), 422

    try:
        result = AIService.generate_suggestion(
            feature_type="improve_summary",
            prompt=PROMPT_IMPROVE_SUMMARY,
            input_text=summary.strip()
        )
        return jsonify({
            "success": True,
            "data": result
        }), 200
    except AIServiceError as e:
        return jsonify({
            "success": False,
            "error": {
                "code": e.code,
                "message": e.message
            }
        }), e.status_code

@ai_bp.route('/api/ai/improve-experience', methods=['POST'])
@login_required
def improve_experience():
    """Enhance experience bullet point to be strong and impact-focused."""
    data = request.get_json() or {}
    experience = data.get('experience')

    if not experience or not isinstance(experience, str) or not experience.strip():
        return jsonify({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Input validation failed.",
                "details": [
                    {
                        "field": "experience",
                        "issue": "Experience text is required and must be a non-empty string."
                    }
                ]
            }
        }), 422

    try:
        result = AIService.generate_suggestion(
            feature_type="improve_experience",
            prompt=PROMPT_IMPROVE_EXPERIENCE,
            input_text=experience.strip()
        )
        return jsonify({
            "success": True,
            "data": result
        }), 200
    except AIServiceError as e:
        return jsonify({
            "success": False,
            "error": {
                "code": e.code,
                "message": e.message
            }
        }), e.status_code

@ai_bp.route('/api/ai/grammar', methods=['POST'])
@login_required
def grammar_correct():
    """Correct grammar, spelling, and general vocabulary in input text."""
    data = request.get_json() or {}
    text = data.get('text')

    if not text or not isinstance(text, str) or not text.strip():
        return jsonify({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Input validation failed.",
                "details": [
                    {
                        "field": "text",
                        "issue": "Text content is required and must be a non-empty string."
                    }
                ]
            }
        }), 422

    try:
        result = AIService.generate_suggestion(
            feature_type="grammar",
            prompt=PROMPT_GRAMMAR,
            input_text=text.strip()
        )
        return jsonify({
            "success": True,
            "data": result
        }), 200
    except AIServiceError as e:
        return jsonify({
            "success": False,
            "error": {
                "code": e.code,
                "message": e.message
            }
        }), e.status_code
