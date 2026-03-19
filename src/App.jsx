import React, { useState } from 'react';
import { Menu, Bell } from 'lucide-react';
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
import ErrorBoundary from './components/UI/ErrorBoundary';
import Login from './components/Login';
import BrainDumpFAB from './components/UI/BrainDumpFAB';

const App = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data, actions, isDark } = useAppContext();

  if (!user) {
    return <Login />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'languages':
        return <LanguagesTab />;
      case 'weekly':
        return <WeeklyTab />;
      case 'monthly':
        return <MonthlyTab />;
      case 'systems':
        return <SystemsTab />;
      case 'network':
        return <NetworkTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <div className="p-10 text-center text-slate-500">Próximamente: {activeTab}</div>;
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

      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        currentStreak={data.streak}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={() => console.log('Logout clicked')} // Implementar si es necesario
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative h-screen">
        {/* Header Bar */}
        <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-10 border-b border-white/5 bg-slate-900/40 backdrop-blur-md z-30 sticky top-0 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2.5 rounded-2xl bg-slate-800 text-slate-400 hover:text-white transition-all shadow-inner"
            >
              <Menu size={20} strokeWidth={2.5} />
            </button>
            <div className="hidden md:block">
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Comando Central</h2>
              <p className="text-white text-sm font-bold truncate max-w-[200px]">{user.displayName || user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-2xl bg-blue-500/5 border border-blue-500/20 shadow-inner group">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-[10px] md:text-xs font-black text-blue-400 uppercase tracking-widest">{data.mode.title}</span>
            </div>
            
            <button className="p-2.5 rounded-2xl bg-slate-800 text-slate-400 hover:text-blue-400 transition-all border border-transparent hover:border-blue-500/30 group">
              <Bell size={20} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </header>

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
