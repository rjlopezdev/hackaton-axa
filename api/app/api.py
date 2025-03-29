from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import pandas as pd
from datetime import datetime
import re
import unicodedata
import numpy as np
from pathlib import Path

from agent.ui_main import obtener_respuesta_agente_salud

app = Flask(__name__)
CORS(app)

# Configurar rutas a los archivos CSV
BASE_DIR = Path(__file__).resolve().parent.parent
USUARIOS_CSV = BASE_DIR / "agent" / "usuarios.csv"
POLIZAS_CSV = BASE_DIR / "agent" / "polizas_usuario.csv"
ESPECIALISTAS_CSV = BASE_DIR / "agent" / "especialistas.csv"

def valida_usuario(df, email):
    """Valida si un usuario existe en el DataFrame por su email."""
    return df[df["Correo"] == email]

@app.route('/')
def home():
    return jsonify({"message": "API is running"})

@app.route('/api/user-info', methods=['GET'])
def get_user_info():
    """Endpoint para obtener información del usuario y sus pólizas"""
    email = request.args.get('email')
    
    if not email or email == "guest@example.com":
        return jsonify({"isRegistered": False}), 200
    
    try:
        # Cargar datos del usuario
        df_usuarios = pd.read_csv(USUARIOS_CSV, encoding="utf-8")
        df_usuario = valida_usuario(df_usuarios, email)
        
        if df_usuario.empty:
            return jsonify({"isRegistered": False}), 200
        
        # Cargar pólizas del usuario
        df_polizas = pd.read_csv(POLIZAS_CSV, encoding="utf-8")
        polizas_usuario = df_polizas[df_polizas["Correo"] == email]["numero_poliza"].tolist()
        
        # Extraer los tipos de póliza (por ejemplo, 'salud' de 'salud01')
        tipos_poliza = list(set([re.sub(r'\d+', '', string) for string in polizas_usuario]))
        
        # Calcular edad y obtener datos
        edad = datetime.now().year - int(df_usuario["Fecha de Nacimiento"].iloc[0])
        
        # Preparar respuesta
        return jsonify({
            "isRegistered": True,
            "name": df_usuario["Nombre"].iloc[0],
            "age": edad,
            "zipCode": df_usuario["Código Postal"].iloc[0],
            "profession": df_usuario["Profesion"].iloc[0],
            "insuranceTypes": tipos_poliza,
            "policies": polizas_usuario
        })
    
    except Exception as e:
        return jsonify({
            "error": f"Error al obtener datos del usuario: {str(e)}"
        }), 500

@app.route('/api/specialists', methods=['GET'])
def get_specialists():
    """Endpoint para obtener especialistas disponibles"""
    especialidad = request.args.get('especialidad')
    cp = request.args.get('cp')
    
    if not especialidad or not cp:
        return jsonify({"error": "Falta especialidad o código postal"}), 400
    
    try:
        cp = int(cp)
        
        # Normalizar especialidad (quitar acentos y convertir a minúsculas)
        especialidad = unicodedata.normalize('NFKD', especialidad)
        especialidad = ''.join(c for c in especialidad if unicodedata.category(c) != 'Mn').lower()
        
        # Cargar y filtrar especialistas
        df_especialistas = pd.read_csv(ESPECIALISTAS_CSV, sep=',')
        
        # Filtrar por especialidad y código postal
        filtro_especialidad = df_especialistas[df_especialistas['Especialidad'] == especialidad]
        filtro_especialidad = filtro_especialidad[filtro_especialidad['CP'] == cp]
        
        # Si no hay resultados con la especialidad solicitada, buscar "medico_cabecera"
        if filtro_especialidad.empty:
            filtro_especialidad = df_especialistas[df_especialistas['Especialidad'] == 'medico_cabecera']
            filtro_especialidad = filtro_especialidad[filtro_especialidad['CP'] == cp]
            
        # Ordenar por fecha, hora y calidad de servicio
        filtro_especialidad = filtro_especialidad.sort_values(by=['Dia_Cita', 'Hora_Cita','Qos'], ascending=[True, True, False])
        
        if filtro_especialidad.empty:
            return jsonify({"specialists": [], "fallbackToGeneral": True})
        
        # Eliminar duplicados
        filtro_especialidad = filtro_especialidad.drop_duplicates(subset=['Dia_Cita', 'Hora_Cita'], keep='first')
        
        # Convertir a lista de diccionarios para JSON
        especialistas = filtro_especialidad.to_dict('records')
        
        return jsonify({
            "specialists": especialistas,
            "fallbackToGeneral": especialidad != especialidad.lower()  # True si se cambió a médico general
        })
    
    except Exception as e:
        return jsonify({
            "error": f"Error al obtener especialistas: {str(e)}"
        }), 500

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
        else:
            # Para usuarios no registrados, intentar usar datos proporcionados manualmente
            age = data.get("age")
            zipCode = data.get("zipCode")
            profession = data.get("profession")
            
            if age and zipCode and profession:
                user_data = f"{age};{zipCode};{profession}"
        
        # Formatear mensaje para el agente
        if is_registered:
            # Usuario registrado
            mensaje_hacia_agente = "(Inicio de la cadena de texto)\n"
            mensaje_hacia_agente += f"CR:{prompt}\n{user_data}"
            mensaje_hacia_agente += "\n(Final cadena de texto)"
        else:
            # Usuario no registrado o invitado
            if user_data:
                # Si tenemos datos del usuario no registrado
                mensaje_hacia_agente = "(Inicio de la cadena de texto)\n"
                mensaje_hacia_agente += f"CNR:{prompt}\n{user_data}"
                mensaje_hacia_agente += "\n(Final cadena de texto)"
            else:
                # Sin datos del usuario
                mensaje_hacia_agente = "(Inicio de la cadena de texto)\n"
                mensaje_hacia_agente += f"CNR:{prompt}"
                mensaje_hacia_agente += "\n(Final cadena de texto)"
        
        # Obtener respuesta del agente
        respuesta_agente = obtener_respuesta_agente_salud(mensaje_hacia_agente)
        
        # Procesar la respuesta para extraer tokens si existen
        respuesta_limpia = respuesta_agente
        especialidad = None
        fin_conversacion = False
        
        if "(fin_de_conver)" in respuesta_agente:
            partes = respuesta_agente.split("(fin_de_conver)")
            respuesta_limpia = partes[0].strip()
            fin_conversacion = True
            
            # Extraer especialidad si está presente
            if len(partes) > 1 and "(" in partes[1] and ")" in partes[1]:
                especialidad_raw = partes[1].replace("(", "").replace(")", "").strip()
                especialidad = unicodedata.normalize('NFKD', especialidad_raw)
                especialidad = ''.join(c for c in especialidad if unicodedata.category(c) != 'Mn').lower()
        
        return jsonify({
            "email": email,
            "prompt": prompt,
            "response": respuesta_limpia,
            "isRegistered": is_registered,
            "conversationEnded": fin_conversacion,
            "specialty": especialidad
        })
    
    except Exception as e:
        return jsonify({
            "email": email,
            "prompt": prompt,
            "response": f"Lo siento, ha ocurrido un error: {str(e)}",
            "error": str(e)
        }), 500