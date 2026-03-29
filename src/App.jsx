import React, { useState, useEffect } from 'react';
import { Menu, Bell, Sun, Moon, ScrollText, Download, X, Zap, Flame, BookOpen, Target } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useAppContext } from './context/AppContext';
import Sidebar from './components/Layout/Sidebar';
import DashboardTab from './components/Tabs/DashboardTab';
import LanguagesTab from './components/Tabs/LanguagesTab';
import WeeklyTab from './components/Tabs/WeeklyTab';
import MonthlyTab from './components/Tabs/MonthlyTab';
import SystemsTab from './components/Tabs/SystemsTab';
import NetworkTab from './components/Tabs/NetworkTab';
import SettingsTab from './components/Tabs/SettingsTab';
import MantraBanner from './components/Layout/MantraBanner';
import ManifestoModal from './components/UI/ManifestoModal';
import ErrorBoundary from './components/UI/ErrorBoundary';
import Login from './components/Login';
import BrainDumpFAB from './components/UI/BrainDumpFAB';

const App = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [manifestoOpen, setManifestoOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const { data, actions, isDark } = useAppContext();

  // Fecha formateada
  const todayLabel = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase());
  const firstName = (user?.displayName || user?.email || 'Arquitecto').split(/[ @]/)[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  // Capturar evento PWA install
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  if (!user) return <Login />;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab />;
      case 'languages': return <LanguagesTab />;
      case 'weekly':    return <WeeklyTab />;
      case 'monthly':   return <MonthlyTab />;
      case 'systems':   return <SystemsTab />;
      case 'network':   return <NetworkTab />;
      case 'settings':  return <SettingsTab />;
      default: return <div className="p-10 text-center text-slate-500">Próximamente: {activeTab}</div>;
    }
  };

  return (
    <div className={`flex min-h-screen bg-[#0a0f1e] text-slate-200 font-sans selection:bg-blue-500/30 overflow-hidden ${!isDark ? 'light' : ''}`}>
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Manifesto Modal */}
      <ManifestoModal isOpen={manifestoOpen} onClose={() => setManifestoOpen(false)} />

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentStreak={data.streak}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={() => console.log('Logout clicked')}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative h-screen">
        {/* Header Bar */}
        <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-10 border-b border-white/5 bg-slate-900/40 backdrop-blur-md z-30 sticky top-0 shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger móvil */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2.5 rounded-2xl bg-slate-800 text-slate-400 hover:text-white transition-all shadow-inner"
            >
              <Menu size={20} strokeWidth={2.5} />
            </button>
            {/* Saludo personalizado */}
            <div>
              <h2 className="text-white font-black text-sm md:text-base leading-tight">
                {greeting}, {firstName} <span className="inline-block animate-[wave_1.5s_ease_1]" style={{display:'inline-block'}}>👋</span>
              </h2>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium capitalize hidden sm:block">{todayLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Theme Toggle */}
            <button
              onClick={actions.toggleTheme}
              className="p-2.5 rounded-2xl bg-slate-800 border border-transparent hover:border-amber-500/30 text-slate-400 hover:text-amber-400 transition-all shadow-inner group"
              title="Alternar tema claro / oscuro"
            >
              {isDark
                ? <Sun size={18} strokeWidth={2} className="group-hover:rotate-90 transition-transform duration-300" />
                : <Moon size={18} strokeWidth={2} className="group-hover:-rotate-12 transition-transform duration-300" />
              }
            </button>

            {/* Manifesto */}
            <button
              onClick={() => setManifestoOpen(true)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/40 transition-all shadow-inner"
              title="Abrir Manifiesto"
            >
              <ScrollText size={17} strokeWidth={2} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Manifiesto</span>
            </button>

            {/* PWA Install (solo visible si el prompt está disponible) */}
            {deferredPrompt && (
              <button
                onClick={handleInstallPWA}
                className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all shadow-inner"
                title="Instalar App"
              >
                <Download size={17} strokeWidth={2} />
              </button>
            )}

            {/* Bell — Panel de Notificaciones del Día */}
            <button
              onClick={() => setNotifOpen(true)}
              className="relative p-2.5 rounded-2xl bg-slate-800 text-slate-400 hover:text-blue-400 transition-all border border-transparent hover:border-blue-500/30 group"
              title="Resumen del día"
            >
              <Bell size={18} strokeWidth={2.5} className="group-hover:animate-[ring_0.5s_ease]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-slate-800 animate-pulse" />
            </button>
          </div>
        </header>

        {/* Panel de Notificaciones / Resumen del Día */}
        {notifOpen && (
          <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setNotifOpen(false)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
              className="relative w-full max-w-sm h-full bg-[#0e1120] border-l border-white/5 shadow-2xl flex flex-col overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <div>
                  <h3 className="font-black text-white text-base uppercase tracking-tight">Resumen del Día</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 capitalize">{todayLabel}</p>
                </div>
                <button onClick={() => setNotifOpen(false)} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all"><X size={16} /></button>
              </div>
              <div className="flex-1 p-5 space-y-4">
                {/* Racha */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                  <Flame size={20} className="text-amber-400 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-amber-400 uppercase tracking-widest">Racha Actual</p>
                    <p className="text-2xl font-black text-white leading-tight">{data.streak} <span className="text-xs font-medium text-slate-400">días</span></p>
                  </div>
                </div>
                {/* Modo activo */}
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3">
                  <Zap size={20} className="text-blue-400 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-blue-400 uppercase tracking-widest">Modo Activo</p>
                    <p className="text-sm font-bold text-white">{data.mode?.title || 'Expansión CEO'}</p>
                    <p className="text-[10px] text-slate-500">{data.mode?.description || 'Enfoque máximo'}</p>
                  </div>
                </div>
                {/* Foco semanal */}
                {data.weeklyFocus?.priority_1 && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                    <Target size={20} className="text-red-400 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-red-400 uppercase tracking-widest">Foco Semanal</p>
                      <p className="text-sm font-bold text-white uppercase">{data.weeklyFocus.priority_1}</p>
                    </div>
                  </div>
                )}
                {/* Lectura */}
                {data.reading?.current_book && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                    <BookOpen size={20} className="text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">Libro Activo</p>
                      <p className="text-sm font-bold text-white line-clamp-2">{data.reading.current_book}</p>
                    </div>
                  </div>
                )}
                {/* Consejo del día */}
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                  <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">💡 Recordatorio</p>
                  <p className="text-xs text-slate-300 leading-relaxed italic">"La consistencia supera a la intensidad. Un 1% mejor cada día = 37x mejor al año."</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Container */}
        <main className="flex-1 overflow-y-auto bg-[#0a0f1e] p-4 md:p-10 custom-scrollbar">
          <ErrorBoundary key={activeTab}>
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-10 pb-20">
              <MantraBanner />
              {renderTabContent()}
            </div>
          </ErrorBoundary>
        </main>
      </div>

      {/* Floating Action / Brain Dump Button (Global) */}
      <BrainDumpFAB />
    </div>
  );
};

export default App;
