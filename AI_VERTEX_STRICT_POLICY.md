# 🛡️ POLÍTICA ESTRICTA E IRREVOCABLE DE INTEGRACIÓN IA (VERTEX AI)

**ATENCIÓN A CUALQUIER AGENTE, DESARROLLADOR O IA:**
Este archivo contiene las **cláusulas determinantes e irrevocables** sobre cómo esta aplicación se conecta y utiliza los modelos de Inteligencia Artificial.

Cualquier futura modificación de código relacionada con la Inteligencia Artificial en este proyecto **DEBE acatar** las siguientes reglas de manera incondicional:

---

## ⛔ REGLA 1: CERO REFERENCIAS A API KEYS MANUALES
- **ESTRICTAMENTE PROHIBIDO:** Solicitar, exponer, utilizar o referenciar claves API (`API Keys`, `Gemini Studio API Key`, `VITE_GEMINI_API_KEY`, etc.) que deban ser generadas por el usuario.
- **MOTIVACIÓN:** La aplicación ya ha sido migrada a **Vertex AI en Google Cloud utilizando el SDK de Firebase**. La capa de autenticación y conexión con la IA está automatizada y manejada internamente. El usuario **jamás** deberá interactuar con o proporcionar una API Key.
- Toda la UI (como en la ruta de configuración) que hiciera alusión a introducir un API Key fue **eliminada** y no debe ser restaurada bajo ninguna circunstancia.

## 🚀 REGLA 2: USO EXCLUSIVO Y NATIVO DE VERTEX AI FOR FIREBASE
- Todas las llamadas a modelos de lenguaje (LLM, AI) deben ejecutarse **sólo** mediante el SDK oficial: `firebase/vertexai`.
- Archivos como `src/services/firebase.js` deben proveer la constante `vertexAI` inicializada mediante `getVertexAI()`.
- Archivos como `src/services/ai.js` deben interactuar con los modelos usando la función `getGenerativeModel()`.

## 🧠 REGLA 3: MODELO DE ALTO RENDIMIENTO (GEMINI 3.1 FLASH) Y ANTI-DOWNGRADE
- **ESTRICTAMENTE PROHIBIDO** usar modelos obsoletos, hacer downgrade o sugerir un "fallback".
  - ❌ Nada de versiones `1.5`, `2.0`, `2.5` ni `3.0`.
  - ❌ ESTÁ TERMINANTEMENTE PROHIBIDO retroceder a `gemini-1.5-flash` o `gemini-2.5-flash` aunque el linter o validador local indique un modelo no encontrado o con error de tipado.
- **REQUISITO OBLIGATORIO:** Iniciar operaciones siempre desde **Gemini 3.1 Flash** (`gemini-3.1-flash`). Para proteger este requisito de linters estrictos, se debe usar la directiva `// @ts-ignore` en la definición del modelo.
- Se dará máxima prioridad funcional a la IA; ella es el **motor núcleo** de esta plataforma.

---

### *DECLARACIÓN DE COMPLIANCE*
Cualquier intento de re-inyección de campos "API Key", uso del paquete `@google/genai` standalone o de rebajar la versión del modelo a `< 3.1` mediante PR o ajuste de código **será considerado un falso positivo regresivo y debe ser evitado por completo.**
