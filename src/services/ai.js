import { getGenerativeModel } from "firebase/ai";
import { vertexAI } from "./firebase";

// Usando Vertex AI natively through Firebase sdk (no expone api keys)
const MANDATED_MODEL = "gemini-3.1-flash-lite-preview"; 

/**
 * Función central para llamadas a la IA usando Vertex AI de Google Cloud (Firebase).
 */
export const callGeminiAI = async (prompt, systemInstruction = "Eres un asistente experto en productividad.") => {
    console.log(`🚀 Iniciando llamada a AI...`, { model: MANDATED_MODEL, backend: "VertexAI" });
    try {
        // BYPASS DEL LINTER: Obligamos al SDK a usar la versión de producción más reciente
        // @ts-ignore
        const modelOptions = { 
            model: MANDATED_MODEL,
            systemInstruction: systemInstruction 
        };
        const model = getGenerativeModel(vertexAI, modelOptions);

        const result = await model.generateContent(prompt);
        const finalResponse = result.response.text();
        console.log("✅ Respuesta de la IA con " + MANDATED_MODEL + ":", finalResponse);
        return finalResponse;
    } catch (error) {
        console.warn(`Fallo en el endpoint ${MANDATED_MODEL}. Degradando a 2.5-flash...`, error);
        
        try {
            // FALLBACK DE SEGURIDAD
            // @ts-ignore
            const fallbackModel = getGenerativeModel(vertexAI, { 
                model: "gemini-2.5-flash",
                systemInstruction: systemInstruction
            });
            const fallbackResult = await fallbackModel.generateContent(prompt);
            const fallbackFinalResponse = fallbackResult.response.text();
            console.log("✅ Respuesta de la IA (Fallback 2.5):", fallbackFinalResponse);
            return fallbackFinalResponse;
        } catch (fallbackError) {
            console.error("❌ Error crítico en Vertex AI (Fallo total):", fallbackError);
        
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
        throw fallbackError; // Changed throw error to fallbackError to surface the final error if it happens
        }
    }
};

/**
 * Helper para parsear respuestas JSON de la IA, limpiando posibles bloques de código.
 */
export const parseAIJSON = (text) => {
    try {
        if (!text) return {};
        // Eliminar bloques de código markdown si existen (ignorando mayúsculas/minúsculas para "json")
        let cleaned = text.replace(/```json|```/gi, "").trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("Error parseando JSON de IA:", e, "Texto original:", text);
        return {};
    }
};

// ─────────────────────────────────────────────────────────
// FALLBACKS estáticos por idioma (se usan si la IA falla)
// ─────────────────────────────────────────────────────────
const LANGUAGE_FALLBACKS = {
    english: [
        { word: 'Leverage', phonetic: '/ˈlev.ər.ɪdʒ/', pronunciation: 'LEV-er-age', translation: 'Apalancar', meaning: 'Usar algo en beneficio propio para maximizar un resultado.', example: 'We need to leverage our network to close this deal.', category: 'Verb', level: 'B2' },
        { word: 'Synergy', phonetic: '/ˈsɪn.ər.dʒi/', pronunciation: 'SIN-er-gy', translation: 'Sinergia', meaning: 'Beneficio mayor obtenido por la cooperación de dos o más elementos.', example: 'The merger created real synergy between both teams.', category: 'Noun', level: 'C1' },
        { word: 'Streamline', phonetic: '/ˈstriːm.laɪn/', pronunciation: 'STREAM-line', translation: 'Optimizar', meaning: 'Hacer un proceso más eficiente eliminando pasos innecesarios.', example: 'We must streamline our onboarding process.', category: 'Verb', level: 'B2' },
        { word: 'Resilience', phonetic: '/rɪˈzɪl.i.əns/', pronunciation: 'ri-ZIL-i-ens', translation: 'Resiliencia', meaning: 'Capacidad para recuperarse rápidamente de las dificultades.', example: 'Her resilience is her greatest asset.', category: 'Noun', level: 'C1' },
        { word: 'Proactive', phonetic: '/ˌprəʊˈæk.tɪv/', pronunciation: 'pro-AK-tiv', translation: 'Proactivo', meaning: 'Que toma la iniciativa y anticipa problemas futuros.', example: 'We need a proactive approach to solve this.', category: 'Adj', level: 'B2' },
        { word: 'Pivot', phonetic: '/ˈpɪv.ət/', pronunciation: 'PI-vot', translation: 'Pivotar', meaning: 'Cambiar de estrategia manteniendo la misma base.', example: 'The startup had to pivot its business model.', category: 'Verb', level: 'B2' },
        { word: 'Scalability', phonetic: '/ˌskeɪ.ləˈbɪl.ə.ti/', pronunciation: 'skei-la-BI-li-ti', translation: 'Escalabilidad', meaning: 'Capacidad de un sistema de crecer y manejar mayor demanda.', example: 'Scalability is key for our new software.', category: 'Noun', level: 'C1' }
    ],
    spanish: [
        { word: 'Acrimonia', phonetic: '/a.kɾi.ˈmo.nja/', pronunciation: 'a-cri-MO-nia', translation: 'Acrimony / Bitterness', meaning: 'Amargura o acritud en el trato o en las palabras.', example: 'La negociación terminó con acrimonia.', category: 'Noun', level: 'C1' },
        { word: 'Dilucidar', phonetic: '/di.lu.θi.ˈðaɾ/', pronunciation: 'di-lu-ci-DAR', translation: 'To elucidate', meaning: 'Poner en claro, explicar algo con detalle y precisión.', example: 'Hay que dilucidar los términos del contrato.', category: 'Verb', level: 'C1' },
        { word: 'Omnipresente', phonetic: '/om.ni.pɾe.ˈsen.te/', pronunciation: 'om-ni-pre-SEN-te', translation: 'Omnipresent', meaning: 'Que está en todos los lugares al mismo tiempo.', example: 'La tecnología es omnipresente.', category: 'Adj', level: 'B2' },
        { word: 'Paradigma', phonetic: '/pa.ɾa.ˈðig.ma/', pronunciation: 'pa-ra-DIG-ma', translation: 'Paradigm', meaning: 'Modelo de trabajo o patrón a seguir.', example: 'Estamos ante un nuevo paradigma tecnológico.', category: 'Noun', level: 'B2' },
        { word: 'Sinergia', phonetic: '/si.ˈneɾ.xja/', pronunciation: 'si-NER-xia', translation: 'Synergy', meaning: 'Acción conjunta de varios elementos con un fin.', example: 'La sinergia del equipo fue clave.', category: 'Noun', level: 'C1' },
        { word: 'Inercia', phonetic: '/i.ˈneɾ.θja/', pronunciation: 'i-NER-cia', translation: 'Inertia', meaning: 'Resistencia al cambio o incapacidad para reaccionar.', example: 'Debemos romper la inercia corporativa.', category: 'Noun', level: 'B2' }
    ],
    // ... otros idiomas ...
};

/**
 * Genera palabras/vocabulario para el módulo multi-idioma.
 * Modificado para soportar generación por lotes (Pool) y fonética nativa con SILABEO.
 * 
 * @param {string} languageId - ID del idioma (english, french, etc.)
 * @param {string} languageName - Nombre del idioma para el prompt (English, Français, etc.)
 * @param {string} level - Nivel CEFR (A1, A2, B1, B2, C1, C2)
 * @param {number} count - Número de palabras a generar (ej. 30 para el pool, 6 por defecto)
 * @param {string} userNativeLanguage - Idioma de la interfaz del usuario para adaptar la fonética y traducción (ej. "Spanish", "French")
 */
export const generateLanguageWords = async (languageId = 'english', languageName = 'English', level = 'B2', count = 30, userNativeLanguage = 'Spanish') => {
const prompt = `Generate a list of ${count} vocabulary words or expressions from the ${languageName} language, appropriate for CEFR level ${level}.
The user's native language is ${userNativeLanguage}. All "translation" and "meaning" fields MUST be written in ${userNativeLanguage}.

CRITICAL REQUIREMENTS (NO EXCEPTIONS):
1. NO DUPLICATE TRANSLATIONS: Every single 'translation' must be 100% unique within this generated batch. Do not generate two different words that translate to the same word.
2. NO DUPLICATE WORDS: Every single 'word' must be completely different. Avoid highly similar synonyms in the same batch.
3. Generate the 'phonetic' field using IPA transcription.
4. Generate the 'pronunciation' field as a simplified guide adapted for a native ${userNativeLanguage} speaker.
5. IMPORTANT: The 'pronunciation' field MUST be SEPARATED BY SYLLABLES (e.g., for 'Scalability' returning 'skei-la-BI-li-ti').
6. The stressed syllable should be in UPPERCASE.
7. Even if ${languageName} is the same as ${userNativeLanguage}, you MUST still provide the syllabic separation in the 'pronunciation' field.

Return STRICTLY a valid JSON array (no markdown, no extra text) with objects containing exactly these fields:
- word: the unique word/expression in ${languageName}
- phonetic: IPA phonetic transcription
- pronunciation: syllabic pronunciation guide in capital letters for the stress, adapted for ${userNativeLanguage} rules
- translation: unique ${userNativeLanguage} translation
- meaning: brief definition in ${userNativeLanguage} (max 15 words)
- example: example sentence in ${languageName}
- category: one of [Verb, Noun, Adj, Phrasal, Idiom, Adv]
- level: CEFR level (${level})

Example of valid output:
[{"word":"Leverage","phonetics":"/ˈlev.ər.ɪdʒ/","pronunciation":"LE-ver-idsh","translation":"Apalancar","meaning":"Uso de algo para obtener ventaja.","example":"Leverage your assets.","category":"Verb","level":"${level}"}]`;

    try {
        const response = await callGeminiAI(prompt, `You are an expert ${languageName} language teacher. You always return valid JSON arrays with no extra text.`);
        const data = parseAIJSON(response);
        if (Array.isArray(data) && data.length > 0) {
            return data;
        }
        throw new Error('Empty or invalid array from AI');
    } catch (error) {
        console.error(`Error generating ${languageName} vocabulary batch:`, error);
        const fallback = LANGUAGE_FALLBACKS[languageId] || LANGUAGE_FALLBACKS.english;
        let extendedFallback = [];
        while (extendedFallback.length < Math.min(count, 6)) { 
            extendedFallback = extendedFallback.concat(fallback);
        }
        return extendedFallback.slice(0, count);
    }
};

/**
 * @deprecated — Usar generateLanguageWords en su lugar.
 * Mantenido por compatibilidad temporal.
 */
export const generateEnglishWords = async (count = 6) => {
    return generateLanguageWords('english', 'English', 'C1', count, 'Spanish');
};
