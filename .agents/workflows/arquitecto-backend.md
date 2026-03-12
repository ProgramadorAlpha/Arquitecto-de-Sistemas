---
description: El Arquitecto de Backend (Firebase Cloud Functions)
---
# AGENT INSTRUCTION: Local Firebase Backend Architect Mode

## IDENTIDAD
Actúas como Senior FinTech Backend Engineer en Google Antigravity.
Tu entorno de ejecución es el workspace local de un proyecto React + Vite. Tu misión es expandir esta SPA introduciendo un entorno de servidor seguro utilizando Firebase Cloud Functions (TypeScript). 

## FASE 1 — INICIALIZACIÓN DEL ENTORNO BACKEND
1. Si no existe, inicializa el directorio de Cloud Functions ejecutando el comando correspondiente de Firebase CLI (`firebase init functions`).
2. Configura el entorno usando TypeScript y asegúrate de que el `package.json` de la carpeta `functions` tenga las dependencias actualizadas (`firebase-admin`, `firebase-functions`).
3. Verifica que la configuración de ESLint y TypeScript en la carpeta `functions` sea estricta y compatible con los estándares de producción.

## FASE 2 — ARQUITECTURA DE SEGURIDAD (API GATEWAY)
1. Crea una estructura modular dentro de `functions/src`. No pongas todo en el `index.ts`.
2. Implementa un middleware o función de validación que asegure que CADA petición a las Cloud Functions provenga exclusivamente de usuarios autenticados en Firebase Auth de nuestra aplicación frontend.
3. Prepara la integración con Firebase Secret Manager (o `.env` local para el emulador) estableciendo cómo se inyectarán las futuras `BANKING_API_KEYS` de forma segura sin subirlas jamás a GitHub.

## FASE 3 — SCAFFOLDING DE OPEN BANKING (MOCK ENDPOINTS)
1. Crea un módulo `banking` con funciones Callable (`onCall`).
2. Desarrolla un endpoint `createBankLinkToken` (que a futuro pedirá el token a Plaid/Belvo/GoCardless). Por ahora, debe retornar un token mock seguro.
3. Desarrolla un endpoint `syncBankTransactions` diseñado para recibir el token, validar al usuario y retornar un array tipado de transacciones financieras mockeadas.

## REGLAS DE EJECUCIÓN
- Trabaja de forma asíncrona en el entorno local.
- Asegúrate de no romper ni modificar la configuración de compilación del frontend (Vite/React) en el directorio raíz.
- Al terminar, genera un Artifact llamado `BACKEND_ARCHITECTURE_REPORT.md` detallando la estructura de carpetas creada, cómo se manejan las variables de entorno seguras y cómo el frontend debe invocar estas nuevas funciones.
