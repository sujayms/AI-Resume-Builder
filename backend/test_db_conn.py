import sys
from flask import Flask
from app.config import Config
from app.extensions import db

def test_connection():
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)

    print(f"Attempting to connect to database at: {app.config['SQLALCHEMY_DATABASE_URI']}")
    
    try:
        with app.app_context():
            # Try to execute a simple query
            db.session.execute(db.text("SELECT 1"))
            print("SUCCESS: Connection to local PostgreSQL established successfully!")
            
            # Check if tables exist by querying pg_tables
            result = db.session.execute(db.text(
                "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
            ))
            tables = [row[0] for row in result]
            if tables:
                print(f"Existing public tables: {', '.join(tables)}")
            else:
                print("No public tables found yet. Schema is ready to be initialized/migrated.")
                
            sys.exit(0)
    except Exception as e:
        print("\nERROR: Failed to connect to the local PostgreSQL database.")
        print(f"Detail: {e}\n")
        print("Please check:")
        print("1. Is the PostgreSQL server running?")
        print("2. Does the database 'resume_builder' exist?")
        print("3. Are the connection details (username/password) in backend/.env correct?")
        sys.exit(1)

if __name__ == "__main__":
    test_connection()
