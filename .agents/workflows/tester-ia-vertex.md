---
description: Flujo de validación QA integral para probar las interacciones de IA Vertex (Gemini 3.1+)
---

Este flujo de pruebas tiene como objetivo validar exhaustivamente cada botón y componente de la interfaz de la aplicación que realiza llamadas al motor de IA central (`services/ai.js`) a través de la infraestructura Vertex AI.

### Pre-requisitos
Asegúrate de que el servidor de desarrollo esté corriendo localmente antes de iniciar el flujo.

// turbo
1. **Ejecutar servidor de desarrollo si no está corriendo**
```bash
npm run dev
```

### Ejecutar Subagente de Navegador para Validación (E2E)

2. **Revisar Pestaña "NetworkTab" (Tribu & Apoyo)**
   - Navega a `http://localhost:5173/`.
   - Haz clic en la navegación hacia "Tribu & Apoyo" (NetworkTab).
   - Localiza la herramienta de "Coach / Mentor de Relaciones" y haz clic en el botón para generar un consejo o interacción.
   - **Criterio de éxito:** La IA responde con un `consejo`, un `tema`, y una `pregunta` válida en la interfaz sin romperse ni tirar fallos de fallback.

3. **Revisar Pestaña "SystemsTab" (Mis Sistemas)**
   - Desplázate a la pestaña "Mis Sistemas" en la interfaz.
   - Interactúa con el generador/optimizador de sistemas basado en IA.
   - **Criterio de éxito:** La IA genera una respuesta coherente, estructurada y sin logs de error en rojo en la consola.

4. **Revisar Pestaña "WeeklyTab" (Plan Semanal)**
   - Navega a "Plan Semanal".
   - Pulsa los botones que invierten llamadas a la IA (como "Warrior Mantra" o Generador de Intenciones/Roles semanales si los hay vinculados).
   - **Criterio de éxito:** Resumen o Mantra autogenerado adaptado usando la API Vertex, sin devolver la respuesta rápida de "fallback" local estática.

5. **Revisar Widget de Idioma (LanguageWidget)**
   - Ve a la sección que muestra el estado de tus idiomas.
   - Haz clic en el botón de "Refrescar vocabulario" o "Generar nuevas palabras".
   - **Criterio de éxito:** La UI renderiza nuevas tarjetas con traducción en español, división de sílabas precisas (ej. `skei-la-BI-li-ti`) e IPA real. 

6. **Inspección Final de Consola**
   - Extraer la última salida de la consola del navegador.
   - Validar que aparezca `🚀 Iniciando llamada a AI... { model: 'gemini-3.1-pro', backend: 'VertexAI' }`.
   - **Fallo:** Si aparece algún `❌ Error en Gemini AI` indicando problemas de modelo no encontrado, tokens, o fallos de CORS, la prueba se marca como fallida en su totalidad.

*Si eres la IA asistente ejecutando este flujo, utiliza tu herramienta `browser_subagent` asignando la URL local y dándole las instrucciones descritas en cada paso para recolectar el comprobante visual y logs correspondientes.*
