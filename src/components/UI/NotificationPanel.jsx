import React, { useState, useEffect } from 'react';
import { X, Flame, Zap, Target, BookOpen, Bell, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';

const TYPE_CONFIG = {
  reminder: { icon: Bell, color: 'blue', bgCls: 'bg-blue-500/10', borderCls: 'border-blue-500/20', textCls: 'text-blue-400' },
  alert:    { icon: AlertTriangle, color: 'amber', bgCls: 'bg-amber-500/10', borderCls: 'border-amber-500/20', textCls: 'text-amber-400' },
  success:  { icon: CheckCircle2, color: 'emerald', bgCls: 'bg-emerald-500/10', borderCls: 'border-emerald-500/20', textCls: 'text-emerald-400' },
  info:     { icon: Info, color: 'indigo', bgCls: 'bg-indigo-500/10', borderCls: 'border-indigo-500/20', textCls: 'text-indigo-400' },
};

const NotificationPanel = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { data } = useAppContext();
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const todayLabel = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase());

  // Subscribe to alerts from Firestore
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'users', user.uid, 'alerts'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      setAlerts(items);
      setUnreadCount(items.filter(a => !a.read).length);
    }, (err) => {
      console.warn('Alerts subscription error:', err);
    });
    return () => unsub();
  }, [user]);

  // Mark alert as read
  const markAsRead = async (alertId) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'alerts', alertId), { read: true });
    } catch (e) {
      console.warn('Failed to mark alert as read:', e);
    }
  };

  // Mark all as read
  const markAllRead = async () => {
    for (const alert of alerts.filter(a => !a.read)) {
      await markAsRead(alert.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm h-full bg-[#0e1120] border-l border-white/5 shadow-2xl flex flex-col overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h3 className="font-black text-white text-base uppercase tracking-tight">Notificaciones</h3>
            <p className="text-[11px] text-slate-500 mt-0.5 capitalize">{todayLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider"
              >
                Leer todo
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 p-5 space-y-4">
          {/* Dashboard Summary Section (always visible) */}
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Resumen del Día</p>

          {/* Streak */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
            <Flame size={20} className="text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-black text-amber-400 uppercase tracking-widest">Racha Actual</p>
              <p className="text-2xl font-black text-white leading-tight">{data.streak} <span className="text-xs font-medium text-slate-400">días</span></p>
            </div>
          </div>

          {/* Active Mode */}
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3">
            <Zap size={20} className="text-blue-400 shrink-0" />
            <div>
              <p className="text-xs font-black text-blue-400 uppercase tracking-widest">Modo Activo</p>
              <p className="text-sm font-bold text-white">{data.mode?.title || 'Expansión CEO'}</p>
              <p className="text-[10px] text-slate-500">{data.mode?.desc || 'Enfoque máximo'}</p>
            </div>
          </div>

          {/* Weekly Focus */}
          {data.weeklyFocus?.priority_1 && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
              <Target size={20} className="text-red-400 shrink-0" />
              <div>
                <p className="text-xs font-black text-red-400 uppercase tracking-widest">Foco Semanal</p>
                <p className="text-sm font-bold text-white uppercase">{data.weeklyFocus.priority_1}</p>
              </div>
            </div>
          )}

          {/* Reading */}
          {data.reading?.current_book && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
              <BookOpen size={20} className="text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">Libro Activo</p>
                <p className="text-sm font-bold text-white line-clamp-2">{data.reading.current_book}</p>
              </div>
            </div>
          )}

          {/* Proactive Alerts Section */}
          {alerts.length > 0 && (
            <>
              <div className="pt-4 border-t border-white/5">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">Alertas Proactivas</p>
              </div>
              {alerts.map((alert) => {
                const config = TYPE_CONFIG[alert.type] || TYPE_CONFIG.info;
                const Icon = config.icon;
                return (
                  <div
                    key={alert.id}
                    onClick={() => !alert.read && markAsRead(alert.id)}
                    className={`p-4 rounded-2xl ${config.bgCls} border ${config.borderCls} flex items-start gap-3 cursor-pointer transition-all ${
                      !alert.read ? 'ring-1 ring-white/10' : 'opacity-60'
                    }`}
                  >
                    <Icon size={18} className={`${config.textCls} shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-black ${config.textCls} uppercase tracking-widest`}>{alert.title}</p>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1">{alert.message}</p>
                      <p className="text-[9px] text-slate-600 mt-2">
                        {alert.createdAt?.toDate?.()?.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) || ''}
                      </p>
                    </div>
                    {!alert.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* Static reminder (kept as fallback) */}
          {alerts.length === 0 && (
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">💡 Recordatorio</p>
              <p className="text-xs text-slate-300 leading-relaxed italic">"La consistencia supera a la intensidad. Un 1% mejor cada día = 37x mejor al año."</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;