export const callGeminiAI = async (prompt, systemInstruction = "Eres un asistente experto en productividad y relaciones.", modelOverride = null) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const model = modelOverride || 'gemini-2.5-flash'; // GA model with free tier — v1beta required
    
    if (!apiKey) {
        throw new Error("API Key de Gemini no configurada. Añade VITE_GEMINI_API_KEY en tu .env");
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

export const generateEnglishWords = async () => {
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
    const response = await callGeminiAI(prompt, system);
    return parseAIJSON(response);
};
