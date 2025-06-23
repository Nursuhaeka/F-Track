from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials, db
from datetime import datetime

# Initialize Firebase only once
cred = credentials.Certificate("C:/xampp/htdocs/Development/f-track-e5c35-firebase-adminsdk-fbsvc-c6fdfbfe53.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://console.firebase.google.com/u/1/project/f-track-e5c35/database/f-track-e5c35-default-rtdb/data/~2F'
})

app = Flask(__name__)

@app.route('/push_expense', methods=['POST'])
def push_expense():
    data = request.get_json()
    category = data.get('category')
    amount = data.get('amount')
    date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    if category and amount:
        ref = db.reference('expenses')
        ref.push({
            'category': category,
            'amount': amount,
            'date': date
        })
        return jsonify({'status': 'success'})
    else:
        return jsonify({'status': 'error', 'message': 'Missing data'}), 400

if __name__ == '__main__':
    app.run(debug=True)
