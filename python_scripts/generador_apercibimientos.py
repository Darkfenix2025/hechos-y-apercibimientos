import os
import sys
import google.generativeai as genai
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configurar Gemini API Key
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Crear la configuración del modelo
generation_config = {
    "temperature": 0.6,  # Puedes ajustar
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
}

# Crear modelo de Gemini
model = genai.GenerativeModel(
    model_name="gemini-pro",  # Usar gemini-pro
    generation_config=generation_config,
)

# Función para interactuar con Gemini (MODIFICADA)
def gemini_query(hechos, sanciones):
    sanciones_texto = "\n".join(
        [f"- Fecha: {s['fecha']}, Tipo: {s['tipo']}, Motivo: {s['motivo']}" for s in sanciones]
    ) if sanciones else "No hay sanciones previas."

    prompt = f"""
Eres un agente de inteligencia artificial especializado en Derecho del Trabajo en Argentina, enfocado en representar a empleadores.
Tu objetivo es evaluar la conducta de un trabajador con base en los hechos proporcionados y determinar la sanción adecuada (apercibimiento, suspensión o despido). Según los hechos descriptos, debes:

Evaluar la gravedad de la conducta del trabajador.

Considerar los antecedentes de sanciones proporcionados, si los hay:
{sanciones_texto}

Aplicar las siguientes reglas:

Tres apercibimientos en un período anual implican que la siguiente sanción será una suspensión.

Tres suspensiones en un período anual ameritan el despido.

Conductas graves pueden justificar suspensión directa o despido sin necesidad de antecedentes.

Redactar una carta documento formal y clara que:

Identifique al trabajador y a la empresa.

Describa los hechos que motivan la sanción.

Indique la sanción aplicada y los antecedentes relevantes.

Use un lenguaje profesional, objetivo y no conciliador.

Hechos proporcionados: "{hechos}"

Por favor, genera una respuesta clara, incluyendo la calificación de la conducta y el texto para la carta documento. Responde siempre en español.
    """
    try:
        response = model.generate_content([prompt])
        return response.text
    except Exception as e:
        print(f"Error en gemini_query: {e}", file=sys.stderr)
        return f"Error al generar la respuesta: {e}"

if __name__ == "__main__":
    if len(sys.argv) > 2:
        hechos = sys.argv[1]
        sanciones_str = sys.argv[2]

        # Procesar las sanciones (convertir la cadena en una lista de diccionarios)
        sanciones = [] # Inicializar la lista vacía.
        try:
            if sanciones_str and sanciones_str != "None":  # Verifica si hay sanciones y si no es "None".
                for s in sanciones_str.split(';'):
                    partes = s.split(',')
                    if len(partes) == 3:  # Verificar que haya *exactamente* tres partes
                        fecha, tipo, motivo = partes
                        sanciones.append({"fecha": fecha.strip(), "tipo": tipo.strip(), "motivo": motivo.strip()})
                    else:
                         print(f"Error: Formato de sanción incorrecto: '{s}'", file=sys.stderr) #Enviar error
        except Exception as e:
            print(f"Error al procesar las sanciones: {e}", file=sys.stderr)
            print(f"Error al procesar las sanciones: {e}")
            sys.exit(1)

        resultado = gemini_query(hechos, sanciones)
        print(resultado)
    else:
        print("Error: Se esperaban dos argumentos (hechos y sanciones).", file=sys.stderr)
        sys.exit(1)