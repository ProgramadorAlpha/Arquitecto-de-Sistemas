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

// ─────────────────────────────────────────────────────────
// FALLBACKS estáticos por idioma (se usan si la IA falla)
// ─────────────────────────────────────────────────────────
const LANGUAGE_FALLBACKS = {
    english: [
        { word: 'Leverage', phonetic: '/ˈlev.ər.ɪdʒ/', pronunciation: 'LEV-er-ij', translation: 'Apalancar', meaning: 'Usar algo en beneficio propio para maximizar un resultado.', example: 'We need to leverage our network to close this deal.', category: 'Verb', level: 'B2' },
        { word: 'Synergy', phonetic: '/ˈsɪn.ər.dʒi/', pronunciation: 'SIN-er-jee', translation: 'Sinergia', meaning: 'Beneficio mayor obtenido por la cooperación de dos o más elementos.', example: 'The merger created real synergy between both teams.', category: 'Noun', level: 'C1' },
        { word: 'Streamline', phonetic: '/ˈstriːm.laɪn/', pronunciation: 'STREAM-line', translation: 'Optimizar', meaning: 'Hacer un proceso más eficiente eliminando pasos innecesarios.', example: 'We must streamline our onboarding process.', category: 'Verb', level: 'B2' },
    ],
    spanish: [
        { word: 'Acrimonia', phonetic: '/a.kɾi.ˈmo.nja/', pronunciation: 'a-kri-MO-nia', translation: 'Acrimony / Bitterness', meaning: 'Amargura o acritud en el trato o en las palabras.', example: 'La negociación terminó con acrimonia entre las partes.', category: 'Noun', level: 'C1' },
        { word: 'Dilucidar', phonetic: '/di.lu.θi.ˈðaɾ/', pronunciation: 'di-lu-ci-DAR', translation: 'To elucidate', meaning: 'Poner en claro, explicar algo con detalle y precisión.', example: 'Hay que dilucidar los términos del contrato antes de firmar.', category: 'Verb', level: 'C1' },
        { word: 'Omnipresente', phonetic: '/om.ni.pɾe.ˈsen.te/', pronunciation: 'om-ni-pre-SEN-te', translation: 'Omnipresent', meaning: 'Que está o parece estar en todos los lugares al mismo tiempo.', example: 'La tecnología es omnipresente en el mundo moderno.', category: 'Adj', level: 'B2' },
    ],
    portuguese: [
        { word: 'Empreender', phonetic: '/ẽ.pɾe.ˈẽn.deɾ/', pronunciation: 'em-pre-EN-der', translation: 'Emprender', meaning: 'Iniciar e executar um projeto ou negócio com determinação.', example: 'É preciso empreender com criatividade neste mercado.', category: 'Verb', level: 'B1' },
        { word: 'Rentabilidade', phonetic: '/ʁẽ.ta.bi.li.ˈda.dʒi/', pronunciation: 'ren-ta-bi-li-DA-ji', translation: 'Rentabilidad', meaning: 'Capacidade de gerar lucro em relação ao investimento realizado.', example: 'A rentabilidade do projeto superou nossas expectativas.', category: 'Noun', level: 'B2' },
        { word: 'Perspicaz', phonetic: '/peɾs.pi.ˈkas/', pronunciation: 'pers-pi-KAS', translation: 'Perspicaz', meaning: 'Que tem capacidade de perceber e compreender as coisas com agudeza.', example: 'O analista fez uma observação perspicaz sobre os dados.', category: 'Adj', level: 'C1' },
    ],
    french: [
        { word: 'Élaborer', phonetic: '/e.la.bɔ.ʁe/', pronunciation: 'é-la-bo-RÉ', translation: 'Elaborar', meaning: 'Développer quelque chose avec soin et en détail.', example: 'Il faut élaborer une stratégie claire pour ce trimestre.', category: 'Verb', level: 'B1' },
        { word: 'Pertinence', phonetic: '/pɛʁ.ti.nɑ̃s/', pronunciation: 'per-ti-NANCE', translation: 'Pertinencia', meaning: 'Caractère de ce qui est adapté et approprié à la situation.', example: 'La pertinence de votre analyse est indéniable.', category: 'Noun', level: 'B2' },
        { word: 'Ingénieux', phonetic: '/ɛ̃.ʒe.njø/', pronunciation: 'an-jé-NYEU', translation: 'Ingenioso', meaning: 'Qui fait preuve d\'inventivité et d\'intelligence pratique.', example: 'Cette solution ingénieuse a résolu le problème.', category: 'Adj', level: 'B2' },
    ],
    italian: [
        { word: 'Intraprendente', phonetic: '/in.tra.pren.ˈdɛn.te/', pronunciation: 'in-tra-pren-DEN-te', translation: 'Emprendedor', meaning: 'Chi ha spirito d\'iniziativa e sa affrontare nuove sfide.', example: 'Un manager intraprendente trova sempre nuove opportunità.', category: 'Adj', level: 'B2' },
        { word: 'Consolidare', phonetic: '/kon.so.li.ˈda.re/', pronunciation: 'con-so-li-DA-re', translation: 'Consolidar', meaning: 'Rendere più solido e stabile qualcosa.', example: 'Dobbiamo consolidare la nostra posizione nel mercato.', category: 'Verb', level: 'B1' },
        { word: 'Lungimirante', phonetic: '/lun.dʒi.mi.ˈran.te/', pronunciation: 'lun-ji-mi-RAN-te', translation: 'Visionario', meaning: 'Che sa prevedere e pianificare con grande visione futura.', example: 'La scelta lungimirante del CEO ha salvato l\'azienda.', category: 'Adj', level: 'C1' },
    ],
    german: [
        { word: 'Nachhaltigkeit', phonetic: '/ˈnaːxˌhal.tɪç.kaɪt/', pronunciation: 'NACH-hal-tig-kait', translation: 'Sostenibilidad', meaning: 'Fähigkeit, langfristig zu bestehen ohne Ressourcen zu erschöpfen.', example: 'Nachhaltigkeit ist ein zentrales Thema in unserem Unternehmen.', category: 'Noun', level: 'B2' },
        { word: 'Erschließen', phonetic: '/ɛɐ̯.ˈʃliː.sn̩/', pronunciation: 'er-SCHLIES-en', translation: 'Desarrollar / Abrir', meaning: 'Einen neuen Markt oder eine Ressource zugänglich machen.', example: 'Wir wollen neue Märkte in Asien erschließen.', category: 'Verb', level: 'C1' },
        { word: 'Leistungsfähig', phonetic: '/ˈlaɪ̯.stʊŋsˌfɛː.ɪç/', pronunciation: 'LEIS-tungs-fä-ig', translation: 'Eficaz / Capaz', meaning: 'In der Lage, gute Leistungen zu erbringen.', example: 'Unser Team ist sehr leistungsfähig unter Druck.', category: 'Adj', level: 'B2' },
    ],
};

/**
 * Genera palabras/vocabulario para el módulo multi-idioma.
 * @param {string} languageId - ID del idioma (english, french, etc.)
 * @param {string} languageName - Nombre del idioma para el prompt (English, Français, etc.)
 * @param {string} level - Nivel CEFR (A1, A2, B1, B2, C1, C2)
 * @param {number} count - Número de palabras a generar
 */
export const generateLanguageWords = async (languageId = 'english', languageName = 'English', level = 'B2', count = 5) => {
    const prompt = `Generate a list of ${count} vocabulary words or expressions from the ${languageName} language, appropriate for CEFR level ${level}.
The user's native language is Spanish. All "translation" and "meaning" fields must be written in Spanish.
Return STRICTLY a valid JSON array (no markdown, no extra text) with objects containing exactly these fields:
- word: the word/expression in ${languageName}
- phonetic: IPA phonetic transcription
- pronunciation: simple pronunciation guide in capital letters
- translation: Spanish translation
- meaning: brief definition in Spanish (max 15 words)
- example: example sentence in ${languageName}
- category: one of [Verb, Noun, Adj, Phrasal, Idiom, Adv]
- level: CEFR level (${level})

Example of valid output:
[{"word":"Example","phonetic":"/ɪɡˈzæm.pl/","pronunciation":"ig-ZAM-pul","translation":"Ejemplo","meaning":"Algo que ilustra una regla o modelo.","example":"This is a clear example.","category":"Noun","level":"${level}"}]`;

    try {
        const response = await callGeminiAI(prompt, `You are an expert ${languageName} language teacher. You always return valid JSON arrays with no extra text.`);
        const data = parseAIJSON(response);
        if (Array.isArray(data) && data.length > 0) {
            return data;
        }
        throw new Error('Empty or invalid array from AI');
    } catch (error) {
        console.error(`Error generating ${languageName} words:`, error);
        // Devolver fallbacks del idioma correspondiente
        const fallback = LANGUAGE_FALLBACKS[languageId] || LANGUAGE_FALLBACKS.english;
        return fallback.slice(0, count);
    }
};

/**
 * @deprecated — Usar generateLanguageWords en su lugar.
 * Mantenido por compatibilidad temporal.
 */
export const generateEnglishWords = async (count = 5) => {
    return generateLanguageWords('english', 'English', 'C1', count);
};
