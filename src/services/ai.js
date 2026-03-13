export const callGeminiAI = async (prompt, systemInstruction = "Eres un asistente experto en productividad y relaciones.", modelOverride = null, apiKeyOverride = null) => {
    const apiKey = apiKeyOverride || import.meta.env.VITE_GEMINI_API_KEY;
    const model = modelOverride || 'gemini-2.0-flash'; 
    
    if (!apiKey) {
        throw new Error("API Key de Gemini no configurada. Por favor, añádela en la sección de Configuración.");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
        contents: [
            {
                role: "user",
                parts: [{ text: `INSTRUCCIÓN DE SISTEMA: ${systemInstruction}\n\nSOLICITUD: ${prompt}` }]
            }
        ],
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048
        }
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.error) throw new Error(data.error.message);
        if (!data.candidates || data.candidates.length === 0) throw new Error("No se ha generado contenido. Comprueba tu cuota o la configuración del modelo.");
        
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("AI Error:", error);
        throw error;
    }
};

export const parseAIJSON = (text) => {
    const attempts = [];

    // Helper: clean common JSON issues
    const cleanJSON = (str) => str
        .replace(/\/\/.*$/gm, '')         // remove JS line comments
        .replace(/,\s*([}\]])/g, '$1')    // remove trailing commas
        .trim();

    // Attempt 1: Direct parse after stripping markdown code fences
    try {
        const stripped = text.replace(/```(?:json)?[\s\S]*?```/g, (match) => {
            return match.replace(/```(?:json)?/, '').replace(/```$/, '').trim();
        });
        return JSON.parse(cleanJSON(stripped));
    } catch (e) { attempts.push('direct: ' + e.message); }

    // Attempt 2: Extract content inside first ```...``` block
    try {
        const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlock) return JSON.parse(cleanJSON(codeBlock[1]));
    } catch (e) { attempts.push('codeblock: ' + e.message); }

    // Attempt 3: Find outermost JSON array [...] or object {...}
    try {
        // Find the first valid JSON container character
        const bracketIdx = text.indexOf('[');
        const braceIdx = text.indexOf('{');
        
        let start, endChar;
        if (bracketIdx !== -1 && (braceIdx === -1 || bracketIdx < braceIdx)) {
            start = bracketIdx;
            endChar = ']';
        } else if (braceIdx !== -1) {
            start = braceIdx;
            endChar = '}';
        } else {
            throw new Error('No JSON container found');
        }
        
        const end = text.lastIndexOf(endChar);
        if (end <= start) throw new Error('Malformed JSON boundaries');
        
        return JSON.parse(cleanJSON(text.substring(start, end + 1)));
    } catch (e) { attempts.push('extraction: ' + e.message); }

    const err = new Error(`JSON no encontrado. Intentos: ${attempts.join(' | ')}`);
    console.error('Parse Error:', err, '\nRaw (200chars):', text?.substring(0, 200));
    throw err;
};

export const generateEnglishWords = async (model = null, apiKey = null) => {
    try {
        const prompt = `Genera EXACTAMENTE 5 palabras/frases de vocabulario avanzado (nivel B2/C1/C2) de Business English. 
        Incluye una mezcla de: verbos, sustantivos, phrasal verbs e idioms.
        Formato JSON (solo el array, sin texto extra):
        [
          {
            "word": "palabra o frase en inglés",
            "phonetic": "/transcripción IPA/",
            "pronunciation": "pronunciación figurada para hispanohablantes",
            "translation": "Traducción directa al español",
            "meaning": "Definición corta en español (máx 15 palabras)",
            "example": "Ejemplo de uso en contexto de negocios (en inglés, máx 12 palabras)",
            "level": "B2|C1|C2",
            "category": "Verb|Noun|Phrasal|Idiom|Adj"
          }
        ]`;
        const system = "Eres un profesor experto en Business English y vocabulario ejecutivo. Responde ÚNICAMENTE con el array JSON válido, sin markdown ni texto adicional.";
        const response = await callGeminiAI(prompt, system, model, apiKey);
        return parseAIJSON(response);
    } catch (error) {
        console.error("AI Error generating English words (using fallback):", error);
        return [
            {
                "word": "Leverage",
                "phonetic": "/ˈlɛvərɪdʒ/",
                "pronunciation": "le-ve-rech",
                "translation": "Apalancar / Aprovechar",
                "meaning": "Usar algo al máximo para lograr una ventaja o resultado óptimo.",
                "example": "We need to leverage our existing resources to win this project.",
                "level": "C1",
                "category": "Verb"
            },
            {
                "word": "Bottleneck",
                "phonetic": "/ˈbɒtlnɛk/",
                "pronunciation": "bo-tl-nek",
                "translation": "Cuello de botella",
                "meaning": "Punto de congestión en un proceso que retrasa el flujo general.",
                "example": "The design approval process is currently the main bottleneck.",
                "level": "B2",
                "category": "Noun"
            },
            {
                "word": "Think outside the box",
                "phonetic": "/θɪŋk ˌaʊtˈsaɪd ðə bɒks/",
                "pronunciation": "zink aut-said de boks",
                "translation": "Pensar de forma creativa",
                "meaning": "Idear soluciones originales y no convencionales a problemas o situaciones.",
                "example": "To solve this crisis, the team must think outside the box.",
                "level": "B2",
                "category": "Idiom"
            },
            {
                "word": "Pivot",
                "phonetic": "/ˈpɪvət/",
                "pronunciation": "pí-vot",
                "translation": "Pivotar / Cambiar de estrategia",
                "meaning": "Cambiar la dirección estratégica del negocio para adaptarse al mercado.",
                "example": "The startup had to pivot when their initial product failed.",
                "level": "C1",
                "category": "Verb"
            },
            {
                "word": "Follow up",
                "phonetic": "/ˈfɒləʊ ʌp/",
                "pronunciation": "fo-lou ap",
                "translation": "Hacer seguimiento",
                "meaning": "Acción continua sobre un tema para asegurar que se complete o resuelva.",
                "example": "Please follow up with the client regarding the contract status.",
                "level": "B2",
                "category": "Phrasal verb"
            }
        ];
    }
};
