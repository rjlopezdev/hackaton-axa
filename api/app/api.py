from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import pandas as pd
from datetime import datetime
import re
from pathlib import Path

from agent.ui_main import obtener_respuesta_agente_salud

app = Flask(__name__)
CORS(app)

# Configurar rutas a los archivos CSV
BASE_DIR = Path(__file__).resolve().parent.parent
USUARIOS_CSV = BASE_DIR / "agent" / "usuarios.csv"
POLIZAS_CSV = BASE_DIR / "agent" / "polizas_usuario.csv"

def valida_usuario(df, email):
    """Valida si un usuario existe en el DataFrame por su email."""
    return df[df["Correo"] == email]

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
    
    try:
        # Verificar si es un usuario registrado o un invitado
        is_registered = False
        user_data = None
        
        if email != "guest@example.com":
            # Intentar cargar datos del usuario
            try:
                df_usuarios = pd.read_csv(USUARIOS_CSV, encoding="utf-8")
                df_usuario = valida_usuario(df_usuarios, email)
                
                if not df_usuario.empty:
                    is_registered = True
                    # Calcular edad y obtener datos
                    edad = datetime.now().year - int(df_usuario["Fecha de Nacimiento"].iloc[0])
                    cp = df_usuario["Código Postal"].iloc[0]
                    profesion = df_usuario["Profesion"].iloc[0]
                    user_data = f"{str(edad)};{str(cp)};{profesion}"
            except Exception as e:
                print(f"Error loading user data: {e}")
        
        # Formatear mensaje para el agente
        if is_registered:
            # Usuario registrado
            mensaje_hacia_agente = "(Inicio de la cadena de texto)\n"
            mensaje_hacia_agente += f"CR:{prompt}\n{user_data}"
            mensaje_hacia_agente += "\n(Final cadena de texto)"
        else:
            # Usuario no registrado o invitado
            mensaje_hacia_agente = "(Inicio de la cadena de texto)\n"
            mensaje_hacia_agente += f"CNR:{prompt}"
            mensaje_hacia_agente += "\n(Final cadena de texto)"
        
        # Obtener respuesta del agente
        respuesta_agente = obtener_respuesta_agente_salud(mensaje_hacia_agente)
        
        # Procesar la respuesta para eliminar tokens si existen
        if "(fin_de_conver)" in respuesta_agente:
            respuesta_limpia = respuesta_agente.split("(fin_de_conver)")[0].strip()
            # Aquí podríamos extraer la especialidad si fuera necesario
            # especialidad = respuesta_agente.split("(fin_de_conver)")[1].replace("(", "").replace(")", "").strip()
        else:
            respuesta_limpia = respuesta_agente
        
        return jsonify({
            "email": email,
            "prompt": prompt,
            "response": respuesta_limpia,
            "isRegistered": is_registered
        })
    
    except Exception as e:
        return jsonify({
            "email": email,
            "prompt": prompt,
            "response": f"Lo siento, ha ocurrido un error: {str(e)}",
            "error": str(e)
        }), 500