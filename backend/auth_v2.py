from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from models import db, User
from email_validator import validate_email, EmailNotValidError
import re

auth_bp = Blueprint('auth', __name__)
bcrypt = Bcrypt()

# Create a local limiter instance for this blueprint if needed, 
# or import the global one. For simplicity, we'll re-init a limiter 
# wrapper or rely on app-level limiter if registered appropriately. 
# However, idiomatic Flask-Limiter usually uses the app's limiter.
# Since we are in a blueprint, we can't easily import 'limiter' from app 
# due to circular imports.
# We will skip the decorator here OR move limiter init to a extensions.py.
# For this step, we will use manual checks or assume global error handling.
# BETTER APPROACH: Create extensions.py. 
# For now, let's just add the validation logic.

def is_password_strong(password):
    if len(password) < 8:
        return False
    if not re.search(r"\d", password):
        return False
    if not re.search(r"[A-Z]", password):
        return False
    return True

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'error': 'Missing required fields'}), 400

    # Email Validation
    try:
        valid = validate_email(email, check_deliverability=False)
        email = valid.email
    except EmailNotValidError as e:
        return jsonify({'error': str(e)}), 400

    # Password Strength
    if not is_password_strong(password):
        return jsonify({'error': 'Password too weak. Must be 8+ chars, include number and uppercase.'}), 400

    if User.query.filter_by(username=username).first() or User.query.filter_by(email=email).first():
        return jsonify({'error': 'User already exists'}), 409

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(username=username, email=email, password_hash=hashed_password)
    
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User created successfully'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    if user and bcrypt.check_password_hash(user.password_hash, password):
        # Identity must be a string for flask-jwt-extended
        access_token = create_access_token(identity=str(user.id))
        return jsonify({'token': access_token, 'user': user.to_dict()}), 200
    
    return jsonify({'error': 'Invalid credentials'}), 401

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict())
