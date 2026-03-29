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
  BatteryLow,
  BatteryMedium,
  BatteryWarning,
  BatteryFull,
  Quote,
  Clock,
  ClipboardList,
  Leaf,
  MonitorOff,
  Briefcase,
  Heart,
  Activity
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  doc, 
  getDoc, 
  onSnapshot, 
  setDoc, 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  limit 
} from 'firebase/firestore';
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
      <div 
        className="absolute inset-0 rounded-full blur-xl opacity-40 transition-all duration-1000"
        style={{ background: `conic-gradient(from 0deg, #136dec ${percentage}%, transparent ${percentage}%)` }}
      />
      <svg width={size} height={size} className="transform -rotate-90 relative z-10">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="currentColor"
          className="text-slate-800/50"
          strokeWidth={strokeWidth}
          fill="none"
        />
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
  
  // 1. Estado de Datos del Negocio
  const [data, setData] = useState({
    habits: {},
    nightHabits: {},
    sacredBlocks: [],
    scheduleItems: [],
    energyHistory: [],
    history: {},
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

  // 2. Estado de UI y Configuración Consolidado
  const [uiState, setUiState] = useState({
    loading: true,
    settings: {},
    langId: localStorage.getItem('language_widget_lang') || 'english',
    levelId: localStorage.getItem('language_widget_level') || 'C1',
    langSuccessStreak: parseInt(localStorage.getItem(`lang_streak_${localStorage.getItem('language_widget_lang') || 'english'}`) || '0'),
    levelUpToast: null
  });

  // 3. Estado de Modales Consolidado
  const [modals, setModals] = useState({
    sacred: false,
    reading: false,
    focus: false,
    schedule: false,
    newEvent: { title: '', category: 'Deep Work', startTime: '09:00', endTime: '10:00' }
  });

  // Referencias estables
  const isGeneratingRef = useRef(false);
  const settingsRef = useRef({});

  // Desestructuración y alias para compatibilidad con código existente
  const { loading, settings, langId, levelId, langSuccessStreak, levelUpToast } = uiState;
  const { sacred: isSacredModalOpen, reading: isReadingModalOpen, focus: isFocusModalOpen, schedule: isScheduleModalOpen, newEvent } = modals;

  // Helpers de estado (en lugar de setters directos)
  const setLoading = (l) => setUiState(p => ({ ...p, loading: l }));
  const setSettings = (s) => setUiState(p => ({ ...p, settings: s }));
  const setLangId = (id) => setUiState(p => ({ ...p, langId: id }));
  const setLevelId = (id) => setUiState(p => ({ ...p, levelId: id }));
  const setLangSuccessStreak = (s) => setUiState(p => ({ ...p, langSuccessStreak: s }));
  const setLevelUpToast = (t) => setUiState(p => ({ ...p, levelUpToast: t }));
  
  const setIsSacredModalOpen = (o)   => setModals(p => ({ ...p, sacred: o }));
  const setIsReadingModalOpen = (o)  => setModals(p => ({ ...p, reading: o }));
  const setIsFocusModalOpen = (o)    => setModals(p => ({ ...p, focus: o }));
  const setIsScheduleModalOpen = (o) => setModals(p => ({ ...p, schedule: o }));
  const setNewEvent = (valOrFn) => setModals(p => ({ ...p, newEvent: typeof valOrFn === 'function' ? valOrFn(p.newEvent) : valOrFn }));

  const today  = new Date().toISOString().split('T')[0];
  const weekId = getWeekId(0);


  // ── 4. Cálculos derivados (useMemo) ──
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
  ], []);

  const streakCount = useMemo(() => {
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

  const morningDone = useMemo(() => morningHabits.filter(h => data.habits[h.key]).length, [data.habits, morningHabits]);
  const nightDone   = useMemo(() => nightHabitsList.filter(h => data.nightHabits[h.key] === 1).length, [data.nightHabits, nightHabitsList]);
  const totalItems  = useMemo(() => morningHabits.length + (data.englishWords.length > 0 ? 1 : 0) + nightHabitsList.length, [data.englishWords, morningHabits.length, nightHabitsList.length]);
  const totalProgress = useMemo(() => Math.round(((morningDone + (data.englishCompleted ? 1 : 0) + nightDone) / totalItems) * 100) || 0, [morningDone, nightDone, totalItems, data.englishCompleted]);
  
  const currentMonth = useMemo(() => new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }), []);

  // ── 5. Efectos ──
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const unsubs = [
      onSnapshot(doc(db, 'users', user.uid, 'habits', today), (d) => {
        if (d.exists()) setData(prev => ({ ...prev, habits: d.data() }));
      }),
      onSnapshot(doc(db, 'users', user.uid, 'settings', 'language_settings'), (d) => {
        if (d.exists()) {
          const cfg = d.data();
          if (cfg.targetLanguage) setLangId(cfg.targetLanguage);
          if (cfg.currentLevel) setLevelId(cfg.currentLevel);
        }
      }),
      onSnapshot(doc(db, 'users', user.uid, 'night_habits', today), (d) => {
        if (d.exists()) setData(prev => ({ ...prev, nightHabits: d.data() }));
      }),
      onSnapshot(doc(db, 'users', user.uid, 'settings', 'sacred_blocks'), (d) => {
        if (d.exists()) setData(prev => ({ ...prev, sacredBlocks: d.data().blocks || [] }));
      }),
      onSnapshot(doc(db, 'users', user.uid, 'settings', 'reading'), (d) => {
        if (d.exists()) setData(prev => ({ ...prev, reading: d.data() }));
      }),
      onSnapshot(doc(db, 'users', user.uid, 'weekly', weekId), (d) => {
        if (d.exists()) setData(prev => ({ ...prev, weeklyFocus: d.data() }));
      }),
      onSnapshot(doc(db, 'users', user.uid, 'settings', 'config'), (d) => {
        if (d.exists()) {
          const cfg = d.data();
          settingsRef.current = cfg;
          setSettings(cfg);
          setData(prev => ({
            ...prev,
            streak: cfg.streak || 0,
            deepWork: cfg.deepWork || 0
          }));
        }
        setLoading(false);
      }, (err) => {
        setLoading(false);
      }),
      onSnapshot(doc(db, 'users', user.uid, 'daily_content', today), async (d) => {
        const langKey   = `${langId}Words`;
        const langObj   = LANGUAGES.find(l => l.id === langId) || LANGUAGES[0];
        const levelObj  = LEVELS.find(l => l.id === levelId) || LEVELS[4];
        const uiLanguage = settingsRef.current?.uiLanguage || 'es';
        const nativeNameMap = { es: 'Spanish', en: 'English', pt: 'Portuguese', fr: 'French', it: 'Italian', de: 'German' };
        const nativeLang = nativeNameMap[uiLanguage] || 'Spanish';

        const generateAndSave = async () => {
          if (isGeneratingRef.current) return;
          isGeneratingRef.current = true;
          try {
            const wordsPerDay = 6;
            let wordsForToday = [];
            const poolRef = doc(db, 'users', user.uid, 'language_pools', `${langObj.id}_${levelObj.id}`);
            const poolSnap = await getDoc(poolRef);
            let poolWords = poolSnap.exists() ? (poolSnap.data().words || []) : [];
            
            // PRIORIDAD 1: Siempre intentar generar palabras NUEVAS con la IA
            try {
                // Generar 6 palabras frescas para hoy
                const batch = await generateLanguageWords(langObj.id, langObj.nativeName, levelObj.id, wordsPerDay, nativeLang);
                wordsForToday = batch;
                
                // Guardamos este lote exitoso como respaldo/pool si por alguna razón falla después
                await setDoc(poolRef, { words: poolWords.length > 0 ? poolWords : batch }, { merge: true });
            } catch (aiError) {
                console.warn('IA Online no disponible, cayendo en el Pool (Modo Offline o error):', aiError);
                if (poolWords.length >= wordsPerDay) {
                    wordsForToday = poolWords.slice(0, wordsPerDay);
                    poolWords = poolWords.slice(wordsPerDay);
                    await setDoc(poolRef, { words: poolWords }, { merge: true });
                } else {
                    wordsForToday = poolWords; // Lo que haya
                }
            }

            await setDoc(doc(db, 'users', user.uid, 'daily_content', today), {
              [langKey]: wordsForToday,
              [`${langId}Completed`]: false,
              energyLevel: 5,
              planBActive: false
            }, { merge: true });
            setData(prev => ({ ...prev, englishWords: wordsForToday }));
          } catch (err) {
            console.error('Error pool:', err);
          } finally {
            isGeneratingRef.current = false;
          }
        };

        if (d.exists()) {
          const content = d.data();
          const words   = content[langKey] || (langId === 'english' ? content.englishWords : []) || [];
          setData(prev => ({
            ...prev,
            englishWords: words,
            englishCompleted: content[`${langId}Completed`] || false,
            energyLevel: content.energyLevel || 5,
            mentalState: content.mentalState || '',
            planBActive: content.planBActive || false
          }));
          if (words.length === 0 && !isGeneratingRef.current) generateAndSave();
        } else {
          if (!isGeneratingRef.current) generateAndSave();
        }
      }),
      onSnapshot(doc(db, 'users', user.uid, 'schedule', today), (d) => {
        if (d.exists()) setData(prev => ({ ...prev, scheduleItems: d.data().items || [] }));
        else setData(prev => ({ ...prev, scheduleItems: [] }));
      }),
      onSnapshot(query(collection(db, 'users', user.uid, 'history'), orderBy('date', 'desc'), limit(40)), (snap) => {
        const hist = {};
        snap.forEach(d => hist[d.id] = d.data());
        setData(prev => ({ ...prev, history: hist }));
      })
    ];

    const timeout = setTimeout(() => setLoading(false), 5000);

    return () => {
        clearTimeout(timeout);
        unsubs.forEach(u => u && u());
    };
  }, [user, today, weekId, langId, levelId]);

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

  useEffect(() => {
    if (!user || loading) return;
    const hasData = Object.keys(data.habits).length > 0 || (data.englishWords && data.englishWords.length > 0);
    if (!hasData) return;
    const timer = setTimeout(async () => {
      try {
        await setDoc(doc(db, 'users', user.uid, 'history', today), {
          score: totalProgress,
          date: today,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        if (streakCount !== 0 || data.streak !== 0) {
          await setDoc(doc(db, 'users', user.uid, 'stats', 'overall'), { streak: streakCount }, { merge: true });
          await setDoc(doc(db, 'users', user.uid, 'settings', 'config'), { streak: streakCount }, { merge: true });
        }
      } catch (err) {
        console.error("Error al sincronizar racha:", err);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [totalProgress, streakCount, user, today, loading, data.habits, data.englishWords, data.streak]);



  // ── 4. Funciones de Usuario ──
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
    if (newVal === 1 && Object.values(newNightHabits).filter(v => v === 1).length === 6) {
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.7 }, colors: ['#6366f1', '#818cf8', '#c7d2fe', '#fbbf24'] });
    }
  };

  const completeLanguageSession = async (score, meta = {}) => {
    const langKey  = `${langId}Words`;
    const pct      = meta.pct ?? Math.round((score / (data.englishWords?.length || 1)) * 100);
    setData(prev => ({ ...prev, englishCompleted: true, englishScore: score }));
    await setDoc(doc(db, 'users', user.uid, 'daily_content', today), {
      [`${langId}Completed`]: true,
      [`${langId}Score`]: score,
      [langKey]: data.englishWords,
    }, { merge: true });
    confetti({ particleCount: 100, spread: 60, origin: { y: 0.7 }, colors: ['#10b981', '#34d399', '#6ee7b7'] });
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
          await setDoc(doc(db, 'users', user.uid, 'settings', 'language_settings'), {
            targetLanguage: langId,
            currentLevel: nextLevel.id,
            updatedAt: today,
          }, { merge: true });
          setLevelUpToast({ from: currentLevel.id, to: nextLevel.id, lang: langId });
          setTimeout(() => setLevelUpToast(null), 5000);
          confetti({ particleCount: 250, spread: 120, origin: { y: 0.45 }, colors: ['#f59e0b', '#fbbf24', '#fde68a', '#fff'] });
        }
      }
    }
  };

  const handleLanguageChange = async (newLangId) => {
    setLangId(newLangId);
    localStorage.setItem('language_widget_lang', newLangId);
    const newLevelId = localStorage.getItem('language_widget_level') || 'B2';
    setData(prev => ({ ...prev, englishWords: [], englishCompleted: false, englishScore: undefined }));
    isGeneratingRef.current = false;
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

  const handleRegenerateLanguage = async () => {
    if (isGeneratingRef.current) return;
    if (!window.confirm("¿Seguro que quieres regenerar las palabras de hoy?")) return;
    setData(prev => ({ ...prev, englishWords: [], englishCompleted: false, englishScore: undefined }));
    const poolRef = doc(db, 'users', user.uid, 'language_pools', `${langId}_${levelId}`);
    try {
      await setDoc(doc(db, 'users', user.uid, 'daily_content', today), { [`${langId}Words`]: [], [`${langId}Completed`]: false }, { merge: true });
      await setDoc(poolRef, { words: [] }, { merge: true });
    } catch (e) { console.error("Error al regenerar:", e); }
  };

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
    await setDoc(doc(db, 'users', user.uid, 'energy_log', today), { level, mode: data.mentalState, date: today }, { merge: true });
  };

  const saveMentalState = async (state) => {
    const newState = data.mentalState === state ? '' : state;
    setData(prev => ({ ...prev, mentalState: newState }));
    await setDoc(doc(db, 'users', user.uid, 'energy_log', today), { mode: newState, level: data.energyLevel, date: today }, { merge: true });
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500/30">
      {loading ? (
        <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm z-[200] flex items-center justify-center">
          <div className="bg-slate-900/80 p-8 rounded-[2rem] border border-slate-800 shadow-2xl flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <p className="text-white font-black uppercase tracking-[0.2em] text-xs animate-pulse">Optimizando Sistema...</p>
          </div>
        </div>
      ) : null}

      
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
            data.planBActive
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
              : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          {data.planBActive ? <ShieldAlert className="w-4 h-4 animate-pulse" /> : <Shield className="w-4 h-4" />}
          <span className="text-[10px] font-black uppercase tracking-widest">{data.planBActive ? 'Plan B Activo' : 'Plan B Off'}</span>
        </button>
      </div>

      <div className="w-full max-w-[1700px] mx-auto p-6 md:p-8 flex flex-col gap-8 pb-32">
        <div className="flex items-center justify-between z-10 relative">
          <div className="flex flex-col">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-500 mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Sincronización Biotécnica
            </p>
          </div>
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
                  data.planBActive
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20 shadow-lg shadow-amber-500/5'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {data.planBActive ? <ShieldAlert className="w-5 h-5 animate-pulse" /> : <Shield className="w-5 h-5" />}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest">{data.planBActive ? 'Plan B Activo' : 'Plan B Off'}</span>
                </div>
              </button>
          </div>
        </div>

      <div className="flex flex-col gap-5 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800/50 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-2xl" />
        <div className="flex items-center justify-between z-10 relative">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-500 mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Progreso del Día
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 relative z-10 w-full">
          <div className="shrink-0 scale-90 sm:scale-100">
            <CircularProgress percentage={totalProgress} size={130} strokeWidth={10} />
          </div>
          <div className="flex-1 flex flex-col gap-4 sm:gap-5 w-full">
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
                <div className={`flex items-center gap-1.5 text-sm sm:text-base font-bold transition-all duration-500 ${data.englishCompleted ? 'text-emerald-400' : 'text-slate-400'}`}>
                  <BookOpen className={`w-4 h-4 sm:w-5 sm:h-5 ${data.englishCompleted ? 'animate-bounce' : 'group-hover:rotate-12 transition-transform'}`} />
                  <span className="tabular-nums">
                    {data.englishCompleted ? `${data.englishScore || 0}/${data.englishWords?.length || 0}` : `0/${data.englishWords?.length || 0}`}
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
        <div className={`relative z-10 flex flex-col sm:flex-row items-center sm:justify-between gap-4 p-4 sm:px-5 rounded-3xl sm:rounded-[2rem] border transition-all ${
            data.planBActive ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-50 dark:bg-[#151518] border-slate-200 dark:border-[#1e1e24] shadow-xl'
          }`}>
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className={`p-2 sm:p-2.5 rounded-full flex items-center justify-center shrink-0 ${data.planBActive ? 'bg-red-500 text-white' : 'bg-[#1e1e24] text-emerald-400'}`}>
              {data.planBActive ? <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" /> : <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-emerald-400" />}
            </div>
            <div className="text-left flex-1 min-w-0">
              <h4 className="font-extrabold text-[13px] sm:text-[15px] uppercase tracking-wide leading-tight text-slate-900 dark:text-white mb-[2px] truncate">
                {data.planBActive ? 'MODO PLAN B ACTIVO' : 'MODO EXPANSIÓN (CEO)'}
              </h4>
              <p className="text-slate-500 text-[11px] sm:text-[12px] font-medium leading-none">{data.planBActive ? 'Adaptación extrema activada' : 'Enfoque máximo'}</p>
            </div>
          </div>
          <button onClick={togglePlanB} className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl text-[11px] font-bold uppercase transition-all bg-indigo-600 text-white hover:bg-indigo-700">
            {data.planBActive ? 'DESACTIVAR PLAN B' : 'ACTIVAR PLAN B'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mx-auto items-start">
        {/* Columna 1 */}
        <div className="flex flex-col gap-6">
          <div className="widget-card bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-amber-500/20 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px]"></div>
            <div className="flex justify-between items-start relative z-10 mb-6">
              <div>
                <h3 className="text-3xl font-black tracking-tight leading-none mb-1 text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-400">Tesla Morning</h3>
                <p className="text-amber-500/60 font-black tracking-widest text-[9px] uppercase">3 · 6 · 9 Protocol</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black leading-none text-slate-800 dark:text-white">{Math.round((morningDone / morningHabits.length) * 100) || 0}%</div>
              </div>
            </div>
            <div className="space-y-3 relative z-10">
              {morningHabits.map((item) => {
                const isDone = data.habits[item.key];
                const colorMap = {
                  amber: {
                    active: 'bg-amber-500 border-amber-500 shadow-lg shadow-amber-500/20',
                    inactive: 'border-amber-500/10 hover:border-amber-500/30',
                    iconBgActive: 'bg-white/20 text-white',
                    iconBgInactive: 'bg-amber-500/10 text-amber-500',
                    textActive: 'text-amber-100',
                  },
                  blue: {
                    active: 'bg-indigo-500 border-indigo-500 shadow-lg shadow-indigo-500/20',
                    inactive: 'border-indigo-500/10 hover:border-indigo-500/30',
                    iconBgActive: 'bg-white/20 text-white',
                    iconBgInactive: 'bg-indigo-500/10 text-indigo-500',
                    textActive: 'text-indigo-100',
                  },
                  purple: {
                    active: 'bg-purple-500 border-purple-500 shadow-lg shadow-purple-500/20',
                    inactive: 'border-purple-500/10 hover:border-purple-500/30',
                    iconBgActive: 'bg-white/20 text-white',
                    iconBgInactive: 'bg-purple-500/10 text-purple-500',
                    textActive: 'text-purple-100',
                  }
                };
                const theme = colorMap[item.color] || colorMap.amber;

                return (
                  <button key={item.key} onClick={() => toggleHabit(item.key)} className={`w-full flex items-center justify-between gap-4 p-4 rounded-3xl border-2 transition-all duration-300 ${isDone ? `${theme.active} scale-[1.02]` : `bg-white/50 dark:bg-black/30 backdrop-blur-md ${theme.inactive}`}`}>
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`p-3 rounded-2xl flex items-center justify-center shrink-0 ${isDone ? theme.iconBgActive : theme.iconBgInactive}`}>
                        {item.icon}
                      </div>
                      <div className="flex flex-col flex-1 min-w-0 text-left">
                        <span className={`font-black text-[13px] uppercase tracking-wide leading-tight ${isDone ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>{item.label}</span>
                        <p className={`text-[10px] font-bold tracking-widest uppercase truncate ${isDone ? theme.textActive : 'text-slate-400'}`}>{item.subLabel}</p>
                      </div>
                    </div>
                    {isDone ? <CheckCircle2 className="w-6 h-6 text-white" /> : <Circle className={`w-6 h-6 text-${item.color}-500/30`} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="widget-card !bg-white dark:!bg-[#151518] border-red-500/20 dark:border-red-900/40 relative shadow-2xl group">
             <button onClick={() => setIsFocusModalOpen(true)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-red-500 transition-all"><Edit2 className="w-5 h-5" /></button>
             <div className="flex items-center gap-3 mb-6">
                 <div className="bg-red-500/10 p-3 rounded-2xl"><Target className="w-6 h-6 text-red-500" /></div>
                 <div><h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-lg text-left">Foco Semanal</h3></div>
             </div>
             <p className="text-2xl font-black text-red-500 uppercase tracking-tighter leading-none text-left">{data.weeklyFocus.priority_1 || 'DEFINE TU ROCA'}</p>
          </div>

          <div className="widget-card !bg-white dark:!bg-[#151518] border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
              <div className="flex items-center gap-4 mb-6">
                  <div className="bg-emerald-500/10 p-3 rounded-2xl"><BookOpen className="w-6 h-6 text-emerald-500" /></div>
                  <div><h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight text-left">Lectura Actual</h3></div>
              </div>
              <div className="flex flex-col items-center justify-center min-h-[140px] text-center p-4">
                  {!data.reading?.current_book ? (
                      <button onClick={() => setIsReadingModalOpen(true)} className="text-xs font-black text-slate-400 hover:text-emerald-500 uppercase tracking-[0.2em] transition-colors">CARGAR LIBRO ACTUAL</button>
                  ) : (
                      <div className="w-full group cursor-pointer" onClick={toggleReading}>
                          <p className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2 group-hover:text-emerald-500 transition-colors">{data.reading.current_book}</p>
                          <div className="flex items-center justify-center gap-3 mb-4">
                              <span className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></span>
                              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20 text-[10px] font-black tracking-widest uppercase">
                                  {data.reading.last_read_date === today ? 'PROGRESO HOY' : 'PENDIENTE HOY'}
                              </div>
                              <span className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></span>
                          </div>
                      </div>
                  )}
              </div>
          </div>
        </div>

        {/* Columna 2 */}
        <div className="flex flex-col gap-6">
          <div className="widget-card bg-white dark:bg-[#151518] border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20"><Zap className="w-6 h-6 text-amber-500" /></div>
                    <div>
                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-lg leading-tight text-left">Journal de Energía</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left">Estado diario</p>
                    </div>
                </div>
            </div>

            <div className="mb-4 p-1">
                <EnergySlider value={data.energyLevel} onChange={saveEnergyLevel} />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { id: 'focus', label: 'FOCUS MODE', icon: <Zap />, colorClass: 'amber' },
                  { id: 'slow', label: 'SLOW STATE', icon: <Sun />, colorClass: 'emerald' },
                  { id: 'water', label: 'WATER MODE', icon: <Waves />, colorClass: 'blue' },
                  { id: 'burnout', label: 'LOW BATTERY', icon: <BatteryLow />, colorClass: 'red' }
                ].map(mode => {
                  const isSelected = data.mentalState === mode.id;
                  const classes = {
                    amber: { active: 'bg-amber-500/10 border-amber-500 text-amber-500', inactive: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700' },
                    emerald: { active: 'bg-emerald-500/10 border-emerald-500 text-emerald-500', inactive: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700' },
                    blue: { active: 'bg-blue-500/10 border-blue-500 text-blue-500', inactive: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700' },
                    red: { active: 'bg-red-500/10 border-red-500 text-red-500', inactive: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700' }
                  };
                  return (
                    <button key={mode.id} onClick={() => saveMentalState(mode.id)} className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all gap-2 ${isSelected ? classes[mode.colorClass].active : classes[mode.colorClass].inactive}`}>
                      {React.cloneElement(mode.icon, { className: 'w-5 h-5' })}
                      <span className="text-[9px] font-black tracking-widest truncate">{mode.label}</span>
                    </button>
                  );
                })}
            </div>

            {data.energyHistory?.length > 0 && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Historial Últimos 7 Días</p>
                <div className="flex items-end justify-between h-12 gap-1.5 px-1">
                  {data.energyHistory.slice(-7).map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-indigo-500/20 rounded-t-lg relative group" style={{ height: `${(h.level || 5) * 10}%` }}>
                        <div className="absolute inset-0 bg-indigo-400 rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-[8px] font-bold text-slate-600">{h.date.split('-')[2]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="widget-card !bg-white dark:!bg-[#151518] border-slate-200 dark:border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                      <div className="bg-indigo-500/10 p-3 rounded-2xl"><Clock className="w-6 h-6 text-indigo-500" /></div>
                      <div><h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight text-left">Horario de Hoy</h3></div>
                  </div>
                  <button onClick={() => setIsScheduleModalOpen(true)} className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 rounded-xl hover:scale-105 transition-all shadow-sm"><Plus className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3 min-h-[120px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                  {data.scheduleItems.length === 0 ? (
                      <div className="text-center group">
                          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform"><Calendar className="w-7 h-7 text-slate-300 dark:text-slate-600" /></div>
                          <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Agenda Limpia.<br/>Añade eventos importantes.</p>
                      </div>
                  ) : (
                      <div className="w-full space-y-3">
                          {data.scheduleItems.map(item => (
                              <div key={item.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 group hover:border-indigo-500/30 transition-all">
                                  <div className="flex items-center gap-4">
                                      <div className="w-2 h-10 bg-indigo-500 rounded-full"></div>
                                      <div className="text-left"><p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight truncate max-w-[120px]">{item.title}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.startTime} - {item.endTime}</p></div>
                                  </div>
                                  <button onClick={() => deleteScheduleItem(item.id)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X className="w-4 h-4" /></button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>

          <div className="widget-card !bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 border-indigo-800/30 shadow-2xl relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform"><Quote className="w-24 h-24 text-indigo-400" /></div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-400 mb-3 relative z-10 text-left">Mandamiento del Día</p>
            <p className="text-xl italic font-serif leading-relaxed text-indigo-50 relative z-10 max-w-2xl text-left">"{settings.manifesto || 'La inacción no es neutral; es una elección activa por la mediocridad.'}"</p>
          </div>
        </div>

        {/* Columna 3 */}
        <div className="flex flex-col gap-6">
          <div className="widget-card !bg-white dark:!bg-[#151518] border-slate-200 dark:border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                      <div className="bg-blue-500/10 p-3 rounded-2xl"><Anchor className="w-6 h-6 text-blue-500" /></div>
                      <div><h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight text-left">Bloque Sagrado</h3></div>
                  </div>
                  <button onClick={() => setIsSacredModalOpen(true)} className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
              </div>
              <div className="min-h-[100px] flex items-center justify-center bg-slate-50 dark:bg-slate-800/30 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6">
                  {data.sacredBlocks.length > 0 ? (
                      <div className="w-full space-y-4">
                          {data.sacredBlocks.map((b, i) => (
                              <div key={i} className="flex items-center justify-between">
                                  <div className="flex flex-col text-left"><span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{b.day}</span><span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{b.label}</span></div>
                                  <span className="text-[11px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">{b.time}</span>
                              </div>
                          ))}
                      </div>
                  ) : <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sin bloques definidos.</span>}
              </div>
          </div>

          <div className="relative">
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
              onRegenerate={handleRegenerateLanguage}
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] border flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
              <p className="text-slate-800 dark:text-white font-bold uppercase tracking-widest text-xs">Sincronizando Idiomas...</p>
            </div>
          )}
          </div>

        </div>

        {/* Cierre Nocturno - Ocupa todo el ancho inferior */}
        <div className="lg:col-span-3 widget-card widget-card--violet !bg-slate-50 dark:!bg-[#151518] border-slate-200 dark:border-slate-800 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                  <div className="bg-indigo-500/10 p-3.5 rounded-3xl shadow-sm"><Moon className="w-7 h-7 text-indigo-500 dark:text-indigo-400" strokeWidth={2} /></div>
                  <div className="text-left">
                      <h3 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">Cierre Nocturno</h3>
                      <p className="text-slate-500 text-[13px] font-medium mt-0.5">Optimización de Sueño</p>
                  </div>
              </div>
              <div className="text-[#6366f1] font-bold text-sm">{Math.round((nightDone / nightHabitsList.length) * 100) || 0}%</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pb-2">
              {nightHabitsList.map(item => {
                const isDone = data.nightHabits[item.key] === 1;
                return (
                  <button key={item.key} onClick={() => toggleNightHabit(item.key)} className={`flex flex-col justify-between p-4 rounded-3xl transition-all min-h-[100px] border-2 ${isDone ? `${item.theme.bg} border-transparent scale-[1.02] shadow-xl` : 'bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                    <div className="flex items-start justify-between w-full mb-3">
                      <div className={`p-2 rounded-xl ${isDone ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{React.cloneElement(item.icon, { className: 'w-4 h-4' })}</div>
                      {isDone ? <CheckCircle2 className="w-5 h-5 text-white" /> : <Circle className="w-5 h-5 text-slate-400 dark:text-slate-700" />}
                    </div>
                    <div className="text-left">
                      <h4 className={`font-bold text-[11px] leading-tight mb-1 ${isDone ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{item.label}</h4>
                      <p className={`text-[8px] font-medium opacity-70 ${isDone ? 'text-white' : 'text-slate-500'}`}>{item.subLabel}</p>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      </div>
      </div>

      {/* Modals */}
      <Modal isOpen={isSacredModalOpen} onClose={() => setIsSacredModalOpen(false)} title="Horario Sagrado">
          <SacredBlockEditor initialBlocks={data.sacredBlocks} onSave={saveSacredBlocks} />
      </Modal>
      <Modal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} title="Nuevo Evento">
          <div className="space-y-4 p-2">
              <input type="text" value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} placeholder="Título" className="w-full p-4 bg-slate-800 rounded-2xl text-white outline-none" />
              <div className="grid grid-cols-2 gap-4">
                  <input type="time" value={newEvent.startTime} onChange={e => setNewEvent(p => ({ ...p, startTime: e.target.value }))} className="p-4 bg-slate-800 rounded-2xl text-white outline-none" />
                  <input type="time" value={newEvent.endTime} onChange={e => setNewEvent(p => ({ ...p, endTime: e.target.value }))} className="p-4 bg-slate-800 rounded-2xl text-white outline-none" />
              </div>
              <button onClick={addScheduleItem} className="w-full py-4 bg-indigo-600 text-white font-black uppercase rounded-2xl">AÑADIR</button>
          </div>
      </Modal>
      <Modal isOpen={isReadingModalOpen} onClose={() => setIsReadingModalOpen(false)} title="Lectura Actual">
          <div className="space-y-4 p-2">
              <input type="text" id="r-in" defaultValue={data.reading?.current_book} placeholder="Título del libro" className="w-full p-4 bg-slate-800 rounded-2xl text-white outline-none" />
              <Button onClick={() => saveReading(document.getElementById('r-in').value)} className="w-full py-4 bg-amber-600 text-white font-black uppercase rounded-2xl">GUARDAR LIBRO</Button>
          </div>
      </Modal>

      <Modal isOpen={isFocusModalOpen} onClose={() => setIsFocusModalOpen(false)} title="Foco Semanal">
          <textarea defaultValue={data.weeklyFocus.priority_1} id="f-in" className="w-full p-4 bg-slate-800 rounded-2xl text-red-500 outline-none h-32 uppercase font-black" />
          <Button onClick={() => saveWeeklyFocus(document.getElementById('f-in').value)} className="w-full mt-4 py-4 bg-red-600">GUARDAR</Button>
      </Modal>

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
                <div key={idx} className="p-5 bg-slate-800 rounded-3xl relative border border-slate-700">
                    <button onClick={() => removeBlock(idx)} className="absolute top-2 right-2 text-slate-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    <div className="flex gap-3 mb-3">
                        <input type="text" value={b.day} onChange={e => update(idx, 'day', e.target.value.toUpperCase())} className="w-20 p-2 rounded-xl bg-slate-900 text-white font-black text-center" />
                        <input type="text" value={b.label} onChange={e => update(idx, 'label', e.target.value)} className="flex-1 p-2 rounded-xl bg-slate-900 text-white" />
                    </div>
                </div>
            ))}
            <button onClick={addBlock} className="w-full py-4 border-2 border-dashed border-slate-700 rounded-2xl text-slate-500">+ AÑADIR</button>
            <Button onClick={() => onSave(blocks)} className="w-full mt-4 py-4">GUARDAR</Button>
        </div>
    );
};

export default DashboardTab;
