import { GoogleGenAI, Type } from "@google/genai";

// Inicializando el nuevo SDK con la API key de entorno
const client = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const MANDATED_MODEL = "gemini-3-flash-preview";
const FALLBACK_MODEL = "gemini-3-flash-preview"; // No se permiten modelos inferiores

/** Extrae texto plano de un prompt que puede ser string o array multimodal */
const extractPromptText = (prompt) => {
    if (typeof prompt === 'string') return prompt;
    if (Array.isArray(prompt)) return prompt.filter(p => typeof p === 'string').join(' ');
    return '';
};

/**
 * Función central para llamadas a la IA usando el nuevo SDK @google/genai
 * @param {string|Array} prompt - Texto o array multimodal (texto + inlineData)
 * @param {string} systemInstruction - Instrucción del sistema
 * @param {Object} options - Opciones extra: { responseMimeType?: string }
 */
export const callGeminiAI = async (prompt, systemInstruction = "Eres un asistente experto en productividad.", options = {}) => {
    console.log(`🚀 Iniciando llamada a AI...`, { model: MANDATED_MODEL, backend: "@google/genai" });
    try {
        const config = { systemInstruction };
        if (options.responseMimeType) {
            config.responseMimeType = options.responseMimeType;
        }

        // Normalizar partes multimodales respetando el formato CamelCase estricto del SDK
        const normalizedParts = (Array.isArray(prompt) ? prompt : [{ text: prompt }]).map(part => {
            // Si es una cadena simple, convertir a objeto { text }
            if (typeof part === 'string') return { text: part };
            
            // Si tiene inlineData (camelCase), asegurar que se mantenga así
            if (part.inlineData) {
                console.log(`📸 PROCESANDO MULTIMODAL: ${part.inlineData.mimeType}, Tamaño: ${Math.round(part.inlineData.data.length/1024)} KB`);
                return {
                    inlineData: {
                        data: part.inlineData.data,
                        mimeType: part.inlineData.mimeType
                    }
                };
            }

            // Si es un objeto de texto con una propiedad 'text'
            if (part.text) return { text: part.text };
            
            return part;
        });

        const formattedContents = [{ role: 'user', parts: normalizedParts }];

        const response = await client.models.generateContent({
            model: MANDATED_MODEL,
            contents: formattedContents,
            config: {
                ...config
            }
        });

        const finalResponse = response.text;
        if (!finalResponse) throw new Error("Respuesta vacía de la IA");
        
        console.log("✅ Respuesta de la IA con " + MANDATED_MODEL + ":", finalResponse.substring(0, 50) + "...");
        return finalResponse;
    } catch (error) {
        console.warn(`Fallo en el modelo principal ${MANDATED_MODEL}. Intentando recuperación...`, error);
        // Lanzamos el error para que el componente visual (como MantraBanner) use sus fallbacks locales
        throw error;
    }
};

/**
 * Función que demuestra la respuesta a funcion multimodal (Multimodal Function Calling)
 * Basado en la nueva API de @google/genai
 */
export const callGeminiMultimodalFunction = async (prompt) => {
    const getImageDeclaration = {
      name: 'get_image',
      description: 'Retrieves the image file reference for a specific order item.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          item_name: {
            type: Type.STRING,
            description: "The name or description of the item ordered (e.g., 'instrument').",
          },
        },
        required: ['item_name'],
      },
    };

    const toolConfig = {
      functionDeclarations: [getImageDeclaration],
    };

    console.log(`🚀 Llamando a IA con herramientas...`);
    const response1 = await client.models.generateContent({
      model: MANDATED_MODEL,
      contents: prompt,
      config: {
        tools: [toolConfig],
      },
    });

    if (response1.functionCalls && response1.functionCalls.length > 0) {
        const functionCall = response1.functionCalls[0];
        const requestedItem = functionCall.args?.item_name || 'instrument';
        console.log(`🤖 La IA quiere llamar a la función: ${functionCall.name} para: ${requestedItem}`);

        // Simulamos la obtención de respuesta e imagen
        const functionResponseData = {
          image_ref: { $ref: `${requestedItem}.jpg` },
        };

        // Obtenemos una imagen genérica para el ejemplo
        const imageUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";
        const response = await fetch(imageUrl);
        const imageArrayBuffer = await response.arrayBuffer();
        
        // En el navegador necesitamos usar btoa en lugar de Buffer
        const base64ImageData = btoa(
            new Uint8Array(imageArrayBuffer)
                .reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        const functionResponseMultimodalData = {
          inlineData: {
            mimeType: 'image/png',
            displayName: `${requestedItem}.jpg`,
            data: base64ImageData,
          },
        };

        const history = [
          { role: 'user', parts: [{ text: prompt }] },
          response1.candidates[0].content, // El modelo devuelve su llamada a Tool
          {
            role: 'tool',
            parts: [
              {
                functionResponse: {
                  name: functionCall.name,
                  response: functionResponseData,
                  parts: [functionResponseMultimodalData], // Multimodal return object
                },
              },
            ],
          },
        ];

        console.log(`🔄 Devolviendo resultado de función multimodal...`);
        const response2 = await client.models.generateContent({
          model: MANDATED_MODEL,
          contents: history,
          config: {
            tools: [toolConfig],
            // En versiones web, thinkingConfig podría ser opcional, pero lo conservamos si lo soporta.
          },
        });

        console.log(`✨ Respuesta final: ${response2.text}`);
        return response2.text;
    }

    return response1.text;
};

/**
 * Helper para parsear respuestas JSON de la IA, limpiando posibles bloques de código.
 */
export const parseAIJSON = (text) => {
    if (!text) return {};
    try {
        // 1. Intentar limpiar bloques de código de Markdown
        let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        // 2. Buscar el primer '{' o '[' y el último '}' o ']' por si hay texto alrededor
        const start = cleanText.search(/[\{\[]/);
        const end = Math.max(cleanText.lastIndexOf('}'), cleanText.lastIndexOf(']'));
        
        if (start !== -1 && end !== -1) {
            cleanText = cleanText.substring(start, end + 1);
        }

        return JSON.parse(cleanText);
    } catch (e) {
        console.error("❌ Error parsing AI JSON:", e, text);
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
    ]
};

/**
 * Genera palabras/vocabulario para el módulo multi-idioma.
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
 */
export const generateEnglishWords = async (count = 6) => {
    return generateLanguageWords('english', 'English', 'C1', count, 'Spanish');
};
