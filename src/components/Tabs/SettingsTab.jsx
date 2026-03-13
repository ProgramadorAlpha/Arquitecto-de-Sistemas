import React, { useState } from 'react';
import { Settings, Sparkles, Eye, EyeOff, Info, CheckCircle, Circle, Loader2, Save } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';

const SettingsTab = ({ settings, onUpdate }) => {
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestKey = async () => {
    setTesting(true);
    setTestResult(null);
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${settings.api_key}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.models) {
            setTestResult({ success: true, message: '¡Conexión exitosa! API Key válida.' });
        } else {
            throw new Error(data.error?.message || 'Error desconocido');
        }
    } catch (err) {
        setTestResult({ success: false, message: 'Error: ' + err.message });
    } finally {
        setTesting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4">
      {/* Header */}
      <div className="text-center mb-12 py-8">
        <div className="bg-slate-100 dark:bg-slate-800 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200 dark:shadow-none">
          <Settings className="w-10 h-10 text-slate-600 dark:text-slate-400" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Configuración</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Personaliza tu arquitectura de vida</p>
      </div>

      {/* AI Section */}
      <Card 
        title="Inteligencia Artificial" 
        icon={<Sparkles className="text-purple-600" />}
        className="overflow-hidden"
      >
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-500 font-medium">Conecta Google Gemini para potenciar tu sistema.</p>
                <div className="flex items-center gap-2">
                    {settings.api_key ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-500 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-full uppercase">
                            <CheckCircle className="w-3 h-3" /> Conectado
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full uppercase">
                            <Circle className="w-3 h-3" /> Sin configurar
                        </span>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {/* Model Selector */}
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Modelo de IA</label>
                    <select 
                        value={settings.ai_model || 'gemini-2.5-flash'}
                        onChange={(e) => onUpdate('ai_model', e.target.value)}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white font-bold text-sm focus:ring-2 focus:ring-purple-500 outline-none appearance-none"
                    >
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (Más eficiente)</option>
                        <option value="gemini-3.1-flash">Gemini 3.1 Flash (Máximo rendimiento)</option>
                    </select>
                </div>

                {/* API Key Input */}
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">API Key de Gemini</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input 
                                type={showKey ? "text" : "password"} 
                                value={settings.api_key || ''}
                                onChange={(e) => onUpdate('api_key', e.target.value)}
                                className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white font-mono text-sm focus:ring-2 focus:ring-purple-500 outline-none pr-12"
                                placeholder="AIzaSy..."
                            />
                            <button 
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        <Button 
                            variant="secondary" 
                            onClick={handleTestKey}
                            disabled={testing || !settings.api_key}
                            className="px-6"
                        >
                            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Probar'}
                        </Button>
                    </div>

                    {testResult && (
                        <div className={`mt-3 p-3 rounded-xl text-xs font-bold border ${testResult.success ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                            {testResult.message}
                        </div>
                    )}

                    <div className="flex items-start gap-2 mt-4 p-4 bg-blue-50 dark:bg-blue-500/5 rounded-2xl">
                        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-blue-600 dark:text-blue-400 leading-relaxed font-medium">
                            Obtén tu API key gratuita en <a href="https://aistudio.google.com/apikey" target="_blank" className="font-bold underline">Google AI Studio</a>. Tu información se guarda de forma segura en tu perfil.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </Card>

      {/* User Info */}
      <Card title="Perfil de Usuario" icon={<Info className="text-blue-500" />}>
        <div className="p-6 space-y-4">
            <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Nombre para IA</label>
                <input 
                    type="text" 
                    value={settings.user_name || ''}
                    onChange={(e) => onUpdate('user_name', e.target.value)}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej. Alexander"
                />
            </div>
            <Button className="w-full py-4 gap-2">
                <Save className="w-5 h-5" /> Guardar Cambios
            </Button>
        </div>
      </Card>
      
      <div className="pb-12 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Versión 2.0 (React Migration)</p>
      </div>
    </div>
  );
};

export default SettingsTab;
