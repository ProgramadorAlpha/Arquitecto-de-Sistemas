import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, ChevronDown, X, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';

/* ══════════════════════════════════════════════════════
   PERSONALIDADES — el corazón del sistema de mantras
══════════════════════════════════════════════════════ */
export const PERSONALITIES = [
  {
    id: 'warrior',
    emoji: '⚔️',
    name: 'El Guerrero',
    tagline: 'Disciplina de acero, foco brutal.',
    gradient: 'from-red-900/80 to-orange-900/60',
    border: 'border-red-500/40',
    accent: 'text-red-400',
    accentBg: 'bg-red-500/10',
    accentRing: 'ring-red-500/50',
    badgeBg: 'bg-red-500',
    textShadow: '0 0 30px rgba(239,68,68,0.5), 0 2px 8px rgba(0,0,0,0.8)',
    labelShadow: '1px 1px 0 rgba(0,0,0,0.9), 2px 2px 0 rgba(0,0,0,0.7), 3px 3px 0 rgba(0,0,0,0.4), 0 0 20px rgba(239,68,68,0.9)',
    lineColor: 'from-transparent via-red-500/60 to-transparent',
    backdropColor: 'rgba(0,0,0,0.35)',
    description: 'Mantras de combate y disciplina extrema. Para quienes se forjan en el fuego.',
    prompt: (today) =>
      `Genera un mantra estoico, brutalmente honesto y poderoso para un arquitecto de sistemas de alto rendimiento para el día de hoy (${today}). Máximo 15 palabras. Que inspire disciplina férrea y foco láser. Devuelve SOLO el texto, sin comillas.`,
    system: 'Eres una IA de mentalidad de acero diseñada para forjar la disciplina de un guerrero moderno.',
    fallbacks: [
      'La disciplina forja imperios. Ejecuta sin piedad.',
      'Foco brutal. Sin excusas. Sin negociación con la mediocridad.',
      'Mientras otros dudan, tú ejecutas. Siempre.',
      'El dolor del esfuerzo es temporal. La rendición es permanente.',
    ],
  },
  {
    id: 'visionary',
    emoji: '🔭',
    name: 'El Visionario',
    tagline: 'Piensa en grande, actúa con claridad.',
    gradient: 'from-blue-900/80 to-indigo-900/60',
    border: 'border-blue-500/40',
    accent: 'text-blue-400',
    accentBg: 'bg-blue-500/10',
    accentRing: 'ring-blue-500/50',
    badgeBg: 'bg-blue-500',
    textShadow: '0 0 30px rgba(96,165,250,0.6), 0 2px 8px rgba(0,0,0,0.8)',
    labelShadow: '1px 1px 0 rgba(0,0,0,0.9), 2px 2px 0 rgba(0,0,0,0.7), 3px 3px 0 rgba(0,0,0,0.4), 0 0 20px rgba(96,165,250,0.9)',
    lineColor: 'from-transparent via-blue-500/60 to-transparent',
    backdropColor: 'rgba(0,0,0,0.35)',
    description: 'Perspectiva elevada, pensamiento estratégico y metas que trascienden.',
    prompt: (today) =>
      `Genera un mantra inspirador y visionario para un líder estratégico con metas a largo plazo (hoy: ${today}). Máximo 15 palabras. Que inspire pensamiento en grande y claridad estratégica. Sin comillas, solo el texto.`,
    system: 'Eres un coach visionario que inspira líderes a pensar con perspectiva de 10 años.',
    fallbacks: [
      'El futuro pertenece a quienes lo diseñan hoy.',
      'Sistemas claros crean libertad. Diseña el tuyo.',
      'La visión sin ejecución es solo imaginación. Construye.',
      'Cada hora de hoy es un ladrillo del mañana que sueñas.',
    ],
  },
  {
    id: 'sage',
    emoji: '🌿',
    name: 'El Sabio',
    tagline: 'Calma interior, sabiduría en acción.',
    gradient: 'from-emerald-900/80 to-teal-900/60',
    border: 'border-emerald-500/40',
    accent: 'text-emerald-400',
    accentBg: 'bg-emerald-500/10',
    accentRing: 'ring-emerald-500/50',
    badgeBg: 'bg-emerald-600',
    textShadow: '0 0 30px rgba(52,211,153,0.5), 0 2px 8px rgba(0,0,0,0.8)',
    labelShadow: '1px 1px 0 rgba(0,0,0,0.9), 2px 2px 0 rgba(0,0,0,0.7), 3px 3px 0 rgba(0,0,0,0.4), 0 0 20px rgba(52,211,153,0.9)',
    lineColor: 'from-transparent via-emerald-500/60 to-transparent',
    backdropColor: 'rgba(0,0,0,0.35)',
    description: 'Filosofía estoica, mindfulness y equilibrio para mentes en paz.',
    prompt: (today) =>
      `Genera un mantra filosófico, sereno y sabio inspirado en el estoicismo y el mindfulness (hoy: ${today}). Máximo 15 palabras. Que inspire ecuanimidad, presencia y sabiduría. Sin comillas, solo el texto.`,
    system: 'Eres un filósofo estoico moderno que combina sabiduría antigua con claridad contemporánea.',
    fallbacks: [
      'La paz interior es el origen de toda grandeza exterior.',
      'Controla tu respuesta, no el evento. Ahí reside tu poder.',
      'Actúa con presencia. El presente es donde vive el progreso.',
      'Sabiduría: saber cuándo actuar y cuándo soltar.',
    ],
  },
  {
    id: 'creator',
    emoji: '🎨',
    name: 'El Creador',
    tagline: 'Imaginación que construye realidades.',
    gradient: 'from-purple-900/80 to-pink-900/60',
    border: 'border-purple-500/40',
    accent: 'text-purple-400',
    accentBg: 'bg-purple-500/10',
    accentRing: 'ring-purple-500/50',
    badgeBg: 'bg-purple-600',
    textShadow: '0 0 30px rgba(168,85,247,0.5), 0 2px 8px rgba(0,0,0,0.8)',
    labelShadow: '1px 1px 0 rgba(0,0,0,0.9), 2px 2px 0 rgba(0,0,0,0.7), 3px 3px 0 rgba(0,0,0,0.4), 0 0 20px rgba(168,85,247,0.9)',
    lineColor: 'from-transparent via-purple-500/60 to-transparent',
    backdropColor: 'rgba(0,0,0,0.35)',
    description: 'Creatividad, expresión auténtica e innovación sin límites.',
    prompt: (today) =>
      `Genera un mantra creativo, inspirado e innovador para alguien que crea con pasión (hoy: ${today}). Máximo 15 palabras. Que inspire innovación, expresión auténtica y pensamiento diferente. Sin comillas, solo el texto.`,
    system: 'Eres un coach creativo que inspira a artistas, diseñadores e innovadores a romper paradigmas.',
    fallbacks: [
      'Crea con valentía. El mundo necesita tu visión única.',
      'La innovación nace donde los demás ven imposibles.',
      'Tu creatividad no imita. Inaugura mundos nuevos.',
      'Diseña el futuro que aún nadie se atrevió a imaginar.',
    ],
  },
  {
    id: 'achiever',
    emoji: '🏆',
    name: 'El Triunfador',
    tagline: 'Resultados, momentum y celebración.',
    gradient: 'from-amber-900/80 to-yellow-900/60',
    border: 'border-amber-500/40',
    accent: 'text-amber-400',
    accentBg: 'bg-amber-500/10',
    accentRing: 'ring-amber-500/50',
    badgeBg: 'bg-amber-500',
    textShadow: '0 0 30px rgba(251,191,36,0.5), 0 2px 8px rgba(0,0,0,0.8)',
    labelShadow: '1px 1px 0 rgba(0,0,0,0.9), 2px 2px 0 rgba(0,0,0,0.7), 3px 3px 0 rgba(0,0,0,0.4), 0 0 20px rgba(251,191,36,0.9)',
    lineColor: 'from-transparent via-amber-500/60 to-transparent',
    backdropColor: 'rgba(0,0,0,0.35)',
    description: 'Orientado a resultados, celebra victorias y mantiene el momentum ganador.',
    prompt: (today) =>
      `Genera un mantra energético y orientado a logros para alguien que celebra victorias (hoy: ${today}). Máximo 15 palabras. Que inspire momentum, celebración de logros y mentalidad ganadora. Sin comillas, solo el texto.`,
    system: 'Eres un coach de alto rendimiento que celebra victorias y mantiene vivo el momentum ganador.',
    fallbacks: [
      'Cada pequeña victoria construye el camino al gran triunfo.',
      'El momentum es tuyo. No lo detengas. Acelera.',
      'Ganaste ayer. Gana hoy. El patrón se convierte en identidad.',
      'Los resultados hablan. Hoy es otro día para que hablen por ti.',
    ],
  },
  {
    id: 'connector',
    emoji: '🌐',
    name: 'El Conector',
    tagline: 'Liderazgo humano que mueve el mundo.',
    gradient: 'from-cyan-900/80 to-blue-900/60',
    border: 'border-cyan-500/40',
    accent: 'text-cyan-400',
    accentBg: 'bg-cyan-500/10',
    accentRing: 'ring-cyan-500/50',
    badgeBg: 'bg-cyan-600',
    textShadow: '0 0 30px rgba(34,211,238,0.5), 0 2px 8px rgba(0,0,0,0.8)',
    labelShadow: '1px 1px 0 rgba(0,0,0,0.9), 2px 2px 0 rgba(0,0,0,0.7), 3px 3px 0 rgba(0,0,0,0.4), 0 0 20px rgba(34,211,238,0.9)',
    lineColor: 'from-transparent via-cyan-500/60 to-transparent',
    backdropColor: 'rgba(0,0,0,0.35)',
    description: 'Liderazgo, empatía, relaciones auténticas y impacto colectivo.',
    prompt: (today) =>
      `Genera un mantra sobre liderazgo, conexión humana e impacto colectivo (hoy: ${today}). Máximo 15 palabras. Que inspire liderazgo empático, colaboración y servicio genuino. Sin comillas, solo el texto.`,
    system: 'Eres un coach de liderazgo humano que inspira a conectar con autenticidad y generar impacto colectivo.',
    fallbacks: [
      'Liderar es servir. Tu impacto vive en quienes elevas.',
      'Las conexiones reales multiplican el talento individual.',
      'El líder más poderoso es quien hace brillar a los demás.',
      'Tu red es tu legado. Cuídala con la misma intensidad que tus metas.',
    ],
  },
];

/* ══════════════════════════════════════════════════════
   CACHÉ & UTILIDADES
══════════════════════════════════════════════════════ */
const CACHE_KEY = 'warrior_mantra_v2';
const PERSONALITY_KEY = 'mantra_personality';
const ONBOARDED_KEY = 'mantra_onboarded';

const getPersonality = () => {
  try {
    const saved = localStorage.getItem(PERSONALITY_KEY);
    return PERSONALITIES.find(p => p.id === saved) || PERSONALITIES[0];
  } catch { return PERSONALITIES[0]; }
};

const loadCachedMantra = (today, personalityId) => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (cached.date === today && cached.personalityId === personalityId && cached.mantra)
      return cached.mantra;
  } catch {}
  return null;
};

const saveMantraCache = (today, personalityId, mantra) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ date: today, personalityId, mantra }));
  } catch {}
};

/* ══════════════════════════════════════════════════════
   MODAL DE SELECCIÓN DE PERSONALIDAD
══════════════════════════════════════════════════════ */
const PersonalityModal = ({ currentId, onSelect, onClose }) => {
  const [hovered, setHovered] = useState(null);
  const selected = hovered || currentId;
  const preview = PERSONALITIES.find(p => p.id === selected) || PERSONALITIES[0];

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(2,6,23,0.85)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-700/60 rounded-[2.5rem] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Decoración fondo */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative px-8 pt-8 pb-6 border-b border-slate-700/40">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-500/15 p-2.5 rounded-2xl">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-white font-black text-xl uppercase tracking-tighter">Tu Arquetipo Mantra</h2>
              <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">
                Elige el tono que resuena con tu identidad
              </p>
            </div>
          </div>

          {/* Preview del arquetipo hovereado */}
          <div className={`mt-4 p-4 rounded-2xl border bg-gradient-to-r ${preview.gradient} ${preview.border} transition-all duration-300`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{preview.emoji}</span>
              <div>
                <p className={`font-black text-base ${preview.accent}`}>{preview.name}</p>
                <p className="text-slate-300 text-[12px] italic">"{preview.fallbacks[0]}"</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de personalidades */}
        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PERSONALITIES.map((p) => {
            const isActive = p.id === currentId;
            return (
              <button
                key={p.id}
                onMouseEnter={() => setHovered(p.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect(p)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-[1.5rem] border-2 transition-all duration-200 text-center
                  ${isActive
                    ? `${p.accentBg} ${p.border} ring-2 ${p.accentRing} scale-[1.03]`
                    : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 hover:scale-[1.02]'
                  }`}
              >
                {isActive && (
                  <div className={`absolute -top-2 -right-2 w-6 h-6 ${p.badgeBg} rounded-full flex items-center justify-center shadow-lg`}>
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </div>
                )}
                <span className="text-3xl">{p.emoji}</span>
                <span className={`font-black text-[13px] uppercase tracking-tight leading-tight ${isActive ? p.accent : 'text-slate-300'}`}>
                  {p.name}
                </span>
                <span className="text-slate-500 text-[10px] leading-tight">{p.tagline}</span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm uppercase tracking-wider transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
const MantraBanner = () => {
  const { user } = useAuth();
  const { actions } = useAppContext();
  const today = new Date().toISOString().split('T')[0];

  const [personality, setPersonality] = useState(getPersonality);
  const [mantra, setMantra] = useState(() => {
    const p = getPersonality();
    return loadCachedMantra(today, p.id) || p.fallbacks[Math.floor(Math.random() * p.fallbacks.length)];
  });
  const [loading, setLoading] = useState(false);
  const [isAI, setIsAI] = useState(() => !!loadCachedMantra(today, getPersonality().id));
  const [showModal, setShowModal] = useState(false);
  const [showBadge, setShowBadge] = useState(() => {
    try { return !localStorage.getItem(ONBOARDED_KEY); } catch { return false; }
  });
  const generatingRef = useRef(false);

  // Genera mantra con IA en segundo plano
  const generateAI = async (p) => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    setLoading(true);
    try {
      const res = await actions.callAI(
        p.prompt(today) + ` Variación: ${Math.random().toFixed(6)}`,
        p.system
      );
      if (res && res.trim()) {
        const m = res.trim().replace(/^["']|["']$/g, '');
        setMantra(m);
        setIsAI(true);
        saveMantraCache(today, p.id, m);
      }
    } catch (e) {
      console.error('Mantra AI error:', e);
    } finally {
      setLoading(false);
      generatingRef.current = false;
    }
  };

  // Al montar: genera si no hay caché
  useEffect(() => {
    if (user && !loadCachedMantra(today, personality.id)) {
      generateAI(personality);
    }
  }, [user]);

  // Al cambiar personalidad
  const handleSelectPersonality = (p) => {
    try {
      localStorage.setItem(PERSONALITY_KEY, p.id);
      localStorage.setItem(ONBOARDED_KEY, '1');
    } catch {}
    setPersonality(p);
    setShowBadge(false);
    setShowModal(false);
    setIsAI(false);
    const cached = loadCachedMantra(today, p.id);
    if (cached) {
      setMantra(cached);
      setIsAI(true);
    } else {
      setMantra(p.fallbacks[Math.floor(Math.random() * p.fallbacks.length)]);
      generateAI(p);
    }
  };

  // Refrescar mantra
  const handleRefresh = () => {
    try { localStorage.removeItem(CACHE_KEY); } catch {}
    setIsAI(false);
    setMantra(personality.fallbacks[Math.floor(Math.random() * personality.fallbacks.length)]);
    generateAI(personality);
  };

  const p = personality;

  return (
    <>
      {showModal && (
        <PersonalityModal
          currentId={p.id}
          onSelect={handleSelectPersonality}
          onClose={() => setShowModal(false)}
        />
      )}

      <div className="mb-6 md:mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className={`bg-gradient-to-r from-slate-50 to-blue-50 dark:bg-gradient-to-r dark:${p.gradient} p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border ${p.border} flex flex-col md:flex-row items-center gap-6 shadow-sm relative overflow-hidden group transition-all duration-500`}>
          {/* Deco */}
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all duration-700" />

          {/* Icono personalidad */}
          <div className={`relative ${p.accentBg} border ${p.border} w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg shrink-0`}>
            <span className="text-3xl">{p.emoji}</span>

            {/* Botón de selección de personalidad */}
            <button
              onClick={() => { setShowModal(true); setShowBadge(false); try { localStorage.setItem(ONBOARDED_KEY, '1'); } catch {} }}
              className={`absolute -bottom-2 -right-2 flex items-center gap-1 ${p.accentBg} border ${p.border} px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${p.accent} hover:scale-105 transition-all shadow`}
              title="Cambiar arquetipo"
            >
              <ChevronDown className="w-2.5 h-2.5" />
              {showBadge && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[8px] font-black">!</span>
                </span>
              )}
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 text-center md:text-left">
            {/* Label row — efecto 3D extruido en el color del arquetipo */}
            <p
              className={`text-[10px] font-black uppercase tracking-[0.3em] mb-3 flex items-center justify-center md:justify-start gap-2`}
              style={{ textShadow: p.labelShadow }}
            >
              <span className={p.accent}>Mantra del Día</span>
              <span className="text-white/30 font-light">|</span>
              <span
                className={`font-black ${p.accent}`}
                style={{ textShadow: p.labelShadow }}
              >
                {p.name}
              </span>
              {isAI && <span className="text-[8px] bg-white/10 text-white/60 px-2 py-0.5 rounded-full font-bold">IA ✦</span>}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="hover:rotate-180 transition-transform duration-500 p-1 rounded-md hover:bg-white/10"
                title="Nuevo mantra"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? `animate-spin ${p.accent}` : 'text-white/30'}`} />
              </button>
            </p>

            {/* ── MANTRA QUOTE BLOCK ── */}
            <div
              className="relative rounded-2xl px-5 py-4 group-hover:scale-[1.01] transition-all duration-500"
              style={{ background: p.backdropColor, backdropFilter: 'blur(4px)' }}
            >
              {/* Línea decorativa TOP */}
              <div className={`absolute top-0 left-8 right-8 h-px bg-gradient-to-r ${p.lineColor}`} />
              {/* Línea decorativa BOTTOM */}
              <div className={`absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r ${p.lineColor}`} />
              {/* Punto decorativo izquierda */}
              <div className={`absolute top-1/2 -translate-y-1/2 left-0 w-1 h-10 rounded-r-full bg-gradient-to-b ${p.lineColor.replace('via-', 'via-').replace('from-transparent', 'from-transparent').replace('to-transparent', 'to-transparent')}`}
                style={{ background: `linear-gradient(to bottom, transparent, ${p.textShadow.match(/rgba\([^)]+\)/)?.[0] || 'white'}, transparent)` }}
              />

              <p
                className="font-serif italic text-xl md:text-2xl leading-relaxed tracking-tight text-white"
                style={{ textShadow: p.textShadow }}
              >
                &ldquo;{mantra}&rdquo;
              </p>
            </div>

            {loading && !isAI && (
              <p className={`text-[9px] ${p.accent} opacity-60 font-bold uppercase tracking-widest mt-2 animate-pulse`}>
                ✨ Personalizando con IA...
              </p>
            )}
            {showBadge && (
              <button
                onClick={() => { setShowModal(true); setShowBadge(false); try { localStorage.setItem(ONBOARDED_KEY, '1'); } catch {}}}
                className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-2xl ${p.accentBg} border ${p.border} ${p.accent} text-[10px] font-black uppercase tracking-wider hover:scale-105 transition-all`}
              >
                <span>🎭</span>
                Personaliza tu arquetipo mantra
                <ChevronDown className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MantraBanner;
