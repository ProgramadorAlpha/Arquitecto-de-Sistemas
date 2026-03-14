import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';

// POLÍTICA AI_STRICT_POLICY.md: Este componente usa IA directa.
// No depende de Firestore para mostrar el mantra — el state es local.

const MantraBanner = () => {
  const { user } = useAuth();
  const { actions } = useAppContext();
  const [mantra, setMantra] = useState('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Generar mantra al cargar si el usuario está autenticado
  useEffect(() => {
    if (user && !generated) {
      generateMantra();
    }
  }, [user]);

  const generateMantra = async () => {
    setLoading(true);
    try {
      const variation = Math.random().toFixed(6);
      const prompt = `Genera un mantra estoico, brutalmente honesto y poderoso para un arquitecto de sistemas de alto rendimiento para el día de hoy (${today}). Máximo 15 palabras. Que inspire disciplina férrea y foco láser. Devuelve SOLO el texto, sin comillas adicionales. Variación: ${variation}`;
      
      const res = await actions.callAI(
        prompt,
        "Eres una IA de mentalidad de acero diseñada para forjar la disciplina de un guerrero moderno."
      );
      
      if (res && res.trim()) {
        setMantra(res.trim());
        setGenerated(true);
      } else {
        setMantra("Ejecuta con absoluta precisión. Hoy.");
      }
    } catch (err) {
      console.error("Error generating mantra:", err);
      setMantra("La disciplina forja imperios. Foco brutal.");
    } finally {
      setLoading(false);
    }
  };

  const displayMantra = mantra || "Iniciando protocolo de mentalidad...";

  if (loading && !mantra) return (
    <div className="mb-10 p-6 bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] border border-blue-100 dark:border-blue-900/20 flex items-center gap-6 animate-pulse">
        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/40 rounded-2xl"></div>
        <div className="flex-1 space-y-2">
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
        </div>
    </div>
  );

  return (
    <div className="mb-6 md:mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800/40 dark:to-blue-900/10 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-blue-100 dark:border-blue-900/20 flex flex-col md:flex-row items-center gap-6 shadow-sm relative overflow-hidden group">
         <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all duration-700"></div>
         
         <div className="bg-white dark:bg-slate-800 w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-blue-100 dark:shadow-none shrink-0 border border-blue-50 dark:border-blue-900/30">
            <Sparkles className="text-blue-500 w-8 h-8 fill-blue-50" />
         </div>
         <div className="flex-1 text-center md:text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/60 mb-2 flex items-center justify-center md:justify-start gap-3">
               Mantra del Guerrero
               <button 
                 onClick={generateMantra}
                 disabled={loading}
                 className="hover:rotate-180 transition-transform duration-500 p-1 rounded-md hover:bg-blue-500/10"
                 title="Generar nuevo mantra"
               >
                 <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
               </button>
            </p>
            <p className="text-slate-800 dark:text-slate-100 font-serif italic text-xl md:text-2xl leading-relaxed tracking-tight group-hover:scale-[1.01] transition-transform duration-500">
               "{displayMantra}"
            </p>
         </div>
      </div>
    </div>
  );
};

export default MantraBanner;
