# app.py
from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///people.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Permission constants
READ_PERMISSION = 'read'
CREATE_PERMISSION = 'create'
UPDATE_PERMISSION = 'update'
DELETE_PERMISSION = 'delete'

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    permissions = db.Column(db.String(500), default=READ_PERMISSION)  # Comma-separated permissions
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def has_permission(self, permission):
        return permission in self.permissions.split(',')

class Person(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    address = db.Column(db.String(200))
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'))

# Permission decorator
def permission_required(permission):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_id = session.get('user_id')
            if not user_id:
                return jsonify({'error': 'Authentication required'}), 401
            
            user = User.query.get(user_id)
            if not user or not user.has_permission(permission):
                return jsonify({'error': f'Permission denied. Requires: {permission}'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Routes
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    user = User(username=data['username'])
    user.set_password(data['password'])
    
    # Set permissions if provided, otherwise default to read only
    permissions = data.get('permissions', READ_PERMISSION)
    user.permissions = permissions
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'message': 'User registered successfully',
        'user': {
            'id': user.id,
            'username': user.username,
            'permissions': user.permissions
        }
    }), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    session['user_id'] = user.id
    session['username'] = user.username
    session['permissions'] = user.permissions
    
    return jsonify({
        'message': 'Logged in successfully',
        'user': {
            'id': user.id,
            'username': user.username,
            'permissions': user.permissions
        }
    })

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/persons', methods=['GET'])
@permission_required(READ_PERMISSION)
def get_persons():
    persons = Person.query.all()
    
    # For operator - show all persons with created_by info
    persons_data = []
    for person in persons:
        person_data = {
            'id': person.id,
            'name': person.name,
            'age': person.age,
            'email': person.email,
            'phone': person.phone,
            'address': person.address,
            'created_by': person.created_by
        }
        persons_data.append(person_data)
    
    return jsonify({'persons': persons_data})

@app.route('/api/persons/<int:id>', methods=['GET'])
@permission_required(READ_PERMISSION)
def get_person(id):
    person = Person.query.get_or_404(id)
    
    # Check if user created this person or has all permissions
    user_id = session.get('user_id')
    user = User.query.get(user_id)
    
    if person.created_by != user_id and not user.has_permission('admin'):
        return jsonify({'error': 'Access denied to this resource'}), 403
    
    return jsonify({
        'id': person.id,
        'name': person.name,
        'age': person.age,
        'email': person.email,
        'phone': person.phone,
        'address': person.address,
        'created_by': person.created_by
    })

@app.route('/api/persons', methods=['POST'])
@permission_required(CREATE_PERMISSION)
def create_person():
    data = request.get_json()
    user_id = session.get('user_id')
    
    # Check if email already exists
    if Person.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    person = Person(
        name=data['name'],
        age=data['age'],
        email=data['email'],
        phone=data.get('phone'),
        address=data.get('address'),
        created_by=user_id
    )
    
    db.session.add(person)
    db.session.commit()
    
    return jsonify({
        'message': 'Person created successfully',
        'person': {
            'id': person.id,
            'name': person.name,
            'age': person.age,
            'email': person.email,
            'phone': person.phone,
            'address': person.address,
            'created_by': person.created_by
        }
    }), 201

@app.route('/api/persons/<int:id>', methods=['PUT'])
@permission_required(UPDATE_PERMISSION)
def update_person(id):
    person = Person.query.get_or_404(id)
    data = request.get_json()
    user_id = session.get('user_id')
    
    # Check if user created this person or has all permissions
    user = User.query.get(user_id)
    if person.created_by != user_id and not user.has_permission('admin'):
        return jsonify({'error': 'Cannot update this person'}), 403
    
    # Check if email is being changed to an existing email
    if 'email' in data and data['email'] != person.email:
        if Person.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
    
    # Update fields
    for key, value in data.items():
        if hasattr(person, key):
            setattr(person, key, value)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Person updated successfully',
        'person': {
            'id': person.id,
            'name': person.name,
            'age': person.age,
            'email': person.email,
            'phone': person.phone,
            'address': person.address,
            'created_by': person.created_by
        }
    })

@app.route('/api/persons/<int:id>', methods=['DELETE'])
@permission_required(DELETE_PERMISSION)
def delete_person(id):
    person = Person.query.get_or_404(id)
    user_id = session.get('user_id')
    
    # Check if user created this person or has all permissions
    user = User.query.get(user_id)
    if person.created_by != user_id and not user.has_permission('admin'):
        return jsonify({'error': 'Cannot delete this person'}), 403
    
    db.session.delete(person)
    db.session.commit()
    
    return jsonify({'message': 'Person deleted successfully'})

@app.route('/api/user/permissions', methods=['GET'])
def get_user_permissions():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(session['user_id'])
    return jsonify({
        'username': user.username,
        'permissions': user.permissions.split(',')
    })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        # Create default admin user if not exists
        if not User.query.filter_by(username='admin').first():
            admin = User(username='admin')
            admin.set_password('admin123')
            admin.permissions = 'read,create,update,delete,admin'
            db.session.add(admin)
            db.session.commit()
    app.run(debug=True)