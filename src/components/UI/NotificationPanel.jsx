import React, { useState, useEffect } from 'react';
import { X, Flame, Zap, Target, BookOpen, Bell, AlertTriangle, CheckCircle2, Info, ShieldAlert, Brain } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import useNetworkMembers from '../../hooks/useNetworkMembers';
import useProactiveAlerts from '../../hooks/useProactiveAlerts';

const TAB_LABELS = {
  dashboard: 'Dashboard',
  weekly: 'Semanal',
  monthly: 'Mensual',
  network: 'Círculo Íntimo',
  languages: 'Idiomas',
};

const NotificationPanel = ({ isOpen, onClose, onNavigate }) => {
  const { user } = useAuth();
  const { data } = useAppContext();
  const [firestoreAlerts, setFirestoreAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const todayLabel = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).replace(/^\w/, c => c.toUpperCase());

  // --- Proactive hooks ---
  const networkMembers = useNetworkMembers(user);
  const { alerts: proactiveAlerts, criticalCount, warningCount } = useProactiveAlerts(user, networkMembers);

  // --- Firestore alerts (from Cloud Functions) ---
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'users', user.uid, 'alerts'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setFirestoreAlerts(items);
      setUnreadCount(items.filter(a => !a.read).length);
    }, (err) => console.warn('Alerts subscription error:', err));
    return () => unsub();
  }, [user]);

  const markAsRead = async (alertId) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'alerts', alertId), { read: true });
    } catch (e) { /* silencioso */ }
  };

  const markAllRead = async () => {
    for (const alert of firestoreAlerts.filter(a => !a.read)) {
      await markAsRead(alert.id);
    }
  };

  const handleNavigate = (tab) => {
    if (onNavigate) onNavigate(tab);
    onClose();
  };

  if (!isOpen) return null;

  const totalCritical = criticalCount;
  const totalWarning  = warningCount + firestoreAlerts.filter(a => !a.read).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm h-full bg-[#0a0f1e] border-l border-white/5 shadow-2xl flex flex-col overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 sticky top-0 bg-[#0a0f1e] z-10">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-white text-base uppercase tracking-tight">Centro de Control</h3>
              {totalCritical > 0 && (
                <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 text-red-400 text-[9px] font-black rounded-full uppercase tracking-widest animate-pulse">
                  {totalCritical} crítica{totalCritical > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 capitalize">{todayLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider">
                Leer todo
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 p-5 space-y-5">

          {/* ── SECCIÓN: Resumen rápido ── */}
          <div>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">Estado del Día</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Racha */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                <Flame size={16} className="text-amber-400 shrink-0" />
                <div>
                  <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Racha</p>
                  <p className="text-lg font-black text-white leading-tight">{data.streak} <span className="text-[9px] font-medium text-slate-400">días</span></p>
                </div>
              </div>
              {/* Modo */}
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
                <Zap size={16} className="text-blue-400 shrink-0" />
                <div>
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Modo</p>
                  <p className="text-xs font-bold text-white line-clamp-1">{data.mode?.title || 'CEO'}</p>
                </div>
              </div>
            </div>

            {/* Foco Semanal */}
            {data.weeklyFocus?.priority_1 && (
              <div className="mt-3 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                <Target size={16} className="text-red-400 shrink-0" />
                <div>
                  <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">Roca #1 Esta Semana</p>
                  <p className="text-xs font-bold text-white">{data.weeklyFocus.priority_1}</p>
                </div>
              </div>
            )}

            {/* Libro Activo */}
            {data.reading?.current_book && (
              <div className="mt-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                <BookOpen size={16} className="text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Lectura Activa</p>
                  <p className="text-xs font-bold text-white line-clamp-1">{data.reading.current_book}</p>
                </div>
              </div>
            )}
          </div>

          {/* ── SECCIÓN: Alertas Proactivas IA ── */}
          {proactiveAlerts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 pt-2 border-t border-white/5">
                <Brain size={12} className="text-indigo-400" />
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  IA Proactiva — {proactiveAlerts.length} alerta{proactiveAlerts.length > 1 ? 's' : ''}
                </p>
              </div>
              <div className="space-y-2">
                {proactiveAlerts.map((alert) => {
                  const isCritical = alert.severity === 'critical';
                  return (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-2xl border flex items-start gap-3 transition-all cursor-pointer group hover:scale-[1.01] ${
                        isCritical
                          ? 'bg-red-500/10 border-red-500/25 hover:border-red-500/50'
                          : 'bg-amber-500/8 border-amber-500/20 hover:border-amber-500/40'
                      }`}
                      onClick={() => alert.tab && handleNavigate(alert.tab)}
                    >
                      {/* Indicador de criticidad */}
                      <div className={`w-1 self-stretch rounded-full shrink-0 ${isCritical ? 'bg-red-500' : 'bg-amber-400'}`} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base leading-none">{alert.icon}</span>
                          <p className={`text-[10px] font-black uppercase tracking-wider leading-tight ${isCritical ? 'text-red-400' : 'text-amber-400'}`}>
                            {alert.title}
                          </p>
                          {isCritical && (
                            <span className="ml-auto shrink-0 px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[8px] font-black rounded uppercase tracking-widest">
                              CRÍTICO
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{alert.message}</p>
                        {alert.tab && (
                          <p className={`text-[9px] font-bold mt-2 uppercase tracking-wider group-hover:underline ${isCritical ? 'text-red-500/60' : 'text-amber-500/60'}`}>
                            Ir a {TAB_LABELS[alert.tab] || alert.tab} →
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── SECCIÓN: Notificaciones del Servidor (Cloud Functions) ── */}
          {firestoreAlerts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 pt-2 border-t border-white/5">
                <Bell size={12} className="text-slate-500" />
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                  Notificaciones del Sistema
                </p>
              </div>
              <div className="space-y-2">
                {firestoreAlerts.map((alert) => {
                  const ICONS = {
                    reminder: <Bell size={14} className="text-blue-400 shrink-0 mt-0.5" />,
                    alert:    <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />,
                    success:  <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />,
                    info:     <Info size={14} className="text-indigo-400 shrink-0 mt-0.5" />,
                  };
                  const COLORS = {
                    reminder: 'bg-blue-500/8 border-blue-500/15',
                    alert:    'bg-amber-500/8 border-amber-500/15',
                    success:  'bg-emerald-500/8 border-emerald-500/15',
                    info:     'bg-indigo-500/8 border-indigo-500/15',
                  };
                  return (
                    <div
                      key={alert.id}
                      onClick={() => !alert.read && markAsRead(alert.id)}
                      className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${COLORS[alert.type] || COLORS.info} ${!alert.read ? 'ring-1 ring-white/5' : 'opacity-50'}`}
                    >
                      {ICONS[alert.type] || ICONS.info}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-wide">{alert.title}</p>
                        <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{alert.message}</p>
                      </div>
                      {!alert.read && <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-1.5" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Estado limpio ── */}
          {proactiveAlerts.length === 0 && firestoreAlerts.length === 0 && (
            <div className="pt-4 border-t border-white/5">
              <div className="p-5 rounded-2xl bg-emerald-500/8 border border-emerald-500/15 text-center">
                <CheckCircle2 size={24} className="text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">Todo al día</p>
                <p className="text-[11px] text-slate-400 mt-1.5 italic leading-relaxed">
                  "La consistencia supera a la intensidad.<br />Un 1% mejor cada día = 37× mejor al año."
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;