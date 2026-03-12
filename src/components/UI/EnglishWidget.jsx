import React, { useState, useEffect } from 'react';
import {
  Volume2, GraduationCap, CheckCircle2,
  ChevronLeft, ChevronRight, RotateCcw,
  Star, Zap, Trophy, BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';

/* ── helpers ── */
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const speak = (text) => {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = 0.82;
  u.pitch = 1;
  window.speechSynthesis.speak(u);
};

/* ════════════════════════════════════════════════
   PHASE: COMPLETED (already done today)
════════════════════════════════════════════════ */
const CompletedView = ({ score, total }) => (
  <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/20 p-8 rounded-[2.5rem] border border-emerald-500/20 shadow-xl">
    <div className="flex items-center gap-3 mb-6">
      <div className="bg-emerald-500/20 p-3 rounded-2xl">
        <GraduationCap className="w-6 h-6 text-emerald-400" />
      </div>
      <div>
        <h3 className="font-black text-white uppercase tracking-tight">Business English C1</h3>
        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Sesión de hoy completada ✓</p>
      </div>
    </div>
    <div className="flex flex-col items-center py-6">
      <Trophy className="w-16 h-16 text-amber-400 mb-4" />
      <p className="font-black text-white text-xl mb-1">¡Vocabulario dominado!</p>
      {score !== undefined && (
        <p className="text-emerald-400 font-bold text-sm">{score}/{total} respuestas correctas</p>
      )}
      <p className="text-slate-500 text-sm mt-1">Vuelve mañana para nuevas palabras</p>
    </div>
  </div>
);

/* ════════════════════════════════════════════════
   PHASE: FLASHCARD
════════════════════════════════════════════════ */
const FlashcardPhase = ({ words, onStartQuiz }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped]           = useState(false);

  const word = words[currentIndex];

  const navigate = (dir) => {
    setFlipped(false);
    setTimeout(() => setCurrentIndex(i => Math.max(0, Math.min(words.length - 1, i + dir))), 160);
  };

  const flip = () => {
    if (!flipped) speak(word.word);
    setFlipped(f => !f);
  };

  const categoryColor = {
    Verb:    'bg-blue-500/20 text-blue-400',
    Noun:    'bg-purple-500/20 text-purple-400',
    Phrasal: 'bg-amber-500/20 text-amber-400',
    Idiom:   'bg-rose-500/20 text-rose-400',
    Adj:     'bg-emerald-500/20 text-emerald-400',
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-7 rounded-[2.5rem] border border-slate-800/50 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/20 p-2.5 rounded-2xl">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-black text-white text-[15px] uppercase tracking-tight">Business English C1</h3>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Vocabulario del día</p>
          </div>
        </div>
        {/* Dot nav */}
        <div className="flex gap-1.5">
          {words.map((_, i) => (
            <div
              key={i}
              onClick={() => { setFlipped(false); setTimeout(() => setCurrentIndex(i), 160); }}
              className={`cursor-pointer h-2 rounded-full transition-all ${currentIndex === i ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-700 hover:bg-slate-600'}`}
            />
          ))}
        </div>
      </div>

      {/* 3D Flip Card */}
      <div className="mb-5" style={{ perspective: '1200px', height: '210px' }}>
        <div
          onClick={flip}
          className="cursor-pointer relative w-full h-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* FRONT */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/70 rounded-[2rem] border border-slate-700/50 p-7 text-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="flex gap-2 mb-3">
              {word.level && (
                <span className="text-[9px] font-black bg-indigo-500/20 text-indigo-400 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">{word.level}</span>
              )}
              {word.category && (
                <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-lg uppercase tracking-wider ${categoryColor[word.category] || 'bg-slate-600/50 text-slate-400'}`}>{word.category}</span>
              )}
            </div>
            <h4 className="text-4xl font-black text-white mb-2">{word.word}</h4>
            <p className="font-mono text-slate-400 text-sm mb-1">{word.phonetic}</p>
            <p className="text-indigo-300 text-sm font-bold">"{word.pronunciation}"</p>
            <p className="text-slate-600 text-[10px] uppercase tracking-widest mt-5">Toca la tarjeta para voltear →</p>
          </div>

          {/* BACK */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900/40 to-purple-900/20 rounded-[2rem] border border-indigo-500/30 p-7 text-center"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Traducción</p>
            <p className="text-2xl font-black text-white mb-3">{word.translation}</p>
            {word.meaning && (
              <p className="text-slate-400 text-[13px] mb-3 leading-relaxed">{word.meaning}</p>
            )}
            <div className="bg-white/5 rounded-2xl px-4 py-2.5">
              <p className="text-slate-300 text-xs italic leading-relaxed">"{word.example}"</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => { speak(word.word); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-all text-xs font-bold group"
        >
          <Volume2 className="w-4 h-4 group-hover:text-indigo-400 transition-colors" />
          Escuchar
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(-1)}
            disabled={currentIndex === 0}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="flex items-center px-3 text-[11px] font-black text-slate-500">
            {currentIndex + 1} / {words.length}
          </span>
          <button
            onClick={() => navigate(1)}
            disabled={currentIndex === words.length - 1}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 disabled:opacity-30 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onStartQuiz}
        className="w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-400 active:scale-[0.98] text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-indigo-500/25"
      >
        <Zap className="w-4 h-4 fill-white" />
        Iniciar Quiz · Pon a prueba tu memoria
      </button>
    </div>
  );
};

/* ════════════════════════════════════════════════
   PHASE: QUIZ
════════════════════════════════════════════════ */
const QuizPhase = ({ words, onFinish }) => {
  const [quizIndex, setQuizIndex]     = useState(0);
  const [options, setOptions]         = useState([]);
  const [selected, setSelected]       = useState(null);
  const [score, setScore]             = useState(0);
  const [answers, setAnswers]         = useState([]);

  const word = words[quizIndex];

  // Build options whenever index changes
  useEffect(() => {
    const correct  = words[quizIndex].translation;
    const others   = shuffle(words.filter((_, i) => i !== quizIndex)).slice(0, 3).map(w => w.translation);
    setOptions(shuffle([correct, ...others]));
    setSelected(null);
  }, [quizIndex, words]);

  const handleAnswer = (opt) => {
    if (selected !== null) return;
    setSelected(opt);
    const isCorrect = opt === word.translation;
    const newScore = isCorrect ? score + 1 : score;
    const newAnswers = [...answers, { word: word.word, correct: isCorrect, selected: opt, correctAnswer: word.translation, example: word.example, meaning: word.meaning }];

    if (isCorrect) setScore(newScore);
    setAnswers(newAnswers);

    setTimeout(() => {
      if (quizIndex < words.length - 1) {
        setQuizIndex(i => i + 1);
      } else {
        // Done
        if (newScore === words.length) {
          confetti({ particleCount: 220, spread: 90, origin: { y: 0.55 }, colors: ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#fff'] });
        }
        onFinish(newScore, newAnswers);
      }
    }, 1400);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-7 rounded-[2.5rem] border border-slate-800/50 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/20 p-2.5 rounded-2xl">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-black text-white text-[15px] uppercase tracking-tight">Quiz</h3>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Business English C1</p>
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
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
              i < quizIndex ? 'bg-indigo-500' :
              i === quizIndex ? 'bg-indigo-400' :
              'bg-slate-700/50'
            }`}
          />
        ))}
      </div>

      {/* Word card */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 mb-5 text-center">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">¿Qué significa?</p>
        <div className="flex items-center justify-center gap-3 mb-2">
          <h4 className="text-3xl font-black text-white">{word.word}</h4>
          <button
            onClick={() => speak(word.word)}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 transition-all"
          >
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
            <button
              key={i}
              onClick={() => handleAnswer(opt)}
              disabled={selected !== null}
              className={`p-4 rounded-2xl border-2 text-sm font-bold text-left transition-all ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {/* Inline feedback */}
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

/* ════════════════════════════════════════════════
   PHASE: RESULTS
════════════════════════════════════════════════ */
const ResultsPhase = ({ score, total, answers, words, onComplete, onRestart }) => {
  const pct       = Math.round((score / total) * 100);
  const isPerfect = score === total;
  const isGood    = score >= Math.ceil(total / 2);

  const colorRing = isPerfect ? 'border-emerald-400 bg-emerald-500/10 text-emerald-400'
                  : isGood    ? 'border-blue-400 bg-blue-500/10 text-blue-400'
                  :             'border-amber-400 bg-amber-500/10 text-amber-400';

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-7 rounded-[2.5rem] border border-slate-800/50 shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <div className="bg-indigo-500/20 p-2.5 rounded-2xl">
          <Trophy className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="font-black text-white text-[15px] uppercase tracking-tight">Resultados</h3>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Business English C1</p>
        </div>
      </div>

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
          {isPerfect
            ? 'Vocabulario completamente dominado'
            : `${total - score} palabra${total - score > 1 ? 's' : ''} a repasar`}
        </p>
      </div>

      {/* Per-word breakdown */}
      <div className="space-y-2 mb-6">
        {answers.map((a, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 p-3 rounded-xl ${a.correct ? 'bg-emerald-500/8 border border-emerald-500/15' : 'bg-red-500/8 border border-red-500/15'}`}
          >
            <span>{a.correct ? '✅' : '❌'}</span>
            <span className="font-bold text-white text-sm flex-1">{a.word}</span>
            {!a.correct && (
              <span className="text-[10px] text-slate-400 italic">→ {a.correctAnswer}</span>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onRestart}
          className="flex-1 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Repasar
        </button>
        <button
          onClick={onComplete}
          className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
        >
          <CheckCircle2 className="w-4 h-4" />
          Completar sesión
        </button>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════
   MAIN WIDGET ORCHESTRATOR
════════════════════════════════════════════════ */
const EnglishWidget = ({ words = [], onComplete, isCompleted, sessionScore }) => {
  const [phase,   setPhase]   = useState('flashcard'); // 'flashcard' | 'quiz' | 'results'
  const [score,   setScore]   = useState(0);
  const [answers, setAnswers] = useState([]);

  const handleQuizFinish = (finalScore, finalAnswers) => {
    setScore(finalScore);
    setAnswers(finalAnswers);
    setPhase('results');
  };

  const handleComplete = () => {
    onComplete(score);
  };

  const handleRestart = () => {
    setPhase('flashcard');
    setScore(0);
    setAnswers([]);
  };

  if (!words || words.length === 0) return null;

  if (isCompleted) {
    return <CompletedView score={sessionScore} total={words.length} />;
  }

  if (phase === 'flashcard') {
    return <FlashcardPhase words={words} onStartQuiz={() => setPhase('quiz')} />;
  }

  if (phase === 'quiz') {
    return <QuizPhase words={words} onFinish={handleQuizFinish} />;
  }

  if (phase === 'results') {
    return (
      <ResultsPhase
        score={score}
        total={words.length}
        answers={answers}
        words={words}
        onComplete={handleComplete}
        onRestart={handleRestart}
      />
    );
  }

  return null;
};

export default EnglishWidget;
