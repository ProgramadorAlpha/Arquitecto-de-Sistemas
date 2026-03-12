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
      api_key: '',
      ai_model: 'gemini-2.0-flash',
      user_name: '',
    }
  });

  const [isDark, setIsDark] = useState(true);

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

    // Listen to Settings
    const settingsUnsub = onSnapshot(doc(db, 'users', user.uid, 'settings', 'config'), (d) => {
        if (d.exists()) {
            setData(prev => ({ ...prev, settings: d.data() }));
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

  const actions = {
    toggleHabit,
    toggleTheme,
    updateSetting,
  };

  return (
    <AppContext.Provider value={{ data, actions, isDark }}>
      {children}
    </AppContext.Provider>
  );
};
