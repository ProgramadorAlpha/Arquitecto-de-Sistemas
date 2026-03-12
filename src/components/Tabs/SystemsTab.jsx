import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Sparkles, 
  Trash2, 
  Edit3, 
  Zap, 
  Target, 
  Repeat, 
  MapPin, 
  CloudSun, 
  RotateCcw,
  Loader2,
  X
} from 'lucide-react';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { callGeminiAI, parseAIJSON } from '../../services/ai';
import Card from '../UI/Card';
import Button from '../UI/Button';

const SystemsTab = () => {
  const { user } = useAuth();
  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    goal: '',
    area: 'salud',
    title: '',
    identity: '',
    action: '',
    trigger: '',
    environment: '',
    plan_b: '',
  });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'systems'));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setSystems(docs);
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

        const res = await callGeminiAI(prompt, "Eres un arquitecto de hábitos estricto. Respondes solo con JSON puro.");
        const sys = parseAIJSON(res);

        setFormData(prev => ({
            ...prev,
            title: sys.title || '',
            identity: sys.identity || '',
            action: sys.action || '',
            trigger: sys.trigger || '',
            environment: sys.environment || '',
            plan_b: sys.plan_b || '',
        }));
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
    } catch (err) {
        console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar este sistema?')) {
        await deleteDoc(doc(db, 'users', user.uid, 'systems', id));
    }
  };

  const handleEdit = (sys) => {
    setFormData(sys);
    setEditingId(sys.id);
    setIsWizardOpen(true);
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></div>;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Sistemas</h2>
          <p className="text-slate-500 font-medium">Arquitectura de hábitos atómicos</p>
        </div>
        <Button onClick={() => { setEditingId(null); setFormData({ goal: '', area: 'salud', title: '', identity: '', action: '', trigger: '', environment: '', plan_b: '' }); setIsWizardOpen(true); }} className="gap-2 px-6">
          <Plus className="w-5 h-5" /> Nuevo Sistema
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {systems.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-bold">No tienes sistemas activos.</p>
            <p className="text-slate-400 text-sm">Crea uno nuevo para hackear tu disciplina.</p>
          </div>
        ) : (
          systems.map(sys => (
            <Card key={sys.id} title={sys.title} className="group relative">
              <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(sys)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:text-blue-600">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(sys.id)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl">
                        <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identidad</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{sys.identity}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Repeat className="w-3 h-3" /> Acción
                        </p>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{sys.action}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Disparador
                        </p>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{sys.trigger}</p>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 py-1 px-3 rounded-full uppercase font-bold tracking-tighter">
                        {sys.area}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-amber-500 font-black">
                        <RotateCcw className="w-3 h-3" /> PLAN B: {sys.plan_b}
                    </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl">
                        <Zap className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                        {editingId ? 'Editar Sistema' : 'Diseño de Sistema'}
                    </h3>
                </div>
                <button onClick={() => setIsWizardOpen(false)} className="p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                    <X className="w-6 h-6 text-slate-400" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {!editingId && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/30 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Generar con IA</span>
                        </div>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                placeholder="¿Qué quieres lograr? (Ej. Leer más, Dejar de fumar)"
                                value={formData.goal}
                                onChange={e => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                                className="flex-1 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                            />
                            <Button type="button" onClick={handleGenerateAI} disabled={isGenerating} className="px-6">
                                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generar'}
                            </Button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Título del Sistema</label>
                        <input type="text" value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 outline-none text-sm font-bold dark:text-white" placeholder="Ej. Arquitecto de Mentes" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Área</label>
                        <select value={formData.area} onChange={e => setFormData(prev => ({ ...prev, area: e.target.value }))} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 outline-none text-sm font-bold dark:text-white">
                            <option value="salud">Salud & Fitness</option>
                            <option value="mental">Disciplina Mental</option>
                            <option value="finanzas">Finanzas Pro</option>
                            <option value="skills">Habilidades</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Identidad (Soy...)</label>
                        <input type="text" value={formData.identity} onChange={e => setFormData(prev => ({ ...prev, identity: e.target.value }))} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 outline-none text-sm font-medium dark:text-white" placeholder="Ej. Soy una persona que nunca falta a su lectura" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Acción Mínima</label>
                            <input type="text" value={formData.action} onChange={e => setFormData(prev => ({ ...prev, action: e.target.value }))} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 outline-none text-sm font-medium dark:text-white" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Disparador (Trigger)</label>
                            <input type="text" value={formData.trigger} onChange={e => setFormData(prev => ({ ...prev, trigger: e.target.value }))} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 outline-none text-sm font-medium dark:text-white" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Entorno Obvio</label>
                            <input type="text" value={formData.environment} onChange={e => setFormData(prev => ({ ...prev, environment: e.target.value }))} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 outline-none text-sm font-medium dark:text-white" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Plan B (Reducción)</label>
                            <input type="text" value={formData.plan_b} onChange={e => setFormData(prev => ({ ...prev, plan_b: e.target.value }))} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 outline-none text-sm font-medium dark:text-white" />
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex gap-4">
                    <Button type="button" variant="secondary" onClick={() => setIsWizardOpen(false)} className="flex-1 py-4">Cancelar</Button>
                    <Button type="submit" disabled={isGenerating} className={`flex-[2] py-4 bg-slate-900 text-white dark:bg-blue-600 font-black shadow-xl shadow-blue-500/20 transition-opacity ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {isGenerating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (editingId ? 'Actualizar Sistema' : 'Activar Sistema')}
                    </Button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemsTab;
