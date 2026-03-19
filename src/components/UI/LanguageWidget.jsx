import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2, GraduationCap, CheckCircle2,
  ChevronLeft, ChevronRight, RotateCcw,
  Star, Zap, Trophy, X, Check, ChevronDown,
  TrendingUp, Globe, Settings, RefreshCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';

/* ══════════════════════════════════════════════════════
   CONSTANTES GLOBALES: IDIOMAS Y NIVELES
══════════════════════════════════════════════════════ */
export const LANGUAGES = [
  {
    id: 'english', name: 'Inglés', nativeName: 'English', emoji: '🇬🇧', locale: 'en-US',
    color: 'from-blue-900/80 to-indigo-900/60', accent: 'text-blue-400', accentBg: 'bg-blue-500/15',
    border: 'border-blue-500/30', badgeBg: 'bg-blue-500',
    description: 'El idioma globalde los negocios y la tecnología.',
  },
  {
    id: 'spanish', name: 'Español', nativeName: 'Español', emoji: '🇪🇸', locale: 'es-ES',
    color: 'from-red-900/80 to-yellow-900/60', accent: 'text-red-400', accentBg: 'bg-red-500/15',
    border: 'border-red-500/30', badgeBg: 'bg-red-600',
    description: 'Perfecciona tu dominio del español avanzado.',
  },
  {
    id: 'portuguese', name: 'Portugués', nativeName: 'Português', emoji: '🇧🇷', locale: 'pt-BR',
    color: 'from-green-900/80 to-emerald-900/60', accent: 'text-emerald-400', accentBg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30', badgeBg: 'bg-emerald-600',
    description: 'Abre puertas al mercado latinoamericano y europeo.',
  },
  {
    id: 'french', name: 'Francés', nativeName: 'Français', emoji: '🇫🇷', locale: 'fr-FR',
    color: 'from-blue-900/80 to-red-900/60', accent: 'text-indigo-400', accentBg: 'bg-indigo-500/15',
    border: 'border-indigo-500/30', badgeBg: 'bg-indigo-600',
    description: 'La lengua de la diplomacia, la cultura y la moda.',
  },
  {
    id: 'italian', name: 'Italiano', nativeName: 'Italiano', emoji: '🇮🇹', locale: 'it-IT',
    color: 'from-green-900/80 to-red-900/60', accent: 'text-rose-400', accentBg: 'bg-rose-500/15',
    border: 'border-rose-500/30', badgeBg: 'bg-rose-600',
    description: 'Arte, gastronomía, moda e ingeniería italiana.',
  },
  {
    id: 'german', name: 'Alemán', nativeName: 'Deutsch', emoji: '🇩🇪', locale: 'de-DE',
    color: 'from-slate-900/80 to-amber-900/60', accent: 'text-amber-400', accentBg: 'bg-amber-500/15',
    border: 'border-amber-500/30', badgeBg: 'bg-amber-600',
    description: 'Ingeniería, tecnología y el motor de Europa.',
  },
];

export const LEVELS = [
  { id: 'A1', name: 'Principiante', wordsPerDay: 3, streakToLevelUp: 7,  color: 'text-slate-400',  bg: 'bg-slate-800',   description: 'Vocabulario básico del día a día.' },
  { id: 'A2', name: 'Básico',       wordsPerDay: 4, streakToLevelUp: 10, color: 'text-green-400',  bg: 'bg-green-900/40', description: 'Expresiones cotidianas y frases simples.' },
  { id: 'B1', name: 'Intermedio',   wordsPerDay: 5, streakToLevelUp: 14, color: 'text-blue-400',   bg: 'bg-blue-900/40',  description: 'Temas de trabajo y situaciones habituales.' },
  { id: 'B2', name: 'Intermedio+',  wordsPerDay: 5, streakToLevelUp: 21, color: 'text-indigo-400', bg: 'bg-indigo-900/40', description: 'Fluidez en temas complejos y abstractos.' },
  { id: 'C1', name: 'Avanzado',     wordsPerDay: 6, streakToLevelUp: 30, color: 'text-purple-400', bg: 'bg-purple-900/40', description: 'Expresión fluida y espontánea, textos complejos.' },
  { id: 'C2', name: 'Maestría',     wordsPerDay: 7, streakToLevelUp: null, color: 'text-amber-400', bg: 'bg-amber-900/40', description: 'Dominio prácticamente nativo del idioma.' },
];

const LANG_KEY  = 'language_widget_lang';
const LEVEL_KEY = 'language_widget_level';
const STREAK_KEY = 'language_widget_streak';

/* ── helpers ── */
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const speak = (text, locale = 'en-US') => {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang  = locale;
  u.rate  = 0.82;
  u.pitch = 1;
  window.speechSynthesis.speak(u);
};

const getLang  = () => LANGUAGES.find(l => l.id === (localStorage.getItem(LANG_KEY)  || 'english')) || LANGUAGES[0];
const getLevel = () => LEVELS.find(l   => l.id === (localStorage.getItem(LEVEL_KEY) || 'C1'))      || LEVELS[4];

/* ══════════════════════════════════════════════════════
   MODAL — Selector de Idioma
══════════════════════════════════════════════════════ */
// El modal de cambio de idioma ahora se maneja en la pestaña "Idiomas" para una UI más limpia.
// Mantenemos una versión simplificada aquí si fuera necesario o lo quitamos para centralizar.
const LanguageModal = ({ currentLangId, currentLevelId, onSelectLang, onSelectLevel, onClose }) => null;

/* ══════════════════════════════════════════════════════
   PHASE: COMPLETED
══════════════════════════════════════════════════════ */
const CompletedView = ({ score, total, lang, level }) => (
  <div className={`widget-card !bg-gradient-to-br ${lang?.color || 'from-slate-900 to-slate-800'} border ${lang?.border || 'border-slate-700'} h-full flex flex-col items-center justify-center text-center`}>
    <div className="flex items-center gap-3 mb-6">
      <div className={`${lang?.accentBg || 'bg-indigo-500/20'} p-3 rounded-2xl`}>
        <GraduationCap className={`w-6 h-6 ${lang?.accent || 'text-indigo-400'}`} />
      </div>
      <div>
        <h3 className="font-black text-white uppercase tracking-tight">{lang?.emoji} {lang?.name || 'Idioma'}</h3>
        <p className={`text-[10px] font-bold ${lang?.accent || 'text-emerald-500'} uppercase tracking-widest`}>Sesión de hoy completada ✓ · Nivel {level?.id}</p>
      </div>
    </div>
    <Trophy className="w-16 h-16 text-amber-400 mb-4" />
    <p className="font-black text-white text-xl mb-1">¡Vocabulario dominado!</p>
    {score !== undefined && (
      <p className="text-emerald-400 font-bold text-sm">{score}/{total} respuestas correctas</p>
    )}
    <p className="text-slate-500 text-sm mt-1">Vuelve mañana para nuevas palabras</p>
  </div>
);

/* ══════════════════════════════════════════════════════
   PHASE: FLASHCARD
══════════════════════════════════════════════════════ */
const FlashcardPhase = ({ words, lang, level, onStartQuiz, onOpenModal, onRegenerate }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const word = words[currentIndex];

  const navigate = (dir) => {
    setFlipped(false);
    setTimeout(() => setCurrentIndex(i => Math.max(0, Math.min(words.length - 1, i + dir))), 160);
  };

  const flip = () => {
    if (!flipped) speak(word.word, lang?.locale || 'en-US');
    setFlipped(f => !f);
  };

  const categoryColor = {
    Verb:    'bg-blue-500/20 text-blue-400',
    Noun:    'bg-purple-500/20 text-purple-400',
    Phrasal: 'bg-amber-500/20 text-amber-400',
    Idiom:   'bg-rose-500/20 text-rose-400',
    Adj:     'bg-emerald-500/20 text-emerald-400',
    Adv:     'bg-cyan-500/20 text-cyan-400',
  };

  return (
    <div className={`widget-card border ${lang?.border || 'border-indigo-500/30'} !p-7 h-full bg-gradient-to-br from-slate-900 to-slate-900`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`${lang?.accentBg || 'bg-indigo-500/20'} p-2.5 rounded-2xl`}>
            <span className="text-xl">{lang?.emoji || '🌍'}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-white text-[15px] uppercase tracking-tight">{lang?.name || 'Idioma'}</h3>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${level?.bg || 'bg-slate-800'} ${level?.color || 'text-slate-400'} border border-white/10`}>
                {level?.id || 'B2'}
              </span>
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Vocabulario del día</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-white/5"
              title="Regenerar hoy"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onOpenModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider"
            title="Cambiar idioma o nivel"
          >
            <Globe className="w-3.5 h-3.5" />
            Cambiar
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Dot nav */}
      <div className="flex gap-1.5 justify-center mb-4">
        {words.map((_, i) => (
          <div
            key={i}
            onClick={() => { setFlipped(false); setTimeout(() => setCurrentIndex(i), 160); }}
            className={`cursor-pointer h-2 rounded-full transition-all ${currentIndex === i ? `w-6 ${lang?.accent ? lang.accent.replace('text-', 'bg-') : 'bg-indigo-500'}` : 'w-2 bg-slate-700 hover:bg-slate-600'}`}
          />
        ))}
      </div>

      {/* 3D Flip Card */}
      <div className="mb-4" style={{ perspective: '1200px', height: '260px' }}>
        <div
          onClick={flip}
          className="cursor-pointer relative w-full h-full transition-transform duration-500"
          style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {/* FRONT */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/70 rounded-[2rem] border border-slate-700/50 p-6 text-center overflow-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="flex gap-2 mb-3">
              {word.level && <span className={`text-[9px] font-black ${lang?.accentBg || 'bg-indigo-500/20'} ${lang?.accent || 'text-indigo-400'} px-2.5 py-0.5 rounded-lg uppercase tracking-wider`}>{word.level}</span>}
              {word.category && <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-lg uppercase tracking-wider ${categoryColor[word.category] || 'bg-slate-600/50 text-slate-400'}`}>{word.category}</span>}
            </div>
            <div className="flex-1 flex flex-col items-center justify-center min-h-0 w-full">
              <h4 className={`font-black text-white mb-2 leading-tight break-words w-full px-2 ${word.word?.length > 12 ? 'text-2xl' : 'text-3xl md:text-4xl'}`}>
                {word.word}
              </h4>
              <div className="flex flex-col gap-1.5 items-center">
                <p className="font-mono text-slate-400 text-xs md:text-sm bg-slate-900/50 px-3 py-0.5 rounded-full border border-slate-700/30">
                  {word.phonetic}
                </p>
                {word.pronunciation && (
                  <p className={`${lang?.accent || 'text-indigo-300'} text-xs md:text-sm font-bold tracking-wide`}>
                    "{word.pronunciation}"
                  </p>
                )}
              </div>
            </div>
            <p className="text-slate-600 text-[9px] uppercase tracking-[0.2em] mt-auto pt-4">Toca para ver traducción →</p>
          </div>

          {/* BACK */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br ${lang?.color || 'from-indigo-900/40 to-purple-900/20'} rounded-[2rem] border ${lang?.border || 'border-indigo-500/30'} p-6 text-center overflow-hidden`}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className={`text-[10px] font-bold ${lang?.accent || 'text-indigo-400'} uppercase tracking-widest mb-1`}>Traducción · Español</p>
            <p className={`${word.translation && word.translation.length > 15 ? 'text-xl' : 'text-3xl'} font-black text-white mb-2 leading-tight tracking-tighter`}>{word.translation}</p>
            {word.meaning && <p className="text-slate-400 text-[13px] mb-3 leading-relaxed">{word.meaning}</p>}
            <div className="bg-white/5 rounded-2xl px-4 py-2.5 w-full">
              <p className="text-slate-300 text-xs italic leading-relaxed">"{word.example}"</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => speak(word.word, lang?.locale || 'en-US')}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-all text-xs font-bold group">
          <Volume2 className={`w-4 h-4 group-hover:${lang?.accent?.replace('text-','text-') || 'text-indigo-400'} transition-colors`} />
          Escuchar
        </button>
        <div className="flex gap-2">
          <button onClick={() => navigate(-1)} disabled={currentIndex === 0}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 disabled:opacity-30 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="flex items-center px-3 text-[11px] font-black text-slate-500">{currentIndex + 1} / {words.length}</span>
          <button onClick={() => navigate(1)} disabled={currentIndex === words.length - 1}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 disabled:opacity-30 transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CTA */}
      <button onClick={onStartQuiz}
        className={`w-full py-4 rounded-2xl ${lang?.badgeBg ? `bg-${lang.badgeBg.replace('bg-', '')}` : 'bg-indigo-500'} hover:brightness-110 active:scale-[0.98] text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all shadow-lg`}
        style={{ background: lang?.id === 'english' ? '#6366f1' : lang?.id === 'spanish' ? '#dc2626' : lang?.id === 'portuguese' ? '#10b981' : lang?.id === 'french' ? '#4f46e5' : lang?.id === 'italian' ? '#f43f5e' : '#d97706' }}
      >
        <Zap className="w-4 h-4 fill-white" />
        Iniciar Quiz · Pon a prueba tu memoria
      </button>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   PHASE: QUIZ
══════════════════════════════════════════════════════ */
const QuizPhase = ({ words, lang, onFinish }) => {
  const [quizIndex, setQuizIndex] = useState(0);
  const [options, setOptions]     = useState([]);
  const [selected, setSelected]   = useState(null);
  const [score, setScore]         = useState(0);
  const [answers, setAnswers]     = useState([]);

  const word = words[quizIndex];

  useEffect(() => {
    const correct = words[quizIndex].translation;
    const allTranslations = words.map(w => w.translation);
    const uniqueOthers = Array.from(new Set(allTranslations)).filter(t => t !== correct);
    const others  = shuffle(uniqueOthers).slice(0, 3);
    
    // Relleno de seguridad para garantizar siempre 4 opciones estrictamente distintas 
    // por si la IA generara traducciones duplicadas en las 6 palabras del día.
    const fallbackOptions = ["Apalancar", "Optimizar", "Desarrollo", "Proactividad", "Desempeño", "Estructura", "Adaptabilidad", "Iteración", "Sinergia"];
    while (others.length < 3) {
       const randomFallback = fallbackOptions[Math.floor(Math.random() * fallbackOptions.length)];
       if (!others.includes(randomFallback) && randomFallback !== correct) {
          others.push(randomFallback);
       }
    }

    setOptions(shuffle([correct, ...others]));
    setSelected(null);
  }, [quizIndex, words]);

  const handleAnswer = (opt) => {
    if (selected !== null) return;
    setSelected(opt);
    const isCorrect  = opt === word.translation;
    const newScore   = isCorrect ? score + 1 : score;
    const newAnswers = [...answers, { word: word.word, correct: isCorrect, selected: opt, correctAnswer: word.translation, example: word.example, meaning: word.meaning }];
    if (isCorrect) setScore(newScore);
    setAnswers(newAnswers);
    setTimeout(() => {
      if (quizIndex < words.length - 1) {
        setQuizIndex(i => i + 1);
      } else {
        if (newScore === words.length) {
          confetti({ particleCount: 220, spread: 90, origin: { y: 0.55 }, colors: ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#fff'] });
        }
        onFinish(newScore, newAnswers);
      }
    }, 1400);
  };

  return (
    <div className={`widget-card border ${lang?.border || 'border-indigo-500/30'} !p-7 h-full bg-gradient-to-br from-slate-900 to-slate-900`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`${lang?.accentBg || 'bg-indigo-500/20'} p-2.5 rounded-2xl`}>
            <span className="text-xl">{lang?.emoji || '🌍'}</span>
          </div>
          <div>
            <h3 className="font-black text-white text-[15px] uppercase tracking-tight">Quiz</h3>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{lang?.name || 'Idioma'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span className="font-black text-amber-400 text-sm">{score}</span>
          <span className="text-slate-500 text-xs">/{words.length}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1.5 mb-6">
        {words.map((_, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
            i < quizIndex ? (lang?.id === 'english' ? 'bg-indigo-500' : lang?.id === 'spanish' ? 'bg-red-500' : lang?.id === 'portuguese' ? 'bg-emerald-500' : lang?.id === 'french' ? 'bg-blue-500' : lang?.id === 'italian' ? 'bg-rose-500' : 'bg-amber-500') :
            i === quizIndex ? 'bg-slate-400' : 'bg-slate-700/50'
          }`} />
        ))}
      </div>

      {/* Word card */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 mb-5 text-center">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">¿Qué significa?</p>
        <div className="flex items-center justify-center gap-3 mb-2">
          <h4 className="text-3xl font-black text-white">{word.word}</h4>
          <button onClick={() => speak(word.word, lang?.locale || 'en-US')}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 transition-all">
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
        <span className="font-mono text-slate-400 text-sm">{word.phonetic}</span>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {options.map((opt, i) => {
          const isCorrect  = opt === word.translation;
          const isSelected = selected === opt;
          let cls = 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:border-slate-600 cursor-pointer';
          if (selected !== null) {
            if (isCorrect)       cls = 'border-emerald-500 bg-emerald-500/15 text-emerald-300 cursor-default';
            else if (isSelected) cls = 'border-red-500 bg-red-500/15 text-red-300 cursor-default';
            else                 cls = 'border-slate-800 bg-slate-800/30 text-slate-600 opacity-40 cursor-default';
          }
          return (
            <button key={i} onClick={() => handleAnswer(opt)} disabled={selected !== null}
              className={`p-4 rounded-2xl border-2 text-sm font-bold text-left transition-all ${cls}`}>
              {opt}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className={`p-4 rounded-2xl text-sm leading-relaxed transition-all ${selected === word.translation ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border border-red-500/20 text-red-300'}`}>
          {selected === word.translation
            ? <><span className="font-black">✅ ¡Correcto!</span> "{word.example}"</>
            : <><span className="font-black">❌ Era:</span> {word.translation} — {word.meaning}</>
          }
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   PHASE: RESULTS
══════════════════════════════════════════════════════ */
const ResultsPhase = ({ score, total, answers, lang, level, levelUpInfo, onComplete, onRestart }) => {
  const pct       = Math.round((score / total) * 100);
  const isPerfect = score === total;
  const isGood    = score >= Math.ceil(total / 2);

  const colorRing = isPerfect ? 'border-emerald-400 bg-emerald-500/10 text-emerald-400'
                  : isGood    ? 'border-blue-400 bg-blue-500/10 text-blue-400'
                  :             'border-amber-400 bg-amber-500/10 text-amber-400';

  return (
    <div className={`widget-card border ${lang?.border || 'border-indigo-500/30'} !p-7 h-full overflow-y-auto`} style={{ scrollbarWidth: 'thin' }}>
      <div className="flex items-center gap-3 mb-7">
        <div className={`${lang?.accentBg || 'bg-indigo-500/20'} p-2.5 rounded-2xl`}>
          <Trophy className={`w-5 h-5 ${lang?.accent || 'text-indigo-400'}`} />
        </div>
        <div>
          <h3 className="font-black text-white text-[15px] uppercase tracking-tight">Resultados</h3>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{lang?.name} · Nivel {level?.id}</p>
        </div>
      </div>

      {/* Level Up Banner */}
      {levelUpInfo && (
        <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30 flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-amber-400 shrink-0" />
          <div>
            <p className="font-black text-amber-300 text-sm">¡Subiste de nivel!</p>
            <p className="text-amber-500/80 text-[11px]">{levelUpInfo.from} → <strong className="text-amber-300">{levelUpInfo.to}</strong> · {levelUpInfo.message}</p>
          </div>
        </div>
      )}

      {/* Score circle */}
      <div className="flex flex-col items-center mb-6">
        <div className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center mb-4 ${colorRing}`}>
          <span className="text-4xl font-black">{score}/{total}</span>
          <span className="text-[10px] font-bold text-slate-500 uppercase">{pct}%</span>
        </div>
        <p className="text-xl font-black text-white">
          {isPerfect ? '¡Perfecto! 🏆' : isGood ? '¡Bien hecho! 💪' : 'Sigue practicando 📚'}
        </p>
        <p className="text-slate-400 text-sm mt-1">
          {isPerfect ? 'Vocabulario completamente dominado' : `${total - score} palabra${total - score > 1 ? 's' : ''} a repasar`}
        </p>
        {/* Streak info */}
        {pct >= 80 && (
          <div className="mt-3 flex items-center gap-2 text-emerald-400 text-[11px] font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            ≥80% · Racha de nivel activa
          </div>
        )}
      </div>

      {/* Per-word breakdown */}
      <div className="space-y-2 mb-6">
        {answers.map((a, i) => (
          <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${a.correct ? 'bg-emerald-500/8 border border-emerald-500/15' : 'bg-red-500/8 border border-red-500/15'}`}>
            <span>{a.correct ? '✅' : '❌'}</span>
            <span className="font-bold text-white text-sm flex-1">{a.word}</span>
            {!a.correct && <span className="text-[10px] text-slate-400 italic">→ {a.correctAnswer}</span>}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={onRestart} className="flex-1 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all">
          <RotateCcw className="w-3.5 h-3.5" />
          Repasar
        </button>
        <button onClick={onComplete} className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-4 h-4" />
          Completar sesión
        </button>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   MAIN WIDGET ORCHESTRATOR
══════════════════════════════════════════════════════ */
const LanguageWidget = ({
  words = [],
  onComplete,
  isCompleted,
  sessionScore,
  // props para nivel/idioma (controlados desde DashboardTab)
  languageId,
  levelId,
  onLanguageChange,
  onLevelChange,
  onRegenerate
}) => {
  const [phase, setPhase]         = useState('flashcard');
  const [score, setScore]         = useState(0);
  const [answers, setAnswers]     = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState(null);

  // Derivar idioma y nivel de props o localStorage
  const lang  = LANGUAGES.find(l => l.id === (languageId || localStorage.getItem(LANG_KEY)  || 'english')) || LANGUAGES[0];
  const level = LEVELS.find(l   => l.id === (levelId    || localStorage.getItem(LEVEL_KEY) || 'C1'))      || LEVELS[4];

  const handleQuizFinish = (finalScore, finalAnswers) => {
    setScore(finalScore);
    setAnswers(finalAnswers);
    setPhase('results');
    // Lógica de progresión de nivel (si aplica) — se comunica al padre via onComplete
  };

  const handleComplete = () => {
    const pct = Math.round((score / words.length) * 100);
    onComplete(score, { languageId: lang.id, levelId: level.id, pct });
  };

  const handleRestart = () => {
    setPhase('flashcard');
    setScore(0);
    setAnswers([]);
    setLevelUpInfo(null);
  };

  const handleLangSelect = (newLang) => {
    localStorage.setItem(LANG_KEY, newLang.id);
    if (onLanguageChange) onLanguageChange(newLang.id);
  };

  const handleLevelSelect = (newLevel) => {
    localStorage.setItem(LEVEL_KEY, newLevel.id);
    if (onLevelChange) onLevelChange(newLevel.id);
  };

  if (!words || words.length === 0) return null;

  if (isCompleted) {
    return <CompletedView score={sessionScore} total={words.length} lang={lang} level={level} />;
  }

  if (phase === 'flashcard') {
    return (
      <>
        {showModal && (
          <LanguageModal
            currentLangId={lang.id}
            currentLevelId={level.id}
            onSelectLang={handleLangSelect}
            onSelectLevel={handleLevelSelect}
            onClose={() => setShowModal(false)}
          />
        )}
        <FlashcardPhase
          words={words}
          lang={lang}
          level={level}
          onStartQuiz={() => setPhase('quiz')}
          onOpenModal={() => setShowModal(true)}
          onRegenerate={onRegenerate}
        />
      </>
    );
  }

  if (phase === 'quiz') {
    return <QuizPhase words={words} lang={lang} onFinish={handleQuizFinish} />;
  }

  if (phase === 'results') {
    return (
      <>
        {showModal && (
          <LanguageModal
            currentLangId={lang.id}
            currentLevelId={level.id}
            onSelectLang={handleLangSelect}
            onSelectLevel={handleLevelSelect}
            onClose={() => setShowModal(false)}
          />
        )}
        <ResultsPhase
          score={score}
          total={words.length}
          answers={answers}
          lang={lang}
          level={level}
          levelUpInfo={levelUpInfo}
          onComplete={handleComplete}
          onRestart={handleRestart}
        />
      </>
    );
  }

  return null;
};

export default LanguageWidget;
