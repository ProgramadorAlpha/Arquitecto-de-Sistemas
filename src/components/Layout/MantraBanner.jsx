import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { callGeminiAI } from '../../services/ai';

const MantraBanner = () => {
  const { user } = useAuth();
  const [mantra, setMantra] = useState('');
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) return;
    
    const unsub = onSnapshot(doc(db, 'daily_content', today), async (d) => {
      if (d.exists() && d.data().mantra) {
        setMantra(d.data().mantra);
        setLoading(false);
      } else {
        // Generate mantra if not exists
        // Safe call to generate
        generateMantra();
      }
    });

    return unsub;
  }, [user, today]);

  const generateMantra = async () => {
    try {
      const prompt = "Genera un mantra estoico y poderoso para el día de hoy (máximo 15 palabras). Que inspire acción masiva y claridad mental. Devuelve SOLO el texto.";
      const res = await callGeminiAI(prompt, "Eres un filósofo estoico de alto rendimiento.");
      if (res) {
          await setDoc(doc(db, 'daily_content', today), { mantra: res.trim() }, { merge: true });
      }
    } catch (err) {
      console.error("Error generating mantra:", err);
      // Don't throw, just set fallback
      setMantra("La disciplina es libertad.");
      setLoading(false);
    }
  };

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
    <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800/40 dark:to-blue-900/10 p-8 rounded-[3rem] border border-blue-100 dark:border-blue-900/20 flex flex-col md:flex-row items-center gap-6 shadow-sm relative overflow-hidden group">
         <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all duration-700"></div>
         
         <div className="bg-white dark:bg-slate-800 w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-blue-100 dark:shadow-none shrink-0 border border-blue-50 dark:border-blue-900/30">
            <Sparkles className="text-blue-500 w-8 h-8 fill-blue-50" />
         </div>
         <div className="flex-1 text-center md:text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/60 mb-2">Mantra del Guerrero</p>
            <p className="text-slate-800 dark:text-slate-100 font-serif italic text-2xl leading-relaxed tracking-tight">
               "{mantra}"
            </p>
         </div>
      </div>
    </div>
  );
};

export default MantraBanner;
