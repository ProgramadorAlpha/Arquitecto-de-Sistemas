import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Trophy, 
  BatteryLow, 
  Euro, 
  Gift, 
  Loader2,
  Save,
  TrendingUp,
  XCircle,
  Users,
  Bot
} from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { getMonthId } from '../../utils/dateUtils';
import Card from '../UI/Card';
import Button from '../UI/Button';

const MonthlyTab = () => {
  const { user } = useAuth();
  const { actions } = useAppContext();
  const [data, setData] = useState({
    wins: '',
    drains: '',
    eliminate: '',
    delegate: '',
    automate: '',
    revenue_last: '',
    revenue_goal: '',
    celebration: ''
  });
  const [loading, setLoading] = useState(true);

  const monthId = getMonthId(0); // Current month

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    // Note: The original used 'current', but using monthId is better for history.
    // For compatibility with old data, we check 'current' first or just migrate to monthId.
    const unsub = onSnapshot(doc(db, 'users', user.uid, 'monthly', monthId), (d) => {
      if (d.exists()) {
        setData(d.data());
      } else {
        // Fallback to 'current' if monthId doesn't exist yet (for migration)
        setData({
            wins: '',
            drains: '',
            eliminate: '',
            delegate: '',
            automate: '',
            revenue_last: '',
            revenue_goal: '',
            celebration: ''
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore error in MonthlyTab:", error);
      setLoading(false);
    });
    return unsub;
  }, [user, monthId]);

  const updateField = async (field, value) => {
    if (!user) return;
    setData(prev => ({ ...prev, [field]: value }));
    await setDoc(doc(db, 'users', user.uid, 'monthly', monthId), { [field]: value }, { merge: true });
  };



  if (loading) return <div className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" /></div>;

  const currentMonthName = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="p-4 space-y-8 pb-20">
      {/* Header */}
      <div className="text-center mb-12 py-8">
        <div className="bg-amber-100 dark:bg-amber-900/30 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-100 dark:shadow-none">
          <Target className="w-10 h-10 text-amber-600" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Visión Mensual</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-bold uppercase tracking-widest text-xs">{currentMonthName}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wins */}
        <Card title="Victorias del Mes Pasado" icon={<Trophy className="text-green-500" />}>
          <div className="p-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">¿Qué lograste? Celebra tus éxitos</p>
            <textarea 
              value={data.wins || ''}
              onChange={e => setData(prev => ({ ...prev, wins: e.target.value }))}
              onBlur={e => updateField('wins', e.target.value)}
              rows="4"
              className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium dark:text-slate-200 resize-none"
              placeholder="Ej: Cerré 3 proyectos, mejoré mi racha de lectura..."
            />
          </div>
        </Card>

        {/* Drains */}
        <Card title="Fugas de Energía" icon={<BatteryLow className="text-red-500" />}>
          <div className="p-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">¿Qué te drenó? Identifica patrones</p>
            <textarea 
              value={data.drains || ''}
              onChange={e => setData(prev => ({ ...prev, drains: e.target.value }))}
              onBlur={e => updateField('drains', e.target.value)}
              rows="4"
              className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium dark:text-slate-200 resize-none"
              placeholder="Ej: Reuniones innecesarias, redes sociales, falta de sueño..."
            />
          </div>
        </Card>
      </div>

      {/* Liberación de Ancho de Banda */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                    <Target className="w-8 h-8 text-slate-300" />
                </div>
                <div>
                    <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter">Liberación de Ancho de Banda</h3>
                    <p className="text-slate-400 text-[10px] md:text-sm font-medium">Sistematiza tu energía. Elimina el ruido. Escala tu tiempo.</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-red-500 font-bold uppercase tracking-widest text-xs">
                    <XCircle className="w-4 h-4" /> Deprecar (Eliminar)
                </h4>
                <textarea 
                    value={data.eliminate || ''}
                    onChange={e => setData(prev => ({ ...prev, eliminate: e.target.value }))}
                    onBlur={e => updateField('eliminate', e.target.value)}
                    rows="3"
                    className="w-full bg-slate-800/50 dark:bg-slate-900/50 border border-slate-700 p-4 rounded-2xl text-sm font-medium text-slate-200 placeholder-slate-600 outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 resize-none transition"
                    placeholder="Ej: Reuniones sin agenda"
                />
            </div>
            
            <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-amber-500 font-bold uppercase tracking-widest text-xs">
                    <Users className="w-4 h-4" /> Tercerizar (Delegar)
                </h4>
                <textarea 
                    value={data.delegate || ''}
                    onChange={e => setData(prev => ({ ...prev, delegate: e.target.value }))}
                    onBlur={e => updateField('delegate', e.target.value)}
                    rows="3"
                    className="w-full bg-slate-800/50 dark:bg-slate-900/50 border border-slate-700 p-4 rounded-2xl text-sm font-medium text-slate-200 placeholder-slate-600 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 resize-none transition"
                    placeholder="Ej: Facturación y cobros"
                />
            </div>
            
            <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-blue-500 font-bold uppercase tracking-widest text-xs">
                    <Bot className="w-4 h-4" /> Sistematizar (Automatizar)
                </h4>
                <textarea 
                    value={data.automate || ''}
                    onChange={e => setData(prev => ({ ...prev, automate: e.target.value }))}
                    onBlur={e => updateField('automate', e.target.value)}
                    rows="3"
                    className="w-full bg-slate-800/50 dark:bg-slate-900/50 border border-slate-700 p-4 rounded-2xl text-sm font-medium text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 resize-none transition"
                    placeholder="Ej: Onboarding de clientes"
                />
            </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Ingresos Mes Pasado" icon={<Euro className="text-amber-500" />}>
           <div className="p-6">
                <input 
                    type="text" 
                    value={data.revenue_last || ''}
                    onChange={e => setData(prev => ({ ...prev, revenue_last: e.target.value }))}
                    onBlur={e => updateField('revenue_last', e.target.value)}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-none text-2xl font-black text-slate-800 dark:text-white text-center outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="€ 0.00"
                />
           </div>
        </Card>

        <Card title="Meta de Ingresos" icon={<TrendingUp className="text-blue-500" />}>
           <div className="p-6">
                <input 
                    type="text" 
                    value={data.revenue_goal || ''}
                    onChange={e => setData(prev => ({ ...prev, revenue_goal: e.target.value }))}
                    onBlur={e => updateField('revenue_goal', e.target.value)}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-none text-2xl font-black text-slate-800 dark:text-white text-center outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="€ 0.00"
                />
           </div>
        </Card>

        <Card title="Recompensa / Celebración" icon={<Gift className="text-purple-500" />}>
           <div className="p-6">
                <input 
                    type="text" 
                    value={data.celebration || ''}
                    onChange={e => setData(prev => ({ ...prev, celebration: e.target.value }))}
                    onBlur={e => updateField('celebration', e.target.value)}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-none text-sm font-bold text-slate-800 dark:text-white text-center outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ej: Cena especial, Viaje corto..."
                />
           </div>
        </Card>
      </div>

      <Button className="w-full py-5 text-lg gap-2 shadow-2xl shadow-blue-500/20">
          <Save className="w-6 h-6" /> Consolidar Visión Mensual
      </Button>
    </div>
  );
};

export default MonthlyTab;
