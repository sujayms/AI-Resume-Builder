import os
from flask import current_app
from google import genai
from google.genai import errors

class AIServiceError(Exception):
    """Custom exception class to map Gemini/Server errors to clean API codes and HTTP statuses."""
    def __init__(self, code, message, status_code=500):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code

class AIService:
    @staticmethod
    def get_client():
        """Retrieve client initialized with the API key from Flask application context or environment."""
        api_key = None
        try:
            api_key = current_app.config.get('GEMINI_API_KEY')
        except RuntimeError:
            # Fallback if accessed outside of Flask app context (e.g. testing scripts)
            pass

        if not api_key:
            api_key = os.environ.get('GEMINI_API_KEY')

        if not api_key or api_key == 'your_gemini_api_key_here':
            raise AIServiceError(
                code="AI_SERVICE_UNAVAILABLE",
                message="Gemini API key is not configured on the server. Please set GEMINI_API_KEY in the backend environment.",
                status_code=503
            )

        try:
            return genai.Client(api_key=api_key)
        except Exception as e:
            raise AIServiceError(
                code="INITIALIZATION_ERROR",
                message=f"Failed to initialize Gemini Client: {str(e)}",
                status_code=500
            )

    @classmethod
    def generate_suggestion(cls, feature_type, prompt, input_text):
        """Send prompt and input text to Gemini and return the polished suggestion.
        
        Args:
            feature_type (str): Category of suggestion ('improve_summary', 'improve_experience', 'grammar')
            prompt (str): System prompt instructions
            input_text (str): User content block to polish
            
        Returns:
            dict: Structured result containing the improved text
        """
        client = cls.get_client()

        try:
            # Request completion from gemini-3.5-flash
            response = client.models.generate_content(
                model='gemini-3.5-flash',
                contents=f"{prompt}\n\nText to process:\n{input_text}"
            )

            output_text = response.text
            if not output_text:
                raise AIServiceError(
                    code="AI_SERVICE_ERROR",
                    message="Received an empty response from the AI model.",
                    status_code=503
                )

            return {
                "improved": output_text.strip()
            }

        except errors.APIError as e:
            # Map specific Gemini API error codes
            status_code = 503
            if getattr(e, 'code', None) == 429:
                code = "AI_RATE_LIMIT_EXCEEDED"
                message = "The AI service rate limit has been exceeded. Please try again in a moment."
                status_code = 429
            else:
                code = "AI_SERVICE_UNAVAILABLE"
                message = f"Upstream AI service error: {getattr(e, 'message', str(e))}"

            raise AIServiceError(code=code, message=message, status_code=status_code)
            
        except Exception as e:
            if isinstance(e, AIServiceError):
                raise e
            # General unexpected server error
            raise AIServiceError(
                code="SERVER_ERROR",
                message=f"An unexpected error occurred during AI processing: {str(e)}",
                status_code=500
            )
