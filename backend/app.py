from flask import Flask, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from models import db
from routes import api_bp
from auth_v2 import auth_bp, bcrypt
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
# Standard CORS setup (Broad but robust for dev)
CORS(app, supports_credentials=True, origins="*", 
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])


@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,PATCH,OPTIONS'
    return response


# Error handlers with CORS headers
@app.errorhandler(500)
def handle_500(e):
    from flask import jsonify
    response = jsonify({'error': 'Internal server error', 'message': str(e)})
    response.status_code = 500
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response


@app.errorhandler(400)
def handle_400(e):
    from flask import jsonify
    response = jsonify({'error': 'Bad request', 'message': str(e)})
    response.status_code = 400
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response


@app.errorhandler(404)
def handle_404(e):
    from flask import jsonify
    response = jsonify({'error': 'Not found', 'message': str(e)})
    response.status_code = 404
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response

# Configuration
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'automarketer.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'AutoMarketer_Production_Secret_Key_2025!!')

# Initialize DB
db.init_app(app)

# Register Blueprints
app.register_blueprint(api_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api/auth')

jwt = JWTManager(app)
bcrypt.init_app(app)

# Initialize database tables (works with Gunicorn)
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(debug=False, host='0.0.0.0', port=port)
