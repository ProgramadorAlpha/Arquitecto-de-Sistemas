const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { logger } = require('firebase-functions');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const resendApiKey = defineSecret('RESEND_API_KEY');

initializeApp();
const db = getFirestore();
const auth = getAuth();

// ─────────────────────────────────────────────────────────
// 1. MORNING CHECK — runs at 7:00 AM Europe/Madrid daily
// ─────────────────────────────────────────────────────────
exports.morningProactiveCheck = onSchedule(
  {
    schedule: '0 7 * * *',
    timeZone: 'Europe/Madrid',
    region: 'europe-west1',
    secrets: [resendApiKey],
  },
  async (event) => {
    logger.info('Morning proactive check started');
    const today = new Date().toISOString().split('T')[0];

    try {
      // Get all users
      const usersSnap = await db.collection('users').get();

      for (const userDoc of usersSnap.docs) {
        const uid = userDoc.id;
        const userData = userDoc.data();
        const alerts = [];

        // Check: Did user set weekly focus?
        const weekId = getWeekId();
        const weeklyDoc = await db.doc(`users/${uid}/weekly/${weekId}`).get();
        const weeklyData = weeklyDoc.data();
        if (!weeklyData?.priority_1) {
          alerts.push({
            type: 'alert',
            title: 'Foco Semanal Pendiente',
            message: 'No has definido tu foco semanal. Define tu prioridad #1 para esta semana.',
            createdAt: new Date(),
            read: false,
          });
        }

        // Check: Did user complete morning habits today?
        const habitsDoc = await db.doc(`users/${uid}/habits/${today}`).get();
        const habitsData = habitsDoc.data();
        if (!habitsData || Object.values(habitsData).filter(Boolean).length === 0) {
          alerts.push({
            type: 'reminder',
            title: 'Protocolo Matutino Pendiente',
            message: 'Aún no has completado ningún hábito matutino. Tu protocolo 3-6-9 te espera.',
            createdAt: new Date(),
            read: false,
          });
        }

        // Write alerts to Firestore
        for (const alert of alerts) {
          await db.collection(`users/${uid}/alerts`).add(alert);
        }

        // Email notification if user has been inactive for 3+ days
        if (userData.lastActiveDate) {
          const lastActive = new Date(userData.lastActiveDate);
          const daysSince = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
          if (daysSince >= 3 && userData.email) {
            try {
              const { Resend } = await import('resend');
              const resend = new Resend(resendApiKey.value());
              await resend.emails.send({
                from: 'Arquitecto <noreply@arquitecto-sistemas.com>',
                to: userData.email,
                subject: 'Tu arquitectura te necesita 🏗️',
                html: `<p>Hace ${daysSince} días que no entras. Tus sistemas necesitan mantenimiento.</p>
                       <p><a href="https://arquitecto-sistemas-2026.web.app">Volver al Dashboard</a></p>`,
              });
              logger.info(`Inactivity email sent to ${uid}`);
            } catch (emailErr) {
              logger.warn('Failed to send inactivity email:', emailErr);
            }
          }
        }
      }
    } catch (err) {
      logger.error('Morning check failed:', err);
    }
  }
);

// ─────────────────────────────────────────────────────────
// 2. EVENING CHECK — runs at 21:00 Europe/Madrid daily
// ─────────────────────────────────────────────────────────
exports.eveningProactiveCheck = onSchedule(
  {
    schedule: '0 21 * * *',
    timeZone: 'Europe/Madrid',
    region: 'europe-west1',
  },
  async (event) => {
    logger.info('Evening proactive check started');
    const today = new Date().toISOString().split('T')[0];

    try {
      const usersSnap = await db.collection('users').get();

      for (const userDoc of usersSnap.docs) {
        const uid = userDoc.id;
        const alerts = [];

        // Check: Night habits
        const nightDoc = await db.doc(`users/${uid}/night_habits/${today}`).get();
        const nightData = nightDoc.data();
        if (!nightData || Object.values(nightData).filter(v => v === 1 || v === true).length === 0) {
          alerts.push({
            type: 'reminder',
            title: 'Cierre Nocturno Pendiente',
            message: 'El día termina. Revisa tu cierre nocturno para mantener tu racha.',
            createdAt: new Date(),
            read: false,
          });
        }

        // Check: Energy log
        const energyDoc = await db.doc(`users/${uid}/energy_log/${today}`).get();
        if (!energyDoc.exists) {
          alerts.push({
            type: 'info',
            title: 'Journal de Energía Vacío',
            message: 'Registra tu nivel de energía antes de cerrar el día.',
            createdAt: new Date(),
            read: false,
          });
        }

        for (const alert of alerts) {
          await db.collection(`users/${uid}/alerts`).add(alert);
        }
      }
    } catch (err) {
      logger.error('Evening check failed:', err);
    }
  }
);

// ─────────────────────────────────────────────────────────
// 3. CLEANUP — auto-delete read alerts older than 7 days
// ─────────────────────────────────────────────────────────
exports.cleanupOldAlerts = onSchedule(
  {
    schedule: '0 3 * * *',
    timeZone: 'Europe/Madrid',
    region: 'europe-west1',
  },
  async (event) => {
    logger.info('Cleaning up old alerts');
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    try {
      const usersSnap = await db.collection('users').get();
      for (const userDoc of usersSnap.docs) {
        const uid = userDoc.id;
        const oldAlerts = await db.collection(`users/${uid}/alerts`)
          .where('read', '==', true)
          .where('createdAt', '<', cutoff)
          .get();

        const batch = db.batch();
        oldAlerts.docs.forEach(d => batch.delete(d.ref));
        if (oldAlerts.size > 0) {
          await batch.commit();
          logger.info(`Cleaned ${oldAlerts.size} alerts for user ${uid}`);
        }
      }
    } catch (err) {
      logger.error('Alert cleanup failed:', err);
    }
  }
);

// ─────────────────────────────────────────────────────────
// HELPER: Compute ISO week ID (matches frontend getWeekId)
// ─────────────────────────────────────────────────────────
function getWeekId(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset * 7);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d - jan1) / (24 * 60 * 60 * 1000));
  const weekNum = Math.ceil((days + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}