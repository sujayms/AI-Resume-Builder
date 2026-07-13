import sys
from app import create_app
from app.extensions import db

def init_database():
    app = create_app()
    
    print("Initializing database tables...")
    try:
        with app.app_context():
            # Create all tables defined in models
            db.create_all()
            print("SUCCESS: Database tables created successfully!")
            
            # Verify the tables exist
            result = db.session.execute(db.text(
                "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
            ))
            tables = [row[0] for row in result]
            print(f"Created tables in 'public' schema: {', '.join(tables)}")
            
            sys.exit(0)
    except Exception as e:
        print(f"\nERROR: Failed to initialize database tables.")
        print(f"Detail: {e}\n")
        sys.exit(1)

if __name__ == "__main__":
    init_database()
