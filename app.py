
from flask import Flask, request, jsonify
import sqlite3
import os

app = Flask(__name__)

# Connect to SQLite database (or create one if it doesn't exist)
DATABASE = 'leaderboard.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# Create leaderboard table if it doesn't exist
def create_table():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS leaderboard (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wallet_address TEXT NOT NULL,
            score INTEGER NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

create_table()

# API route to submit score
@app.route('/submit_score', methods=['POST'])
def submit_score():
    data = request.get_json()
    wallet_address = data.get('wallet_address')
    score = data.get('score')

    if wallet_address and score:
        conn = get_db_connection()
        conn.execute('INSERT INTO leaderboard (wallet_address, score) VALUES (?, ?)',
                     (wallet_address, score))
        conn.commit()
        conn.close()
        return jsonify({'status': 'success'}), 201
    else:
        return jsonify({'status': 'error', 'message': 'Invalid data'}), 400

# API route to get leaderboard
@app.route('/get_leaderboard', methods=['GET'])
def get_leaderboard():
    conn = get_db_connection()
    leaderboard = conn.execute('SELECT * FROM leaderboard ORDER BY score DESC LIMIT 10').fetchall()
    conn.close()

    return jsonify([dict(row) for row in leaderboard])

if __name__ == '__main__':
    # Run the app on Heroku's assigned port or 5000 locally
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
