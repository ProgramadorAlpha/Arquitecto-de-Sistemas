import React, { useState, useEffect } from 'react';
import { Menu, Bell, Sun, Moon, ScrollText, Download, Zap, Flame, BookOpen, Target } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useAppContext } from './context/AppContext';
import useNetworkMembers from './hooks/useNetworkMembers';
import useProactiveAlerts from './hooks/useProactiveAlerts';
import Sidebar from './components/Layout/Sidebar';
import BottomTabBar from './components/Layout/BottomTabBar';
import DashboardTab from './components/Tabs/DashboardTab';
import LanguagesTab from './components/Tabs/LanguagesTab';
import WeeklyTab from './components/Tabs/WeeklyTab';
import MonthlyTab from './components/Tabs/MonthlyTab';
import SystemsTab from './components/Tabs/SystemsTab';
import NetworkTab from './components/Tabs/NetworkTab';
import SettingsTab from './components/Tabs/SettingsTab';
import MantraBanner from './components/Layout/MantraBanner';
import ManifestoModal from './components/UI/ManifestoModal';
import NotificationPanel from './components/UI/NotificationPanel';
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

  // ── Alertas Proactivas (alimentan tanto el FAB como el badge de la campana)
  const networkMembers = useNetworkMembers(user);
  const { criticalCount, warningCount } = useProactiveAlerts(user, networkMembers);
  const totalAlerts = criticalCount + warningCount;

  // Fecha formateada
  const todayLabel = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase());
  const getDisplayName = () => {
    const rawName = data?.settings?.user_name || data?.settings?.nickname || user?.displayName;
    if (rawName) {
      const p = rawName.trim().split(/\s+/);
      if (p.length === 1) return p[0];
      if (p.length === 2) return `${p[0]} ${p[1][0].toUpperCase()}.`;
      if (p.length >= 3) return `${p[0]} ${p[1][0].toUpperCase()}. ${p[2][0].toUpperCase()}.`;
    }
    return user?.email ? user.email.split('@')[0] : 'Arquitecto';
  };
  const firstName = getDisplayName();
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
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Hamburger móvil */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden shrink-0 p-2.5 rounded-2xl bg-slate-800 text-slate-400 hover:text-white transition-all shadow-inner"
            >
              <Menu size={20} strokeWidth={2.5} />
            </button>
            {/* Saludo personalizado */}
            <div className="min-w-0 flex-1">
              <h2 className="text-white font-black text-sm md:text-base leading-tight text-ellipsis overflow-hidden whitespace-nowrap">
                {greeting}, {firstName} <span className="inline-block animate-[wave_1.5s_ease_1]" style={{display:'inline-block'}}>👋</span>
              </h2>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium capitalize hidden sm:block">{todayLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
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
              className={`relative p-2.5 rounded-2xl border transition-all group ${
                criticalCount > 0
                  ? 'bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25'
                  : 'bg-slate-800 border-transparent text-slate-400 hover:text-blue-400 hover:border-blue-500/30'
              }`}
              title="Notificaciones"
            >
              <Bell size={18} strokeWidth={2.5} className={criticalCount > 0 ? 'animate-[hinge_0.1s_ease_infinite]' : 'group-hover:animate-[ring_0.5s_ease]'} />
              {totalAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-slate-900 leading-none">
                  {totalAlerts > 9 ? '9+' : totalAlerts}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Panel de Notificaciones */}
        <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} onNavigate={(tab) => { setActiveTab(tab); setNotifOpen(false); }} />

        {/* Scrollable Container */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#0a0f1e] p-4 md:p-10 custom-scrollbar pb-24 md:pb-10">
          <ErrorBoundary key={activeTab}>
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-10">
              <MantraBanner />
              {renderTabContent()}
            </div>
          </ErrorBoundary>
        </main>
      </div>

      {/* Bottom Tab Bar (mobile native navigation) */}
      <BottomTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenMore={() => setSidebarOpen(true)}
      />

      {/* Floating Action / Brain Dump Button (Global) */}
      <BrainDumpFAB />
    </div>
  );
};

export default App;
