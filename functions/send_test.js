const { Resend } = require('resend');

const resend = new Resend('re_WQiG3Cpx_KNCm5WfGYQK4QCpqotK2qiHj');

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

// Datos de prueba inventados
const testAlerts = [
  {
    severity: 'critical',
    icon: '🎯',
    title: 'Sin Foco Semanal Definido',
    message: 'Llevas 3 días de semana sin definir tu Roca #1. Sin foco claro, la semana se pierde en lo urgente.'
  },
  {
    severity: 'critical',
    icon: '🌍',
    title: 'Módulo de Idiomas Abandonado',
    message: 'Llevas 5 días consecutivos sin completar tu sesión de idiomas. El aprendizaje exige consistencia.'
  },
  {
    severity: 'warning',
    icon: '💛',
    title: 'Jorge Luis — Contacto Próximo',
    message: 'Llevas 12 días sin conectar con Jorge Luis. En 3 días más se convertirá en alerta crítica.'
  }
];

async function sendTest() {
  try {
    console.log('Enviando email a tecnomania73...');
    const result = await resend.emails.send({
      from: 'Life OS <onboarding@resend.dev>',
      to: 'tecnomania73@gmail.com',
      subject: `⚡ 2 alertas críticas en tu Life OS (TEST)`,
      html: buildEmailHTML({ userName: 'José', alerts: testAlerts }),
    });
    console.log('Email enviado éxito:', result);
  } catch (err) {
    console.error('Error enviando email:', err);
  }
}

sendTest();
