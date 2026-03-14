import { getGenerativeModel } from "firebase/ai";
import { vertexAI } from "./firebase";

// Utilizando Firebase Vertex AI
const MANDATED_MODEL = "gemini-2.5-flash"; // o "gemini-1.5-flash" si el 2.5 no está disponible aún en Firebase Vertex AI

/**
 * Función central para llamadas a la IA usando Vertex AI de Firebase.
 */
export const callGeminiAI = async (prompt, systemInstruction = "Eres un asistente experto en productividad.") => {
    console.log(`🚀 Iniciando llamada a AI...`, { model: MANDATED_MODEL, backend: "Firebase-VertexAI" });
    try {
        const model = getGenerativeModel(vertexAI, { 
            model: MANDATED_MODEL,
            systemInstruction: systemInstruction 
        });

        const response = await model.generateContent(prompt);
        const finalResponse = response.response.text();
        console.log("✅ Respuesta de la IA:", finalResponse);
        return finalResponse;
    } catch (error) {
        console.error("❌ Error en Gemini AI:", error);
        
        // Fallback para no romper la UI — indica que la IA falló
        if (prompt.toLowerCase().includes("mantra")) {
            return "La disciplina forja imperios.";
        }
        if (prompt.toLowerCase().includes("intención")) {
            return "EJECUCIÓN MÁXIMA — CERO EXCUSAS";
        }
        if (prompt.toLowerCase().includes("coach experto en relaciones") || prompt.toLowerCase().includes("conexión")) {
            return JSON.stringify({
                consejo: "La llave de tu red falló en la capa de Google. Mientras la restauras: Escucha el doble de lo que hablas hoy.",
                tema: "Aspiraciones personales y metas a corto plazo",
                pregunta: "¿Qué desafío invisible estás enfrentando en este momento y cómo puedo sumar valor?"
            });
        }
        throw error;
    }
};

/**
 * Helper para parsear respuestas JSON de la IA, limpiando posibles bloques de código.
 */
export const parseAIJSON = (text) => {
    try {
        if (!text) return {};
        // Eliminar bloques de código markdown si existen
        const cleaned = text.replace(/```json|```/g, "").trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("Error parseando JSON de IA:", e, "Texto original:", text);
        return {};
    }
};

/**
 * Genera palabras de inglés para el módulo de Business English
 */
export const generateEnglishWords = async (count = 5) => {
    const prompt = `Genera una lista de ${count} palabras o expresiones de Business English nivel C1.
    Devuelve estrictamente un JSON array con objetos que tengan: word, phonetic, audio, translation, definition, example.`;
    
    try {
        const response = await callGeminiAI(prompt, "Eres un profesor de inglés de negocios experto.");
        const data = parseAIJSON(response);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Error generando palabras de inglés:", error);
        return [];
    }
};
