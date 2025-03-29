from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
import os
import sys
from pathlib import Path

app = Flask(__name__)
CORS(app)

# Obtener la ruta base del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent

@app.route('/')
def home():
    return jsonify({"message": "API is running"})

@app.route('/run-agent', methods=['GET', 'POST'])
def run_agent():
    """
    Este endpoint ejecuta directamente el script ui_main.py
    Nota: En producción, este enfoque no es recomendable, pero es útil para desarrollo
    """
    try:
        # Agregar el directorio base al path para poder importar módulos correctamente
        sys.path.insert(0, str(BASE_DIR))
        
        # Cambiar al directorio donde está ui_main.py para asegurar que 
        # todas las rutas relativas funcionen correctamente
        original_dir = os.getcwd()
        os.chdir(str(BASE_DIR))
        
        # Ejecutar el script ui_main.py como si fuera la aplicación principal
        # Esto preserva su comportamiento original
        import agent.ui_main as ui_main
        
        # Restaurar el directorio original
        os.chdir(original_dir)
        
        return jsonify({
            "success": True, 
            "message": "ui_main.py ejecutado correctamente"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/chat', methods=['POST'])
def chat_api():
    """
    API para integrar con el script ui_main.py
    Recibe mensajes y los pasa a la función obtener_respuesta_agente_salud
    """
    try:
        data = request.get_json()
        message = data.get('message')
        email = data.get('email', 'guest@example.com')
        
        if not message:
            return jsonify({"error": "El mensaje no puede estar vacío"}), 400
        
        # Importar la función desde ui_main.py
        sys.path.insert(0, str(BASE_DIR))
        from agent.ui_main import obtener_respuesta_agente_salud
        
        # Formatear el mensaje según el formato esperado por ui_main.py
        if email != 'guest@example.com':
            # Procesa como usuario registrado
            from agent.ui_main import valida_usuario
            import pandas as pd
            from datetime import datetime
            
            df_usuarios = pd.read_csv(BASE_DIR / "agent" / "usuarios.csv", encoding="utf-8")
            df_usuario = valida_usuario(df_usuarios, email)
            
            if not df_usuario.empty:
                # Calcular la edad
                edad = datetime.now().year - int(df_usuario["Fecha de Nacimiento"].iloc[0])
                cp = df_usuario["Código Postal"].iloc[0]
                profesion = df_usuario["Profesion"].iloc[0]
                
                mensaje_hacia_agente = "(Inicio de la cadena de texto)\n"
                mensaje_hacia_agente += f"CR:{message}\n{str(edad)};{str(cp)};{profesion}"
                mensaje_hacia_agente += "\n(Final cadena de texto)"
            else:
                # Si no encontramos el usuario, lo tratamos como invitado
                mensaje_hacia_agente = "(Inicio de la cadena de texto)\n"
                mensaje_hacia_agente += f"CNR:{message}"
                mensaje_hacia_agente += "\n(Final cadena de texto)"
        else:
            # Procesa como usuario invitado
            mensaje_hacia_agente = "(Inicio de la cadena de texto)\n"
            mensaje_hacia_agente += f"CNR:{message}"
            mensaje_hacia_agente += "\n(Final cadena de texto)"
        
        # Obtener respuesta del agente
        respuesta = obtener_respuesta_agente_salud(mensaje_hacia_agente)
        
        # Procesar la respuesta
        respuesta_limpia = respuesta
        especialidad = None
        if "(fin_de_conver)" in respuesta:
            respuesta_limpia = respuesta.split("(fin_de_conver)")[0].strip()
            partes = respuesta.split("(fin_de_conver)")
            if len(partes) > 1:
                especialidad = partes[1].replace("(", "").replace(")", "").strip()
        
        return jsonify({
            "response": respuesta_limpia,
            "especialidad": especialidad
        })
        
    except Exception as e:
        import traceback
        return jsonify({
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500

@app.route('/ui-main', methods=['GET'])
def redirect_to_ui_main():
    """
    Redirigir a la ejecución directa de ui_main.py
    Este enfoque es simple pero efectivo para desarrollo
    """
    # Construir el comando para ejecutar ui_main.py
    ui_main_path = BASE_DIR / "agent" / "ui_main.py"
    
    # Informar al usuario que debe ejecutar el archivo directamente
    return jsonify({
        "message": "Para ejecutar ui_main.py directamente, utiliza el siguiente comando en tu terminal:",
        "command": f"python {ui_main_path}",
        "path": str(ui_main_path)
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=True)