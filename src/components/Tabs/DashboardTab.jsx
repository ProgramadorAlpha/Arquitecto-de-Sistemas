import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Flame, 
  Calendar, 
  Zap, 
  Sun, 
  Moon, 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  Anchor, 
  BookOpen, 
  Edit2, 
  Plus, 
  Trash2,
  ChevronRight,
  Info,
  Loader2,
  Target,
  Shield,
  ShieldAlert,
  Brain,
  Swords,
  Waves,
  Battery,
  BatteryFull,
  Clock,
  ClipboardList,
  Leaf,
  MonitorOff,
  Briefcase,
  Heart,
  Activity
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { doc, onSnapshot, setDoc, updateDoc, collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Modal from '../UI/Modal';
import LanguageWidget, { LANGUAGES, LEVELS } from '../UI/LanguageWidget';
import { getWeekId } from '../../utils/dateUtils';
import { generateLanguageWords } from '../../services/ai';

/* ─── Circular Progress Component ─── */
const CircularProgress = ({ percentage, size = 120, strokeWidth = 10 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Glow effect */}
      <div 
        className="absolute inset-0 rounded-full blur-xl opacity-40 transition-all duration-1000"
        style={{ background: `conic-gradient(from 0deg, #136dec ${percentage}%, transparent ${percentage}%)` }}
      />
      <svg width={size} height={size} className="transform -rotate-90 relative z-10">
        {/* Background circle */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="currentColor"
          className="text-slate-800/50"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--purple)" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <span className="text-3xl font-black text-white tabular-nums">{percentage}%</span>
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Progreso</span>
      </div>
    </div>
  );
};

/* ─── Energy Slider ─── */
const EnergySlider = ({ value, onChange }) => {
  const emojis = ['😴', '😪', '😐', '🙂', '😊', '😄', '💪', '🔥', '⚡', '🚀'];
  const emoji = emojis[Math.max(0, Math.min(value - 1, 9))];
  const gradientPercent = (value / 10) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nivel de Energía</span>
        <span className="text-2xl">{emoji}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer energy-slider"
          style={{
            background: `linear-gradient(to right, var(--accent) 0%, var(--purple) ${gradientPercent}%, var(--surface-border) ${gradientPercent}%)`
          }}
        />
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-slate-500 font-bold">1</span>
          <span className="text-[9px] text-slate-500 font-bold">10</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Main DashboardTab ─── */
const DashboardTab = () => {
  const { user } = useAuth();
  const [data, setData] = useState({
    habits: {},
    nightHabits: {},
    sacredBlocks: [],
    scheduleItems: [],
    energyHistory: [],
    reading: { current_book: '', last_read_date: null },
    weeklyFocus: { priority_1: '' },
    streak: 0,
    deepWork: 0,
    englishWords: [],
    englishCompleted: false,
    englishScore: undefined,
    energyLevel: 5,
    mentalState: '',
    planBActive: false
  });
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});

  // ── Language / Level state (multi-language module) ──
  const [langId,  setLangId]  = useState(() => localStorage.getItem('language_widget_lang')  || 'english');
  const [levelId, setLevelId] = useState(() => localStorage.getItem('language_widget_level') || 'C1');
  const [langSuccessStreak, setLangSuccessStreak] = useState(
    () => parseInt(localStorage.getItem(`lang_streak_${localStorage.getItem('language_widget_lang') || 'english'}`) || '0')
  );
  const [levelUpToast, setLevelUpToast] = useState(null);

  // Editor states
  const [isSacredModalOpen, setIsSacredModalOpen] = useState(false);
  const [isReadingModalOpen, setIsReadingModalOpen] = useState(false);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', category: 'Deep Work', startTime: '09:00', endTime: '10:00' });

  const today  = new Date().toISOString().split('T')[0];
  const weekId = getWeekId(0);
  // Mutex to prevent parallel AI calls on rapid onSnapshot events
  const isGeneratingRef = useRef(false);
  const settingsRef = useRef({});

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const unsubs = [
      // Habits
      onSnapshot(doc(db, 'users', user.uid, 'habits', today), (d) => {
        if (d.exists()) setData(prev => ({ ...prev, habits: d.data() }));
      }),
      // Night Habits
      onSnapshot(doc(db, 'users', user.uid, 'night_habits', today), (d) => {
        if (d.exists()) setData(prev => ({ ...prev, nightHabits: d.data() }));
      }),
      // Sacred Blocks
      onSnapshot(doc(db, 'users', user.uid, 'settings', 'sacred_blocks'), (d) => {
        if (d.exists()) setData(prev => ({ ...prev, sacredBlocks: d.data().blocks || [] }));
      }),
      // Reading
      onSnapshot(doc(db, 'users', user.uid, 'settings', 'reading'), (d) => {
        if (d.exists()) setData(prev => ({ ...prev, reading: d.data() }));
      }),
      // Weekly Focus
      onSnapshot(doc(db, 'users', user.uid, 'weekly', weekId), (d) => {
        if (d.exists()) setData(prev => ({ ...prev, weeklyFocus: d.data() }));
      }),
      // Language Words (multi-language) & Status + Mental State + PlanB
      onSnapshot(doc(db, 'users', user.uid, 'daily_content', today), async (d) => {
        const langKey   = `${langId}Words`;
        const langObj   = LANGUAGES.find(l => l.id === langId) || LANGUAGES[0];
        const levelObj  = LEVELS.find(l => l.id === levelId) || LEVELS[4];

        const generateAndSave = async () => {
          if (isGeneratingRef.current) return;
          isGeneratingRef.current = true;
          try {
            const words = await generateLanguageWords(langObj.id, langObj.nativeName, levelObj.id, levelObj.wordsPerDay);
            await setDoc(doc(db, 'users', user.uid, 'daily_content', today), {
              [langKey]: words,
              [`${langId}Completed`]: false,
              energyLevel: 5,
              mentalState: '',
              planBActive: false
            }, { merge: true });
            setData(prev => ({ ...prev, englishWords: words }));
          } catch (err) {
            console.error('Error generating language words:', err);
          } finally {
            isGeneratingRef.current = false;
          }
        };

        if (d.exists()) {
          const content = d.data();
          const words   = content[langKey] || content.englishWords || [];
          setData(prev => ({
            ...prev,
            englishWords: words,
            englishCompleted: content[`${langId}Completed`] || content.englishCompleted || false,
            englishScore: content[`${langId}Score`] ?? content.englishScore,
            energyLevel: content.energyLevel || 5,
            mentalState: content.mentalState || '',
            planBActive: content.planBActive || false
          }));
          if (words.length === 0 && !isGeneratingRef.current) generateAndSave();
        } else {
          if (!isGeneratingRef.current) generateAndSave();
        }
      }),
      // Stats / Settings
      onSnapshot(doc(db, 'users', user.uid, 'settings', 'config'), (d) => {
        if (d.exists()) {
            const s = d.data();
            settingsRef.current = s;
            setSettings(s);
            setData(prev => ({ 
                ...prev, 
                streak: s.streak || 0,
                deepWork: s.deepWork || 0
            }));
        }
        setLoading(false);
      }),
      // Schedule
      onSnapshot(doc(db, 'users', user.uid, 'schedule', today), (d) => {
        if (d.exists()) setData(prev => ({ ...prev, scheduleItems: d.data().items || [] }));
        else setData(prev => ({ ...prev, scheduleItems: [] }));
      })
    ];

    return () => {
        unsubs.forEach(u => u && u());
    };
  }, [user, today, weekId]);

  // Energy history — last 7 days (one-time fetch, refreshes when day changes)
  useEffect(() => {
    if (!user) return;
    const fetchEnergyHistory = async () => {
      try {
        const snap = await getDocs(collection(db, 'users', user.uid, 'energy_log'));
        const history = [];
        snap.forEach(d => history.push({ date: d.id, ...d.data() }));
        setData(prev => ({ ...prev, energyHistory: history }));
      } catch (e) {
        console.warn('energy_log fetch failed', e);
      }
    };
    fetchEnergyHistory();
  }, [user, today]);

  const toggleHabit = async (habitKey) => {
    const newVal = !data.habits[habitKey];
    const newHabits = { ...data.habits, [habitKey]: newVal };
    setData(prev => ({ ...prev, habits: newHabits }));
    await setDoc(doc(db, 'users', user.uid, 'habits', today), { [habitKey]: newVal }, { merge: true });
    
    if (newVal && Object.values(newHabits).filter(v => v).length === 3) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  };

  const toggleNightHabit = async (habitKey) => {
    const newVal = data.nightHabits[habitKey] ? 0 : 1;
    const newNightHabits = { ...data.nightHabits, [habitKey]: newVal };
    setData(prev => ({ ...prev, nightHabits: newNightHabits }));
    await setDoc(doc(db, 'users', user.uid, 'night_habits', today), { [habitKey]: newVal }, { merge: true });
    
    // Confetti when ALL 6 night habits are completed
    const completedCount = Object.values(newNightHabits).filter(v => v === 1).length;
    if (newVal === 1 && completedCount === 6) {
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.7 }, colors: ['#6366f1', '#818cf8', '#c7d2fe', '#fbbf24'] });
    }
  };

  // ── Complete Language Session (con lógica de progresión de nivel) ──
  const completeLanguageSession = async (score, meta = {}) => {
    const langKey  = `${langId}Words`;
    const pct      = meta.pct ?? Math.round((score / (data.englishWords?.length || 1)) * 100);

    setData(prev => ({ ...prev, englishCompleted: true, englishScore: score }));
    await setDoc(doc(db, 'users', user.uid, 'daily_content', today), {
      [`${langId}Completed`]: true,
      [`${langId}Score`]: score,
      [langKey]: data.englishWords,
      // legacy compat:
      englishCompleted: langId === 'english' ? true : undefined,
      englishScore:     langId === 'english' ? score : undefined,
    }, { merge: true });

    confetti({ particleCount: 100, spread: 60, origin: { y: 0.7 }, colors: ['#10b981', '#34d399', '#6ee7b7'] });

    // ── Progresión automática de nivel ──
    if (pct >= 80) {
      const streakKey = `lang_streak_${langId}`;
      const newStreak = langSuccessStreak + 1;
      localStorage.setItem(streakKey, String(newStreak));
      setLangSuccessStreak(newStreak);

      const currentLevel = LEVELS.find(l => l.id === levelId) || LEVELS[4];
      const threshold    = currentLevel.streakToLevelUp;

      if (threshold && newStreak >= threshold) {
        const currentIdx  = LEVELS.findIndex(l => l.id === levelId);
        const nextLevel   = LEVELS[currentIdx + 1];
        if (nextLevel) {
          localStorage.setItem('language_widget_level', nextLevel.id);
          localStorage.setItem(streakKey, '0');
          setLevelId(nextLevel.id);
          setLangSuccessStreak(0);
          // Guardar en Firestore
          await setDoc(doc(db, 'users', user.uid, 'settings', 'language_settings'), {
            targetLanguage: langId,
            currentLevel: nextLevel.id,
            updatedAt: today,
          }, { merge: true });
          // Toast de nivel
          setLevelUpToast({ from: currentLevel.id, to: nextLevel.id, lang: langId });
          setTimeout(() => setLevelUpToast(null), 5000);
          confetti({ particleCount: 250, spread: 120, origin: { y: 0.45 }, colors: ['#f59e0b', '#fbbf24', '#fde68a', '#fff'] });
        }
      }
    }
  };

  // ── Cambio de idioma (invalida caché del día) ──
  const handleLanguageChange = async (newLangId) => {
    setLangId(newLangId);
    localStorage.setItem('language_widget_lang', newLangId);
    const newLevelId = localStorage.getItem('language_widget_level') || 'B2';
    // Reset daily words for new language
    setData(prev => ({ ...prev, englishWords: [], englishCompleted: false, englishScore: undefined }));
    isGeneratingRef.current = false; // release mutex
    // Save language preference in Firestore
    await setDoc(doc(db, 'users', user.uid, 'settings', 'language_settings'), {
      targetLanguage: newLangId, currentLevel: newLevelId
    }, { merge: true });
  };

  const handleLevelChange = async (newLevelId) => {
    setLevelId(newLevelId);
    localStorage.setItem('language_widget_level', newLevelId);
    setData(prev => ({ ...prev, englishWords: [], englishCompleted: false, englishScore: undefined }));
    isGeneratingRef.current = false;
    await setDoc(doc(db, 'users', user.uid, 'settings', 'language_settings'), {
      targetLanguage: langId, currentLevel: newLevelId
    }, { merge: true });
  };

  // ── Legacy compat (seguía siendo llamado en algunas partes) ──
  const completeEnglish = (score) => completeLanguageSession(score);

  const toggleReading = async () => {
    const isRead = data.reading.last_read_date === today;
    const newDate = isRead ? null : today;
    await setDoc(doc(db, 'users', user.uid, 'settings', 'reading'), { last_read_date: newDate }, { merge: true });
    if (!isRead) confetti({ particleCount: 50, spread: 40 });
  };

  const saveSacredBlocks = async (blocks) => {
    await setDoc(doc(db, 'users', user.uid, 'settings', 'sacred_blocks'), { blocks });
    setIsSacredModalOpen(false);
  };

  const saveReading = async (book) => {
    await setDoc(doc(db, 'users', user.uid, 'settings', 'reading'), { current_book: book }, { merge: true });
    setIsReadingModalOpen(false);
  };

  const saveWeeklyFocus = async (focus) => {
    await setDoc(doc(db, 'users', user.uid, 'weekly', weekId), { priority_1: focus }, { merge: true });
    setIsFocusModalOpen(false);
  };

  const saveEnergyLevel = async (level) => {
    setData(prev => ({ ...prev, energyLevel: level }));
    await setDoc(
      doc(db, 'users', user.uid, 'energy_log', today),
      { level, mode: data.mentalState, date: today },
      { merge: true }
    );
  };

  const saveMentalState = async (state) => {
    const newState = data.mentalState === state ? '' : state;
    setData(prev => ({ ...prev, mentalState: newState }));
    await setDoc(
      doc(db, 'users', user.uid, 'energy_log', today),
      { mode: newState, level: data.energyLevel, date: today },
      { merge: true }
    );
    // also keep in daily_content for streak/progress references
    await setDoc(doc(db, 'users', user.uid, 'daily_content', today), { mentalState: newState }, { merge: true });
  };

  const togglePlanB = async () => {
    const newState = !data.planBActive;
    setData(prev => ({ ...prev, planBActive: newState }));
    await setDoc(doc(db, 'users', user.uid, 'daily_content', today), { planBActive: newState }, { merge: true });
  };

  const addScheduleItem = async () => {
    if (!newEvent.title.trim()) return;
    const item = { ...newEvent, id: Date.now().toString() };
    const updated = [...data.scheduleItems, item].sort((a, b) => a.startTime.localeCompare(b.startTime));
    setData(prev => ({ ...prev, scheduleItems: updated }));
    await setDoc(doc(db, 'users', user.uid, 'schedule', today), { items: updated }, { merge: true });
    setNewEvent({ title: '', category: 'Deep Work', startTime: '09:00', endTime: '10:00' });
    setIsScheduleModalOpen(false);
  };

  const deleteScheduleItem = async (id) => {
    const updated = data.scheduleItems.filter(i => i.id !== id);
    setData(prev => ({ ...prev, scheduleItems: updated }));
    await setDoc(doc(db, 'users', user.uid, 'schedule', today), { items: updated }, { merge: true });
  };

  // ── useMemo hooks MUST be before any early return (React rules of hooks) ──
  const morningHabits = useMemo(() => [
    { 
      key: 'movement', number: 3, label: 'Movimiento', color: 'amber', icon: <Swords className="w-5 h-5" />,
      subLabel: data.planBActive ? '1 Ejercicio Express (Circuito corto)' : '15min (3 ejercicios × 3 sets)'
    },
    { 
      key: 'meditation', number: 6, label: 'Meditación', color: 'blue', icon: <Brain className="w-5 h-5" />,
      subLabel: data.planBActive ? '6 min meditación guiada rápida' : '10 min total silencio'
    },
    { 
      key: 'planTomorrow', number: 9, label: 'Revisión de Planificación', color: 'purple', icon: <Target className="w-5 h-5" />,
      subLabel: data.planBActive ? 'Visión Express de agenda (3 min)' : 'Revisar la agenda preparada anoche para tener claridad del día'
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [data.planBActive]);

  const nightHabitsList = useMemo(() => [
    { 
      key: 'plan_night', label: 'Planificación Nocturna', subLabel: 'Agenda de Mañana lista', 
      icon: <ClipboardList className="w-6 h-6" />, color: 'text-blue-500', 
      theme: { bg: 'bg-[#e0f2fe]', text: 'text-blue-900', sub: 'text-blue-500/80', icon: 'text-blue-500', fill: 'fill-blue-500' }
    },
    { 
      key: 'seed_water', label: 'Jugo Verde / Agua...', subLabel: 'Preparado ahora', 
      icon: <Leaf className="w-6 h-6" />, color: 'text-emerald-500', 
      theme: { bg: 'bg-[#dcfce7]', text: 'text-emerald-900', sub: 'text-emerald-600/80', icon: 'text-emerald-600', fill: 'fill-emerald-500' }
    },
    { 
      key: 'digital_limit', label: 'Desconexión', subLabel: 'Límite de TV / Pantallas', 
      icon: <MonitorOff className="w-6 h-6" />, color: 'text-purple-400', 
      theme: { bg: 'bg-[#f3e8ff]', text: 'text-purple-900', sub: 'text-purple-500/80', icon: 'text-purple-600', fill: 'fill-purple-500' }
    },
    { 
      key: 'env_ready', label: 'Entorno Listo', subLabel: 'Ropa y maletín listos', 
      icon: <Briefcase className="w-6 h-6" />, color: 'text-amber-500', 
      theme: { bg: 'bg-[#fef3c7]', text: 'text-amber-900', sub: 'text-amber-600/80', icon: 'text-amber-600', fill: 'fill-amber-500' }
    },
    { 
      key: 'reflection', label: 'Gratitud', subLabel: '3 cosas por agradecer', 
      icon: <Heart className="w-6 h-6 outline-none" />, color: 'text-rose-500', 
      theme: { bg: 'bg-[#ffe4e6]', text: 'text-rose-900', sub: 'text-rose-500/80', icon: 'text-rose-600', fill: 'fill-rose-500' }
    },
    { 
      key: 'lessons', label: 'Reflexión', subLabel: 'Lecciones del día', 
      icon: <BookOpen className="w-6 h-6" />, color: 'text-teal-400', 
      theme: { bg: 'bg-[#ccfbf1]', text: 'text-teal-900', sub: 'text-teal-600/80', icon: 'text-teal-600', fill: 'fill-teal-500' }
    }
  ], []); // static list — never changes

  // Cálculo de Racha (Streak) local para el Dashboard
  const streakCount = React.useMemo(() => {
    let count = 0;
    const d = new Date();
    const pastDays = [...Array(30)].map((_, i) => {
        const temp = new Date(d);
        temp.setDate(temp.getDate() - i);
        const tzOffset = temp.getTimezoneOffset() * 60000;
        return new Date(temp.getTime() - tzOffset).toISOString().split('T')[0];
    });
    
    for (const dateStr of pastDays) {
        if (data?.history && data.history[dateStr] && data.history[dateStr].score >= 70) count++;
        else if (dateStr !== today) break;
    }
    return count;
  }, [data?.history, today]);

  if (loading) return <div className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-500" /></div>;

  const currentMonth = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });

  // Calculate progress
  const morningDone = morningHabits.filter(h => data.habits[h.key]).length;
  const nightDone = nightHabitsList.filter(h => data.nightHabits[h.key]).length;
  const totalItems = morningHabits.length + (data.englishWords.length > 0 ? 1 : 0) + nightHabitsList.length;
  const totalProgress = Math.round(((morningDone + (data.englishCompleted ? 1 : 0) + nightDone) / totalItems) * 100) || 0;

  const getDayLabel = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return ['D','L','M','X','J','V','S'][d.getDay()];
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500/30">
      
      {/* Toast de Level Up Global */}
      {levelUpToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[1000] animate-bounce-short">
          <div className="bg-gradient-to-r from-amber-500 to-yellow-400 p-[2px] rounded-[2rem] shadow-[0_10px_40px_rgba(245,158,11,0.4)]">
            <div className="bg-slate-900 px-6 py-4 rounded-[calc(2rem-2px)] flex items-center gap-4">
              <span className="text-3xl">{LANGUAGES.find(l => l.id === levelUpToast.lang)?.emoji || '🌍'}</span>
              <div>
                <p className="font-black text-amber-400 text-lg uppercase tracking-tight leading-none mb-1">¡Nuevo Nivel Alcanzado!</p>
                <p className="text-slate-300 text-sm font-medium">Has pasado del nivel <strong className="text-white">{levelUpToast.from}</strong> al <strong className="text-white">{levelUpToast.to}</strong>. ¡Increíble!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATUS BAR HORIZONTAL (Sólo Mobile/Tablet) */}
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm z-20 relative lg:hidden">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl font-black text-sm uppercase tracking-wider">
             <span className="text-lg">🔥</span> {streakCount} {streakCount === 1 ? 'DÍA' : 'DÍAS'}
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
          <div className="hidden sm:block">
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">
              {today}
            </h2>
          </div>
        </div>
        <button
          onClick={togglePlanB}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all duration-500 ${
            settings.planB
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
              : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          {settings.planB ? <ShieldAlert className="w-4 h-4 animate-pulse" /> : <Shield className="w-4 h-4" />}
          <span className="text-[10px] font-black uppercase tracking-widest">{settings.planB ? 'Plan B Activo' : 'Plan B Off'}</span>
        </button>
      </div>

      {/* DASHBOARD CANVAS (Contenedor Maestro) */}
      <div className="w-full max-w-[1700px] mx-auto p-6 md:p-8 flex flex-col gap-8 pb-32">
        {/* Header Indicator / Desktop Status */}
        <div className="flex items-center justify-between z-10 relative">
          <div className="flex flex-col">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-500 mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Sincronización Biotécnica
            </p>
          </div>
          
          {/* Desktop Only Status Indicators (Premium Feel) */}
          <div className="hidden lg:flex items-center gap-3">
              <div className="flex flex-col items-end mr-4">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Racha Actual</span>
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-black text-lg">
                  <span className="text-xl">🔥</span> {streakCount} {streakCount === 1 ? 'DÍA' : 'DÍAS'}
                </div>
              </div>
              <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>
              <button
                onClick={togglePlanB}
                className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border-2 transition-all duration-500 ${
                  settings.planB
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20 shadow-lg shadow-amber-500/5'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {settings.planB ? <ShieldAlert className="w-5 h-5 animate-pulse" /> : <Shield className="w-5 h-5" />}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest">{settings.planB ? 'Plan B Activo' : 'Plan B Off'}</span>
                </div>
              </button>
          </div>
        </div>


      {/* ═══════════════════════════════════════════
          1. TOP BANNER — Circular Progress + Chips
         ═══════════════════════════════════════════ */}
      <div className="flex flex-col gap-5 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800/50 shadow-2xl relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-2xl" />

        {/* Header Indicator */}
        <div className="flex items-center justify-between z-10 relative">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-500 mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Progreso del Día
          </p>

        </div>

        {/* ── ROW 1: Progreso + info ── */}
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 relative z-10 w-full">
          <div className="shrink-0 scale-90 sm:scale-100">
            <CircularProgress percentage={totalProgress} size={130} strokeWidth={10} />
          </div>

          <div className="flex-1 flex flex-col gap-4 sm:gap-5 w-full">
            {/* Chips — distribuidos en todo el ancho */}
            <div className="flex items-center justify-between gap-3 w-full">

              <div className="flex items-center gap-2 bg-blue-500/10 px-3 sm:px-4 py-2 sm:py-2.5 rounded-[1.2rem] border border-blue-500/20 shadow-sm flex-1 justify-center">
                <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-[10px] sm:text-xs font-black text-blue-300 uppercase tracking-wider truncate">{currentMonth}</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/10 px-3 sm:px-4 py-2 sm:py-2.5 rounded-[1.2rem] border border-emerald-500/20 shadow-sm flex-1 justify-center">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)] shrink-0" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">LIVE</span>
              </div>
            </div>

            {/* Stats — distribuidos en todo el ancho */}
            <div className="flex items-center justify-between w-full bg-slate-100/50 dark:bg-slate-800/30 p-3 sm:p-0 sm:bg-transparent rounded-2xl">
              <div className="flex flex-col items-center gap-1 sm:gap-0.5 flex-1">
                <div className="flex items-center gap-1.5 text-amber-500 text-sm sm:text-base font-bold">
                  <Sun className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-500" />
                  <span>{morningDone}/{morningHabits.length}</span>
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider">AMANECER</span>
              </div>
              <span className="text-slate-300 dark:text-slate-700 sm:text-slate-700/60 text-xl font-light">|</span>
              <div className="flex flex-col items-center gap-1 sm:gap-0.5 flex-1 group">
                <div className={`flex items-center gap-1.5 text-sm sm:text-base font-bold transition-all duration-500 ${data.englishCompleted ? (data.englishScore === data.englishWords?.length ? 'text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] scale-110' : 'text-emerald-400') : 'text-slate-400'}`}>
                  <BookOpen className={`w-4 h-4 sm:w-5 sm:h-5 ${data.englishCompleted ? 'animate-bounce' : 'group-hover:rotate-12 transition-transform'}`} />
                  <span className="tabular-nums">
                    {data.englishCompleted 
                      ? `${data.englishScore || 0}/${data.englishWords?.length || 0}` 
                      : `0/${data.englishWords?.length || 3}`}
                  </span>
                </div>
                <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest mt-0.5 transition-colors ${data.englishCompleted ? 'text-emerald-500' : 'text-slate-500'}`}>
                  {data.englishCompleted ? 'DOMINADO' : `${LANGUAGES.find(l => l.id === langId)?.emoji || '🌍'} RETO ${levelId}`}
                </span>
              </div>
              <span className="text-slate-300 dark:text-slate-700 sm:text-slate-700/60 text-xl font-light">|</span>
              <div className="flex flex-col items-center gap-1 sm:gap-0.5 flex-1">
                <div className="flex items-center gap-1.5 text-indigo-400 text-sm sm:text-base font-bold">
                  <Moon className="w-4 h-4 sm:w-5 sm:h-5 fill-indigo-400" />
                  <span>{nightDone}/{nightHabitsList.length}</span>
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider">CIERRE</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── ROW 2: Plan B — ancho completo ── */}
        <div className={`relative z-10 flex flex-col sm:flex-row items-center sm:justify-between gap-4 p-4 sm:px-5 rounded-3xl sm:rounded-[2rem] border transition-all ${
            data.planBActive 
              ? 'bg-red-500/10 border-red-500/30' 
              : 'bg-slate-50 dark:bg-[#151518] border-slate-200 dark:border-[#1e1e24] shadow-xl'
          }`}>
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className={`p-2 sm:p-2.5 rounded-full flex items-center justify-center shrink-0 ${data.planBActive ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-[#1e1e24] text-emerald-400'}`}>
              {data.planBActive ? <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" /> : <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-emerald-400" />}
            </div>
            <div className="text-left flex-1 min-w-0">
              <h4 className="font-extrabold text-[13px] sm:text-[15px] uppercase tracking-wide leading-tight text-slate-900 dark:text-white mb-[2px] truncate">
                {data.planBActive ? 'MODO PLAN B ACTIVO' : 'MODO EXPANSIÓN (CEO)'}
              </h4>
              <p className="text-slate-500 text-[11px] sm:text-[12px] font-medium leading-none">
                {data.planBActive ? 'Adaptación extrema activada' : 'Enfoque máximo'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => togglePlanB()}
            className={`w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl text-[11px] font-bold uppercase transition-all whitespace-nowrap sm:ml-6 shadow-sm flex items-center justify-center ${
                data.planBActive
                ? 'bg-slate-800 text-white hover:bg-slate-700'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {data.planBActive ? 'DESACTIVAR PLAN B' : 'ACTIVAR PLAN B'}
          </button>
        </div>
      </div>

      <div className="widget-grid-3">

          {/* ─── 2. TESLA MORNING 3-6-9 ─── */}
          <div className="col-span-1 md:col-span-2 order-1 widget-card widget-card--amber !p-0 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-amber-500 dark:from-orange-700 dark:to-orange-900 p-6 md:p-8 pb-4 md:pb-6 text-white flex justify-between items-start overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
              <div>
                <h3 className="text-3xl font-black tracking-tight leading-none mb-1">Tesla Morning</h3>
                <p className="text-orange-200 font-medium tracking-wide">3 · 6 · 9 Protocol</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black leading-none">{Math.round((morningDone / morningHabits.length) * 100) || 0}%</div>
                <div className="text-[10px] font-bold text-orange-200 uppercase tracking-widest mt-1">Complete</div>
              </div>
            </div>

            {/* Habits List */}
            <div className="p-6 space-y-4">
              {morningHabits.map((item) => {
                const isDone = data.habits[item.key];
                
                const colorMap = {
                  amber: { 
                    border: 'border-l-amber-400 dark:border-l-amber-500', 
                    numBg: 'bg-amber-50 dark:bg-amber-900/40 text-amber-500 dark:text-amber-400', 
                    pillBg: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
                    activeBg: 'bg-amber-50/50 dark:bg-amber-900/10',
                    iconColor: 'text-slate-400 dark:text-slate-500'
                  },
                  blue: { 
                    border: 'border-l-blue-400 dark:border-l-blue-500', 
                    numBg: 'bg-blue-50 dark:bg-blue-900/40 text-blue-500 dark:text-blue-400', 
                    pillBg: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
                    activeBg: 'bg-blue-50/50 dark:bg-blue-900/10',
                    iconColor: 'text-slate-400 dark:text-slate-500'
                  },
                  purple: { 
                    border: 'border-l-purple-400 dark:border-l-purple-500', 
                    numBg: 'bg-purple-50 dark:bg-purple-900/40 text-purple-500 dark:text-purple-400', 
                    pillBg: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
                    activeBg: 'bg-purple-50/50 dark:bg-purple-900/10',
                    iconColor: 'text-slate-400 dark:text-slate-500'
                  },
                  emerald: { 
                    border: 'border-l-emerald-400 dark:border-l-emerald-500', 
                    numBg: 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-500 dark:text-emerald-400', 
                    pillBg: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
                    activeBg: 'bg-emerald-50/50 dark:bg-emerald-900/10',
                    iconColor: 'text-slate-400 dark:text-slate-500'
                  }
                };
                const color = colorMap[item.color];

                return (
                  <button 
                    key={item.key}
                    onClick={() => toggleHabit(item.key)}
                    className={`w-full flex items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 rounded-[2rem] border-y border-r border-l-[6px] border-r-slate-100 border-y-slate-100 dark:border-r-slate-800 dark:border-y-slate-800 ${color.border} transition-all duration-300 text-left hover:-translate-y-1 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] ${isDone ? color.activeBg : 'bg-slate-50/50 dark:bg-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]'}`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      {/* Number Circle */}
                      <div className={`hidden sm:flex w-12 h-12 rounded-full items-center justify-center text-xl font-black shrink-0 ${color.numBg} ${isDone ? 'opacity-50' : ''}`}>
                        {item.number}
                      </div>

                      {/* Content */}
                      <div className={`flex flex-col flex-1 min-w-0 ${isDone ? 'opacity-50' : ''}`}>
                        <div className="flex items-start gap-2 mb-1">
                          <div className={`mt-0.5 shrink-0 ${color.iconColor}`}>{item.icon}</div>
                          <span className="font-bold text-slate-800 dark:text-slate-100 text-[16px] sm:text-[17px] leading-tight break-words">{item.label}</span>
                        </div>
                        <p className="text-[13px] sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-snug break-words pl-[30px]">
                          {item.subLabel}
                        </p>
                      </div>
                    </div>

                    {/* Checkbox */}
                    <div className="shrink-0 flex items-center justify-center pl-2">
                      {isDone ? (
                        <CheckCircle2 className={`w-8 h-8 shrink-0 ${color.numBg.split(' ')[2] || 'text-slate-400'}`} />
                      ) : (
                        <Circle className="w-8 h-8 shrink-0 text-slate-200 dark:text-slate-700 hover:text-slate-300 transition-colors" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── 5. CIERRE DE ALTO RENDIMIENTO ─── */}
          <div className="col-span-2 order-3 widget-card widget-card--violet">
            {/* Header section matching screenshot */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 dark:bg-white p-3.5 rounded-3xl shadow-sm">
                        <Moon className="w-7 h-7 text-[#30338F] stroke-[2]" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">Cierre de Alto Rendimiento</h3>
                        <p className="text-slate-500 text-[13px] font-medium mt-0.5">Rutina nocturna para mañanas exitosas</p>
                    </div>
                </div>
                {/* Percentage & exact circle matching the screenshot */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[#6366f1] font-bold text-sm tracking-tight leading-none">{Math.round((nightDone / nightHabitsList.length) * 100) || 0}%</span>
                  <div className="relative w-7 h-7">
                    <svg width="28" height="28" className="transform -rotate-90">
                      <circle cx="14" cy="14" r="11" stroke="#1f293b" strokeWidth="2.5" fill="none" />
                      <circle 
                        cx="14" cy="14" r="11" 
                        stroke="#6366f1" 
                        strokeWidth="2.5" 
                        fill="none" 
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 11}
                        strokeDashoffset={2 * Math.PI * 11 - (nightDone / nightHabitsList.length) * 2 * Math.PI * 11}
                        className="transition-all duration-700"
                      />
                    </svg>
                  </div>
                </div>
            </div>

            {/* Horizontal Progress Bar */}
            <div className="w-full h-2 bg-[#1e293b] rounded-full overflow-hidden mb-6">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 rounded-full"
                style={{ width: `${(nightDone / nightHabitsList.length) * 100}%` }}
              />
            </div>

                {/* Checkboxes grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2">
                {nightHabitsList.map(item => {
                  const isDone = data.nightHabits[item.key];
                  return (
                    <button 
                      key={item.key}
                      onClick={() => toggleNightHabit(item.key)}
                      className={`flex flex-col justify-between p-5 rounded-[2rem] transition-all duration-300 text-left min-h-[140px]
                        ${isDone 
                          ? `${item.theme.bg} border-transparent scale-[1.02] shadow-[0_0_20px_rgba(0,0,0,0.15)] z-10` 
                          : 'bg-[#151518] hover:bg-[#1a1a1f] border border-transparent hover:border-slate-800/80 shadow-none'}`}
                    >
                      {/* Top icons row */}
                      <div className="flex items-start justify-between w-full mb-4">
                        <div className={`p-2.5 rounded-2xl flex items-center justify-center transition-colors
                          ${isDone ? `bg-white/90 ${item.theme.icon}` : 'bg-[#1e1e24] ' + item.color}`}>
                           {item.icon}
                        </div>
                        <div className="pt-1 pr-1">
                           {isDone 
                             ? <CheckCircle2 className={`w-7 h-7 text-white ${item.theme.fill}`} strokeWidth={2} /> 
                             : <Circle className="w-7 h-7 text-slate-700 stroke-[1.5]" />}
                        </div>
                      </div>

                      {/* Text content */}
                      <div className="mt-auto">
                        <h4 className={`font-bold text-[15px] leading-snug mb-0.5 transition-colors ${isDone ? item.theme.text : 'text-slate-200'}`}>
                          {item.label}
                        </h4>
                        <p className={`text-xs font-medium transition-colors ${isDone ? item.theme.sub : 'text-slate-500'}`}>
                          {item.subLabel}
                        </p>
                      </div>
                    </button>
                  );
                })}
            </div>
            
            {/* Victory message */}
            {nightDone === nightHabitsList.length && (
                <div className="mt-6 p-5 bg-white rounded-[2rem] flex flex-col items-center justify-center animate-bounce shadow-xl shadow-white/5 border border-slate-100">
                    <Sparkles className="w-8 h-8 text-[#30338F] mb-1" />
                    <p className="text-[#30338F] font-bold text-[17px] text-center leading-tight">¡Cierre perfecto! Mañana será<br/>un gran día 🌟</p>
                </div>
            )}
          </div>
        {/* =======================
            SIDEBAR WIDGETS
            ======================= */}
          {/* ─── 3. MÓDULO MULTI-IDIOMA ─── */}
          <div className="col-span-1 order-4 flex flex-col h-full">
          {data.englishWords.length > 0 ? (
            <LanguageWidget
              words={data.englishWords}
              onComplete={completeLanguageSession}
              isCompleted={data.englishCompleted}
              sessionScore={data.englishScore}
              languageId={langId}
              levelId={levelId}
              onLanguageChange={handleLanguageChange}
              onLevelChange={handleLevelChange}
            />
          ) : (
            /* Skeleton mientras la IA genera las palabras */
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-7 rounded-[2.5rem] border border-slate-800/50 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-500/20 p-2.5 rounded-2xl">
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                </div>
                <div>
                  <h3 className="font-black text-white text-[15px] uppercase tracking-tight">
                    {(() => { const l = LANGUAGES.find(x => x.id === langId); return l ? `${l.emoji} ${l.name}` : '🌍 Idioma'; })()}
                  </h3>
                  <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest animate-pulse">Generando vocabulario con IA · Nivel {levelId}...</p>
                </div>
              </div>
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-14 bg-slate-800/50 rounded-2xl animate-pulse" style={{ opacity: 1 - i * 0.2 }} />
                ))}
              </div>
            </div>
          )}
          </div>

          {/* ─── 4. JOURNAL DE ENERGÍA ─── */}
          {(() => {
            const modeConfig = {
              focus:   { emoji: '🎯', label: 'Focus',   color: 'bg-blue-500',   text: 'text-blue-400',   barGrad: 'from-blue-500 to-blue-400' },
              flow:    { emoji: '🌊', label: 'Flow',    color: 'bg-indigo-500', text: 'text-indigo-400', barGrad: 'from-indigo-500 to-purple-400' },
              warrior: { emoji: '⚔️', label: 'Warrior', color: 'bg-amber-500',  text: 'text-amber-400',  barGrad: 'from-amber-500 to-orange-400' },
              '':      { emoji: '·',  label: '—',       color: 'bg-slate-600',  text: 'text-slate-500',  barGrad: 'from-slate-600 to-slate-500' },
            };
            // Build last 7 days
            const days = Array.from({ length: 7 }, (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (6 - i));
              const key = d.toISOString().split('T')[0];
              const label = d.toLocaleDateString('es-ES', { weekday: 'short' }).slice(0, 2).toUpperCase();
              const entry = (data.energyHistory || []).find(e => e.date === key);
              return { key, label, level: entry?.level || 0, mode: entry?.mode || '' };
            });
            const todayEntry = days[6];
            const mc = modeConfig[data.mentalState] || modeConfig[''];

            return (
              <div className="col-span-1 order-2 widget-card widget-card--amber !bg-gradient-to-br !from-surface-raised !to-surface-base h-full">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -ml-10 -mb-10" />

                {/* Header */}
                <div className="flex items-center gap-3 mb-7 relative z-10">
                  <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/20">
                    <Brain className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-white uppercase tracking-tight text-lg">Journal de Energía</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Registra tu frecuencia diaria</p>
                  </div>
                </div>

                {/* Slider */}
                <div className="relative z-10 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm mb-5">
                  <EnergySlider value={data.energyLevel} onChange={saveEnergyLevel} />
                </div>

                {/* Modo del día */}
                <div className="relative z-10 grid grid-cols-3 gap-3 mb-7">
                  {[
                    { key: 'focus',   label: 'Focus Mode',   icon: '🎯', color: 'blue' },
                    { key: 'flow',    label: 'Flow State',   icon: '🌊', color: 'indigo' },
                    { key: 'warrior', label: 'Warrior Mode', icon: '⚔️', color: 'amber' }
                  ].map(mode => (
                    <button
                      key={mode.key}
                      onClick={() => saveMentalState(mode.key)}
                      className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 transition-all duration-300 ${
                        data.mentalState === mode.key
                          ? mode.color === 'blue'   ? 'bg-blue-500/20 border-blue-500/50 shadow-lg shadow-blue-500/10'
                          : mode.color === 'indigo' ? 'bg-indigo-500/20 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                          : 'bg-amber-500/20 border-amber-500/50 shadow-lg shadow-amber-500/10'
                          : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-2xl">{mode.icon}</span>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${
                        data.mentalState === mode.key ? 'text-white' : 'text-slate-400'
                      }`}>{mode.label}</span>
                    </button>
                  ))}
                </div>

                {/* Gráfica semanal */}
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Historial — Últimos 7 días</p>
                  <div className="flex items-end justify-between gap-2 h-28">
                    {days.map((day, idx) => {
                      const m = modeConfig[day.mode] || modeConfig[''];
                      const heightPct = day.level > 0 ? (day.level / 10) * 100 : 0;
                      const isToday = idx === 6;
                      return (
                        <div key={day.key} className="flex-1 flex flex-col items-center gap-1.5">
                          {/* Emoji modo */}
                          <span className="text-[11px] leading-none">{day.level > 0 ? m.emoji : ''}</span>
                          {/* Barra */}
                          <div className="relative w-full flex items-end" style={{ height: '72px' }}>
                            <div
                              className={`w-full rounded-t-lg transition-all duration-700 bg-gradient-to-t ${m.barGrad} ${
                                isToday ? 'opacity-100 ring-2 ring-offset-1 ring-offset-slate-900 ring-white/20' : 'opacity-60'
                              }`}
                              style={{ height: `${Math.max(heightPct, day.level > 0 ? 8 : 0)}%` }}
                            />
                          </div>
                          {/* Nivel y día */}
                          <span className={`text-[9px] font-black leading-none ${
                            isToday ? 'text-white' : 'text-slate-600'
                          }`}>{day.level > 0 ? day.level : ''}</span>
                          <span className={`text-[9px] font-bold leading-none ${
                            isToday ? 'text-blue-400' : 'text-slate-600'
                          }`}>{day.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Leyenda simple */}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-800">
                    {[['focus', '🎯', 'Focus', 'text-blue-400'], ['flow', '🌊', 'Flow', 'text-indigo-400'], ['warrior', '⚔️', 'Warrior', 'text-amber-400']].map(([k, e, l, c]) => (
                      <div key={k} className="flex items-center gap-1.5">
                        <span className="text-[10px]">{e}</span>
                        <span className={`text-[9px] font-black uppercase tracking-wider ${c}`}>{l}</span>
                      </div>
                    ))}
                    <div className="ml-auto flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-slate-500">HOY:</span>
                      <span className="text-[11px] font-black text-slate-800 dark:text-white">{todayEntry.level > 0 ? `${todayEntry.level}/10 ${mc.emoji}` : '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ─── Mandamiento del Día (improved) ─── */}
          <div className="col-span-1 order-9 widget-card widget-card--violet !bg-gradient-to-br !from-surface-raised !to-surface-base justify-center relative group">
            <div className="absolute top-4 right-8 text-8xl text-white/5 font-serif italic pointer-events-none group-hover:text-white/10 transition-all duration-700">"</div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-700" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400 mb-6">Mandamiento del Día</p>
            <p className="text-xl italic font-medium leading-relaxed opacity-90 relative z-10 font-serif">
               "{settings.manifesto || 'La inacción no es neutral; es una elección activa por la mediocridad.'}"
            </p>
            <div className="mt-6 w-12 h-0.5 bg-gradient-to-r from-amber-400 to-transparent rounded-full" />
          </div>

          {/* ─── Weekly Focus (improved) ─── */}
          <div className="col-span-1 order-8 widget-card widget-card--coral relative group">
                {/* Decorative accent */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-red-500 to-red-600 rounded-l-full" />
                <button 
                    onClick={() => setIsFocusModalOpen(true)}
                    className="absolute top-6 right-6 p-2 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-slate-400 rounded-xl transition border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                >
                    <Edit2 className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 mb-6 pr-12">
                    <Target className="w-5 h-5 text-red-500 shrink-0" />
                    <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter truncate">Foco Semanal #1</h3>
                </div>
                <div className="p-5 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30 relative">
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <p className="text-lg font-black text-red-600 dark:text-red-400 uppercase tracking-tight leading-tight">
                        {data.weeklyFocus.priority_1 || 'DEFINE TU ROCA'}
                    </p>
                </div>
          </div>

          {/* ─── Sacred Blocks (improved with timeline) ─── */}
          <div className="col-span-1 order-6 widget-card widget-card--zinc h-full relative group">
            <button 
                onClick={() => setIsSacredModalOpen(true)}
                className="absolute top-6 right-6 p-2 bg-slate-50 dark:bg-slate-800 hover:bg-white text-slate-400 rounded-xl transition"
            >
                <Edit2 className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-6 pr-12">
              <Anchor className="w-5 h-5 text-cyan-500 shrink-0" />
              <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter truncate">Horario Sagrado</h3>
            </div>
            
            {/* Timeline layout */}
            <div className="relative">
              {/* Vertical connector line */}
              {data.sacredBlocks.length > 1 && (
                <div className="absolute left-[18px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-blue-500/30 via-indigo-500/20 to-transparent" />
              )}
              <div className="space-y-3">
                {data.sacredBlocks.length > 0 ? data.sacredBlocks.map((block, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 transition-all relative">
                      {/* Timeline dot */}
                      <div className="w-[10px] h-[10px] bg-blue-500 rounded-full ring-4 ring-blue-500/20 shrink-0 z-10" />
                      <div className="bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest shrink-0">{block.day}</div>
                      <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-800 dark:text-white text-xs uppercase tracking-tight truncate">{block.label}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <p className="text-[10px] text-slate-400 font-bold">{block.time}</p>
                          </div>
                      </div>
                  </div>
                )) : (
                  <p className="text-xs text-slate-400 italic text-center py-4">Sin bloques configurados</p>
                )}
              </div>
            </div>
          </div>

          {/* ─── Reading Block (improved) ─── */}
          <div className="col-span-1 order-7 widget-card widget-card--emerald h-full">
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="w-5 h-5 text-emerald-500" />
              <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter">Lectura Actual</h3>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 text-center">En progreso</p>
                <p className={`font-black text-slate-900 dark:text-white text-center mb-4 text-lg leading-tight ${data.reading.last_read_date === today ? 'line-through opacity-30' : ''}`}>
                    {data.reading.current_book || 'Añadir libro'}
                </p>

                {/* Visual reading indicator */}
                <div className="flex items-center justify-center gap-1 mb-4">
                  {[...Array(7)].map((_, i) => {
                    // Simple 7-day visual. Only today is dynamic.
                    const dayLabel = ['L','M','X','J','V','S','D'][i];
                    const isToday = i === new Date().getDay() - 1 || (new Date().getDay() === 0 && i === 6);
                    const isDone = isToday && data.reading.last_read_date === today;
                    return (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black transition-all ${
                          isDone ? 'bg-emerald-500 text-white' : isToday ? 'bg-blue-500/20 text-blue-400 ring-2 ring-blue-500/30' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                        }`}>
                          {isDone ? '✓' : dayLabel}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <button 
                  onClick={toggleReading}
                  className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md ${data.reading.last_read_date === today ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'}`}
                >
                  {data.reading.last_read_date === today ? (
                      <> <CheckCircle2 className="w-4 h-4" /> ¡Dosis Absorbida! </>
                  ) : (
                      <> <Circle className="w-4 h-4" /> Consumir 1 Página </>
                  )}
                </button>
            </div>
          </div>

          {/* ─── Horario de Hoy ─── */}
          {(() => {
            const categoryTheme = {
              'Deep Work':  { bar: 'bg-blue-500',   bg: 'bg-blue-50 dark:bg-blue-950/30',   text: 'text-blue-600 dark:text-blue-400' },
              'Reunión':    { bar: 'bg-red-500',    bg: 'bg-rose-50 dark:bg-rose-950/30',   text: 'text-rose-600 dark:text-rose-400' },
              'Descanso':   { bar: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-400' },
              'Ejercicio':  { bar: 'bg-amber-500',  bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-400' },
              'Personal':   { bar: 'bg-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-600 dark:text-indigo-400' },
            };
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
            return (
              <div className="col-span-1 order-5 widget-card widget-card--violet">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter">Horario de Hoy</h3>
                  </div>
                  <button
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="flex items-center gap-1.5 text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-400 transition-colors bg-indigo-50 dark:bg-indigo-950/30 px-3 py-2 rounded-xl"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Añadir
                  </button>
                </div>

                {data.scheduleItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-3">
                      <Clock className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sin eventos hoy</p>
                    <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">Añade tu primer evento del día</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {data.scheduleItems.map(ev => {
                      const theme = categoryTheme[ev.category] || categoryTheme['Personal'];
                      const isActive = ev.startTime <= currentTime && currentTime < ev.endTime;
                      return (
                        <div
                          key={ev.id}
                          className={`group relative flex items-stretch gap-3 p-4 rounded-2xl border transition-all ${isActive ? 'ring-2 ring-indigo-400/30' : ''} ${theme.bg} border-transparent`}
                        >
                          {/* Barra de color lateral */}
                          <div className={`w-1 rounded-full shrink-0 ${theme.bar}`} />

                          {/* Horas */}
                          <div className="flex flex-col items-end shrink-0 w-10">
                            <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 leading-tight">{ev.startTime}</span>
                            <span className={`text-[10px] font-bold ${theme.text} leading-tight`}>{ev.endTime}</span>
                          </div>

                          {/* Contenido */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 dark:text-white text-[13px] leading-tight truncate">{ev.title}</p>
                            <span className={`text-[10px] font-bold ${theme.text}`}>{ev.category}</span>
                          </div>

                          {/* Borrar */}
                          <button
                            onClick={() => deleteScheduleItem(ev.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-300 hover:text-red-400 shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Indicador activo */}
                          {isActive && (
                            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ─── Weekly Vitals Chart (New Widget) ─── */}
          <div className="col-span-1 order-10 widget-card widget-card--emerald !bg-gradient-to-br !from-surface-raised !to-surface-base flex flex-col justify-center">
             <div className="flex items-center gap-3 mb-6">
               <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
                 <Activity className="w-6 h-6 text-emerald-400" />
               </div>
               <div>
                 <h3 className="font-black text-white uppercase tracking-tight text-lg">Vitals Semanales</h3>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tu racha y tendencia</p>
               </div>
             </div>

             <div className="flex items-end justify-between gap-2 h-32 px-2 mt-2">
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => {
                  const val = [65, 85, 45, 95, 75, 55, 90][i]; // Sample dynamic-ish values
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                      <div className="relative w-full flex flex-col justify-end h-full">
                         <div 
                           className="w-full bg-gradient-to-t from-emerald-600/20 to-emerald-500 rounded-t-xl rounded-b-md transition-all duration-500 group-hover:scale-x-110 group-hover:brightness-110"
                           style={{ height: `${val}%` }}
                         />
                         {/* Micro-label on hover */}
                         <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-[9px] font-black px-1.5 py-0.5 rounded transition-opacity whitespace-nowrap z-50">
                            {val}%
                         </div>
                      </div>
                      <span className="text-[10px] font-black text-slate-600 group-hover:text-emerald-400 transition-colors uppercase">{day}</span>
                    </div>
                  );
                })}
             </div>
          </div>

      </div>

      {/* ═══════════════════════════════════════
          MODALS (unchanged)
         ═══════════════════════════════════════ */}
      <Modal isOpen={isSacredModalOpen} onClose={() => setIsSacredModalOpen(false)} title="Configurar Horario">
          <SacredBlockEditor initialBlocks={data.sacredBlocks} onSave={saveSacredBlocks} />
      </Modal>

      {/* Schedule Modal */}
      <Modal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} title="Añadir Evento">
        <div className="space-y-5">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Título del Evento</label>
            <input
              type="text"
              value={newEvent.title}
              onChange={e => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ej: Deep Work — Estrategia"
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Hora Inicio</label>
              <input type="time" value={newEvent.startTime}
                onChange={e => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-bold text-slate-800 dark:text-white outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Hora Fin</label>
              <input type="time" value={newEvent.endTime}
                onChange={e => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-bold text-slate-800 dark:text-white outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Categoría</label>
            <div className="grid grid-cols-3 gap-2">
              {['Deep Work', 'Reunión', 'Descanso', 'Ejercicio', 'Personal'].map(cat => (
                <button key={cat}
                  onClick={() => setNewEvent(prev => ({ ...prev, category: cat }))}
                  className={`py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                    newEvent.category === cat
                      ? 'bg-indigo-500 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >{cat}</button>
              ))}
            </div>
          </div>
          <button
            onClick={addScheduleItem}
            className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-indigo-500/20"
          >
            Guardar Evento
          </button>
        </div>
      </Modal>

      <Modal isOpen={isReadingModalOpen} onClose={() => setIsReadingModalOpen(false)} title="Configurar Lectura">
          <div className="space-y-6">
              <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Título del Libro</label>
                  <input 
                      type="text" 
                      defaultValue={data.reading.current_book}
                      id="book-input"
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Ej: Meditaciones - Marco Aurelio"
                  />
              </div>
              <Button onClick={() => saveReading(document.getElementById('book-input').value)} className="w-full py-4 text-xs font-black uppercase tracking-widest">
                  Guardar Libro
              </Button>
          </div>
      </Modal>

      <Modal isOpen={isFocusModalOpen} onClose={() => setIsFocusModalOpen(false)} title="Foco de la Semana">
           <div className="space-y-6">
              <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Tu roca absoluta #1</label>
                  <textarea 
                      defaultValue={data.weeklyFocus.priority_1}
                      id="focus-input"
                      rows="3"
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-black text-red-600 dark:text-red-400 outline-none focus:ring-4 focus:ring-red-500/10 uppercase"
                      placeholder="ESCRIBE TU PRIORIDAD..."
                  />
              </div>
              <Button onClick={() => saveWeeklyFocus(document.getElementById('focus-input').value)} className="w-full py-4 text-xs font-black uppercase tracking-widest bg-red-600 hover:bg-red-700">
                  Establecer Foco
              </Button>
          </div>
      </Modal>
      </div>
    </div>
  );
};

const SacredBlockEditor = ({ initialBlocks, onSave }) => {
    const [blocks, setBlocks] = useState(initialBlocks.length > 0 ? initialBlocks : [{ day: 'LUN-VIE', label: 'DEEP WORK', time: '05:00 - 08:30', color: 'blue' }]);

    const addBlock = () => setBlocks([...blocks, { day: 'DIA', label: 'NUEVA', time: '00:00', color: 'blue' }]);
    const removeBlock = (idx) => setBlocks(blocks.filter((_, i) => i !== idx));
    const update = (idx, field, val) => {
        const nb = [...blocks];
        nb[idx][field] = val;
        setBlocks(nb);
    };

    return (
        <div className="space-y-4">
            {blocks.map((b, idx) => (
                <div key={idx} className="p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl relative border border-slate-100 dark:border-slate-700">
                    <button onClick={() => removeBlock(idx)} className="absolute top-2 right-2 p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    <div className="flex gap-3 mb-3">
                        <input type="text" value={b.day} onChange={e => update(idx, 'day', e.target.value.toUpperCase())} className="w-20 p-2 rounded-xl bg-white dark:bg-slate-900 border-none font-black text-[10px] uppercase text-center" placeholder="DIA" />
                        <input type="text" value={b.label} onChange={e => update(idx, 'label', e.target.value)} className="flex-1 p-2 rounded-xl bg-white dark:bg-slate-900 border-none font-bold text-xs" placeholder="Actividad" />
                    </div>
                    <input type="text" value={b.time} onChange={e => update(idx, 'time', e.target.value)} className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border-none text-[10px] font-bold text-slate-400" placeholder="Rango de Tiempo" />
                </div>
            ))}
            <button onClick={addBlock} className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[1.5rem] text-xs font-black uppercase text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-all">+ Añadir Bloque</button>
            <Button onClick={() => onSave(blocks)} className="w-full py-5 text-sm font-black uppercase tracking-widest mt-4">Actualizar Bloques</Button>
        </div>
    );
};

export default DashboardTab;
