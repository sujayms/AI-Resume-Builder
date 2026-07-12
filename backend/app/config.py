import os
from dotenv import load_dotenv

# Load env variables from .env file
load_dotenv()

class Config:
    """Base configuration settings."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    ENV = os.environ.get('FLASK_ENV', 'development')
    DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() in ('true', '1', 't')
    PORT = int(os.environ.get('PORT', 5000))
