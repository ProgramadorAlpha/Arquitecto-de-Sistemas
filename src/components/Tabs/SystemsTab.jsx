import React, { useState, useEffect } from 'react';
import { 
  Plus, Sparkles, Trash2, Edit3, Zap, Target, Repeat, MapPin, 
  CloudSun, RotateCcw, Loader2, X, Shield, Brain, Dumbbell, 
  TrendingUp, BookOpen, ChevronRight, AlertTriangle
} from 'lucide-react';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { callGeminiAI, parseAIJSON } from '../../services/ai';
import Button from '../UI/Button';

const AREA_CONFIG = {
  salud:    { label: 'Salud & Fitness',      icon: Dumbbell,   color: 'from-emerald-500 to-teal-600',    bg: 'bg-emerald-500/10',   text: 'text-emerald-400',  border: 'border-emerald-500/20' },
  mental:   { label: 'Disciplina Mental',    icon: Brain,      color: 'from-violet-500 to-purple-600',   bg: 'bg-violet-500/10',    text: 'text-violet-400',   border: 'border-violet-500/20' },
  finanzas: { label: 'Finanzas Pro',         icon: TrendingUp, color: 'from-amber-500 to-orange-500',   bg: 'bg-amber-500/10',     text: 'text-amber-400',    border: 'border-amber-500/20' },
  skills:   { label: 'Habilidades',          icon: BookOpen,   color: 'from-blue-500 to-indigo-600',    bg: 'bg-blue-500/10',      text: 'text-blue-400',     border: 'border-blue-500/20' },
};

const SystemCard = ({ sys, onEdit, onDelete }) => {
  const area = AREA_CONFIG[sys.area] || AREA_CONFIG['salud'];
  const AreaIcon = area.icon;

  return (
    <div className="group relative bg-[#13151A] border border-[#2A2D35] rounded-[1.75rem] overflow-hidden transition-all duration-300 hover:border-white/10 hover:shadow-[0_0_40px_rgba(0,0,0,0.4)] hover:-translate-y-0.5">
      {/* Gradient accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${area.color}`} />

      {/* Header */}
      <div className="p-5 pb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`shrink-0 p-2.5 rounded-2xl ${area.bg} border ${area.border}`}>
            <AreaIcon className={`w-5 h-5 ${area.text}`} />
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-white text-base leading-tight truncate">{sys.title || 'Sin título'}</h3>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${area.text}`}>{area.label}</span>
          </div>
        </div>
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => onEdit(sys)} className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(sys.id)} className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Identity */}
      <div className="px-5 pb-4">
        <div className={`flex items-start gap-3 p-3.5 rounded-2xl ${area.bg} border ${area.border}`}>
          <Target className={`w-4 h-4 ${area.text} shrink-0 mt-0.5`} />
          <div className="min-w-0">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Identidad</p>
            <p className="text-sm font-semibold text-slate-200 leading-snug">{sys.identity}</p>
          </div>
        </div>
      </div>

      {/* Action + Trigger — stacked on mobile, side-by-side on md+ */}
      <div className="px-5 pb-4 flex flex-col sm:grid sm:grid-cols-2 gap-3">
        <div className="bg-[#1A1D24] rounded-2xl p-3.5 border border-[#2A2D35]">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
            <Repeat className="w-3 h-3" /> Acción
          </p>
          <p className="text-xs font-medium text-slate-300 leading-snug break-words">{sys.action}</p>
        </div>
        <div className="bg-[#1A1D24] rounded-2xl p-3.5 border border-[#2A2D35]">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
            <MapPin className="w-3 h-3" /> Disparador
          </p>
          <p className="text-xs font-medium text-slate-300 leading-snug break-words">{sys.trigger}</p>
        </div>
      </div>

      {/* Plan B footer */}
      {sys.plan_b && (
        <div className="mx-5 mb-5 flex items-start gap-2.5 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/15">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-0.5">Plan B</p>
            <p className="text-[11px] font-medium text-amber-400/80 leading-snug break-words">{sys.plan_b}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const SystemsTab = () => {
  const { user } = useAuth();
  const { actions } = useAppContext();
  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    goal: '', area: 'salud', title: '', identity: '', action: '', trigger: '', environment: '', plan_b: '',
  });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'systems'));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setSystems(docs);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error in SystemsTab:", error);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const handleGenerateAI = async () => {
    if (!formData.goal) return alert('Por favor, ingresa una meta.');
    setIsGenerating(true);
    try {
      const prompt = `Actúa como James Clear (Atomic Habits). El usuario quiere un sistema para el área "${formData.area}" con la meta: "${formData.goal}".
      OBJETIVO: Generar un protocolo de comportamiento específico.
      Responde SOLO con un objeto JSON válido.
      Estructura JSON requerida:
      {
          "title": "Nombre corto y memorable del sistema",
          "identity": "Afirmación de identidad en presente (ej: Soy un atleta)",
          "action": "La acción mínima viable (< 2 min)",
          "trigger": "Disparador específico (Cuándo/Dónde)",
          "environment": "Cambio en el entorno",
          "plan_b": "Estrategia de respaldo"
      }`;
      const res = await actions.callAI(prompt, "Eres un arquitecto de hábitos estricto. Respondes solo con JSON puro.");
      const sys = parseAIJSON(res);
      setFormData(prev => ({ ...prev, title: sys.title||'', identity: sys.identity||'', action: sys.action||'', trigger: sys.trigger||'', environment: sys.environment||'', plan_b: sys.plan_b||'' }));
    } catch (err) {
      console.error(err);
      alert('Error al generar sistema con IA.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      const data = { ...formData, updated_at: serverTimestamp() };
      if (editingId) {
        await updateDoc(doc(db, 'users', user.uid, 'systems', editingId), data);
      } else {
        data.created_at = serverTimestamp();
        await addDoc(collection(db, 'users', user.uid, 'systems'), data);
      }
      setIsWizardOpen(false);
      setFormData({ goal: '', area: 'salud', title: '', identity: '', action: '', trigger: '', environment: '', plan_b: '' });
      setEditingId(null);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar este sistema?')) await deleteDoc(doc(db, 'users', user.uid, 'systems', id));
  };

  const handleEdit = (sys) => { setFormData(sys); setEditingId(sys.id); setIsWizardOpen(true); };
  const openNew = () => { setEditingId(null); setFormData({ goal: '', area: 'salud', title: '', identity: '', action: '', trigger: '', environment: '', plan_b: '' }); setIsWizardOpen(true); };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Cargando sistemas...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 px-1">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
            Arquitectura de Hábitos
          </p>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Mis Sistemas</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">{systems.length} {systems.length === 1 ? 'protocolo activo' : 'protocolos activos'}</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-sm uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" /> Nuevo Sistema
        </button>
      </div>

      {/* Grid */}
      {systems.length === 0 ? (
        <div className="py-24 text-center bg-[#13151A] rounded-[2.5rem] border-2 border-dashed border-[#2A2D35]">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 flex items-center justify-center mx-auto mb-5">
            <Zap className="w-8 h-8 text-amber-500" />
          </div>
          <p className="text-white font-black text-lg mb-2">Sin sistemas activos</p>
          <p className="text-slate-500 text-sm mb-6">Crea tu primer protocolo para hackear tu disciplina.</p>
          <button onClick={openNew} className="px-6 py-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl font-bold text-sm hover:bg-amber-500/20 transition-colors">
            + Crear mi primer sistema
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {systems.map(sys => (
            <SystemCard key={sys.id} sys={sys} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#13151A] w-full sm:max-w-2xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border border-[#2A2D35] border-b-0 sm:border-b overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#2A2D35] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/10 p-2.5 rounded-2xl border border-amber-500/20">
                  <Zap className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                  {editingId ? 'Editar Sistema' : 'Diseñar Sistema'}
                </h3>
              </div>
              <button onClick={() => setIsWizardOpen(false)} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* AI Generator */}
              {!editingId && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Generar con IA</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="¿Qué quieres lograr? (Ej. Leer más, Dejar de fumar)"
                      value={formData.goal}
                      onChange={e => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                      className="flex-1 p-3.5 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <button type="button" onClick={handleGenerateAI} disabled={isGenerating}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50 shrink-0">
                      {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generar'}
                    </button>
                  </div>
                </div>
              )}

              {/* Area + Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Área</label>
                  <select value={formData.area} onChange={e => setFormData(prev => ({ ...prev, area: e.target.value }))}
                    className="w-full p-3.5 rounded-xl text-sm font-bold outline-none">
                    <option value="salud">Salud & Fitness</option>
                    <option value="mental">Disciplina Mental</option>
                    <option value="finanzas">Finanzas Pro</option>
                    <option value="skills">Habilidades</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Título del Sistema</label>
                  <input type="text" value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-3.5 rounded-xl text-sm font-bold outline-none" placeholder="Ej. Arquitecto de Mentes" />
                </div>
              </div>

              {/* Identity */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Identidad (Soy...)</label>
                <input type="text" value={formData.identity} onChange={e => setFormData(prev => ({ ...prev, identity: e.target.value }))}
                  className="w-full p-3.5 rounded-xl text-sm outline-none" placeholder="Ej. Soy una persona que nunca falta a su lectura" />
              </div>

              {/* Action + Trigger */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Acción Mínima</label>
                  <input type="text" value={formData.action} onChange={e => setFormData(prev => ({ ...prev, action: e.target.value }))}
                    className="w-full p-3.5 rounded-xl text-sm outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Disparador (Trigger)</label>
                  <input type="text" value={formData.trigger} onChange={e => setFormData(prev => ({ ...prev, trigger: e.target.value }))}
                    className="w-full p-3.5 rounded-xl text-sm outline-none" />
                </div>
              </div>

              {/* Environment + Plan B */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Entorno Obvio</label>
                  <input type="text" value={formData.environment} onChange={e => setFormData(prev => ({ ...prev, environment: e.target.value }))}
                    className="w-full p-3.5 rounded-xl text-sm outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Plan B (Reducción)</label>
                  <input type="text" value={formData.plan_b} onChange={e => setFormData(prev => ({ ...prev, plan_b: e.target.value }))}
                    className="w-full p-3.5 rounded-xl text-sm outline-none" />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsWizardOpen(false)}
                  className="flex-1 py-3.5 rounded-2xl border border-[#2A2D35] text-slate-400 font-bold text-sm hover:bg-white/5 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isGenerating}
                  className="flex-[2] py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50">
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (editingId ? 'Actualizar Sistema' : 'Activar Sistema')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemsTab;
