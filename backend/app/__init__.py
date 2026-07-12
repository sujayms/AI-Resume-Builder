from flask import Flask
from flask_cors import CORS
from app.config import Config

def create_app(config_class=Config):
    """Application factory method to instantiate and configure Flask app."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable Cross-Origin Resource Sharing (CORS)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register blueprints
    from app.routes import main_bp
    app.register_blueprint(main_bp)

    return app
