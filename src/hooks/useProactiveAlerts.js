import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot, collection } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getWeekId, getMonthId } from '../utils/dateUtils';

const DAY_MS = 1000 * 60 * 60 * 24;

const diffDays = (dateStr) => {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((today - d) / DAY_MS);
};

/**
 * useProactiveAlerts — Monitorea todos los módulos del Life OS y genera alertas
 * cuando el usuario abandona rituales o no cumple con sus compromisos.
 *
 * @param {object} user  - Firebase Auth user
 * @param {array}  networkMembers - array de miembros del Círculo Íntimo (de useNetworkMembers)
 * @returns {{ alerts: Array, criticalCount: number, warningCount: number }}
 */
const useProactiveAlerts = (user, networkMembers = []) => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!user) return;

    const today      = new Date().toISOString().split('T')[0];
    const weekId     = getWeekId(0);
    const monthId    = getMonthId(0);
    const now        = new Date();
    const hourNow    = now.getHours();
    const dayOfWeek  = now.getDay(); // 0=Dom, 1=Lun, 2=Mar ...
    const langId     = localStorage.getItem('language_widget_lang') || 'english';

    let localAlerts = [];
    let pendingChecks = 0;
    let completedChecks = 0;

    // Función que acumula chequeos y al finalizar todos actualiza el estado
    const checkDone = () => {
      completedChecks++;
      if (completedChecks >= pendingChecks) {
        // Ordenar: críticas primero, luego advertencias
        const sorted = [...localAlerts].sort((a, b) => {
          const order = { critical: 0, warning: 1 };
          return (order[a.severity] ?? 1) - (order[b.severity] ?? 1);
        });
        setAlerts(sorted);
      }
    };

    const addAlert = (alert) => {
      localAlerts.push(alert);
    };

    // ─────────────────────────────────────────────
    // CHEQUEO 1: Ritual de Dominio Semanal
    // ─────────────────────────────────────────────
    pendingChecks++;
    const weeklyUnsub = onSnapshot(
      doc(db, 'users', user.uid, 'weekly', weekId),
      (snap) => {
        const data = snap.exists() ? snap.data() : {};
        const checklist = data.checklist || {};
        const anyChecked = Object.values(checklist).some(Boolean);
        const hasRock1   = !!(data.priority_1?.trim());

        // Crítico: Es lunes o martes y NO hay checklist iniciado
        if ((dayOfWeek === 1 || dayOfWeek === 2) && !anyChecked) {
          addAlert({
            id: 'weekly_ritual_pending',
            severity: 'critical',
            icon: '📅',
            title: 'Ritual de Dominio Semanal Pendiente',
            message: `Es ${dayOfWeek === 1 ? 'lunes' : 'martes'} y aún no has completado ningún punto del Ritual Semanal. 4 ítems te esperan.`,
            tab: 'weekly',
            color: 'red',
          });
        }

        // Crítico: Han pasado más de 2 días de semana sin Roca #1
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const mondayDate   = new Date(now);
        mondayDate.setDate(now.getDate() + mondayOffset);
        const daysSinceMonday = Math.floor((now - mondayDate) / DAY_MS);

        if (!hasRock1 && daysSinceMonday >= 2) {
          addAlert({
            id: 'weekly_rocks_empty',
            severity: 'critical',
            icon: '🎯',
            title: 'Sin Foco Semanal Definido',
            message: `Llevas ${daysSinceMonday} días de semana sin definir tu Roca #1. Sin foco no hay progreso.`,
            tab: 'weekly',
            color: 'red',
          });
        }

        checkDone();
      },
      () => checkDone()
    );

    // ─────────────────────────────────────────────
    // CHEQUEO 2: Módulo de Idiomas — última sesión completada
    // ─────────────────────────────────────────────
    pendingChecks++;
    // Miramos los últimos 10 días de daily_content para ver cuándo fue la última completada
    // Usamos una aproximación simple: revisamos solo hoy y calculamos desde settings
    getDoc(doc(db, 'users', user.uid, 'daily_content', today))
      .then((snap) => {
        const completedToday = snap.exists() && snap.data()[`${langId}Completed`];

        // Verificamos fecha del último éxito en localStorage (más ligero que leer 10 docs)
        const lastSuccess = localStorage.getItem(`last_lang_success_${langId}`);
        if (!completedToday) {
          const daysSince = lastSuccess ? diffDays(lastSuccess) : 5;
          if (daysSince >= 5) {
            addAlert({
              id: 'language_streak_broken',
              severity: 'critical',
              icon: '🌍',
              title: 'Módulo de Idiomas Abandonado',
              message: `Llevas ${daysSince >= 999 ? 'varios' : daysSince}+ días sin completar tu práctica de idiomas. Tu progreso se enfría.`,
              tab: 'languages',
              color: 'red',
            });
          } else if (daysSince >= 3) {
            addAlert({
              id: 'language_warning',
              severity: 'warning',
              icon: '🌍',
              title: 'Idiomas: Sesión Pendiente Hoy',
              message: 'No has completado tu práctica de idiomas hoy. Mantén el ritmo.',
              tab: 'languages',
              color: 'amber',
            });
          }
        } else {
          // Si completó hoy, actualizar localStorage
          localStorage.setItem(`last_lang_success_${langId}`, today);
        }
        checkDone();
      })
      .catch(() => checkDone());

    // ─────────────────────────────────────────────
    // CHEQUEO 3: Lectura
    // ─────────────────────────────────────────────
    pendingChecks++;
    getDoc(doc(db, 'users', user.uid, 'settings', 'reading'))
      .then((snap) => {
        if (snap.exists()) {
          const { last_read_date, current_book } = snap.data();
          const days = diffDays(last_read_date);
          if (current_book && days >= 10) {
            addAlert({
              id: 'reading_absent',
              severity: 'critical',
              icon: '📖',
              title: `${days >= 15 ? '🚨 ' : ''}Lectura Abandonada`,
              message: `Llevas ${days} días sin marcar lectura de "${current_book}". Tu compromiso intelectual te espera.`,
              tab: 'dashboard',
              color: days >= 15 ? 'red' : 'amber',
              severity: days >= 15 ? 'critical' : 'warning',
            });
          } else if (current_book && days >= 7) {
            addAlert({
              id: 'reading_warning',
              severity: 'warning',
              icon: '📖',
              title: 'Lectura: +7 Días de Pausa',
              message: `Tu libro actual lleva ${days} días esperándote. 10 páginas al día cambian tu año.`,
              tab: 'dashboard',
              color: 'amber',
            });
          }
        }
        checkDone();
      })
      .catch(() => checkDone());

    // ─────────────────────────────────────────────
    // CHEQUEO 4: Visión Mensual
    // ─────────────────────────────────────────────
    pendingChecks++;
    const dayOfMonth = now.getDate();
    if (dayOfMonth <= 5) {
      getDoc(doc(db, 'users', user.uid, 'monthly', monthId))
        .then((snap) => {
          const data = snap.exists() ? snap.data() : {};
          const hasGoal = !!(data.revenue_goal?.trim() || data.wins?.trim());
          if (!hasGoal) {
            addAlert({
              id: 'monthly_vision_empty',
              severity: 'critical',
              icon: '📊',
              title: 'Visión Mensual Sin Definir',
              message: `Estamos en el día ${dayOfMonth} del mes y aún no has trazado tu Visión Mensual. Define tus metas ahora.`,
              tab: 'monthly',
              color: 'red',
            });
          }
          checkDone();
        })
        .catch(() => checkDone());
    } else {
      checkDone();
    }

    // ─────────────────────────────────────────────
    // CHEQUEO 5: Hábitos Matutinos (horario)
    // ─────────────────────────────────────────────
    pendingChecks++;
    if (hourNow >= 10) {
      getDoc(doc(db, 'users', user.uid, 'habits', today))
        .then((snap) => {
          const data = snap.exists() ? snap.data() : {};
          const completedCount = Object.values(data).filter(Boolean).length;
          if (completedCount === 0) {
            addAlert({
              id: 'morning_habits_zero',
              severity: hourNow >= 12 ? 'critical' : 'warning',
              icon: '☀️',
              title: hourNow >= 12 ? '🚨 Rituales Matutinos Sin Completar' : 'Protocolo Matutino Pendiente',
              message: `Son las ${hourNow}:${String(now.getMinutes()).padStart(2,'0')} y no has completado ningún hábito matutino. Tu Protocolo 3-6-9 te espera.`,
              tab: 'dashboard',
              color: hourNow >= 12 ? 'red' : 'amber',
            });
          } else if (completedCount < 2) {
            addAlert({
              id: 'morning_habits_partial',
              severity: 'warning',
              icon: '☀️',
              title: 'Ritual Matutino Incompleto',
              message: `Solo has completado ${completedCount}/3 hábitos matutinos hoy.`,
              tab: 'dashboard',
              color: 'amber',
            });
          }
          checkDone();
        })
        .catch(() => checkDone());
    } else {
      checkDone();
    }

    // ─────────────────────────────────────────────
    // CHEQUEO 6: Hábitos Nocturnos (horario ≥ 21:00)
    // ─────────────────────────────────────────────
    pendingChecks++;
    if (hourNow >= 21) {
      getDoc(doc(db, 'users', user.uid, 'night_habits', today))
        .then((snap) => {
          const data = snap.exists() ? snap.data() : {};
          const completedNight = Object.values(data).filter(v => v === 1 || v === true).length;
          if (completedNight < 3) {
            addAlert({
              id: 'night_habits_pending',
              severity: 'warning',
              icon: '🌙',
              title: 'Cierre Nocturno Pendiente',
              message: `Solo has completado ${completedNight}/6 rituales nocturnos. El día NO está cerrado.`,
              tab: 'dashboard',
              color: 'amber',
            });
          }
          checkDone();
        })
        .catch(() => checkDone());
    } else {
      checkDone();
    }

    // ─────────────────────────────────────────────
    // CHEQUEO 7: Círculo Íntimo (datos síncronos)
    // ─────────────────────────────────────────────
    // Este chequeo es síncrono — los datos vienen del prop networkMembers
    pendingChecks++;
    if (networkMembers.length > 0) {
      networkMembers.forEach((person) => {
        const days = diffDays(person.last_connect_date);
        if (days >= 15) {
          addAlert({
            id: `tribe_critical_${person.id}`,
            severity: 'critical',
            icon: '💞',
            title: `${person.name} — Círculo Íntimo en Riesgo`,
            message: `Hace ${days >= 999 ? 'más de 30' : days} días que no conectas con ${person.name} (${person.role || 'Aliado'}). Tu círculo íntimo te necesita.`,
            tab: 'network',
            color: 'red',
          });
        } else if (days >= 10) {
          addAlert({
            id: `tribe_warning_${person.id}`,
            severity: 'warning',
            icon: '💛',
            title: `${person.name} — Contacto Próximo`,
            message: `Llevas ${days} días sin conectar con ${person.name}. Llega el momento de volver a reuniros.`,
            tab: 'network',
            color: 'amber',
          });
        }
      });
    }
    checkDone();

    // ─────────────────────────────────────────────
    // CHEQUEO 8: Racha en riesgo (≥20:00 sin actividad)
    // ─────────────────────────────────────────────
    pendingChecks++;
    if (hourNow >= 20) {
      getDoc(doc(db, 'users', user.uid, 'history', today))
        .then((snap) => {
          const score = snap.exists() ? (snap.data().score || 0) : 0;
          if (score < 30) {
            addAlert({
              id: 'streak_at_risk',
              severity: 'warning',
              icon: '🔥',
              title: 'Tu Racha Peligra Esta Noche',
              message: `Progreso de hoy: ${score}%. Son las ${hourNow}h. Completa al menos un módulo para no romper tu racha.`,
              tab: 'dashboard',
              color: 'amber',
            });
          }
          checkDone();
        })
        .catch(() => checkDone());
    } else {
      checkDone();
    }

    // Si no hay ningún chequeo pendiente (edge case), actualizar estado vacío
    if (pendingChecks === 0) setAlerts([]);

    return () => {
      weeklyUnsub?.();
    };
  }, [user, networkMembers, JSON.stringify(networkMembers.map(m => m.last_connect_date))]);

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount  = alerts.filter(a => a.severity === 'warning').length;

  return { alerts, criticalCount, warningCount };
};

export default useProactiveAlerts;
