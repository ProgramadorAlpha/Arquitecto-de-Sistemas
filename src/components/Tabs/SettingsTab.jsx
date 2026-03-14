import React from 'react';
import { Settings, Sparkles, Info, CheckCircle, Save } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';

const SettingsTab = ({ settings, onUpdate }) => {
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

      {/* AI Section (Auto-configured with Vertex AI) */}
      <Card 
        title="Inteligencia Artificial" 
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
                        El sistema ahora utiliza <strong>Gemini 3 Flash Preview</strong> a través de la infraestructura segura de Google Cloud. El acceso es automático y gestionado por tu cuenta.
                    </p>
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
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Versión 3.0 (Vertex AI Migration)</p>
      </div>
    </div>
  );
};

export default SettingsTab;
