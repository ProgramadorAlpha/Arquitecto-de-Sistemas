import React, { useState, useEffect } from 'react';
import { Settings, Sparkles, Info, CheckCircle, Save, Globe } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';

const SettingsTab = () => {
  const { data, actions } = useAppContext();
  const settings = data?.settings || {};
  const [localUiLanguage, setLocalUiLanguage] = useState(settings.uiLanguage || 'es');

  useEffect(() => {
    if (settings.uiLanguage) {
      setLocalUiLanguage(settings.uiLanguage);
    }
  }, [settings.uiLanguage]);

  const handleUiLangSave = async () => {
    await actions.updateSetting('uiLanguage', localUiLanguage);
    const msgs = {
      es: 'Idioma aplicado',
      en: 'Language applied',
      pt: 'Idioma aplicado',
      fr: 'Langue appliquée',
      it: 'Lingua applicata',
      de: 'Sprache angewendet'
    };
    alert(msgs[localUiLanguage] || msgs.es);
  };

  const UI_LANGS = [
    { id: 'es', label: 'Español', emoji: '🇪🇸' },
    { id: 'en', label: 'English', emoji: '🇺🇸' },
    { id: 'pt', label: 'Português', emoji: '🇧🇷' },
    { id: 'fr', label: 'Français', emoji: '🇫🇷' },
    { id: 'it', label: 'Italiano', emoji: '🇮🇹' },
    { id: 'de', label: 'Deutsch', emoji: '🇩🇪' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4">
      {/* Header */}
      <div className="text-center mb-12 py-8">
        <div className="bg-slate-100 dark:bg-slate-800 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-md shadow-slate-300/40 dark:shadow-none">
          <Settings className="w-10 h-10 text-slate-600 dark:text-slate-400" />
        </div>
        <h2 className="text-3xl font-black text-slate-200 dark:text-white uppercase tracking-tighter">{actions.t('settings_title')}</h2>
        <p className="text-slate-400 dark:text-slate-400 mt-2 font-medium">{actions.t('settings_subtitle')}</p>
      </div>

      {/* AI Section (Auto-configured with Vertex AI) */}
      <Card 
        title={actions.t('settings_ai')} 
        icon={<Sparkles className="text-purple-600" />}
        className="overflow-hidden"
      >
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-500 font-medium">Vertex AI for Firebase está activo.</p>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-500 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-full uppercase">
                        <CheckCircle className="w-3 h-3" /> Producción Activa
                    </span>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-start gap-2 p-4 bg-purple-50 dark:bg-purple-500/5 rounded-2xl">
                    <Sparkles className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-purple-600 dark:text-purple-400 leading-relaxed font-medium">
                        El sistema ahora utiliza <strong>Gemini 3.1 Flash (High Performance)</strong> a través de la infraestructura segura de Vertex AI en Google Cloud. El acceso es interno y gestionado de forma automática por la plataforma. Ya no se requieren ni permiten API Keys manuales.
                    </p>
                </div>
            </div>
        </div>
      </Card>

      {/* Idioma de la App */}
      <Card title={actions.t('settings_lang')} icon={<Globe className="text-indigo-400" />}>
        <div className="p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-5">
            Idioma nativo de la interfaz. También determina la fonética guiada en las sesiones de vocabulario.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {UI_LANGS.map(l => (
              <button
                key={l.id}
                onClick={() => setLocalUiLanguage(l.id)}
                className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all font-bold text-sm
                  ${localUiLanguage === l.id
                    ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-400 scale-[1.02]'
                    : 'bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-400 dark:hover:border-slate-600'}`}
              >
                <span className="text-xl">{l.emoji}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>

          <Button 
            onClick={handleUiLangSave}
            className="w-full py-4 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <CheckCircle className="w-5 h-5" /> {actions.t('settings_apply_lang')}
          </Button>
        </div>
      </Card>

      {/* Panel de Identidad y Propósito */}
      <Card title={actions.t('settings_profile')} icon={<Info className="text-blue-500" />}>
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 block ml-1">
                        Nombre Real
                    </label>
                    <input 
                        type="text" 
                        value={settings.user_name || ''}
                        onChange={(e) => actions.updateSetting('user_name', e.target.value)}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="Ej. Jose García"
                    />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 block ml-1">
                        {actions.t('profile_nickname')}
                    </label>
                    <input 
                        type="text" 
                        value={settings.nickname || ''}
                        onChange={(e) => actions.updateSetting('nickname', e.target.value)}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="Ej. Archi"
                    />
                </div>
            </div>

            <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 block ml-1">
                    {actions.t('profile_mission')}
                </label>
                <textarea 
                    value={settings.life_mission || ''}
                    onChange={(e) => actions.updateSetting('life_mission', e.target.value)}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-medium text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[100px] resize-none"
                    placeholder={actions.t('profile_mission_placeholder')}
                />
                <p className="text-[9px] text-slate-500 mt-2 font-medium italic">
                    * Tu misión de vida ayuda a Gemini 3 a alinear tus mantras y consejos con tu propósito central.
                </p>
            </div>

            <Button 
                onClick={async () => {
                    const saveBtn = document.activeElement;
                    if (!saveBtn || !settings.userId) return;
                    
                    const originalContent = saveBtn.innerHTML;
                    saveBtn.innerHTML = '<span class="animate-pulse">Guardando...</span>';
                    saveBtn.classList.add('opacity-80');
                    
                    try {
                        // Guardado real en Firestore
                        await setDoc(doc(db, 'users', settings.userId), settings, { merge: true });
                        
                        saveBtn.innerHTML = '✅ ¡Guardado con éxito!';
                        saveBtn.classList.replace('bg-blue-600', 'bg-emerald-600');
                        
                        setTimeout(() => {
                            saveBtn.innerHTML = originalContent;
                            saveBtn.classList.replace('bg-emerald-600', 'bg-blue-600');
                            saveBtn.classList.remove('opacity-80');
                        }, 2000);
                    } catch (error) {
                        console.error("Error saving profile:", error);
                        saveBtn.innerHTML = '❌ Error al guardar';
                        saveBtn.classList.replace('bg-blue-600', 'bg-rose-600');
                        setTimeout(() => {
                            saveBtn.innerHTML = originalContent;
                            saveBtn.classList.replace('bg-rose-600', 'bg-blue-600');
                            saveBtn.classList.remove('opacity-80');
                        }, 2000);
                    }
                }}
                className="w-full py-4 gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/10 transition-all duration-300"
            >
                <Save className="w-5 h-5" /> {actions.t('settings_save_changes')}
            </Button>
        </div>
      </Card>
      
      <div className="pb-12 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Versión 3.0 (Vertex AI Migration)</p>
      </div>
    </div>
  );
};

export default SettingsTab;
