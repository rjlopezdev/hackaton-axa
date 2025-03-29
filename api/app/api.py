from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from agent.ui_main import obtener_respuesta_agente_salud

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return jsonify({"message": "API is running"})

@app.route('/ai-assistant', methods=['POST'])
def ai_assistant():
    data = request.get_json()
    prompt = data.get("prompt")
    email = data.get("email")
    
    if not prompt or not email:
        return jsonify({"error": "Missing prompt or email"}), 400
    
    # Get response from the UI agent
    response = obtener_respuesta_agente_salud(prompt)
    
    return jsonify({
        "email": email,
        "prompt": prompt,
        "response": response
    })
