import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Users, 
  Plus, 
  Sparkles, 
  Clock, 
  CheckCircle, 
  StickyNote, 
  Lightbulb,
  Edit2,
  Trash2,
  X,
  Loader2,
  Copy,
  Info
} from 'lucide-react';
import { collection, query, onSnapshot, doc, setDoc, addDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { callGeminiAI, parseAIJSON } from '../../services/ai';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Modal from '../UI/Modal';

const NetworkTab = () => {
  const { user } = useAuth();
  const [network, setNetwork] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdviceModalOpen, setIsAdviceModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [isCandidateMode, setIsCandidateMode] = useState(false);
  
  // AI Advice state
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
  const [adviceData, setAdviceData] = useState(null);
  const [targetPerson, setTargetPerson] = useState(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    role: '',
    relationship: '',
    personal_reminder: '',
    avatar_color: 'blue',
    status: 'active'
  });

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = query(collection(db, 'users', user.uid, 'network'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setNetwork(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const activeMembers = network.filter(p => p.status !== 'candidate');
  const candidates = network.filter(p => p.status === 'candidate');
  const expansionProgress = Math.min((candidates.length / 10) * 100, 100);

  // Daily Wisdom
  const dayIdx = new Date().getDay() % 3;
  const quotes = ["Tu éxito como CEO no vale nada si este círculo se rompe.", "El liderazgo empieza en casa.", "Nadie en su lecho de muerte dice: 'Ojalá hubiera trabajado más'."];
  const rules = ["Prohibido hablar de obra", "Hoy solo se escucha, no se resuelve", "Preguntar: ¿Cómo te sientes? antes de ¿Qué hiciste?"];
  const questions = ["¿Qué aventura imposible intentaríamos si el dinero no importara?", "¿Cuál es tu recuerdo favorito de nosotros este año?", "¿En qué te puedo apoyar mejor esta semana?"];

  const handleOpenEdit = (person = null, isCandidate = false) => {
    setEditingPerson(person);
    setIsCandidateMode(isCandidate);
    if (person) {
      setForm({
        name: person.name || '',
        role: person.role || '',
        relationship: person.relationship || '',
        personal_reminder: person.personal_reminder || '',
        avatar_color: person.avatar_color || 'blue',
        status: person.status || 'active'
      });
    } else {
      setForm({
        name: '',
        role: '',
        relationship: '',
        personal_reminder: '',
        avatar_color: 'blue',
        status: isCandidate ? 'candidate' : 'active'
      });
    }
    setIsEditModalOpen(true);
  };

  const handleSavePerson = async () => {
    if (!form.name) return;
    try {
      if (editingPerson) {
        await updateDoc(doc(db, 'users', user.uid, 'network', editingPerson.id), form);
      } else {
        await addDoc(collection(db, 'users', user.uid, 'network'), { ...form, created_at: serverTimestamp() });
      }
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePerson = async (id) => {
    if (!window.confirm('¿Eliminar de la tribu?')) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'network', id));
    } catch (err) {
      console.error(err);
    }
  };

  const registerEncounter = async (id) => {
    try {
      await updateDoc(doc(db, 'users', user.uid, 'network', id), {
        last_connect_date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleGetAdvice = async (person) => {
    setTargetPerson(person);
    setIsAdviceModalOpen(true);
    setIsGeneratingAdvice(true);
    setAdviceData(null);

    const dayOfWeek = new Date().toLocaleDateString('es-ES', { weekday: 'long' });
    const prompt = `Actúa como coach experto en relaciones interpersonales. 
    Contexto: Es ${dayOfWeek}. El usuario quiere conectar con ${person.name}, quien es su ${person.relationship}.
    Genera consejos personalizados en formato JSON con esta estructura exacta:
    {
        "consejo": "Un consejo específico y accionable para fortalecer esta relación hoy",
        "tema": "Un tema de conversación interesante que NO sea sobre trabajo",
        "pregunta": "Una pregunta abierta y genuina para iniciar una conversación significativa"
    }
    Responde SOLO con el JSON válido.`;

    try {
      const resText = await callGeminiAI(prompt, "Eres un coach experto en relaciones interpersonales y comunicación efectiva.");
      const advice = parseAIJSON(resText);
      setAdviceData(advice);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAdvice(false);
    }
  };

  const copyAdvice = () => {
    if (!adviceData) return;
    const text = `Consejo: ${adviceData.consejo}\nTema: ${adviceData.tema}\nPregunta: ${adviceData.pregunta}`;
    navigator.clipboard.writeText(text);
    alert('Copiado al portapapeles');
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-pink-500" /></div>;

  return (
    <div className="p-4 space-y-8 pb-20 max-w-6xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/10 dark:to-rose-900/10 border border-pink-100 dark:border-pink-900/30 p-10 rounded-[3rem] relative overflow-hidden group shadow-sm transition-all hover:shadow-xl">
         <div className="absolute -right-20 -top-20 w-80 h-80 bg-pink-100/40 dark:bg-pink-500/5 rounded-full blur-3xl group-hover:bg-pink-500/10 transition-all duration-700"></div>
         
         <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
            <div className="text-center lg:text-left flex-1">
                <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-pink-50 dark:border-pink-900/40">
                        <Heart className="w-8 h-8 text-pink-500 fill-pink-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Círculo Íntimo</h2>
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1">Nivel: Guardián del Hogar</p>
                    </div>
                </div>
                <p className="text-xl font-medium italic text-slate-700 dark:text-slate-200 leading-relaxed opacity-90">
                    "{quotes[dayIdx]}"
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl font-black text-[10px] uppercase tracking-widest">
                    <Info className="w-3.5 h-3.5" />
                    Regla de Hoy: {rules[dayIdx]}
                </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-pink-100 dark:border-pink-900/20 max-w-sm w-full shadow-lg shadow-pink-900/5">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-pink-50 dark:bg-pink-900/50 rounded-lg">
                        <Sparkles className="w-4 h-4 text-pink-500" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pregunta de Conexión</span>
                </div>
                <p className="text-lg font-bold text-slate-800 dark:text-white leading-snug">
                    "{questions[dayIdx]}"
                </p>
            </div>
         </div>
      </div>

      <div className="flex justify-between items-end px-2">
        <div>
            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-xl flex items-center gap-2">
                <Users className="w-6 h-6 text-slate-400" /> Miembros de la Tribu
            </h3>
        </div>
        <Button onClick={() => handleOpenEdit()} className="bg-slate-900 dark:bg-blue-600 text-white rounded-2xl px-6 py-3 font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20">
            <Plus className="w-4 h-4" /> Añadir Miembro
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeMembers.map(person => {
            const lastDate = person.last_connect_date ? new Date(person.last_connect_date) : null;
            const today = new Date();
            today.setHours(0,0,0,0);
            const diffDays = lastDate ? Math.floor((today - lastDate) / (1000 * 60 * 60 * 24)) : 999;
            const statusColor = diffDays < 7 ? 'bg-green-500' : diffDays < 14 ? 'bg-amber-500' : 'bg-red-500';
            const colorClass = person.avatar_color || 'blue';

            return (
                <div key={person.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-${colorClass}-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-${colorClass}-500/10 transition-all`}></div>
                    
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className={`w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-${colorClass}-100 to-${colorClass}-200 dark:from-${colorClass}-900 dark:to-${colorClass}-800/50 flex items-center justify-center text-${colorClass}-700 dark:text-${colorClass}-300 font-black text-2xl shadow-inner border border-white dark:border-slate-700`}>
                                    {person.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${statusColor} border-4 border-white dark:border-slate-900 shadow-sm flex items-center justify-center`}>
                                    {diffDays < 7 && <CheckCircle className="w-3 h-3 text-white" />}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tighter group-hover:text-blue-600 transition-colors">{person.name}</h4>
                                <span className={`text-[9px] font-black uppercase tracking-widest text-${colorClass}-600 dark:text-${colorClass}-400 bg-${colorClass}-100 dark:bg-${colorClass}-900/30 px-2 py-0.5 rounded-md border border-${colorClass}-200 dark:border-${colorClass}-800/50 block w-fit mt-1`}>
                                    {person.role || 'Aliado'}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenEdit(person)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeletePerson(person.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-6 min-h-[2.5rem] line-clamp-2">" {person.relationship} "</p>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Última Cita</span>
                        </div>
                        <span className={`text-sm font-black ${diffDays < 7 ? 'text-green-600' : diffDays < 14 ? 'text-amber-500' : 'text-red-500'}`}>
                            {diffDays === 0 ? 'Hoy' : diffDays === 1 ? 'Ayer' : `Hace ${diffDays} días`}
                        </span>
                    </div>

                    <div className="grid grid-cols-5 gap-3">
                        <button onClick={() => registerEncounter(person.id)} className="col-span-4 bg-slate-900 dark:bg-slate-700 text-white p-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition shadow-lg shadow-slate-200 dark:shadow-none">
                            Relación Atendida
                        </button>
                        <button onClick={() => handleGetAdvice(person)} className="col-span-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center hover:bg-indigo-100 transition border border-indigo-100 dark:border-indigo-800/30 shadow-sm shadow-indigo-100 dark:shadow-none">
                            <Sparkles className="w-5 h-5 fill-indigo-100 dark:fill-indigo-900/50" />
                        </button>
                    </div>
                </div>
            );
        })}
      </div>

      {/* Expansion Section */}
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/30 dark:bg-blue-900/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
                <div>
                   <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Buscando la Tribu (Expansión)</h3>
                   <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-lg">
                       "Eres el promedio de las 5 personas que te rodean." En busca de mentes maestras para elevar el estándar.
                   </p>
                </div>
                <div className="text-right">
                    <span className="text-5xl font-black text-blue-600 dark:text-blue-400 drop-shadow-sm">{Math.round(expansionProgress)}%</span>
                </div>
            </div>

            <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-10 border-4 border-white dark:border-slate-900 shadow-inner">
                <div 
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-1000 ease-out shadow-lg" 
                    style={{ width: `${expansionProgress}%` }}
                ></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                    onClick={() => handleOpenEdit(null, true)}
                    className="flex items-center justify-center gap-4 p-6 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-blue-400 dark:hover:border-blue-600 hover:text-blue-500 transition-all group bg-slate-50 dark:bg-slate-800/30"
                >
                    <Plus className="w-6 h-6 group-hover:scale-125 transition-transform" />
                    <span className="font-black uppercase text-xs tracking-widest">Añadir Candidato a la Tribu</span>
                </button>

                <div className="p-6 bg-amber-50/50 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-900/30 flex items-start gap-4">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-amber-500">
                        <Lightbulb className="w-5 h-5 fill-amber-100 dark:fill-amber-900/50" />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-1">Estrategia de Expansión</h4>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 italic leading-snug opacity-80">
                            IA: "Busca emprendedores en sectores complementarios a tu visión 2026."
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title={editingPerson ? "Editar Perfil" : (isCandidateMode ? "Añadir Candidato" : "Nuevo Miembro")}
      >
        <div className="space-y-6">
            <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Nombre Completo</label>
                <input 
                    type="text"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none focus:ring-4 focus:ring-blue-500/10 transition text-lg font-bold"
                    placeholder="Ej: Elon Musk"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Rol / Ocupación</label>
                    <input 
                        type="text"
                        value={form.role}
                        onChange={e => setForm({...form, role: e.target.value})}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none focus:ring-4 focus:ring-blue-500/10 transition text-sm font-bold"
                        placeholder="Emprendedor..."
                    />
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Color Avatar</label>
                    <select 
                        value={form.avatar_color}
                        onChange={e => setForm({...form, avatar_color: e.target.value})}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none focus:ring-4 focus:ring-blue-500/10 transition text-sm font-bold"
                    >
                        <option value="blue">Azul</option>
                        <option value="pink">Rosa</option>
                        <option value="emerald">Verde</option>
                        <option value="amber">Ámbar</option>
                        <option value="indigo">Índigo</option>
                        <option value="rose">Rojo</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Descripción de la Relación</label>
                <textarea 
                    value={form.relationship}
                    onChange={e => setForm({...form, relationship: e.target.value})}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none focus:ring-4 focus:ring-blue-500/10 transition text-sm font-medium min-h-[80px]"
                    placeholder="Describe por qué esta persona es clave..."
                />
            </div>
            <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Recordatorio Personal / Notas</label>
                <input 
                    type="text"
                    value={form.personal_reminder}
                    onChange={e => setForm({...form, personal_reminder: e.target.value})}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none focus:ring-4 focus:ring-blue-500/10 transition text-sm font-medium italic"
                    placeholder="Un detalle que no debes olvidar..."
                />
            </div>
            <Button onClick={handleSavePerson} className="w-full py-5 text-sm uppercase tracking-widest font-black">
                {editingPerson ? "Guardar Cambios" : "Integrar a la Tribu"}
            </Button>
        </div>
      </Modal>

      {/* ADVICE MODAL */}
      <Modal
        isOpen={isAdviceModalOpen}
        onClose={() => setIsAdviceModalOpen(false)}
        title={`Conectar con ${targetPerson?.name}`}
      >
        {isGeneratingAdvice ? (
            <div className="py-12 text-center">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Consultando al Coach IA...</p>
            </div>
        ) : adviceData ? (
            <div className="space-y-8 animate-in zoom-in-95 duration-500">
                <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2rem] border border-indigo-100 dark:border-indigo-800/30">
                    <h5 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5" /> Consejo Estratégico
                    </h5>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed italic">
                        "{adviceData.consejo}"
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 px-2">
                    <div>
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tema de Conversación</h5>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 font-black text-slate-800 dark:text-white">
                            {adviceData.tema}
                        </div>
                    </div>
                    <div>
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ice-Breaker Significativo</h5>
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900 text-lg font-black text-indigo-600 dark:text-indigo-400 italic">
                            "{adviceData.pregunta}"
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button onClick={copyAdvice} className="flex-1 py-4 text-xs tracking-widest bg-indigo-600 hover:bg-indigo-700 rounded-2xl">
                        <Copy className="w-4 h-4" /> Copiar Plan
                    </Button>
                    <Button onClick={() => setIsAdviceModalOpen(false)} variant="secondary" className="flex-1 py-4 text-xs tracking-widest rounded-2xl">
                        Hecho
                    </Button>
                </div>
            </div>
        ) : (
            <div className="py-12 text-center text-red-500">Error al contactar con la IA.</div>
        )}
      </Modal>
    </div>
  );
};

export default NetworkTab;
