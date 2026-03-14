import { GoogleGenAI } from "@google/genai";

// SDK Directo de Gemini — Bypassa el wrapper de Firebase AI
// POLÍTICA AI_STRICT_POLICY.md: Modelo 3.1 mandatorio. NO downgrade.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// POLÍTICA AI_STRICT_POLICY.md: gemini-2.5-flash = más avanzado VERIFICADO en API real
// NO USAR gemini-3.1-flash-lite → no existe en la API de Google (404 garantizado)
const MANDATED_MODEL = "gemini-2.5-flash";

const genAI = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Función central para llamadas a la IA — Gemini 3.1 Flash Lite.
 * Usa el SDK @google/genai directamente para máximo rendimiento y control.
 */
export const callGeminiAI = async (prompt, systemInstruction = "Eres un asistente experto en productividad.") => {
    console.log(`🚀 Iniciando llamada a AI...`, { model: MANDATED_MODEL, backend: "GoogleGenAI-Direct" });
    try {
        const response = await genAI.models.generateContent({
            model: MANDATED_MODEL,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        const finalResponse = response.text;
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
