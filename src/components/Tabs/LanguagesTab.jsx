import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  TrendingUp, 
  Trophy, 
  Check, 
  ChevronRight,
  Settings,
  Shield,
  BookOpen,
  Zap,
  Star,
  Activity,
  Award
} from 'lucide-react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { LANGUAGES, LEVELS } from '../UI/LanguageWidget';
import confetti from 'canvas-confetti';

const LanguagesTab = () => {
  const { user } = useAuth();
  const { actions } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({
    targetLanguage: localStorage.getItem('language_widget_lang') || 'english',
    currentLevel: localStorage.getItem('language_widget_level') || 'C1',
    uiLanguage: 'es'
  });
  const [stats, setStats] = useState({
    streak: 0,
    totalWords: 0,
    levelProgress: 0
  });

  useEffect(() => {
    if (!user) return;

    // 1) Escuchar uiLanguage desde settings/config
    const unsubscribeConfig = onSnapshot(doc(db, 'users', user.uid, 'settings', 'config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setConfig(prev => ({
          ...prev,
          uiLanguage: data.uiLanguage || 'es'
        }));
      }
    });

    // 2) Escuchar idioma objetivo y nivel
    const unsubscribeLang = onSnapshot(doc(db, 'users', user.uid, 'settings', 'language_settings'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setConfig(prev => ({
          ...prev,
          targetLanguage: data.targetLanguage || prev.targetLanguage,
          currentLevel: data.currentLevel || prev.currentLevel
        }));
        setStats(prev => ({
          ...prev,
          levelProgress: data.levelProgress || 0
        }));
      }
      setLoading(false);
    });

    return () => {
      unsubscribeConfig();
      unsubscribeLang();
    };
  }, [user]);

  const handleLanguageSelect = (langId) => {
    setConfig(prev => ({ ...prev, targetLanguage: langId }));
  };

  const handleLevelSelect = (levelId) => {
    setConfig(prev => ({ ...prev, currentLevel: levelId }));
  };

  const handleUiLanguageSelect = (langId) => {
    setConfig(prev => ({ ...prev, uiLanguage: langId }));
  };

  const handleGlobalSave = async () => {
    setLoading(true);
    try {
      // 1. Guardar Configuración de Aprendizaje
      await setDoc(doc(db, 'users', user.uid, 'settings', 'language_settings'), {
        targetLanguage: config.targetLanguage,
        currentLevel: config.currentLevel,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 2. Guardar Idioma de Interfaz
      await setDoc(doc(db, 'users', user.uid, 'settings', 'config'), {
        uiLanguage: config.uiLanguage
      }, { merge: true });

      // 3. Sincronizar localStorage para persistencia inmediata (opcional pero ayuda)
      localStorage.setItem('language_widget_lang', config.targetLanguage);
      localStorage.setItem('language_widget_level', config.currentLevel);

      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentLang = LANGUAGES.find(l => l.id === config.targetLanguage) || LANGUAGES[0];
  const currentLevel = LEVELS.find(l => l.id === config.currentLevel) || LEVELS[4];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Traducciones específicas de esta pestaña (si no están en AppContext)
  const langTexts = {
    es: {
      title: 'Centro de Idiomas',
      subtitle: 'Configuración y Progreso Maestro',
      streak: 'Racha',
      days: 'Días',
      level: 'Nivel',
      target_title: 'Selección de Idioma Objetivo',
      cefr_title: 'Nivel de Dominio (CEFR)',
      progress_title: 'Tu Progreso',
      weekly_goal: 'Meta Semanal',
      ai_optimized: 'IA Optimizada',
      ai_desc: 'Basado en tu nivel {level}, la IA ha pre-generado {words} palabras en tu pool para acceso instantáneo.'
    },
    en: {
      title: 'Language Center',
      subtitle: 'Configuration and Master Progress',
      streak: 'Streak',
      days: 'Days',
      level: 'Level',
      target_title: 'Target Language Selection',
      cefr_title: 'Proficiency Level (CEFR)',
      progress_title: 'Your Progress',
      weekly_goal: 'Weekly Goal',
      ai_optimized: 'AI Optimized',
      ai_desc: 'Based on your {level} level, the AI has pre-generated {words} words in your pool for instant access.'
    },
    pt: {
      title: 'Centro de Idiomas',
      subtitle: 'Configuração e Progresso Mestre',
      streak: 'Sequência',
      days: 'Dias',
      level: 'Nível',
      target_title: 'Seleção de Idioma Alvo',
      cefr_title: 'Nível de Proficiência (CEFR)',
      progress_title: 'Seu Progresso',
      weekly_goal: 'Meta Semanal',
      ai_optimized: 'IA Otimizada',
      ai_desc: 'Com base no seu nível {level}, a IA pré-gerou {words} palavras no seu pool para acesso instantâneo.'
    },
    fr: {
      title: 'Centre de Langues',
      subtitle: 'Configuration et Progrès Maître',
      streak: 'Série',
      days: 'Jours',
      level: 'Niveau',
      target_title: 'Sélection de la Langue Cible',
      cefr_title: 'Niveau de Maîtrise (CEFR)',
      progress_title: 'Votre Progrès',
      weekly_goal: 'Objectif Hebdomadaire',
      ai_optimized: 'IA Optimisée',
      ai_desc: 'Basé sur votre niveau {level}, l\'IA a pré-généré {words} mots dans votre pool pour un accès instantané.'
    },
    it: {
      title: 'Centro de Lingue',
      subtitle: 'Configurazione e Progresso Maestro',
      streak: 'Serie',
      days: 'Giorni',
      level: 'Livello',
      target_title: 'Selezione della Lingua Target',
      cefr_title: 'Livello di Competenza (CEFR)',
      progress_title: 'Il Tuo Progresso',
      weekly_goal: 'Obiettivo Settimanale',
      ai_optimized: 'IA Ottimizzata',
      ai_desc: 'In base al tuo livello {level}, l\'IA ha pre-generato {words} parole nel tuo pool per un accesso istantaneo.'
    },
    de: {
      title: 'Sprachenzentrum',
      subtitle: 'Konfiguration und Master-Fortschritt',
      streak: 'Folge',
      days: 'Tage',
      level: 'Niveau',
      target_title: 'Zielwahl der Sprache',
      cefr_title: 'Leistungsniveau (CEFR)',
      progress_title: 'Dein Fortschritt',
      weekly_goal: 'Wochenziel',
      ai_optimized: 'KI-optimiert',
      ai_desc: 'Basierend auf Ihrem {level}-Niveau hat die KI {words} Wörter in Ihrem Pool für den sofortigen Zugriff vorab generiert.'
    }
  };

  const getT = (key) => langTexts[config.uiLanguage]?.[key] || langTexts.es[key];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-500/10 p-4 rounded-3xl border border-indigo-500/20 shadow-xl">
            <Globe className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">{getT('title')}</h2>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">{getT('subtitle')}</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex gap-3">
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-[2rem] flex items-center gap-4 min-w-[140px]">
            <div className="bg-amber-500/10 p-2.5 rounded-2xl">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase">{getT('streak')}</p>
              <p className="text-xl font-black text-white">{localStorage.getItem(`lang_streak_${config.targetLanguage}`) || 0} {getT('days')}</p>
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-[2rem] flex items-center gap-4 min-w-[140px]">
            <div className="bg-indigo-500/10 p-2.5 rounded-2xl">
              <Star className="w-5 h-5 text-indigo-400 fill-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase">{getT('level')}</p>
              <p className="text-xl font-black text-white">{config.currentLevel}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Sección: Elección de Idioma ── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/50 rounded-[3rem] border border-slate-800/50 p-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
            
            <div className="flex items-center gap-3 mb-8 relative z-10">
              <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
              <h3 className="text-xl font-black text-white uppercase tracking-tight">{getT('target_title')}</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
              {LANGUAGES.map(lang => {
                const isActive = lang.id === config.targetLanguage;
                return (
                  <button
                    key={lang.id}
                    onClick={() => handleLanguageSelect(lang.id)}
                    className={`group relative flex flex-col items-center gap-4 p-6 rounded-[2.5rem] border-2 transition-all duration-500
                      ${isActive 
                        ? 'bg-indigo-500/15 border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.2)] scale-[1.03]' 
                        : 'bg-slate-800/40 border-slate-800/80 hover:bg-slate-800 hover:border-slate-700 hover:scale-[1.02]'}`}
                  >
                    <div className={`p-4 rounded-[1.8rem] transition-all duration-500 ${isActive ? 'bg-indigo-500 scale-110 shadow-lg' : 'bg-slate-900 group-hover:bg-slate-700'}`}>
                      <span className="text-4xl">{lang.emoji}</span>
                    </div>
                    <div className="text-center">
                      <p className={`font-black text-lg ${isActive ? 'text-white' : 'text-slate-300'}`}>{lang.name}</p>
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">{lang.nativeName}</p>
                    </div>
                    {isActive && (
                      <div className="absolute -top-3 -right-3 bg-indigo-500 w-8 h-8 rounded-full flex items-center justify-center border-4 border-slate-900 shadow-xl">
                        <Check className="w-4 h-4 text-white" strokeWidth={4} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Sección: Nivel CEFR ── */}
          <div className="bg-slate-900/50 rounded-[3rem] border border-slate-800/50 p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
              <h3 className="text-xl font-black text-white uppercase tracking-tight">{getT('cefr_title')}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {LEVELS.map(lvl => {
                const isActive = lvl.id === config.currentLevel;
                return (
                  <button
                    key={lvl.id}
                    onClick={() => handleLevelSelect(lvl.id)}
                    className={`flex items-center gap-5 p-5 rounded-[2rem] border-2 transition-all duration-300 text-left
                      ${isActive 
                        ? 'bg-slate-800 border-white/20 shadow-xl scale-[1.01]' 
                        : 'bg-slate-900 border-slate-800/50 hover:bg-slate-800 hover:border-slate-700'}`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 font-black text-xl transition-colors ${isActive ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-800 text-slate-500'}`}>
                      {lvl.id}
                    </div>
                    <div className="flex-1">
                      <p className={`font-black uppercase tracking-tight ${isActive ? 'text-white' : 'text-slate-300'}`}>
                        {lvl.name} {isActive && <span className="ml-2 text-[8px] bg-indigo-500 text-white px-2 py-0.5 rounded-full">Actual</span>}
                      </p>
                      <p className="text-slate-500 text-[11px] font-medium leading-tight mt-1">{lvl.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Sidebar: Solo Progreso ── */}
        <div className="space-y-6">

          <div className="bg-slate-900/50 rounded-[3rem] border border-slate-800/50 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-amber-500/10 p-2.5 rounded-2xl">
                <Award className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">{getT('progress_title')}</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-800/30 p-5 rounded-3xl border border-slate-800/50">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{getT('weekly_goal')}</p>
                <div className="flex items-end justify-between mb-2">
                  <p className="text-2xl font-black text-white">4/7</p>
                  <p className="text-xs font-bold text-indigo-400 uppercase">{getT('days')}</p>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 w-[57%] rounded-full shadow-[0_0_10px_rgba(79,70,229,0.4)]" />
                </div>
              </div>

              <div className="bg-slate-800/30 p-5 rounded-3xl border border-slate-800/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{getT('ai_optimized')}</p>
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  {getT('ai_desc').replace('{level}', config.currentLevel).replace('{words}', stats.totalWords || 30)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* ── Sección: Idioma de la Interfaz ── */}
      <div className="bg-slate-900/50 rounded-[3rem] border border-slate-800/50 p-8 mt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Idioma de la Interfaz</h3>
        </div>
        <p className="text-slate-500 text-[11px] font-medium mb-8 leading-relaxed">
          Cambia el idioma de toda la aplicación (menús, botones, etc.)
        </p>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { id: 'es', emoji: '🇪🇸', label: 'ESP' },
            { id: 'en', emoji: '🇺🇸', label: 'ENG' },
            { id: 'pt', emoji: '🇧🇷', label: 'POR' },
            { id: 'fr', emoji: '🇫🇷', label: 'FRA' },
            { id: 'it', emoji: '🇮🇹', label: 'ITA' },
            { id: 'de', emoji: '🇩🇪', label: 'GER' },
          ].map(lang => {
            const isSelected = config.uiLanguage === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => setConfig(prev => ({ ...prev, uiLanguage: lang.id }))}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all
                  ${isSelected 
                    ? 'bg-amber-500/10 border-amber-500/50 scale-105' 
                    : 'bg-slate-800/40 border-slate-800/50 hover:bg-slate-800'}`}
              >
                <span className="text-2xl">{lang.emoji}</span>
                <span className={`text-[10px] font-black uppercase ${isSelected ? 'text-amber-400' : 'text-slate-500'}`}>
                  {lang.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Botón de Acción Global ── */}
      <div className="flex justify-center pt-10">
        <button
          onClick={handleGlobalSave}
          className="group relative flex items-center gap-4 px-12 py-5 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-[2rem] text-white font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Check className="w-5 h-5" />
          Guardar y Aplicar Cambios
        </button>
      </div>
    </div>
  );
};

export default LanguagesTab;
