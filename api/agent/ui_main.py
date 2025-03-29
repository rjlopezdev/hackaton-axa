import pandas as pd
import unicodedata
from datetime import datetime
import re
from dateutil.relativedelta import relativedelta

from datetime import datetime
from pathlib import Path
from textwrap import dedent

from agno.agent import Agent
from agno.models.openai import OpenAIChat

from dotenv import load_dotenv
import os

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

Seleccionado = False
Nombre = None
Dni = None

def valida_usuario(df, email):
    return df[df["Correo"] == email]

def get_id_polizas(df_usuario, df_poliza):
    return df_poliza[df_poliza["Correo"] == df_usuario["Correo"].iloc[0]]

agente_salud = Agent(
    model=OpenAIChat(id="gpt-4o"),
    description=dedent("""\
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
    """),
    add_history_to_messages=True,
    num_history_responses=10,
    instructions = dedent("""\
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
                                 
    \
    """),

    expected_output=dedent("""\
        El output esperado es una respuesta natural. Pero en el caso de que ya tengas claro cual es el especialista
        indicado y el seguro, respondes al cliente nornalmente y finalizas el chat cuando tengas claro con dos tokens
        uno que indica el fin del chat, y otro que indica la especialidad del médico o psicólogo elegido, así:
        (fin_de_conver)
        (inserta_especialista) 
    \
    """),
    markdown=False,
)

def obtener_respuesta_agente_salud(query):
    response = agente_salud.run(query)
    return response.content

if __name__ == "__main__":

    login = True

    # Usuario ya registrado
    if login == True:
        email = "pepe@gmail.com"
        df_usuarios = pd.read_csv("./usuarios.csv", encoding="utf-8")

        df_usuario = valida_usuario(df_usuarios, email)

        # Calcular la edad
        edad = datetime.now().year - int(df_usuario["Fecha de Nacimiento"])
        cp = df_usuario["Código Postal"].iloc[0]
        profesion = df_usuario["Profesion"].iloc[0]

        df_polizas = pd.read_csv("./polizas_usuario.csv", encoding="utf-8")
        df_ids_polizas = valores_correo = df_polizas['numero_poliza']

        lista_ids_polizas = df_ids_polizas.tolist()

        polizas = list(set([re.sub(r'\d+', '', string) for string in lista_ids_polizas]))

        seguro_contratado = False
        while seguro_contratado == False:
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
                print(f"Usted ha seleccionado la categoría: {categoria}\n¿Qué poblema tiene?")

                respuesta_agente = ""
                while not "(fin_de_conver)" in respuesta_agente:
                    cr = input("")

                    # Puedes continuar con el flujo del programa si la categoría es válida
                    seguro_contratado = True

                    # Pasa al agente especializado
                    mensaje_hacia_agente = "(Inicio de la cadena de texto)\n"
                    mensaje_hacia_agente = mensaje_hacia_agente + f"CR:{cr}\n{str(edad)};{str(cp)};{profesion}"
                    mensaje_hacia_agente = mensaje_hacia_agente + "\n(Final cadena de texto)"
                    print(mensaje_hacia_agente)
                    respuesta_agente = obtener_respuesta_agente_salud(mensaje_hacia_agente)
                    print(respuesta_agente)

                df_medicos = pd.read_csv("./especialistas.csv", sep=';')

                respuesta_agente_especialidad = respuesta_agente.split("(fin_de_conver)")[1]

                filtro_especialidad = df_medicos[(df_medicos['codigo postal'] == cp) & (df_medicos['especialidad'] == respuesta_agente_especialidad)]

                # Si no hay resultados con la especialidad solicitada, buscar "Medico Cabecera"
                if filtro_especialidad.empty:
                    print(f"No obstante, sería convieniente que previamente le valore un médico de antención de primaria")
                    filtro_especialidad = df_medicos[(df_medicos['codigo postal'] == cp) & (df_medicos['especialidad'] == 'Medico Cabecera')]

                filtro_especialidad = filtro_especialidad.sort_values(by=['Dia_Cita', 'Hora_Cita','Qos'], ascending=[True, False]).iloc[0]
                filtro_especialidad = filtro_especialidad.drop_duplicates(subset=['Dia_Cita', 'Hora_Cita'], keep='first')

                si_no = ""
                i = 0
                no_reservado = False

                while not 's' in si_no:
                    cita_asignada = filtro_especialidad[i]
                    i = i + 1
                    print(f"¿Podría asistir en el tramo horario {cita_asignada['Cita']} en {cita_asignada['Dirección']}?")
                    while not 's' in si_no and not 'n' in si_no:
                        si_no = input("")
                    if 0 == filtro_especialidad.shape[0]:
                        print("Lo siento, no quedan más citas disponibles")
                        no_reservado = True
                        break

                if no_reservado == False:
                    print("Estupendo, cita reservada")

                # Acaba la conversación
                while True:
                    pass

            else:
                print("No tiene contratado ese tipo de seguro ¿desea contratarlo?")
                si_no = input("Responda sí o no: ").lower()

                if 's' in si_no:
                    # Pasa al agente de contratación
                    seguro_contratado  = True
                    print("Dirigiéndolo al agente de contratación...")
                else:
                    # Vuelve a preguntar
                    pass

    # Alta de nuevo Usuario
    else:
        pass
