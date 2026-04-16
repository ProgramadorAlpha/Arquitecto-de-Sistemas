const { onSchedule } = require('firebase-functions/v2/scheduler');
const { logger } = require('firebase-functions');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const resendApiKey = defineSecret('RESEND_API_KEY');

initializeApp();
const db = getFirestore();

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getWeekId() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function getMonthId() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function diffDays(dateStr) {
  if (!dateStr) return Infinity;
  const past = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((today - past) / (1000 * 60 * 60 * 24));
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE DE EMAIL — HTML Bonito y Premium
// ─────────────────────────────────────────────────────────────────────────────

function buildEmailHTML({ userName, alerts }) {
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts  = alerts.filter(a => a.severity === 'warning');

  const renderAlert = (alert) => {
    const isCritical = alert.severity === 'critical';
    const borderColor = isCritical ? '#ef4444' : '#f59e0b';
    const bgColor     = isCritical ? '#1f0a0a' : '#1a1300';
    const badgeText   = isCritical ? 'CRÍTICO' : 'AVISO';
    const badgeColor  = isCritical ? '#ef4444' : '#f59e0b';

    return `
      <div style="margin-bottom:12px; border-radius:12px; background:${bgColor}; border:1px solid ${borderColor}30; border-left:3px solid ${borderColor}; padding:16px 20px;">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
          <span style="font-size:18px;">${alert.icon}</span>
          <strong style="font-size:11px; color:${borderColor}; text-transform:uppercase; letter-spacing:0.08em;">${alert.title}</strong>
          <span style="margin-left:auto; background:${badgeColor}20; color:${badgeColor}; font-size:9px; font-weight:700; padding:2px 8px; border-radius:20px; text-transform:uppercase; letter-spacing:0.1em;">${badgeText}</span>
        </div>
        <p style="margin:0; font-size:13px; color:#cbd5e1; line-height:1.6;">${alert.message}</p>
      </div>
    `;
  };

  const alertsHTML = [
    ...criticalAlerts.map(renderAlert),
    ...warningAlerts.map(renderAlert)
  ].join('');

  const critLabel = criticalAlerts.length > 0
    ? `<span style="background:#ef444420; color:#ef4444; padding:3px 12px; border-radius:20px; font-size:11px; font-weight:700;">${criticalAlerts.length} crítica${criticalAlerts.length > 1 ? 's' : ''}</span>`
    : '';
  const warnLabel = warningAlerts.length > 0
    ? `<span style="background:#f59e0b20; color:#f59e0b; padding:3px 12px; border-radius:20px; font-size:11px; font-weight:700;">${warningAlerts.length} aviso${warningAlerts.length > 1 ? 's' : ''}</span>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Alertas del Life OS</title>
</head>
<body style="margin:0; padding:0; background:#060b18; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060b18; padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a0533 0%,#0f172a 60%,#0c1a2e 100%); border-radius:20px 20px 0 0; padding:36px 36px 28px; text-align:center; border:1px solid #ffffff08; border-bottom:none;">
              <div style="display:inline-block; background:#ffffff10; border-radius:50%; width:56px; height:56px; line-height:56px; font-size:28px; margin-bottom:16px;">🧠</div>
              <h1 style="margin:0 0 6px; font-size:22px; font-weight:800; color:#ffffff; letter-spacing:-0.5px;">Life OS — Alerta Proactiva</h1>
              <p style="margin:0; font-size:13px; color:#64748b;">Tu sistema de vida necesita atención, ${userName}.</p>
              <div style="margin-top:16px; display:flex; gap:8px; justify-content:center;">
                ${critLabel} ${warnLabel}
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#0d1424; padding:28px 28px 20px; border:1px solid #ffffff08; border-top:none; border-bottom:none;">
              ${alertsHTML}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="background:#0d1424; padding:8px 28px 32px; border:1px solid #ffffff08; border-top:none; border-radius:0 0 20px 20px; text-align:center;">
              <a href="https://arquitecto-sistemas-2026.web.app" style="display:inline-block; background:linear-gradient(135deg,#f59e0b,#d97706); color:#000; font-size:13px; font-weight:800; text-decoration:none; padding:14px 32px; border-radius:12px; margin-top:8px; text-transform:uppercase; letter-spacing:0.08em; box-shadow:0 4px 20px rgba(245,158,11,0.35);">
                Abrir el Life OS →
              </a>
              <p style="margin:16px 0 0; font-size:11px; color:#334155;">Enviado por tu asistente de productividad personal</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN CENTRAL: Evalúa un usuario y retorna sus alertas del día
// ─────────────────────────────────────────────────────────────────────────────

async function evaluateUser(uid, userData) {
  const today      = new Date().toISOString().split('T')[0];
  const weekId     = getWeekId();
  const monthId    = getMonthId();
  const now        = new Date();
  const hourNow    = now.getHours();
  const dayOfWeek  = now.getDay(); // 0=Dom, 1=Lun ... 6=Sáb
  const dayMonth   = now.getDate();
  const alerts     = [];

  // ── 1. RITUAL DE DOMINIO SEMANAL ──────────────────────────────────────────
  const weeklyDoc  = await db.doc(`users/${uid}/weekly/${weekId}`).get();
  const weeklyData = weeklyDoc.data() || {};
  const checklist  = weeklyData.checklist || {};
  const anyChecked = Object.values(checklist).some(Boolean);
  const hasRock1   = !!(weeklyData.priority_1?.trim());

  if ((dayOfWeek === 1 || dayOfWeek === 2) && !anyChecked) {
    alerts.push({
      severity: 'critical', icon: '📅',
      title: 'Ritual de Dominio Semanal Pendiente',
      message: `Es ${dayOfWeek === 1 ? 'lunes' : 'martes'} y aún no has completado ningún punto del Ritual Semanal. 4 ítems te esperan para dominar esta semana.`,
    });
  }

  // Días desde el lunes
  const mondayOffset   = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const mondayDate     = new Date(now);
  mondayDate.setDate(now.getDate() + mondayOffset);
  const daysSinceMonday = Math.floor((now - mondayDate) / (1000 * 60 * 60 * 24));
  if (!hasRock1 && daysSinceMonday >= 2) {
    alerts.push({
      severity: 'critical', icon: '🎯',
      title: 'Sin Foco Semanal Definido',
      message: `Llevas ${daysSinceMonday} días de semana sin definir tu Roca #1. Sin foco claro, la semana se pierde en lo urgente.`,
    });
  }

  // ── 2. VISIÓN MENSUAL (primeros 5 días del mes) ───────────────────────────
  if (dayMonth <= 5) {
    const monthlyDoc  = await db.doc(`users/${uid}/monthly/${monthId}`).get();
    const monthlyData = monthlyDoc.data() || {};
    const hasGoal     = !!(monthlyData.revenue_goal?.trim() || monthlyData.wins?.trim());
    if (!hasGoal) {
      alerts.push({
        severity: 'critical', icon: '📊',
        title: 'Visión Mensual Sin Definir',
        message: `Estamos en el día ${dayMonth} del mes y aún no has trazado tu Visión Mensual. Un mes sin metas claras es un mes perdido.`,
      });
    }
  }

  // ── 3. HÁBITOS MATUTINOS (solo si es tarde — 11:00+) ─────────────────────
  if (hourNow >= 11) {
    const habitsDoc  = await db.doc(`users/${uid}/habits/${today}`).get();
    const habitsData = habitsDoc.data() || {};
    const completed  = Object.values(habitsData).filter(Boolean).length;
    if (completed === 0) {
      alerts.push({
        severity: 'critical', icon: '☀️',
        title: 'Protocolo Matutino Sin Completar',
        message: `Son las ${hourNow}h y aún no has activado ningún hábito matutino. Tu Protocolo 3-6-9 es la base del día.`,
      });
    }
  }

  // ── 4. HÁBITOS NOCTURNOS (solo si es tarde — 22:00+) ─────────────────────
  if (hourNow >= 22) {
    const nightDoc  = await db.doc(`users/${uid}/night_habits/${today}`).get();
    const nightData = nightDoc.data() || {};
    const nightDone = Object.values(nightData).filter(v => v === 1 || v === true).length;
    if (nightDone < 3) {
      alerts.push({
        severity: 'warning', icon: '🌙',
        title: 'Cierre Nocturno Incompleto',
        message: `Solo completaste ${nightDone}/6 rituales nocturnos. El día no está bien cerrado. Tu subconsciente trabaja mientras duermes.`,
      });
    }
  }

  // ── 5. CÍRCULO ÍNTIMO — miembros con +15 días sin contacto ───────────────
  const networkSnap = await db.collection(`users/${uid}/network`).get();
  const overdueMembers = [];
  networkSnap.forEach(d => {
    const p = d.data();
    if (p.status === 'candidate') return;
    const days = diffDays(p.last_connect_date);
    if (days >= 15) overdueMembers.push({ name: p.name, days, role: p.role });
  });

  if (overdueMembers.length === 1) {
    const m = overdueMembers[0];
    alerts.push({
      severity: 'critical', icon: '💞',
      title: `${m.name} — Círculo Íntimo en Riesgo`,
      message: `Hace ${m.days >= 999 ? '30+' : m.days} días sin conectar con ${m.name}${m.role ? ` (${m.role})` : ''}. Las relaciones se construyen con presencia constante.`,
    });
  } else if (overdueMembers.length > 1) {
    const names = overdueMembers.map(m => m.name).join(', ');
    alerts.push({
      severity: 'critical', icon: '💞',
      title: `${overdueMembers.length} Relaciones del Círculo Descuidadas`,
      message: `${names} llevan más de 15 días sin tu atención. Tu red íntima es tu mayor activo — no la descuides.`,
    });
  }

  // ── 6. LECTURA — +10 días sin registrar ──────────────────────────────────
  const readingDoc  = await db.doc(`users/${uid}/settings/reading`).get();
  if (readingDoc.exists) {
    const { last_read_date, current_book } = readingDoc.data();
    const daysSince = diffDays(last_read_date);
    if (current_book && daysSince >= 10) {
      alerts.push({
        severity: daysSince >= 15 ? 'critical' : 'warning',
        icon: '📖',
        title: `Lectura Abandonada (${daysSince} días)`,
        message: `"${current_book}" lleva ${daysSince} días esperándote. 10 páginas diarias = 12 libros al año. No pierdas el ritmo.`,
      });
    }
  }

  return alerts;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CHECK MATUTINO — 07:00 (evalúa rituales + semanal + mensual)
// ─────────────────────────────────────────────────────────────────────────────
exports.morningProactiveCheck = onSchedule(
  {
    schedule: '0 7 * * *',
    timeZone: 'Europe/Madrid',
    region: 'europe-west1',
    secrets: [resendApiKey],
  },
  async () => {
    logger.info('🌅 Morning proactive check started');
    try {
      const usersSnap = await db.collection('users').get();

      for (const userDoc of usersSnap.docs) {
        const uid      = userDoc.id;
        const userData = userDoc.data();
        if (!userData.email) continue;

        const alerts = await evaluateUser(uid, userData);

        // Guardar alertas críticas en Firestore (para el panel in-app)
        for (const alert of alerts) {
          await db.collection(`users/${uid}/alerts`).add({
            type: alert.severity === 'critical' ? 'alert' : 'reminder',
            title: alert.title,
            message: alert.message,
            icon: alert.icon,
            severity: alert.severity,
            createdAt: new Date(),
            read: false,
          });
        }

        // Enviar email solo si hay alertas críticas
        const criticalAlerts = alerts.filter(a => a.severity === 'critical');
        if (criticalAlerts.length === 0) continue;

        try {
          const { Resend } = await import('resend');
          const resend = new Resend(resendApiKey.value());
          const userName = userData.displayName?.split(' ')[0] || 'Arquitecto';

          await resend.emails.send({
            from: 'Life OS <onboarding@resend.dev>',
            to: userData.email,
            subject: `⚡ ${criticalAlerts.length} alerta${criticalAlerts.length > 1 ? 's' : ''} crítica${criticalAlerts.length > 1 ? 's' : ''} en tu Life OS`,
            html: buildEmailHTML({ userName, alerts }),
          });

          logger.info(`✉️ Alert email sent to ${userData.email} (${criticalAlerts.length} critical)`);
        } catch (emailErr) {
          logger.warn('Failed to send alert email:', emailErr.message);
        }
      }
    } catch (err) {
      logger.error('Morning proactive check failed:', err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. CHECK VESPERTINO — 18:00 (evalúa idiomas + lectura + círculo)
// ─────────────────────────────────────────────────────────────────────────────
exports.afternoonProactiveCheck = onSchedule(
  {
    schedule: '0 18 * * *',
    timeZone: 'Europe/Madrid',
    region: 'europe-west1',
    secrets: [resendApiKey],
  },
  async () => {
    logger.info('🌇 Afternoon proactive check started');
    const today = new Date().toISOString().split('T')[0];

    try {
      const usersSnap = await db.collection('users').get();

      for (const userDoc of usersSnap.docs) {
        const uid      = userDoc.id;
        const userData = userDoc.data();
        if (!userData.email) continue;

        const alerts = [];

        // Comprobar si completó idiomas hoy
        const langDoc  = await db.doc(`users/${uid}/daily_content/${today}`).get();
        const langData = langDoc.data() || {};

        // Buscamos cualquier campo que termine en 'Completed' con valor true
        const langCompleted = Object.entries(langData).some(
          ([key, val]) => key.endsWith('Completed') && val === true
        );

        if (!langCompleted) {
          // Contar cuántos días seguidos sin completar — miramos últimos 5 días
          let streak = 0;
          for (let i = 1; i <= 5; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const pastDoc = await db.doc(`users/${uid}/daily_content/${dateStr}`).get();
            const pastData = pastDoc.data() || {};
            const done = Object.entries(pastData).some(
              ([key, val]) => key.endsWith('Completed') && val === true
            );
            if (!done) streak++; else break;
          }

          if (streak >= 4) {
            alerts.push({
              severity: 'critical', icon: '🌍',
              title: `Módulo de Idiomas — ${streak + 1} Días Sin Práctica`,
              message: `Llevas ${streak + 1} días consecutivos sin completar tu sesión de idiomas. El aprendizaje de idiomas exige consistencia diaria para no perder la progresión.`,
            });
            await db.collection(`users/${uid}/alerts`).add({
              type: 'alert', title: `Módulo de Idiomas — ${streak + 1} Días Sin Práctica`,
              message: `Llevas ${streak + 1} días sin práctica de idiomas. Completa tu sesión hoy.`,
              icon: '🌍', severity: 'critical', createdAt: new Date(), read: false,
            });
          } else if (streak >= 2) {
            alerts.push({
              severity: 'warning', icon: '🌍',
              title: 'Idiomas: Sesión Pendiente Hoy',
              message: `No has practicado idiomas en ${streak + 1} días. Hoy aún puedes mantener tu ritmo.`,
            });
          }
        }

        // Círculo Íntimo — warning 10 días (umbral amarillo, antes del crítico)
        const networkSnap = await db.collection(`users/${uid}/network`).get();
        networkSnap.forEach(d => {
          const p = d.data();
          if (p.status === 'candidate') return;
          const days = diffDays(p.last_connect_date);
          if (days >= 10 && days < 15) {
            alerts.push({
              severity: 'warning', icon: '💛',
              title: `${p.name} — Contacto Próximo`,
              message: `Llevas ${days} días sin conectar con ${p.name}. En 5 días más se convertirá en alerta crítica.`,
            });
          }
        });

        // Email solo si hay críticos en este check (poco probable en tarde, pero por si acaso)
        const critical = alerts.filter(a => a.severity === 'critical');
        if (critical.length > 0 && userData.email) {
          try {
            const { Resend } = await import('resend');
            const resend = new Resend(resendApiKey.value());
            const userName = userData.displayName?.split(' ')[0] || 'Arquitecto';
            await resend.emails.send({
              from: 'Life OS <onboarding@resend.dev>',
              to: userData.email,
              subject: `⚠️ Alerta vespertina — módulos pendientes en tu Life OS`,
              html: buildEmailHTML({ userName, alerts }),
            });
            logger.info(`✉️ Afternoon alert email sent to ${userData.email}`);
          } catch (emailErr) {
            logger.warn('Afternoon email failed:', emailErr.message);
          }
        }
      }
    } catch (err) {
      logger.error('Afternoon proactive check failed:', err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. CHECK NOCTURNO — 21:00 (hábitos nocturnos + racha)
// ─────────────────────────────────────────────────────────────────────────────
exports.eveningProactiveCheck = onSchedule(
  {
    schedule: '0 21 * * *',
    timeZone: 'Europe/Madrid',
    region: 'europe-west1',
  },
  async () => {
    logger.info('🌙 Evening proactive check started');
    const today = new Date().toISOString().split('T')[0];

    try {
      const usersSnap = await db.collection('users').get();

      for (const userDoc of usersSnap.docs) {
        const uid  = userDoc.id;
        const alerts = [];

        // Hábitos nocturnos
        const nightDoc  = await db.doc(`users/${uid}/night_habits/${today}`).get();
        const nightData = nightDoc.data() || {};
        const nightDone = Object.values(nightData).filter(v => v === 1 || v === true).length;
        if (nightDone < 3) {
          alerts.push({
            type: 'reminder',
            title: 'Cierre Nocturno Pendiente',
            message: `Solo completaste ${nightDone}/6 rituales nocturnos. El día no está cerrado. Completa tu rutina nocturna.`,
            icon: '🌙', severity: 'warning', createdAt: new Date(), read: false,
          });
        }

        // Racha — verificar si hay progreso hoy
        const historyDoc = await db.doc(`users/${uid}/history/${today}`).get();
        const score = historyDoc.exists ? (historyDoc.data().score || 0) : 0;
        if (score < 30) {
          alerts.push({
            type: 'alert',
            title: '🔥 Tu Racha Peligra Esta Noche',
            message: `Progreso de hoy: ${score}%. Completa al menos un módulo antes de dormir para mantener tu racha activa.`,
            icon: '🔥', severity: 'warning', createdAt: new Date(), read: false,
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

// ─────────────────────────────────────────────────────────────────────────────
// 4. ALERTA LUNES — Email especial el lunes a las 8:30
// Email motivacional con el ritual semanal + resumen del estado general
// ─────────────────────────────────────────────────────────────────────────────
exports.mondayWeeklyKickoff = onSchedule(
  {
    schedule: '30 8 * * 1', // Lunes 08:30
    timeZone: 'Europe/Madrid',
    region: 'europe-west1',
    secrets: [resendApiKey],
  },
  async () => {
    logger.info('🗓️ Monday Weekly Kickoff email started');
    try {
      const usersSnap = await db.collection('users').get();

      for (const userDoc of usersSnap.docs) {
        const uid      = userDoc.id;
        const userData = userDoc.data();
        if (!userData.email) continue;

        const weekId    = getWeekId();
        const weeklyDoc = await db.doc(`users/${uid}/weekly/${weekId}`).get();
        const weeklyData = weeklyDoc.data() || {};
        const hasRock1  = !!(weeklyData.priority_1?.trim());
        const userName  = userData.displayName?.split(' ')[0] || 'Arquitecto';

        const mondayAlerts = [
          {
            severity: 'critical', icon: '📅',
            title: 'Ritual de Dominio Semanal',
            message: 'Es lunes. Tu semana empieza ahora. Abre el Life OS, completa el checklist semanal y define tus 3 Rocas para dominar esta semana.',
          },
        ];

        if (!hasRock1) {
          mondayAlerts.push({
            severity: 'critical', icon: '🎯',
            title: 'Define tu Roca #1',
            message: 'Sin prioridad clara, todo parece urgente. ¿Cuál es el UNO que moverá el marcador esta semana?',
          });
        }

        try {
          const { Resend } = await import('resend');
          const resend = new Resend(resendApiKey.value());
          await resend.emails.send({
            from: 'Life OS <onboarding@resend.dev>',
            to: userData.email,
            subject: `🗓️ ${userName}, es lunes — Tu Ritual de Dominio Semanal te espera`,
            html: buildEmailHTML({ userName, alerts: mondayAlerts }),
          });
          logger.info(`✉️ Monday kickoff email sent to ${userData.email}`);
        } catch (emailErr) {
          logger.warn('Monday kickoff email failed:', emailErr.message);
        }
      }
    } catch (err) {
      logger.error('Monday kickoff failed:', err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. LIMPIEZA — Borrar alertas leídas con +7 días (03:00 diario)
// ─────────────────────────────────────────────────────────────────────────────
exports.cleanupOldAlerts = onSchedule(
  {
    schedule: '0 3 * * *',
    timeZone: 'Europe/Madrid',
    region: 'europe-west1',
  },
  async () => {
    logger.info('🧹 Cleaning up old alerts');
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    try {
      const usersSnap = await db.collection('users').get();
      for (const userDoc of usersSnap.docs) {
        const uid = userDoc.id;
        const oldAlerts = await db.collection(`users/${uid}/alerts`)
          .where('read', '==', true)
          .where('createdAt', '<', cutoff)
          .get();

        if (oldAlerts.size > 0) {
          const batch = db.batch();
          oldAlerts.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
          logger.info(`Cleaned ${oldAlerts.size} alerts for user ${uid}`);
        }
      }
    } catch (err) {
      logger.error('Alert cleanup failed:', err);
    }
  }
);