from flask import Flask
from flask_cors import CORS
from app.config import Config
from app.extensions import db, migrate, bcrypt

def create_app(config_class=Config):
    """Application factory method to instantiate and configure Flask app."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)

    # Enable Cross-Origin Resource Sharing (CORS)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Import models to ensure they are registered with SQLAlchemy
    from app.models.user import User, RefreshToken
    from app.models.resume import Resume

    # Register blueprints
    from app.routes import main_bp
    from app.routes.auth import auth_bp
    from app.routes.resumes import resumes_bp
    from app.routes.ai import ai_bp
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(resumes_bp)
    app.register_blueprint(ai_bp)

    return app

