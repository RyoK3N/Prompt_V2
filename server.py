from flask import Flask, render_template, redirect, url_for, request, jsonify, session, send_from_directory
from functools import wraps
import sqlite3
import hashlib
import os

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  # Change this to a secure secret key

# Database initialization
def init_db():
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

# Helper functions
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def get_user_by_email(email):
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute('SELECT * FROM users WHERE email = ?', (email,))
    user = c.fetchone()
    conn.close()
    return user

# Login decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            if request.path.startswith('/api/'):
                return jsonify({'error': 'Unauthorized'}), 401
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# Routes
@app.route('/')
def index():
    if 'user' in session:
        return redirect(url_for('dashboard'))
    return send_from_directory('.', 'index.html')

@app.route('/dashboard')
@login_required
def dashboard():
    return send_from_directory('.', 'dashboard.html')

@app.route('/discover')
def discover():
    return send_from_directory('.', 'discover.html')

@app.route('/spaces')
@login_required
def spaces():
    return send_from_directory('.', 'spaces.html')

@app.route('/library')
@login_required
def library():
    return send_from_directory('.', 'library.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'user' in session:
        return redirect(url_for('dashboard'))
        
    if request.method == 'GET':
        return send_from_directory('.', 'login.html')
    
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    user = get_user_by_email(email)
    if user and user[2] == hash_password(password):  # Index 2 is password
        session['user'] = {
            'id': user[0],
            'email': user[1],
            'first_name': user[3],
            'last_name': user[4]
        }
        return jsonify({'success': True, 'redirect': '/dashboard'})
    return jsonify({'success': False, 'error': 'Invalid credentials'})

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if 'user' in session:
        return redirect(url_for('dashboard'))
        
    if request.method == 'GET':
        return send_from_directory('.', 'signup.html')
    
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    first_name = data.get('firstName')
    last_name = data.get('lastName')
    
    if get_user_by_email(email):
        return jsonify({'success': False, 'error': 'Email already registered'})
    
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    try:
        c.execute('''
            INSERT INTO users (email, password, first_name, last_name)
            VALUES (?, ?, ?, ?)
        ''', (email, hash_password(password), first_name, last_name))
        conn.commit()
        
        # Get the newly created user
        user = get_user_by_email(email)
        session['user'] = {
            'id': user[0],
            'email': user[1],
            'first_name': user[3],
            'last_name': user[4]
        }
        
        return jsonify({'success': True, 'redirect': '/dashboard'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        conn.close()

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/api/user')
@login_required
def get_user():
    return jsonify(session['user'])

# Serve static files
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

if __name__ == '__main__':
    app.run(debug=True) 