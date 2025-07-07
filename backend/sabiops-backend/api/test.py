from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/api/test')
def test():
    return jsonify({"message": "Backend is working!", "status": "success"})

@app.route('/api/health')
def health():
    return jsonify({"status": "healthy", "message": "Backend is running"})

if __name__ == "__main__":
    app.run(debug=True)

