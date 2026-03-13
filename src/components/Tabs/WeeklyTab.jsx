import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Map, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Target, 
  Sparkles, 
  Brain, 
  Loader2,
  X 
} from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { getWeekId, formatWeekLabel } from '../../utils/dateUtils';
import { callGeminiAI } from '../../services/ai';
import Card from '../UI/Card';
import Button from '../UI/Button';

const WeeklyTab = () => {
  const { user } = useAuth();
  const { actions } = useAppContext();
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState({
    checklist: {},
    priority_1: '',
    priority_2: '',
    priority_3: '',
    brain_dump: ''
  });
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState(null);

  const weekId = getWeekId(offset);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = onSnapshot(doc(db, 'users', user.uid, 'weekly', weekId), (d) => {
      if (d.exists()) {
        setData(d.data());
      } else {
        setData({
          checklist: {},
          priority_1: '',
          priority_2: '',
          priority_3: '',
          brain_dump: ''
        });
      }
      setLoading(false);
    });
    return unsub;
  }, [user, weekId]);

  const updateField = async (field, value) => {
    if (!user) return;
    // Don't need to update state, onSnapshot will handle it, 
    // but updating state optimistically feels smoother
    setData(prev => ({ ...prev, [field]: value }));
    await setDoc(doc(db, 'users', user.uid, 'weekly', weekId), { [field]: value }, { merge: true });
  };

  const toggleCheck = async (key) => {
    const newVal = !data.checklist?.[key];
    const newChecklist = { ...data.checklist, [key]: newVal };
    setData(prev => ({ ...prev, checklist: newChecklist }));
    await setDoc(doc(db, 'users', user.uid, 'weekly', weekId), { checklist: newChecklist }, { merge: true });
  };

  const handleAIAction = async () => {
    if (!data.priority_1) return alert('Define primero tu Roca #1');
    setIsGenerating(true);
    try {
      const prompt = `Actúa como Project Manager experto. Tengo esta tarea prioritaria: "${data.priority_1}". Desglósala en 3 pasos accionables y concretos para empezar ya.`;
      const res = await actions.callAI(prompt, "Eres un asistente de ejecución estratégico.");
      setSuggestion(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 space-y-8 pb-20">
      {/* Navigation Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 px-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <Map className="w-5 h-5 text-blue-600" />
          <span className="font-black text-slate-700 dark:text-white uppercase tracking-tighter">Plan Estratégico</span>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button onClick={() => setOffset(o => o - 1)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition text-slate-500">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="px-4 text-center min-w-[120px]">
             <span className="text-[10px] font-black text-slate-400 block uppercase leading-none mb-1">Semana {weekId.split('-W')[1]}</span>
             <span className="text-sm font-bold text-slate-700 dark:text-white">{formatWeekLabel(offset)}</span>
          </div>
          <button onClick={() => setOffset(o => o + 1)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition text-slate-500">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>
      ) : (
        <>
          {/* Ritual Section */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 dark:from-indigo-950 dark:to-slate-950 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-white/10 p-4 rounded-[1.5rem] backdrop-blur-md">
                <Calendar className="text-indigo-400 w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">Ritual de Domingo</h2>
                <p className="text-indigo-200 text-sm italic">"Una hora de planificación ahorra diez de ejecución."</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'finances', label: 'Revisar cuentas/pagos pendientes' },
                { id: 'delegation', label: 'Asignar tarea administrativa' },
                { id: 'review', label: 'Revisar progresos de vida' },
                { id: 'schedule', label: 'Bloquear horas Gym/Ministerio' }
              ].map(item => (
                <button 
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`flex items-center gap-3 p-4 rounded-2xl transition-all border text-left cursor-pointer ${data.checklist?.[item.id] ? 'bg-indigo-500/40 border-indigo-400' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${data.checklist?.[item.id] ? 'bg-indigo-400' : 'border-2 border-slate-600'}`}>
                    {data.checklist?.[item.id] && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-sm font-bold">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* The 3 Rocks */}
            <div className="md:col-span-2 space-y-6">
              <Card 
                title="Las 3 Rocas" 
                icon={<Target className="text-red-500" />}
                extra={
                  <button onClick={handleAIAction} disabled={isGenerating} className="text-[10px] font-black uppercase bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-2 px-3 rounded-lg flex items-center gap-1.5 hover:bg-indigo-100 transition">
                    {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    IA: Desglosar #1
                  </button>
                }
              >
                <div className="p-6 space-y-6">
                  {[
                    { key: 'priority_1', label: '1. El Dinosaurio (Más difícil)', bg: 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 ring-red-500/10' },
                    { key: 'priority_2', label: '2. Tarea Clave (Delegable)', bg: 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 ring-blue-500/10' },
                    { key: 'priority_3', label: '3. Personal / Salud / Otros', bg: 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 ring-green-500/10' }
                  ].map(rock => (
                    <div key={rock.key}>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">{rock.label}</label>
                      <input 
                        type="text"
                        value={data[rock.key] || ''}
                        onChange={e => setData(prev => ({ ...prev, [rock.key]: e.target.value }))}
                        onBlur={e => updateField(rock.key, e.target.value)}
                        placeholder="Define tu enfoque estratégico..."
                        className={`w-full p-4 rounded-2xl border outline-none font-bold text-slate-800 dark:text-white transition focus:ring-4 ${rock.bg}`}
                      />
                    </div>
                  ))}
                </div>
              </Card>

              {suggestion && (
                <div className="p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/30 shadow-sm animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-500" />
                            <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter">Plan de Acción IA</h4>
                        </div>
                        <button onClick={() => setSuggestion(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <X className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium whitespace-pre-line">
                        {suggestion}
                    </p>
                </div>
              )}
            </div>

            {/* Brain Dump */}
            <div className="flex flex-col h-full">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-6">
                    <Brain className="w-5 h-5 text-slate-400" />
                    <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter">Vaciado Mental</h3>
                </div>
                <textarea 
                  value={data.brain_dump || ''}
                  onChange={e => setData(prev => ({ ...prev, brain_dump: e.target.value }))}
                  onBlur={e => updateField('brain_dump', e.target.value)}
                  className="w-full flex-1 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 resize-none placeholder-slate-400"
                  placeholder="Escribe todo lo que ocupe espacio en tu cabeza..."
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WeeklyTab;
