# MÁXIMA IMPERATIVA DE INTELIGENCIA ARTIFICIAL
**ESTADO: ACTIVO Y BLOQUEANTE PARA TODOS LOS AGENTES**
**Proyecto:** Arquitecto de Sistemas 2026
**Última actualización:** 2026-03-14 — Verificado contra la API de Google

---

## 🔴 DIRECTIVAS INAMOVIBLES

### 1. Prohibición Total de Downgrade de Modelo
Bajo **NINGUNA** circunstancia se usará un modelo inferior al estándar autorizado definido a continuación.

### 2. Modelos Autorizados — Verificados contra la API Real de Google

> **NOTA CRÍTICA:** Los identifiers de modelos deben verificarse contra la API real.
> El modelo `gemini-3.1-flash-lite` NO EXISTE en la API de Google.
> Fue rechazado con 404. Este nombre es incorrecto.

| Prioridad | Modelo | Estado |
|---|---|---|
| ✅ PRIMARIO | `gemini-2.5-flash` | **CONFIRMADO en API** — Más avanzado disponible |
| ✅ SECUNDARIO | `gemini-2.5-pro` | **CONFIRMADO en API** — Máximo razonamiento |
| ✅ ALTERNATIVO | `gemini-2.0-flash-lite` | **CONFIRMADO en API** — Ultra rápido |
| ❌ PROHIBIDO | `gemini-1.5-flash` | Retirado desde septiembre 2025 |
| ❌ PROHIBIDO | `gemini-3.1-flash-lite` | **NO EXISTE** en la API — 404 garantizado |

### 3. Protocolo de Resolución de Errores
Si un modelo falla con 400, 403, 404:

> **El agente DEBE verificar primero que el modelo existe en la API** antes de asumir que es un problema de código.
> Usar: `ai.models.list()` para obtener la lista real disponible.

**Causas raíz a investigar (en orden):**
1. ¿El nombre del modelo es correcto y existe en la API? (`ai.models.list()`)
2. ¿El backend de IA es el correcto? (`GoogleAIBackend` con API Key del `.env`)
3. ¿La API Key en `.env` (`VITE_GEMINI_API_KEY`) es válida?
4. ¿El módulo SDK importado es correcto? (`firebase/ai` en Firebase 12+)

---

## ⚡ ARQUITECTURA TÉCNICA MANDATORIA

### Stack de IA Correcto (Verificado 2026-03-14)
```javascript
// ARCHIVO: src/services/ai.js
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// MODELO MANDATORIO — Verificado en API
const MANDATED_MODEL = "gemini-2.5-flash";

export const callGeminiAI = async (prompt, systemInstruction) => {
  const response = await genAI.models.generateContent({
    model: MANDATED_MODEL,
    contents: prompt,
    config: { systemInstruction }
  });
  return response.text;
};
```

### Modelos Verificados en API de Google con Key del Proyecto
```
models/gemini-2.5-flash         ← USAR ESTE
models/gemini-2.5-pro
models/gemini-2.0-flash
models/gemini-2.0-flash-001
models/gemini-2.0-flash-lite-001
models/gemini-2.0-flash-lite
```

---

*Esta política fue establecida el 2026-03-14 por el CEO del proyecto.*
*Es inamovible hasta que el CEO emita una nueva directiva con fecha posterior.*
