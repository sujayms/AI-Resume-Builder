from app import create_app

app = create_app()

if __name__ == '__main__':
    # Retrieve port and debug settings from app configuration
    port = app.config.get('PORT', 5000)
    debug = app.config.get('DEBUG', True)
    
    print(f"Starting server on http://127.0.0.1:{port}")
    app.run(host='127.0.0.1', port=port, debug=debug)
