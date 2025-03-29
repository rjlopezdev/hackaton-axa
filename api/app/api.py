from flask import Flask, request, jsonify
from flask_restful import Api, Resource

app = Flask(__name__)
api = Api(app)

class Home(Resource):
    def get(self):
        return jsonify({"message": "API is running"})

class AIAssistant(Resource):
    def post(self):
        data = request.get_json()
        prompt = data.get("prompt")
        email = data.get("email")
        
        if not prompt or not email:
            return jsonify({"error": "Missing prompt or email"}), 400
        
        # Simulación de respuesta de IA
        response = f"AI Response to: {prompt}"
        
        return jsonify({
            "email": email,
            "prompt": prompt,
            "response": response
        })

api.add_resource(Home, "/")
api.add_resource(AIAssistant, "/ai-assistant")

if __name__ == "__main__":
    app.run(debug=True)
