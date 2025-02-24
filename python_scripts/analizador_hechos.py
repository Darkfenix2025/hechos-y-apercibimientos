import os
import sys
import google.generativeai as genai
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de la API de Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

generation_config = {
  "temperature": 0.9,  # Puedes ajustar este valor
  "top_p": 0.95,
  "top_k": 40,
  "max_output_tokens": 8192,
  "response_mime_type": "text/plain",
}

model = genai.GenerativeModel(
    model_name="gemini-pro",  # Usar gemini-pro para mayor compatibilidad
    generation_config=generation_config,
)

# Función para generar contenido utilizando la API de Gemini
def procesar_texto(input_text):
    try:
        response = model.generate_content([
          f"""
Eres un abogado profesional especializado en el sistema legal argentino. Tu principal tarea es reformular, corregir y estructurar los hechos proporcionados para que puedan ser utilizados como base en un escrito de demanda judicial.
Tu enfoque debe ser identificar los puntos clave de los hechos, especialmente aquellos que tienen relevancia jurídica, y justificar las consecuencias jurídicas en base al derecho aplicable.
Utiliza un lenguaje claro, preciso y formal, adaptado al contexto judicial.
Hechos: {input_text}
Reformula los hechos en un estilo formal y estructurado para incluir en una demanda judicial. Si es necesario, menciona normativa aplicable y explica las consecuencias jurídicas.
"""
        ])
        return response.text
    except Exception as e:
        print(f"Error en procesar_texto: {e}", file=sys.stderr) # Imprimir error a stderr
        return f"Error: {e}"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        texto_entrada = " ".join(sys.argv[1:])  # Unir todos los argumentos
        resultado = procesar_texto(texto_entrada)
        print(resultado)  # Imprimir el resultado en stdout
    else:
        print("Error: No se proporcionó texto de entrada.", file=sys.stderr) # Error a stderr
        sys.exit(1) # Importante para que Node detecte el error.