## [1.2.2] - 2026-04-16

### Features
- **Audio Journal time limit indicator**: Barra de progreso visual durante la grabación de voz. Muestra tiempo grabado / límite máximo (60s), countdown regresivo, y cambio de color progresivo (fucsia → ámbar → rojo) al acercarse al límite. Auto-stop al alcanzar los 60 segundos.
- **Premium scrollbar always visible**: `.premium-scrollbar` ahora fuerza `overflow-y: scroll` para que la barra esté siempre visible. Track con borde sutil y thumb con gradiente ámbar con mínimo 40px de altura.

### Bug Fixes
- **ai.js multimodal format**: `callGeminiAI` ahora formatea correctamente `contents` como `[{role:'user', parts:[...]}]` para arrays multimodales. Strings se envuelven en `{text: ...}`, objetos `inlineData` se pasan directo. Compatible con `@google/genai` SDK v3.
- **ai.js `responseMimeType` support**: Nuevo parámetro `options` en `callGeminiAI(prompt, system, options)` para forzar JSON con `{ responseMimeType: "application/json" }`.
- **AppContext `callAI` threading**: `callAI` ahora acepta y propaga el 3er parámetro `options` a `callGeminiAI`, permitiendo que componentes especifiquen `responseMimeType`.
- **MantraBanner personalized prompts**: `p.prompt()` ahora recibe `(today, nickname, lifeMission)` en vez de solo `(today)` para generar mantras personalizados con nombre del usuario.
- **LyaHubDashboard JSON mode**: `analyzeVoiceJournal` y `analyzeWorkspace` pasan `{ responseMimeType: "application/json" }` al llamar a la IA para forzar respuesta JSON estructurada.
- **ManifestoModal scrollbar contrast**: Aumentado contraste del track (0.05 → 0.08 opacity) y añadido borde sutil para mejor visibilidad en monitores con bajo contraste.

### Design Rationale
- El límite de 60s se alinea con el máximo práctico de audio que Gemini puede procesar en una sola llamada. El auto-stop previene envíos que fallarían por timeout.
- `responseMimeType: "application/json"` elimina la necesidad de regex para limpiar bloques de código markdown en las respuestas JSON de la IA.
- Los prompts personalizados con `nickname` y `lifeMission` producen mantras más relevantes y motivadores al incluir el nombre del usuario directamente.

## [1.2.1] - 2026-04-15

### Bug Fixes
- **ManifestoModal scroll**: Añadido `flex-1` al div interno scrollable para que `overflow-y-auto` funcione correctamente dentro del contenedor flex con `max-h-[85vh]`.
- **MantraBanner fallback on AI failure**: El catch block de `generateAI` ahora asigna un fallback aleatorio desde `p.fallbacks` en vez de dejar el mantra en blanco.
- **ai.js multimodal crash**: `prompt.toLowerCase()` ya no crashea cuando el prompt es un array multimodal. Se añadió `extractPromptText()` para extraer texto de arrays de forma segura.
- **ai.js static mantra override eliminado**: El bloque `if (prompt.toLowerCase().includes("mantra"))` se eliminó — MantraBanner gestiona sus propios fallbacks por personalidad.
- **ai.js fallback model corregido**: `FALLBACK_MODEL` cambiado de `"gemini-3-flash"` a `"gemini-3.0-flash"`.
- **ai.js native audit/voice fallbacks**: Añadidos fallbacks nativos en el catch para prompts de "auditor implacable" y "desahogo emocional" — la UI ya no se rompe si ambos modelos fallan.
- **ai.js JSON responseMimeType**: `callGeminiAI` ahora acepta `{ responseMimeType: "application/json" }` en el 3er parámetro para forzar salida JSON.
- **LyaHubDashboard JSON parsing**: Añadida validación `typeof response === 'string'` antes de `.replace()` en `analyzeVoiceJournal` y `analyzeWorkspace` — previene crash cuando la IA devuelve un objeto en vez de string.

### Design Rationale
- `extractPromptText()` filtra solo las partes de texto de arrays multimodales, ignorando objetos `inlineData` que no tienen `.toLowerCase()`.
- Los fallbacks de audit y voice devuelven JSON estructurado coherente con el schema esperado por cada componente, evitando crashes downstream.
- `responseMimeType` se propaga tanto al modelo primario como al fallback, garantizando formato JSON cuando el caller lo solicita.

## [1.2.0] - 2026-04-15

### Features
- **Code-Splitting LyaHubDashboard**: Lya AI Hub se carga via `React.lazy()` + `Suspense` en un chunk separado (25.5 kB gzip: 7.9 kB). Mejora FCP al no incluir camera, confetti, ni genai en el bundle principal.
- **Audio Journaling Engine**: Pestaña Voice ahora es funcional. Grabación via MediaRecorder (WebRTC audio) → conversión a base64 → análisis multimodal con Gemini (transcripción, nivel de estrés, emociones, plan de acción). UI con indicador de estrés visual, badges de emociones, y plan de acción numerado.
- **Bottom Tab Bar (Mobile-First)**: Navegación nativa para móvil con `BottomTabBar` component. 4 tabs primarios (Dashboard, Idiomas, Semanal, Sistemas) + botón "Más" que abre el sidebar para tabs secundarios. Hardware blur, safe-area support, touch targets 48px min.
- **Count-Up Animations**: Hook `useCountUp` con easing cubic ease-out. Aplicado al CircularProgress (porcentaje anima desde 0) y al StreakCounter (racha cuenta hacia arriba).
- **Dopaminergic Micro-Confetti**: Cada habito completado dispara mini-confetti (30 partículas). Completar todos los matutinos/nocturnos dispara mega-confetti (200-250 partículas, 5+ colores).
- **Skeleton Loading Premium**: Estado de carga del DashboardTab ahora usa skeleton placeholders con staggered animation delays en vez del spinner genérico.

### Design Rationale
- Bottom Tab Bar en móvil elimina la fricción del hamburger menu. Solo 4+1 items en el bar sigue el patrón de apps nativas exitosas (iOS Tab Bar, Material Bottom Navigation).
- Audio Journal usa `audio/webm;codecs=opus` para máxima compatibilidad con navegadores modernos y menor tamaño de archivo.
- `useCountUp` usa `requestAnimationFrame` en vez de `setInterval` para animaciones fluidas a 60fps sin jank.
- Micro-confetti por habito individual refuerza positivamente cada micro-logro, no solo la meta final.

### Notes & Caveats
- **Audio Journaling requiere permiso de micrófono** — el navegador pedirá permiso al primer uso.
- **BottomTabBar solo visible en viewport < 768px** — en desktop se mantiene el sidebar.
- **useCountUp** no afecta el valor real de los datos, solo la representación visual. Los datos en Firestore se actualizan instantáneamente.

## [1.1.0] - 2026-04-14

### Features
- **Mantra Rotativo Diario**: Los arquetipos de personalidad ahora rotan automáticamente cada día (dom=sabio, lun=visionario, etc.). Si el usuario elige manualmente, se respeta esa elección hasta el día siguiente.
- **Brain Dump → Chat IA**: El FAB de Vaciado Mental ahora tiene dos modos: "Nota Rápida" (comportamiento original) y "Chat IA" (conversación contextual con Vertex AI que conoce el estado del Dashboard).
- **Panel de Notificaciones Dinámico**: El panel de la campana ahora lee alertas proactivas desde Firestore (`users/{uid}/alerts`). Soporta tipos: reminder, alert, success, info. Permite marcar como leído individualmente o en lote.
- **Cloud Functions Proactivas**: Tres funciones programadas — chequeo matutino (7h), chequeo nocturno (21h), y limpieza de alertas viejas (3h). Incluye envío de correo por inactividad via Resend.

### Bug Fixes
- **Saludo con nombres largos**: Reemplazado `truncate` rígido por `text-ellipsis overflow-hidden` con `max-w-[260px]` en móvil. Nombres largos ya no rompen el layout.
- **Energy Journal 7 días**: Corregidos 3 bugs: (1) Query sin orderBy/limit, (2) Etiquetas de día hardcodeadas sin corresponder a fechas reales, (3) Sin manejo de días vacíos. Ahora genera un array de 7 fechas reales y mapea datos por fecha.
- **Caché de Mantra**: Invalidación forzada al cambiar de día. Antes el caché solo verificaba si existía, no si era del día actual.

### Design Rationale
- Chat IA usa `callGeminiAI` directo desde frontend (consistente con Mantra/Idiomas), no Cloud Functions. Rate limiting futuro se puede agregar con un contador en Firestore.
- Alertas en subcolección `users/{uid}/alerts` en vez de colección global — simplifica las reglas de seguridad y la consulta por usuario.
- Rotación de personalidad usa `getDay() % length` — determinístico, predecible, no requiere estado.

### Notes & Caveats
- **Cloud Functions requieren Firebase Blaze plan** (pay-as-you-go). El plan Free (Spark) no soporta funciones programadas. Hacer `firebase deploy --only functions` solo después de actualizar.
- **Resend API Key fue expuesta** en conversación. Rotar inmediatamente en dashboard.resend.com.
- El índice compuesto para `alerts` se creará automáticamente en el primer deploy de Firestore indexes.
- La función `cleanupOldAlerts` elimina alertas leídas de más de 7 días — las no leídas se conservan indefinidamente.