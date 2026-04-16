import React from 'react';
import { ShieldCheck, Crosshair, Zap, Rocket, Feather, X } from 'lucide-react';

const ManifestoModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-500"
        onClick={onClose}
      ></div>
      
      {/* Contenedor tipo pergamino/documento premium */}
      <div className="relative bg-[#fdfbf7] dark:bg-[#0f1219] w-full max-w-2xl max-h-[85vh] rounded-xl shadow-2xl border-4 border-[#e5dcd3] dark:border-slate-800 animate-in zoom-in-95 duration-500 overflow-hidden flex flex-col font-serif">
        
        {/* Cabecera / Decoración antigua - textura */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] opacity-20 dark:opacity-5 pointer-events-none mix-blend-multiply dark:mix-blend-screen"></div>
        
        {/* Cierre */}
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-slate-200/50 dark:bg-slate-800/50 hover:bg-red-500 hover:text-white rounded-full transition-colors text-slate-500 dark:text-slate-400"
        >
            <X className="w-5 h-5" />
        </button>

        <div className="flex-1 px-8 py-12 md:py-16 overflow-y-auto premium-scrollbar relative z-0 scroll-smooth pr-2">
            {/* Título */}
            <div className="text-center mb-12">
                <Feather className="w-12 h-12 mx-auto text-[#8c5a2b] dark:text-[#c48e58] mb-4 opacity-80" />
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">El Manifiesto <br/><span className="text-[#8c5a2b] dark:text-[#c48e58] text-[0.45em] tracking-[0.3em] font-sans block mt-4">Del Arquitecto de Sistemas</span></h2>
                <div className="w-24 h-1 bg-[#8c5a2b]/30 mx-auto mt-6 rounded-full dark:bg-[#c48e58]/30"></div>
            </div>

            {/* Contenido */}
            <div className="space-y-10 text-slate-800 dark:text-slate-300 leading-relaxed text-lg mx-auto sm:px-6">
                <p className="first-letter:text-7xl first-letter:font-black first-letter:text-[#8c5a2b] dark:first-letter:text-[#c48e58] first-letter:mr-3 first-letter:float-left first-letter:leading-none">
                    No estamos aquí para ser promedio. Hemos declarado la guerra total a la mediocridad, a la procrastinación y a las excusas. El mundo está lleno de personas que desean el éxito, pero nosotros somos los pocos dispuestos a <strong className="text-slate-900 dark:text-white">construir los sistemas inquebrantables</strong> que lo garantizan.
                </p>

                <div className="bg-[#f3eadf] dark:bg-amber-900/10 p-6 md:p-8 rounded-2xl border-l-4 border-l-[#8c5a2b] dark:border-l-[#c48e58] shadow-inner relative mt-12 transition-all hover:-translate-y-1">
                    <ShieldCheck className="absolute -top-5 -left-5 w-10 h-10 text-[#8c5a2b] dark:text-[#c48e58] bg-[#fdfbf7] dark:bg-slate-900 rounded-full border border-[#e5dcd3] dark:border-slate-800 p-1" />
                    <h3 className="text-[#8c5a2b] dark:text-[#c48e58] font-bold font-sans uppercase tracking-[0.2em] text-sm mb-3">I. La Ley del Sistema</h3>
                    <p className="text-sm md:text-base font-medium">Tú no te elevas al nivel de tus metas, caes al nivel de tus sistemas. Un deseo sin un plan impecable es una fantasía infantil. <strong className="text-slate-900 dark:text-white">Documentamos, automatizamos y ejecutamos.</strong></p>
                </div>

                <div className="bg-[#eaf1f8] dark:bg-blue-900/10 p-6 md:p-8 rounded-2xl border-l-4 border-l-blue-700 dark:border-l-blue-500 shadow-inner relative transition-all hover:-translate-y-1">
                    <Crosshair className="absolute -top-5 -left-5 w-10 h-10 text-blue-700 dark:text-blue-500 bg-[#fdfbf7] dark:bg-slate-900 rounded-full border border-[#e5dcd3] dark:border-slate-800 p-1" />
                    <h3 className="text-blue-900 dark:text-blue-400 font-bold font-sans uppercase tracking-[0.2em] text-sm mb-3">II. El Poder del Enfoque (Deep Work)</h3>
                    <p className="text-sm md:text-base font-medium">El mayor activo de la era moderna no es el dinero, es tu atención focalizada. Protejo mis bloques de tiempo sagrados con la vida misma. Durante el trabajo profundo, <strong className="text-slate-900 dark:text-white">el resto del mundo deja de existir.</strong></p>
                </div>

                <div className="bg-[#e6f4ea] dark:bg-emerald-900/10 p-6 md:p-8 rounded-2xl border-l-4 border-l-emerald-700 dark:border-l-emerald-500 shadow-inner relative transition-all hover:-translate-y-1">
                    <Zap className="absolute -top-5 -left-5 w-10 h-10 text-emerald-700 dark:text-emerald-500 bg-[#fdfbf7] dark:bg-slate-900 rounded-full border border-[#e5dcd3] dark:border-slate-800 p-1" />
                    <h3 className="text-emerald-900 dark:text-emerald-400 font-bold font-sans uppercase tracking-[0.2em] text-sm mb-3">III. Regla del Plan B</h3>
                    <p className="text-sm md:text-base font-medium">Los días perfectos raramente suceden. El guerrero verdadero se mide por lo que hace cuando todo sale mal. Nunca hay cero progreso. <strong className="text-slate-900 dark:text-white">El Plan B asegura la victoria táctica diaria.</strong></p>
                </div>

                <div className="bg-[#f3ebf8] dark:bg-purple-900/10 p-6 md:p-8 rounded-2xl border-l-4 border-l-purple-700 dark:border-l-purple-500 shadow-inner relative transition-all hover:-translate-y-1">
                    <Rocket className="absolute -top-5 -left-5 w-10 h-10 text-purple-700 dark:text-purple-500 bg-[#fdfbf7] dark:bg-slate-900 rounded-full border border-[#e5dcd3] dark:border-slate-800 p-1" />
                    <h3 className="text-purple-900 dark:text-purple-400 font-bold font-sans uppercase tracking-[0.2em] text-sm mb-3">IV. Implacabilidad Relentless</h3>
                    <p className="text-sm md:text-base font-medium">Si caigo hoy, ejecuto mañana con doble ferocidad. El progreso exponencial es el resultado inevitable de una consistencia obsesiva, no de la intensidad momentánea. <strong className="text-slate-900 dark:text-white">Nunca dejes que un fallo se convierta en dos.</strong></p>
                </div>

                <blockquote className="border-t-2 border-b-2 border-slate-900 dark:border-white py-8 my-12 italic font-semibold text-2xl md:text-3xl text-center text-slate-900 dark:text-white tracking-tight">
                    "Soy el Arquitecto de mi propia realidad. <br/><span className="text-[#8c5a2b] dark:text-[#c48e58]">Escribo el código. Diseño la rutina. Ejecuto el plan.</span> <br/>Sin excusas. Sin atajos. Solo resultados."
                </blockquote>

                <div className="text-center pt-8">
                    <div className="w-16 h-16 border-2 border-[#8c5a2b] dark:border-[#c48e58] rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="font-serif italic font-bold text-2xl text-[#8c5a2b] dark:text-[#c48e58]">S</span>
                    </div>
                    <p className="uppercase text-[10px] tracking-[0.3em] font-sans font-bold text-slate-500 dark:text-slate-400">Firmado bajo juramento solemne <br/> de excelencia inflexible</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ManifestoModal;
