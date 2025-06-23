from flask import Flask, request, jsonify, send_from_directory
import firebase_admin
from firebase_admin import credentials, db
import os

app = Flask(__name__)

# Initialize Firebase only once
if not firebase_admin._apps:
    cred = credentials.Certificate("C:/xampp/htdocs/Development/f-track-e5c35-firebase-adminsdk-fbsvc-c6fdfbfe53.json")
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://f-track-e5c35.firebaseio.com/'
    })

@app.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        role = data.get('role')

        if email and password and role:
            ref = db.reference('users')
            ref.push({
                'email': email,
                'password': password,  # Hash in production
                'role': role
            })
            return jsonify({'status': 'success', 'message': 'User created successfully'}), 200
        else:
            return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Serve sign_up.html for testing (optional)
@app.route('/sign_up')
def serve_signup_page():
    return send_from_directory('.', 'sign_up.html')

if __name__ == '__main__':
    app.run(debug=True)
