import pandas as pd
import unicodedata
from datetime import datetime
import re
from dateutil.relativedelta import relativedelta
import os
from pathlib import Path

from agno.agent import Agent
from agno.models.openai import OpenAIChat

from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

# Configurar rutas a los archivos CSV
BASE_DIR = Path(__file__).resolve().parent
USUARIOS_CSV = BASE_DIR / "usuarios.csv"
POLIZAS_CSV = BASE_DIR / "polizas_usuario.csv"
ESPECIALISTAS_CSV = BASE_DIR / "especialistas.csv"

# Variables globales
Seleccionado = False
Nombre = None
Dni = None

def valida_usuario(df, email):
    """Valida si un usuario existe en el DataFrame por su email."""
    return df[df["Correo"] == email]

def get_id_polizas(df_usuario, df_poliza):
    """Obtiene las pólizas asociadas a un usuario."""
    if not df_usuario.empty:
        return df_poliza[df_poliza["Correo"] == df_usuario["Correo"].iloc[0]]
    return pd.DataFrame()

# Configuración del agente de salud
agente_salud = Agent(
    model=OpenAIChat(id="gpt-4o"),
    description="""\
        Eres un asegurador especializado en salud que se encarga de 
        averiguar las necesidades del cliente en materia de salud, 
        incluyendo la salud mental, abarcas el territorio de España. 
        Hay dos tipos de cliente:

        - Cliente que ya tiene seguro y está registrado: suelen ser 
          personas mayores con poco acceso a la tecnología, es poco
          probable que usen este chatbot. Como ya están registrados,
          tendrás acceso a sus datos, como nombre, correo, DNI, 
          dirección, código postal, fecha de nacimiento (año de nacimiento)
          y profesión. 

        - Cliente que no está registrado y no tiene seguro de salud:
          son personas jóvenes principalmente que todavían no han 
          contratado un seguro de salud. Habría que descubir sus 
          necesidades y ponerle en contacto con el médico especializado
          más conveniente.\
    """,
    add_history_to_messages=True,
    num_history_responses=10,
    instructions = """\
        En función del cliente la cadena de texto de entrada va a ser 
        distinta, el cliente registrado se etiqueta como 'CR', y el no 
        etiquetado como 'CNR'. En el caso del CR, la cadena de texto de
        entrada es la siguiente:
        
        (Inicio de la cadena de texto)
        CR: (Petición del cliente)
        Set de datos del cliente.
        (Fin de la cadena de texto)
        
        En el caso del CNR, tenemos los siguiente:
                        
        (Inicio de la cadena de texto)
        CNR: (Petición del cliente)
        (Fin de la cadena de texto)

        Los datos del cliente irían separados por punto y coma con el
        siguiente formato: Edad;Código postal;Profesión
        Ejemplo: 35;28001;Bombero
        
        Teniendo en cuenta toda la información, debes
        seguir los siguientes pasos:
                        
        1. En una primera iteración, empieza por preguntar al cliente qué 
           tipo de necesidad médica tiene.
        
        2. Si es cliente registrado, vas a usar los datos proporcionados
           en la entrada de texto y sigue con el paso número 4.
        
        3. Si es cliente no registrado, tienes que iterar varias veces con 
           el cliente para preguntarle lo siguiente:
                          - Edad.
                          - Código postal.
                          - Profesión.
        
        4. A partir de aquí hay que decidir la especialidad de qué médico o psicólogo (según si
           tiene necesidades de salud física o mental) hay que redirigir al cliente usando el set 
           de datos del cliente, proporcionados en la cadena de datos de entrada. Para decidirlo, 
           según la petición de entrada que haga el cliente, puedes hacer el siguiente 
           tipo de preguntas:
                        - ¿Considera su profesión de riesgo o susceptible de necesitar algún servicio de salud extra?
                        - ¿Para ti solo o para una unidad familiar?
                        - ¿Sufre alguna enfermedad diagnosticada en este momento o alguien de su familia? Si no es así indica si tiene algún síntoma o no.
                        - ¿Has sido hospitalizado por esta enfermedad? ¿Cuántas veces y por qué motivos?
                        - ¿Recibe actualmente terapia para su enfermedad?
                        - ¿Tienes antecedentes familiares relacionados con tu enfermedad?
                        - ¿Tienes otras enfermedades que afecten tu salud?
                        - ¿Qué tipo de atención necesitas? (Chequeo general, especialidad específica, segunda opinión, etc.)
                        - ¿Tienes alguna restricción o recomendación médica vigente?
                        - ¿Tiene alguna preferencia de póliza de seguros que quiera contratar?
                          
        5. Una vez tengas claro qué médico o psicólogo de la zona es el mejor, 
           recomienda uno tanto para el caso CR como CNR y asigna uno de los siguientes 
           seguros en el caso de que el cliente sea del tipo CNR, el que más se adapte:
                          - Óptima Joven: Seguro de Salud con cobertura ambulatoria,con o sin copago, con acceso a un amplio cuadro médico y sin hospitalización. ¡Y además tienes acceso a telemedicina!
                          - Óptima y Óptima Familiar: Seguro de Salud con cobertura completa, con o sin copago, con acceso a especialistas, urgencias, pruebas, hospitalizaciones, intervenciones a través del amplio cuadro médico y ¡mucho más!
                          - Óptima Plus: Incluye las mismas prestaciones que Óptima, además te ofrece cobertura nacional e internacional a través del reembolso de gastos y los servicios más exclusivos.
    """,
    expected_output="""\
        El output esperado es una respuesta natural. Pero en el caso de que ya tengas claro cual es el especialista
        indicado y el seguro, respondes al cliente nornalmente y finalizas el chat cuando tengas claro con dos tokens
        uno que indica el fin del chat, y otro que indica la especialidad del médico o psicólogo elegido, así:
        (fin_de_conver)
        (inserta_especialista) 

        inserta_especialista tiene que ser un valor de los siguiente: medico_cabecera, pediatra, cardiologo o neumologo
    """,
    markdown=False,
)

def obtener_respuesta_agente_salud(query):
    """Obtiene la respuesta del agente de salud."""
    try:
        response = agente_salud.run(query)
        return response.content
    except Exception as e:
        print(f"Error al obtener respuesta del agente: {e}")
        return "Lo siento, ha ocurrido un error al procesar tu consulta. Por favor, inténtalo de nuevo."

def main():
    try:
        login = True

        # Usuario ya registrado
        if login:
            email = "pepe@gmail.com"
            
            # Cargar datos de usuarios
            try:
                df_usuarios = pd.read_csv(USUARIOS_CSV, encoding="utf-8")
            except Exception as e:
                print(f"Error al cargar el archivo de usuarios: {e}")
                return
                
            # Validar usuario
            df_usuario = valida_usuario(df_usuarios, email)
            if df_usuario.empty:
                print(f"No se encontró ningún usuario con el correo {email}")
                return
                
            # Calcular datos del usuario
            try:
                edad = datetime.now().year - int(df_usuario["Fecha de Nacimiento"].iloc[0])
                cp = df_usuario["Código Postal"].iloc[0]
                profesion = df_usuario["Profesion"].iloc[0]
            except Exception as e:
                print(f"Error al procesar datos del usuario: {e}")
                return
                
            # Cargar pólizas
            try:
                df_polizas = pd.read_csv(POLIZAS_CSV, encoding="utf-8")
                # Filtrar por el correo del usuario
                df_ids_polizas = df_polizas[df_polizas['Correo'] == email]
                lista_ids_polizas = df_ids_polizas['numero_poliza'].tolist()
                
                # Extraer tipos de pólizas (eliminar números)
                polizas = list(set([re.sub(r'\d+', '', string) for string in lista_ids_polizas]))
            except Exception as e:
                print(f"Error al procesar las pólizas: {e}")
                return
                
            seguro_contratado = False
            while not seguro_contratado:
                mensaje = f"Ahora mismo tiene contratado {len(lista_ids_polizas)} seguros entre las siguiente categorías\n"
                mensaje += '\n'.join([f"- Seguro de {i}" for i in polizas])
                mensaje += "\n¿Sobre qué categoría se trata su petición?"

                print(mensaje)

                # Pedir la categoría hasta que el usuario ingrese algo
                categoria = ""
                while categoria == "":
                    categoria = input("").strip()

                categoria = unicodedata.normalize('NFKD', categoria)
                categoria = ''.join(c for c in categoria if unicodedata.category(c) != 'Mn').lower()

                if categoria in polizas:
                    print(f"Usted ha seleccionado la categoría: {categoria}\n¿Qué problema tiene?")

                    respuesta_agente = ""
                    while "(fin_de_conver)" not in respuesta_agente:
                        cr = input("")

                        # Puedes continuar con el flujo del programa si la categoría es válida
                        seguro_contratado = True

                        # Pasa al agente especializado
                        mensaje_hacia_agente = "(Inicio de la cadena de texto)\n"
                        mensaje_hacia_agente += f"CR:{cr}\n{str(edad)};{str(cp)};{profesion}"
                        mensaje_hacia_agente += "\n(Final cadena de texto)"
                        
                        respuesta_agente = obtener_respuesta_agente_salud(mensaje_hacia_agente)
                        
                        # Verificar si la respuesta contiene el token fin_de_conver
                        if "(fin_de_conver)" in respuesta_agente:
                            print(respuesta_agente.split("(fin_de_conver)")[0].rstrip('\n'))
                        else:
                            print(respuesta_agente)
                            continue  # Si no tiene el token, continuamos el ciclo

                    # Procesar la especialidad recomendada
                    try:
                        partes = respuesta_agente.split("(fin_de_conver)")
                        if len(partes) > 1:
                            respuesta_agente_especialidad = partes[1].replace("\n", "").replace('(', '').replace(')', '').strip()
                            
                            respuesta_agente_especialidad = unicodedata.normalize('NFKD', respuesta_agente_especialidad)
                            respuesta_agente_especialidad = ''.join(c for c in respuesta_agente_especialidad if unicodedata.category(c) != 'Mn').lower()
                            
                            # Cargar datos de especialistas
                            df_medicos = pd.read_csv(ESPECIALISTAS_CSV, sep=',')
                            
                            # Filtrar especialistas
                            filtro_especialidad = df_medicos[df_medicos['Especialidad'] == respuesta_agente_especialidad]
                            filtro_especialidad = filtro_especialidad[filtro_especialidad['CP'] == str(cp)]
                            
                            # Si no hay resultados, buscar médico de cabecera
                            if filtro_especialidad.empty:
                                print("No obstante, sería conveniente que previamente le valore un médico de atención primaria")
                                filtro_especialidad = df_medicos[df_medicos['Especialidad'] == 'medico_cabecera']
                                filtro_especialidad = filtro_especialidad[filtro_especialidad['CP'] == str(cp)]
                            
                            # Ordenar por fecha, hora y calidad
                            filtro_especialidad = filtro_especialidad.sort_values(by=['Dia_Cita', 'Hora_Cita', 'Qos'], ascending=[True, True, False])
                            
                            if filtro_especialidad.empty:
                                print("Lo siento, no quedan citas disponibles")
                            else:
                                # Guardar todas las opciones de citas
                                citas_disponibles = filtro_especialidad.drop_duplicates(subset=['Dia_Cita', 'Hora_Cita'], keep='first')
                                
                                si_no = ""
                                i = 0
                                no_reservado = True
                                
                                # Recorrer citas disponibles
                                while i < len(citas_disponibles) and no_reservado:
                                    if i >= len(citas_disponibles):
                                        print("Lo siento, no quedan más citas disponibles")
                                        break
                                        
                                    cita_actual = citas_disponibles.iloc[i]
                                    print(f"¿Podría asistir el {cita_actual['Dia_Cita']} a las {cita_actual['Hora_Cita']} en {cita_actual['Dirección']}?")
                                    
                                    si_no = ""
                                    while 's' not in si_no.lower() and 'n' not in si_no.lower():
                                        si_no = input("Responda sí o no: ").lower()
                                    
                                    if 's' in si_no.lower():
                                        print("Estupendo, cita reservada")
                                        no_reservado = False
                                    else:
                                        i += 1
                        else:
                            print("No se pudo determinar la especialidad recomendada")
                    except Exception as e:
                        print(f"Error al procesar la especialidad o las citas: {e}")

                else:
                    print("No tiene contratado ese tipo de seguro ¿desea contratarlo?")
                    si_no = input("Responda sí o no: ").lower()

                    if 's' in si_no:
                        # Pasa al agente de contratación
                        seguro_contratado = True
                        print("Dirigiéndolo al agente de contratación...")
        
        # Alta de nuevo Usuario
        else:
            print("Funcionalidad de registro de nuevo usuario no implementada")
            
    except Exception as e:
        print(f"Error general en la aplicación: {e}")

if __name__ == "__main__":
    main()