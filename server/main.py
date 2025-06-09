from flask import Flask, jsonify 
from flask_cors import CORS

app = Flask(__name__)
cors = CORS(app, origins="*")  # Allow all origins for CORS

@app.route("/api/users", methods=['GET'])
def users():
    return jsonify(
        {
            "users": [
                'Dean',
                'Mark',
                'Bob'
            ]
        }
    )

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True, port=8080)