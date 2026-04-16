import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  collection, 
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { callGeminiAI } from '../services/ai';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  const [data, setData] = useState({
    mantra: '',
    streak: 0,
    today: new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
    mode: { title: 'MODO EXPANSIÓN (CEO)', desc: 'Objetivo: Dominación total del día' },
    habits: { progress: 0, list: [] },
    nightHabits: { progress: 0, list: [] },
    englishWord: null,
    sacredBlocks: [],
    focus: '',
    reading: null,
    settings: {
      user_name: '',
      nickname: '',
      life_mission: '',
      uiLanguage: 'es'
    }
  });

  const [isDark, setIsDark] = useState(true);

  // Sistema de Traducciones Básico
  const translations = {
    es: {
      nav_dashboard: 'Comando Central',
      nav_languages: 'Idiomas',
      nav_weekly: 'Plan Semanal',
      nav_monthly: 'Visión Mensual',
      nav_systems: 'Mis Sistemas',
      nav_network: 'Tribu & Apoyo',
      nav_settings: 'Configuración',
      nav_logout: 'Cerrar Sesión',
      nav_streak: 'DÍAS EN RACHA',
      settings_title: 'Configuracion',
      settings_subtitle: 'Personaliza tu arquitectura de vida',
      settings_ai: 'Inteligencia Artificial',
      settings_lang: 'Idioma de la Aplicación',
      settings_profile: 'Perfil de Usuario',
      settings_apply_lang: 'Aplicar Idioma',
      settings_save_changes: 'Guardar Cambios',
      hello: 'Hola',
      manifesto: 'Manifiesto',
      vaciado_mental: 'VACIADO MENTAL',
      vaciado_title: 'Vaciado Mental Rápido',
      vaciado_save: 'Guardar en Mi Plan',
      vaciado_placeholder: 'Escribe todo lo que ocupe espacio ahora mismo...',
      profile_nickname: 'Apodo / Avatar',
      profile_mission: 'Misión de Vida',
      profile_mission_placeholder: 'Escribe el propósito que dirige tus acciones...'
    },
    en: {
      nav_dashboard: 'Control Center',
      nav_languages: 'Languages',
      nav_weekly: 'Weekly Plan',
      nav_monthly: 'Monthly Vision',
      nav_systems: 'My Systems',
      nav_network: 'Tribe & Support',
      nav_settings: 'Settings',
      nav_logout: 'Logout',
      nav_streak: 'STREAK DAYS',
      settings_title: 'Settings',
      settings_subtitle: 'Customize your life architecture',
      settings_ai: 'Artificial Intelligence',
      settings_lang: 'App Language',
      settings_profile: 'User Profile',
      settings_apply_lang: 'Apply Language',
      settings_save_changes: 'Save Changes',
      hello: 'Hello',
      manifesto: 'Manifesto',
      vaciado_mental: 'BRAIN DUMP',
      vaciado_title: 'Quick Brain Dump',
      vaciado_save: 'Save to My Plan',
      vaciado_placeholder: 'Write everything that is taking up space right now...',
      profile_nickname: 'Nickname / Avatar',
      profile_mission: 'Life Mission',
      profile_mission_placeholder: 'Write the purpose that drives your actions...'
    },
    pt: {
      nav_dashboard: 'Comando Central',
      nav_languages: 'Idiomas',
      nav_weekly: 'Plano Semanal',
      nav_monthly: 'Visão Mensal',
      nav_systems: 'Meus Sistemas',
      nav_network: 'Tribo & Apoio',
      nav_settings: 'Configurações',
      nav_logout: 'Sair',
      nav_streak: 'DIAS DE SEQUÊNCIA',
      settings_title: 'Configurações',
      settings_subtitle: 'Personalize sua arquitetura de vida',
      settings_ai: 'Inteligência Artificial',
      settings_lang: 'Idioma do Aplicativo',
      settings_profile: 'Perfil do Usuário',
      settings_apply_lang: 'Aplicar Idioma',
      settings_save_changes: 'Salvar Alterações',
      hello: 'Olá',
      manifesto: 'Manifesto',
      vaciado_mental: 'ESVAZIAMENTO MENTAL',
      vaciado_title: 'Esvaziamento Mental Rápido',
      vaciado_save: 'Salvar no Meu Plano',
      vaciado_placeholder: 'Escreva tudo o que está ocupando espaço agora...'
    },
    fr: {
      nav_dashboard: 'Commandement Central',
      nav_languages: 'Langues',
      nav_weekly: 'Plan Hebdomadaire',
      nav_monthly: 'Vision Mensuelle',
      nav_systems: 'Mes Systèmes',
      nav_network: 'Tribu & Soutien',
      nav_settings: 'Configuration',
      nav_logout: 'Déconnexion',
      nav_streak: 'JOURS DE SÉRIE',
      settings_title: 'Configuration',
      settings_subtitle: 'Personnalisez votre architecture de vie',
      settings_ai: 'Intelligence Artificielle',
      settings_lang: 'Langue de l\'App',
      settings_profile: 'Profil Utilisateur',
      settings_apply_lang: 'Appliquer la Langue',
      settings_save_changes: 'Enregistrer',
      hello: 'Bonjour',
      manifesto: 'Manifeste',
      vaciado_mental: 'VIDE-CERVEAU',
      vaciado_title: 'Vide-Cerveau Rapide',
      vaciado_save: 'Enregistrer dans Mon Plan',
      vaciado_placeholder: 'Écrivez tout ce qui prend de la place en ce moment...'
    },
    it: {
      nav_dashboard: 'Comando Centrale',
      nav_languages: 'Lingue',
      nav_weekly: 'Piano Settimanale',
      nav_monthly: 'Visione Mensile',
      nav_systems: 'I Miei Sistemi',
      nav_network: 'Tribù & Supporto',
      nav_settings: 'Impostazioni',
      nav_logout: 'Disconnetti',
      nav_streak: 'GIORNI DI SERIE',
      settings_title: 'Impostazioni',
      settings_subtitle: 'Personalizza la tua architettura di vita',
      settings_ai: 'Intelligenza Artificiale',
      settings_lang: 'Lingua dell\'App',
      settings_profile: 'Profilo Utente',
      settings_apply_lang: 'Applica Lingua',
      settings_save_changes: 'Salva Modifiche',
      hello: 'Ciao',
      manifesto: 'Manifesto',
      vaciado_mental: 'SVUOTAMENTO MENTALE',
      vaciado_title: 'Svuotamento Mentale Rapido',
      vaciado_save: 'Salva nel Mio Piano',
      vaciado_placeholder: 'Scrivi tutto ciò che occupa spazio in questo momento...'
    },
    de: {
      nav_dashboard: 'Zentrales Kommando',
      nav_languages: 'Sprachen',
      nav_weekly: 'Wochenplan',
      nav_monthly: 'Monatliche Vision',
      nav_systems: 'Meine Systeme',
      nav_network: 'Stamm & Unterstützung',
      nav_settings: 'Einstellungen',
      nav_logout: 'Abmelden',
      nav_streak: 'Tage in Folge',
      settings_title: 'Einstellungen',
      settings_subtitle: 'Personalisiere deine Lebensarchitektur',
      settings_ai: 'Künstliche Intelligenz',
      settings_lang: 'App-Sprache',
      settings_profile: 'Benutzerprofil',
      settings_apply_lang: 'Sprache anwenden',
      settings_save_changes: 'Änderungen speichern',
      hello: 'Hallo',
      manifesto: 'Manifest',
      vaciado_mental: 'BRAIN DUMP',
      vaciado_title: 'Schneller Brain Dump',
      vaciado_save: 'In meinem Plan speichern',
      vaciado_placeholder: 'Schreiben Sie alles auf, was gerade Platz wegnimmt...'
    }
  };


  const t = useCallback((key) => {
    const lang = data.settings.uiLanguage || 'es';
    return translations[lang]?.[key] || translations['es'][key] || key;
  }, [data.settings.uiLanguage]);

  // Sync with Firestore
  useEffect(() => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    
    // Listen to Habits
    const habitsUnsub = onSnapshot(doc(db, 'users', user.uid, 'habits', today), (d) => {
      const habitsData = d.exists() ? d.data() : {};
      // Map to list
      const list = [
        { id: 'movement', text: 'Tesla 3: 15min ejercicio', done: habitsData.movement === 1 },
        { id: 'meditation', text: 'Tesla 6: 10min silencio', done: habitsData.meditation === 1 },
        { id: 'reflection', text: 'Tesla 9: Lectura/Diario', done: habitsData.reflection === 1 },
      ];
      const progress = Math.round((list.filter(h => h.done).length / list.length) * 100);
      setData(prev => ({ ...prev, habits: { progress, list } }));
    });

    // Listen to Stats (Streak)
    const statsUnsub = onSnapshot(doc(db, 'users', user.uid, 'stats', 'overall'), (d) => {
      if (d.exists()) {
        setData(prev => ({ ...prev, streak: d.data().streak || 0 }));
      }
    });

    const settingsUnsub = onSnapshot(doc(db, 'users', user.uid, 'settings', 'config'), (d) => {
        if (d.exists()) {
            setData(prev => ({ ...prev, settings: { ...prev.settings, ...d.data() } }));
        }
    });

    // Mantra logic (inside effect to avoid stale closure & ESLint dep warning)
    const loadMantra = async (uid) => {
      const today = new Date().toISOString().split('T')[0];
      const globalRef = doc(db, 'daily_content', 'mantras', 'days', today);
      const globalDoc = await getDoc(globalRef);
      if (globalDoc.exists()) {
        setData(prev => ({ ...prev, mantra: globalDoc.data().text }));
      }
    };
    loadMantra(user.uid);

    return () => {
      habitsUnsub();
      statsUnsub();
      settingsUnsub();
    };
  }, [user]);

  const toggleHabit = useCallback(async (habitId) => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const habit = data.habits.list.find(h => h.id === habitId);
    await setDoc(doc(db, 'users', user.uid, 'habits', today), {
      [habitId]: habit.done ? 0 : 1
    }, { merge: true });
  }, [user, data.habits.list]);

  const toggleTheme = useCallback(() => {
    setIsDark(d => !d);
    document.documentElement.classList.toggle('dark');
  }, []);

  const updateSetting = useCallback(async (key, value) => {
    if (!user) return;
    const newSettings = { ...data.settings, [key]: value };
    setData(prev => ({ ...prev, settings: newSettings }));
    await setDoc(doc(db, 'users', user.uid, 'settings', 'config'), newSettings, { merge: true });
  }, [user, data.settings]);

  const callAI = useCallback(async (prompt, system, options) => {
    return callGeminiAI(prompt, system, options);
  }, []);

  const actions = {
    toggleHabit,
    toggleTheme,
    updateSetting,
    callAI,
    t
  };


  return (
    <AppContext.Provider value={{ data, actions, isDark }}>
      {children}
    </AppContext.Provider>
  );
};
