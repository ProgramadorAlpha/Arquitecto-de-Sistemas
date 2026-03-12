import React, { useState, useEffect } from 'react';
import { 
  Check, Target, Zap, Shield, Layout, Save, X, 
  Sun, Moon, Calendar, Users, Briefcase, Coffee, 
  BookOpen, Activity, Heart, Clock, ChevronRight, Anchor,
  Plus, Trash2, Quote, ScrollText, Home, Sparkles, Loader,
  TrendingUp, DollarSign, Award, MessageCircle, ClipboardList,
  Brain, LayoutTemplate, ArrowRight
} from 'lucide-react';

// --- COMPONENTE PRINCIPAL ---
export default function CEOLifeOS() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isPlanB, setIsPlanB] = useState(false);
  const [showManifestoModal, setShowManifestoModal] = useState(false);
  
  // --- ESTADO PARA GEMINI AI ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [reflectionPrompt, setReflectionPrompt] = useState(null);
  const [conversationStarter, setConversationStarter] = useState(null);
  const [weeklyBreakdown, setWeeklyBreakdown] = useState(null);
  
  // --- ESTADO: DASHBOARD DIARIO (CORE SYSTEM) ---
  const [dailyHabits, setDailyHabits] = useState({
    movement: false,    // Tesla 3 (15m)
    meditation: false,  // Tesla 6 (10m)
    reflection: false,  // Tesla 9 (6m)
    reading: false,     // (19m)
    greenJuice: false,
    tvLimit: false,
  });

  // --- ESTADO: PLANIFICACIÓN SEMANAL (NUEVO) ---
  const [weeklyData, setWeeklyData] = useState({
    brainDump: '',
    priority1: '',
    priority2: '',
    priority3: '',
    checklist: {
      finances: false,
      delegation: false,
      review: false,
      schedule: false
    }
  });

  // --- ESTADO: VISIÓN MENSUAL ---
  const [monthlyData, setMonthlyData] = useState({
    wins: '',
    drains: '',
    intention: '',
    revenueLast: '',
    revenueGoal: '',
    celebration: ''
  });

  // --- ESTADO: RED DE APOYO (TRIBU) ---
  const [network, setNetwork] = useState([
    { id: 1, name: "Esposa", role: "Pareja", lastConnect: new Date(Date.now() - 86400000 * 2).toLocaleDateString(), action: "Cita semanal", rule: "🚫 No hablar de obra", status: 'good' },
    { id: 2, name: "Hijo (21)", role: "Sucesor/Marketing", lastConnect: new Date(Date.now() - 86400000 * 1).toLocaleDateString(), action: "Mentoria de Vida", rule: "👂 Escuchar más, mandar menos", status: 'warning' },
    { id: 3, name: "Primo", role: "Arquitecto/Amigo", lastConnect: new Date(Date.now() - 86400000 * 5).toLocaleDateString(), action: "Café de Relax", rule: "☕ Solo disfrute", status: 'good' }
  ]);

  // --- ESTADO: CONSTRUCTOR DE SISTEMAS ---
  const [customSystems, setCustomSystems] = useState([
    {
      id: 1,
      area: 'Espiritual',
      title: "Protocolo Jueves",
      goal: "Ministerio enfocado",
      identity: "Siervo diligente",
      action: "Preparar maletín",
      trigger: "Al llegar de obra (7:00 PM)",
      environment: "Ropa lista en la cama",
      planB: "Solo leer el texto diario",
      completedToday: false
    },
    {
      id: 2,
      area: 'Familia',
      title: "Cita con Esposa",
      goal: "Conexión profunda",
      identity: "Esposo presente",
      action: "Dejar celular en el auto",
      trigger: "Al entrar al restaurante",
      environment: "Reserva hecha el lunes",
      planB: "Caminata de 15 min sin celular",
      completedToday: false
    }
  ]);
  
  const [isCreating, setIsCreating] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [newSystemData, setNewSystemData] = useState({
    area: 'Personal', title: '', goal: '', identity: '', action: '', trigger: '', environment: '', planB: ''
  });

  // --- INTEGRACIÓN GEMINI API ---
  const apiKey = ""; // API Key injected by environment

  const callGemini = async (prompt) => {
    setIsGenerating(true);
    setAiError(null);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );
      
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      return data.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (error) {
      setAiError("Error conectando con tu IA Arquitecto. Intenta de nuevo.");
      console.error(error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSystemWithAI = async () => {
    if (!newSystemData.goal) {
      setAiError("Por favor define una meta primero.");
      return;
    }

    const prompt = `
      Actúa como un experto en hábitos (Atomic Habits, Tiny Habits) y coach ejecutivo.
      El usuario quiere un sistema para el área "${newSystemData.area}" con la meta: "${newSystemData.goal}".
      
      Genera un objeto JSON VÁLIDO (sin markdown, solo el json plano) con estos campos en Español:
      {
        "title": "Nombre corto y atractivo del sistema",
        "identity": "Afirmación de identidad (Ej: Soy un...)",
        "action": "Acción mínima viable (<2 min)",
        "trigger": "Un gatillo específico común en la rutina diaria",
        "environment": "Cómo preparar el entorno para eliminar fricción",
        "planB": "Versión de emergencia ridículamente fácil"
      }
    `;

    const result = await callGemini(prompt);
    if (result) {
      try {
        const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
        const generatedSystem = JSON.parse(cleanJson);
        setNewSystemData(prev => ({ ...prev, ...generatedSystem }));
        setWizardStep(1); 
      } catch (e) {
        setAiError("La IA generó un formato inesperado. Intenta de nuevo.");
      }
    }
  };

  const generateDailyReflection = async () => {
    const prompt = `
      Genera una única pregunta de reflexión profunda y corta (máximo 20 palabras) para un CEO y hombre de fe, basada en principios del Estoicismo o liderazgo de servicio. 
      La pregunta debe invitar a la acción o la gratitud. En Español.
    `;
    const result = await callGemini(prompt);
    if (result) setReflectionPrompt(result);
  };

  const generateConversationStarter = async (personName, role) => {
    const prompt = `
      Dame un tema de conversación o pregunta interesante (NO sobre trabajo, construcción o negocios) para hablar con mi ${personName} que es mi ${role}.
      Algo que fomente conexión emocional, sueños o risas. Máximo 20 palabras. En Español.
    `;
    const result = await callGemini(prompt);
    if (result) setConversationStarter(result);
  };

  const generateBreakdown = async () => {
    const bigTask = weeklyData.priority1 || "mi proyecto principal";
    const prompt = `
      Tengo una gran prioridad para esta semana: "${bigTask}".
      Actúa como un Project Manager experto. Dame 3 sub-tareas muy concretas y accionables para avanzar en esto sin abrumarme.
      Formato lista corta en Español.
    `;
    const result = await callGemini(prompt);
    if (result) setWeeklyBreakdown(result);
  };

  // --- HANDLERS ---
  const handleMonthlyChange = (e) => setMonthlyData({ ...monthlyData, [e.target.name]: e.target.value });
  const handleWizardChange = (e) => setNewSystemData({ ...newSystemData, [e.target.name]: e.target.value });
  const handleWeeklyChange = (e) => setWeeklyData({ ...weeklyData, [e.target.name]: e.target.value });
  const toggleWeeklyCheck = (key) => setWeeklyData(prev => ({ ...prev, checklist: { ...prev.checklist, [key]: !prev.checklist[key] } }));
  
  const saveNewSystem = () => {
    setCustomSystems([...customSystems, { ...newSystemData, id: Date.now(), completedToday: false }]);
    setIsCreating(false);
    setWizardStep(0);
    setNewSystemData({ area: 'Personal', title: '', goal: '', identity: '', action: '', trigger: '', environment: '', planB: '' });
  };

  const toggleDaily = (key) => setDailyHabits(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleCustom = (id) => setCustomSystems(sys => sys.map(s => s.id === id ? { ...s, completedToday: !s.completedToday } : s));

  const updateConnection = (id) => {
    setNetwork(network.map(p => p.id === id ? { ...p, lastConnect: new Date().toLocaleDateString(), status: 'good' } : p));
  };

  const dailyTotal = isPlanB ? 2 : 4; 
  const dailyDone = (dailyHabits.movement ? 1 : 0) + (dailyHabits.meditation ? 1 : 0) + (!isPlanB && dailyHabits.reflection ? 1 : 0) + (!isPlanB && dailyHabits.reading ? 1 : 0);
  const progressPercentage = Math.min(100, Math.round((dailyDone / dailyTotal) * 100));

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      
      {/* --- HEADER HOLÍSTICO --- */}
      <div className="bg-slate-900 text-white pt-10 pb-24 px-6 rounded-b-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-400 via-slate-900 to-slate-900"></div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                 <Shield className="text-blue-400" size={24} />
                 <h1 className="text-3xl font-bold tracking-tight">ARQUITECTO DE SISTEMAS <span className="text-blue-400">2026</span></h1>
              </div>
              <p className="text-slate-400 text-sm max-w-md italic border-l-2 border-blue-500 pl-3">
                "No dependas de la motivación fluctuante. Construye rutinas a prueba de fallos."
              </p>
            </div>
            
            <button 
              onClick={() => setShowManifestoModal(true)}
              className="group flex flex-col items-center gap-1 bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/10 transition-all"
            >
              <ScrollText size={20} className="text-yellow-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Leer Manifiesto</span>
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {[
              { id: 'dashboard', label: 'Comando Central', icon: <Activity size={18} /> },
              { id: 'weekly', label: 'Plan Semanal', icon: <ClipboardList size={18} /> },
              { id: 'monthly', label: 'Visión Mensual', icon: <Target size={18} /> },
              { id: 'systems', label: 'Mis Sistemas', icon: <Layout size={18} /> },
              { id: 'network', label: 'Tribu & Apoyo', icon: <Users size={18} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all font-bold whitespace-nowrap border ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50' 
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-10">
        
        {/* --- PESTAÑA 1: DASHBOARD --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isPlanB ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                   {isPlanB ? <Shield size={20} /> : <Zap size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{isPlanB ? 'MODO SUPERVIVENCIA' : 'MODO EXPANSIÓN (CEO)'}</h3>
                  <p className="text-xs text-slate-500">{isPlanB ? 'Objetivo: No romper la cadena (Mínimo viable)' : 'Objetivo: Dominación total del día'}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPlanB(!isPlanB)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${
                  isPlanB ? 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                }`}
              >
                {isPlanB ? 'Restaurar Plan A' : 'Activar Plan B'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-100">
                  <div className="bg-gradient-to-r from-orange-400 to-amber-500 p-5 text-white flex justify-between items-center">
                    <h2 className="font-bold flex items-center gap-2"><Sun size={20} /> Mañana Tesla (3-6-9)</h2>
                    <span className="text-3xl font-bold opacity-90">{progressPercentage}%</span>
                  </div>
                  <div className="p-5 space-y-1">
                    <div className={`flex items-center gap-4 p-3 rounded-xl transition-all ${dailyHabits.movement ? 'bg-orange-50' : 'hover:bg-slate-50'}`}>
                      <button onClick={() => toggleDaily('movement')} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${dailyHabits.movement ? 'bg-orange-500 border-orange-500' : 'border-slate-300'}`}>
                        {dailyHabits.movement && <Check size={14} className="text-white" />}
                      </button>
                      <div className="flex-1">
                        <p className="font-bold text-slate-700">Movimiento (Tesla 3)</p>
                        <p className="text-xs text-slate-500">{isPlanB ? '10 min estiramiento' : '15 min (3 ejercicios x 3 series)'}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-4 p-3 rounded-xl transition-all ${dailyHabits.meditation ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                      <button onClick={() => toggleDaily('meditation')} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${dailyHabits.meditation ? 'bg-blue-500 border-blue-500' : 'border-slate-300'}`}>
                        {dailyHabits.meditation && <Check size={14} className="text-white" />}
                      </button>
                      <div className="flex-1">
                        <p className="font-bold text-slate-700">Meditación (Tesla 6)</p>
                        <p className="text-xs text-slate-500">{isPlanB ? '5 min respiración' : '10 min silencio total'}</p>
                      </div>
                    </div>
                    {!isPlanB && (
                      <div className={`flex items-start gap-4 p-3 rounded-xl transition-all ${dailyHabits.reflection ? 'bg-purple-50' : 'hover:bg-slate-50'}`}>
                        <button onClick={() => toggleDaily('reflection')} className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${dailyHabits.reflection ? 'bg-purple-500 border-purple-500' : 'border-slate-300'}`}>
                          {dailyHabits.reflection && <Check size={14} className="text-white" />}
                        </button>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                             <div>
                               <p className="font-bold text-slate-700">Reflexión (Tesla 9)</p>
                               <p className="text-xs text-slate-500">6 min reflexión + 19 min lectura</p>
                             </div>
                             <button 
                                onClick={generateDailyReflection}
                                disabled={isGenerating}
                                className="text-purple-600 bg-purple-100 hover:bg-purple-200 p-1.5 rounded-lg transition"
                                title="Pedir pregunta a la IA"
                             >
                                {isGenerating ? <Loader className="animate-spin" size={14} /> : <Sparkles size={14} />}
                             </button>
                          </div>
                          {reflectionPrompt && (
                             <div className="mt-2 bg-purple-100 p-3 rounded-lg text-sm text-purple-900 italic border-l-2 border-purple-500 animate-in fade-in">
                                "{reflectionPrompt}"
                             </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                   <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Moon size={18} className="text-indigo-500" /> Cierre del Día</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div onClick={() => toggleDaily('greenJuice')} className={`p-4 rounded-xl border cursor-pointer transition-all ${dailyHabits.greenJuice ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                         <Zap size={20} className={dailyHabits.greenJuice ? 'text-green-600' : 'text-slate-400'} />
                         <p className="mt-2 font-bold text-sm">Jugo Verde</p>
                         <p className="text-[10px] text-slate-500">Prepara hoy, bebe mañana</p>
                      </div>
                      <div onClick={() => toggleDaily('tvLimit')} className={`p-4 rounded-xl border cursor-pointer transition-all ${dailyHabits.tvLimit ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                         <Clock size={20} className={dailyHabits.tvLimit ? 'text-indigo-600' : 'text-slate-400'} />
                         <p className="mt-2 font-bold text-sm">Límite TV</p>
                         <p className="text-[10px] text-slate-500">Max 1 peli. Dormir temprano.</p>
                      </div>
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                 <div className="bg-slate-800 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                    <Quote className="absolute top-4 right-4 text-white/10" size={40} />
                    <p className="text-xs text-blue-300 font-bold uppercase tracking-wider mb-2">Recordatorio del Manifiesto</p>
                    <p className="font-serif italic text-lg leading-relaxed">"La inacción no es neutral; es una elección activa por la mediocridad."</p>
                 </div>

                 <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Anchor size={16} /> Bloques Sagrados</h3>
                    <div className="space-y-3">
                       <div className="flex items-center gap-3 p-3 bg-sky-50 rounded-xl border border-sky-100">
                          <div className="bg-sky-200 p-2 rounded-lg text-sky-700 font-bold text-xs">JUE</div>
                          <div>
                             <p className="font-bold text-sky-900 text-sm">Ministerio</p>
                             <p className="text-xs text-sky-600">08:00 PM</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3 p-3 bg-sky-50 rounded-xl border border-sky-100">
                          <div className="bg-sky-200 p-2 rounded-lg text-sky-700 font-bold text-xs">DOM</div>
                          <div>
                             <p className="font-bold text-sky-900 text-sm">Estudio Atalaya</p>
                             <p className="text-xs text-sky-600">10:00 AM - 12:00 PM</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* --- PESTAÑA 2 (NUEVA): PLANIFICACIÓN SEMANAL --- */}
        {activeTab === 'weekly' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-8 rounded-3xl shadow-xl">
               <div className="flex items-center gap-4 mb-4">
                  <div className="bg-white/10 p-3 rounded-2xl"><Calendar size={28} className="text-indigo-400" /></div>
                  <div>
                    <h2 className="text-2xl font-bold">Ritual de Domingo</h2>
                    <p className="text-indigo-200 text-sm">"Una hora de planificación ahorra diez horas de ejecución."</p>
                  </div>
               </div>
               
               {/* Checklist Semanal */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {[
                    { key: 'finances', label: 'Revisar cuentas/pagos pendientes de obras' },
                    { key: 'delegation', label: 'Asignar tarea administrativa al hijo (Marketing)' },
                    { key: 'review', label: 'Revisar logros de la semana pasada' },
                    { key: 'schedule', label: 'Bloquear horas de Gym y Ministerio' }
                  ].map(item => (
                    <div key={item.key} onClick={() => toggleWeeklyCheck(item.key)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${weeklyData.checklist[item.key] ? 'bg-indigo-500/20 border-indigo-400 text-white' : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'}`}>
                       <div className={`w-5 h-5 rounded border flex items-center justify-center ${weeklyData.checklist[item.key] ? 'bg-indigo-500 border-indigo-500' : 'border-slate-500'}`}>
                          {weeklyData.checklist[item.key] && <Check size={14} />}
                       </div>
                       <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {/* Columna 1: Las 3 Rocas */}
               <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-slate-800 flex items-center gap-2"><Target className="text-red-500" /> Las 3 Rocas (Prioridades)</h3>
                     <button 
                        onClick={generateBreakdown}
                        disabled={isGenerating || !weeklyData.priority1}
                        className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg font-bold flex items-center gap-1 hover:bg-indigo-100 transition disabled:opacity-50"
                     >
                        {isGenerating ? <Loader size={12} className="animate-spin" /> : <Sparkles size={12} />} IA: Desglosar #1
                     </button>
                  </div>
                  
                  <div className="space-y-4">
                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">1. El Dinosaurio (Lo más difícil)</label>
                        <input name="priority1" value={weeklyData.priority1} onChange={handleWeeklyChange} className="w-full p-3 bg-red-50/50 border border-red-100 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-red-200 outline-none" placeholder="Ej. Cerrar presupuesto Obra X..." />
                        {weeklyBreakdown && (
                           <div className="mt-2 bg-indigo-50 p-3 rounded-lg text-sm text-indigo-800 border-l-4 border-indigo-500 animate-in slide-in-from-top-2">
                              <p className="font-bold text-xs uppercase mb-1 flex items-center gap-1"><Sparkles size={10}/> Plan de Ataque Sugerido:</p>
                              <div className="whitespace-pre-line">{weeklyBreakdown}</div>
                           </div>
                        )}
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">2. Tarea Clave (Delegable)</label>
                        <input name="priority2" value={weeklyData.priority2} onChange={handleWeeklyChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="Ej. Revisión con el Arquitecto..." />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">3. Personal / Salud</label>
                        <input name="priority3" value={weeklyData.priority3} onChange={handleWeeklyChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-green-200 outline-none" placeholder="Ej. No fallar al Gym ni un día..." />
                     </div>
                  </div>
               </div>

               {/* Columna 2: Vaciado Mental */}
               <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Brain className="text-slate-400" /> Vaciado Mental</h3>
                  <textarea 
                     name="brainDump"
                     value={weeklyData.brainDump}
                     onChange={handleWeeklyChange}
                     className="flex-1 w-full bg-slate-50 border-none rounded-xl p-4 text-sm text-slate-600 placeholder-slate-400 resize-none focus:ring-2 focus:ring-indigo-100 outline-none min-h-[200px]"
                     placeholder="Escribe aquí todo lo que tienes en la cabeza para sacarlo y dejar de preocuparte..."
                  />
                  <p className="text-[10px] text-slate-400 mt-2 text-center">"Tu mente es para tener ideas, no para guardarlas." - GTD</p>
               </div>
            </div>
          </div>
        )}

        {/* --- PESTAÑA 3: MIS SISTEMAS --- */}
        {activeTab === 'systems' && (
          <div>
             <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Biblioteca de Sistemas</h2>
                  <p className="text-slate-500">Tus protocolos para Familia, Iglesia y Negocio.</p>
                </div>
                <button 
                  onClick={() => setIsCreating(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                >
                  <Plus size={18} /> Crear Nuevo
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customSystems.map(system => (
                  <div key={system.id} className={`bg-white p-6 rounded-3xl border transition-all hover:shadow-lg ${system.completedToday ? 'border-green-300 bg-green-50/30' : 'border-slate-100'}`}>
                     <div className="flex justify-between items-start mb-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                          ${system.area === 'Espiritual' ? 'bg-sky-100 text-sky-700' : 
                            system.area === 'Familia' ? 'bg-pink-100 text-pink-700' : 
                            system.area === 'Negocio' ? 'bg-slate-100 text-slate-700' : 'bg-orange-100 text-orange-700'}
                        `}>
                          {system.area}
                        </span>
                        <div className="flex items-center gap-2">
                           <button onClick={() => toggleCustom(system.id)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${system.completedToday ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'}`}>
                              <Check size={16} />
                           </button>
                        </div>
                     </div>

                     <h3 className="font-bold text-lg text-slate-800 mb-1">{system.title}</h3>
                     <p className="text-xs text-slate-400 mb-4 italic">"{system.identity}"</p>

                     <div className="space-y-3 text-sm">
                        <div className="flex gap-3">
                           <Zap size={16} className="text-yellow-500 shrink-0" />
                           <div>
                              <p className="font-bold text-slate-700">Acción:</p>
                              <p className="text-slate-600">{system.action}</p>
                           </div>
                        </div>
                        <div className="flex gap-3">
                           <Layout size={16} className="text-purple-500 shrink-0" />
                           <div>
                              <p className="font-bold text-slate-700">Gatillo:</p>
                              <p className="text-slate-600">{system.trigger}</p>
                           </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100">
                           <p className="text-xs font-bold text-red-400 uppercase flex items-center gap-1 mb-1">
                              <Shield size={12} /> Plan B (Emergencia)
                           </p>
                           <p className="text-xs text-slate-500 italic">{system.planB}</p>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* --- PESTAÑA 4: VISIÓN MENSUAL --- */}
        {activeTab === 'monthly' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
               {/* Decorative Circles */}
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
               <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500"></div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                 <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2"><Target className="text-emerald-400" /> Ritual de Reconexión</h2>
                    <p className="text-slate-300 mt-2 text-sm max-w-lg">
                       "Los primeros 3 días del mes no son para operar, son para dirigir el barco. Sin reflexión no hay evolución."
                    </p>
                 </div>
                 <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Próxima Sesión</p>
                    <p className="text-lg font-bold flex items-center gap-2"><Calendar size={16} /> 1-3 del Mes</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-emerald-900/30 p-5 rounded-2xl border border-emerald-500/30 backdrop-blur-sm">
                  <h3 className="font-bold text-emerald-400 mb-3 flex items-center gap-2"><TrendingUp size={18} /> ¿Qué funcionó? (Victorias)</h3>
                  <textarea 
                     name="wins" 
                     value={monthlyData.wins} 
                     onChange={handleMonthlyChange}
                     className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 text-sm resize-none focus:ring-1 focus:ring-emerald-500 outline-none h-32" 
                     placeholder="Escribe aquí tus victorias y avances..." 
                  />
                </div>
                <div className="bg-red-900/20 p-5 rounded-2xl border border-red-500/20 backdrop-blur-sm">
                  <h3 className="font-bold text-red-400 mb-3 flex items-center gap-2"><Activity size={18} /> ¿Qué drenó energía? (Eliminar)</h3>
                  <textarea 
                     name="drains" 
                     value={monthlyData.drains} 
                     onChange={handleMonthlyChange}
                     className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 text-sm resize-none focus:ring-1 focus:ring-red-500 outline-none h-32" 
                     placeholder="Escribe aquí qué debes delegar o eliminar..." 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* KPIs Financieros */}
               <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 border-b pb-4">
                     <Briefcase className="text-blue-600" size={20} /> Finanzas BuilditNow
                  </h3>
                  <div className="space-y-4">
                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Facturación Mes Pasado</label>
                        <div className="relative">
                           <DollarSign className="absolute left-3 top-3 text-slate-400" size={16} />
                           <input 
                              name="revenueLast" 
                              value={monthlyData.revenueLast} 
                              onChange={handleMonthlyChange}
                              className="w-full pl-9 p-3 bg-slate-50 rounded-xl font-mono font-bold text-slate-700 border border-slate-200 focus:outline-none focus:border-blue-500" 
                              placeholder="0.00" 
                           />
                        </div>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Meta Este Mes</label>
                        <div className="relative">
                           <DollarSign className="absolute left-3 top-3 text-emerald-500" size={16} />
                           <input 
                              name="revenueGoal" 
                              value={monthlyData.revenueGoal} 
                              onChange={handleMonthlyChange}
                              className="w-full pl-9 p-3 bg-emerald-50 rounded-xl font-mono font-bold text-emerald-700 border border-emerald-200 focus:outline-none focus:border-emerald-500" 
                              placeholder="10,000.00" 
                           />
                        </div>
                     </div>
                  </div>
               </div>

               {/* Intención y Celebración */}
               <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                     <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Sparkles className="text-purple-500" size={20} /> Intención del Mes
                     </h3>
                     <textarea 
                        name="intention" 
                        value={monthlyData.intention} 
                        onChange={handleMonthlyChange}
                        className="w-full bg-slate-50 border-none rounded-xl p-3 text-slate-700 placeholder-slate-400 text-sm resize-none focus:ring-2 focus:ring-purple-200 h-24 mb-4" 
                        placeholder="¿Cuál es la palabra o enfoque clave para este mes?" 
                     />
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                     <div className="flex items-center gap-2 mb-2">
                        <Award className="text-yellow-600" size={18} />
                        <h4 className="font-bold text-yellow-800 text-sm">Plan de Celebración</h4>
                     </div>
                     <input 
                        name="celebration" 
                        value={monthlyData.celebration} 
                        onChange={handleMonthlyChange}
                        className="w-full bg-white border border-yellow-200 rounded-lg p-2 text-sm text-yellow-900 placeholder-yellow-300 focus:outline-none" 
                        placeholder="Ej. Cena en restaurante favorito..." 
                     />
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* --- PESTAÑA 5: TRIBU & APOYO (ACTUALIZADA) --- */}
        {activeTab === 'network' && (
           <div className="space-y-6">
              
              <div className="bg-pink-50 border border-pink-100 p-6 rounded-3xl relative overflow-hidden">
                <div className="relative z-10">
                   <div className="flex items-center gap-3 mb-2">
                     <Heart className="text-pink-500 fill-pink-500" />
                     <h2 className="text-xl font-bold text-pink-900">El Círculo Íntimo</h2>
                   </div>
                   <p className="text-pink-800 text-sm max-w-lg">
                     Tu éxito como CEO no vale nada si este círculo se rompe. 
                     <br/><span className="font-bold italic opacity-80">Regla de Oro: Prohibido hablar de obra en estas citas.</span>
                   </p>
                   {conversationStarter && (
                      <div className="mt-4 bg-white/60 p-3 rounded-xl border border-pink-200 backdrop-blur-sm animate-in fade-in">
                        <p className="text-xs font-bold text-pink-400 uppercase mb-1 flex items-center gap-1"><Sparkles size={10}/> Sugerencia de Gemini:</p>
                        <p className="text-pink-900 italic text-sm">"{conversationStarter}"</p>
                      </div>
                   )}
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-200/50 rounded-full blur-3xl -mr-10 -mt-10"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {network.map(person => (
                    <div key={person.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 group hover:border-pink-200 transition-all">
                       <div className="flex justify-between items-start mb-3">
                          <div>
                             <h3 className="font-bold text-slate-800 text-lg">{person.name}</h3>
                             <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">{person.role}</p>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${person.status === 'good' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} title="Salud de Relación"></div>
                       </div>
                       
                       <div className="space-y-3 mb-4">
                          <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-2 rounded-lg">
                             <Clock size={14} className="shrink-0" /> 
                             <span className="truncate">Última vez: <span className="font-bold text-slate-700">{person.lastConnect}</span></span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500 bg-red-50 p-2 rounded-lg border border-red-50">
                             <Shield size={14} className="shrink-0 text-red-400" /> 
                             <span className="truncate text-red-800 text-xs font-medium">{person.rule}</span>
                          </div>
                       </div>

                       <div className="flex gap-2 mt-4">
                          <button 
                             onClick={() => updateConnection(person.id)}
                             className="flex-1 bg-slate-100 hover:bg-green-100 hover:text-green-700 text-slate-600 py-2 rounded-lg text-xs font-bold transition flex justify-center items-center gap-1"
                          >
                             <Check size={14} /> Registrar Cita
                          </button>
                          <button 
                             onClick={() => generateConversationStarter(person.name, person.role)}
                             disabled={isGenerating}
                             className="w-10 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg flex items-center justify-center hover:shadow-lg transition"
                             title="Pedir tema a IA"
                          >
                             {isGenerating ? <Loader size={14} className="animate-spin" /> : <MessageCircle size={16} />}
                          </button>
                       </div>
                    </div>
                 ))}
              </div>

              {/* Sección de Expansión */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100">
                <div className="flex justify-between items-end mb-4">
                   <div>
                      <h3 className="font-bold text-slate-800 mb-1">Buscando la Tribu (Expansión)</h3>
                      <p className="text-sm text-slate-500">Objetivo 2026: Encontrar 2 emprendedores en Portugal con mentalidad de crecimiento.</p>
                   </div>
                   <div className="text-right">
                      <span className="text-3xl font-bold text-blue-600">10%</span>
                   </div>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-6">
                   <div className="w-[10%] h-full bg-blue-600 rounded-full"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <button className="p-4 border border-dashed border-slate-300 rounded-xl text-slate-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 transition flex items-center justify-center gap-2 text-sm font-bold">
                      <Plus size={18} /> Añadir Posible Mentor
                   </button>
                   <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-500 flex items-center gap-3">
                      <div className="bg-white p-2 rounded-full shadow-sm">
                         <TrendingUp size={16} className="text-blue-500" />
                      </div>
                      <span>Idea: Buscar eventos en Lisboa/Algarve</span>
                   </div>
                </div>
              </div>
           </div>
        )}

        {/* --- WIZARD MODAL (CREADOR DE SISTEMAS) --- */}
        {isCreating && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                   <h3 className="font-bold">Diseñar Nuevo Sistema</h3>
                   <button onClick={() => setIsCreating(false)}><X size={24} className="text-white/50 hover:text-white" /></button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                   {/* Paso 1: Básicos + AI */}
                   {wizardStep === 0 && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                         
                         {aiError && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-2">{aiError}</div>
                         )}

                         <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Área de Vida</label>
                            <div className="flex gap-2">
                               {['Personal', 'Familia', 'Espiritual', 'Negocio'].map(area => (
                                  <button 
                                    key={area}
                                    onClick={() => setNewSystemData({...newSystemData, area})}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${newSystemData.area === area ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                                  >
                                    {area}
                                  </button>
                               ))}
                            </div>
                         </div>
                         <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">¿Cuál es tu meta?</label>
                            <div className="flex gap-2">
                               <input name="goal" value={newSystemData.goal} onChange={handleWizardChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej. Mejorar mi inglés para negocios" />
                               <button 
                                  onClick={generateSystemWithAI} 
                                  disabled={isGenerating || !newSystemData.goal}
                                  className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white px-4 rounded-xl font-bold flex flex-col items-center justify-center text-xs hover:shadow-lg disabled:opacity-50 transition-all min-w-[100px]"
                               >
                                  {isGenerating ? <Loader className="animate-spin mb-1" /> : <Sparkles className="mb-1" />}
                                  {isGenerating ? 'Creando...' : 'Diseñar con IA'}
                               </button>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 pl-1">Escribe tu meta y deja que Gemini diseñe el sistema por ti.</p>
                         </div>
                         <div className="pt-4 border-t border-slate-100 mt-4">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nombre del Sistema (Opcional)</label>
                            <input name="title" value={newSystemData.title} onChange={handleWizardChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" placeholder="Se llena automático con IA..." />
                         </div>
                         <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Identidad (Opcional)</label>
                            <input name="identity" value={newSystemData.identity} onChange={handleWizardChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" placeholder="Se llena automático con IA..." />
                         </div>
                      </div>
                   )}

                   {/* Paso 2: Acción y Gatillo */}
                   {wizardStep === 1 && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                         <div className="bg-indigo-50 p-3 rounded-lg text-xs text-indigo-800 mb-2 flex items-center gap-2">
                            <Sparkles size={14} /> Revisa lo que la IA ha creado para ti:
                         </div>
                         <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Acción Mínima Viable</label>
                            <input name="action" value={newSystemData.action} onChange={handleWizardChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" />
                         </div>
                         <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Gatillo (¿Después de qué?)</label>
                            <input name="trigger" value={newSystemData.trigger} onChange={handleWizardChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" />
                         </div>
                      </div>
                   )}

                   {/* Paso 3: Entorno y Plan B */}
                   {wizardStep === 2 && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                         <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Diseño de Entorno</label>
                            <input name="environment" value={newSystemData.environment} onChange={handleWizardChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" />
                         </div>
                         <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                            <label className="text-xs font-bold text-red-500 uppercase mb-1 block">Plan B (Emergencia)</label>
                            <input name="planB" value={newSystemData.planB} onChange={handleWizardChange} className="w-full p-2 bg-white rounded-lg border border-red-200 text-red-700" />
                         </div>
                      </div>
                   )}
                </div>

                <div className="p-4 border-t flex justify-between bg-slate-50">
                   {wizardStep > 0 ? (
                      <button onClick={() => setWizardStep(wizardStep - 1)} className="text-slate-500 font-bold px-4">Atrás</button>
                   ) : <div></div>}
                   
                   {wizardStep < 2 ? (
                      <button onClick={() => setWizardStep(wizardStep + 1)} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">Siguiente</button>
                   ) : (
                      <button onClick={saveNewSystem} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2">
                         <Save size={18} /> Guardar Sistema
                      </button>
                   )}
                </div>
             </div>
          </div>
        )}

        {/* --- MANIFIESTO MODAL (FULL SCREEN) --- */}
        {showManifestoModal && (
          <div className="fixed inset-0 bg-slate-900 z-[60] overflow-y-auto animate-in fade-in duration-300">
             <div className="max-w-3xl mx-auto min-h-screen bg-white shadow-2xl relative">
                <div className="sticky top-0 bg-slate-900 text-white p-4 flex justify-between items-center z-10 shadow-lg">
                   <h2 className="font-bold tracking-widest text-sm uppercase text-yellow-500">Manifiesto del Éxito 2026</h2>
                   <button onClick={() => setShowManifestoModal(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition"><X size={20} /></button>
                </div>
                
                <div className="p-8 md:p-12 space-y-12 font-serif text-lg leading-relaxed text-slate-800">
                   <section className="text-center border-b pb-10">
                      <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">UN COMPROMISO CON LA CONVICCIÓN</h1>
                      <p className="italic text-xl text-slate-600">"El éxito no es un accidente. Es el resultado deliberado de despertar un poder interior."</p>
                   </section>

                   <section>
                      <h3 className="text-2xl font-bold text-blue-900 mb-4 font-sans flex items-center gap-3">
                         <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm">PARTE I</span> La Mente es la Arquitecta
                      </h3>
                      <p className="mb-4">Rechazo el pensamiento limitado. Abandono para siempre la frase "no puede ser".</p>
                   </section>

                   <section>
                      <h3 className="text-2xl font-bold text-red-900 mb-4 font-sans flex items-center gap-3">
                         <span className="bg-red-100 text-red-800 px-3 py-1 rounded-lg text-sm">PARTE II</span> La Acción es mi Mandato
                      </h3>
                      <p className="mb-4">La inacción es una traición al potencial. Las ideas sin ejecución son alucinaciones.</p>
                   </section>

                   <section>
                      <h3 className="text-2xl font-bold text-green-900 mb-4 font-sans flex items-center gap-3">
                         <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm">PARTE III</span> Vender es Servir
                      </h3>
                      <p className="mb-4">Redefino la venta. No es manipular, es resolver problemas. <strong>Ayudar vende.</strong></p>
                   </section>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}