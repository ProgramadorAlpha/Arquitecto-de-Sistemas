import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useAppContext } from './context/AppContext';
import Sidebar from './components/Layout/Sidebar';
import TopBar from './components/Layout/TopBar';
import { useSidebar } from './hooks/useSidebar';

import DashboardTab from './components/Tabs/DashboardTab';
import WeeklyTab from './components/Tabs/WeeklyTab';
import MonthlyTab from './components/Tabs/MonthlyTab';
import SettingsTab from './components/Tabs/SettingsTab';
import SystemsTab from './components/Tabs/SystemsTab';
import NetworkTab from './components/Tabs/NetworkTab';
import MantraBanner from './components/Layout/MantraBanner';
import Login from './components/Login';
import Modal from './components/UI/Modal';
import ManifestoModal from './components/UI/ManifestoModal';
import { Brain, Save } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './services/firebase';
import { getWeekId } from './utils/dateUtils';

function App() {
  const { user, logout } = useAuth();
  const { data, actions, isDark } = useAppContext();
  const [activeTab, setActiveTab] = useState('dashboard');
  const { isOpen: isSidebarOpen, toggle: toggleSidebar, close: closeSidebar } = useSidebar();

  const [isBrainDumpOpen, setIsBrainDumpOpen] = useState(false);
  const [isManifestoOpen, setIsManifestoOpen] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!user) {
    return <Login />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab data={data} actions={actions} />;
      case 'weekly':
        return <WeeklyTab />;
      case 'monthly':
        return <MonthlyTab />;
      case 'settings':
        return <SettingsTab settings={data.settings} onUpdate={actions.updateSetting} />;
      case 'systems':
        return <SystemsTab />;
      case 'network':
        return <NetworkTab />;
      default:
        return <div className="p-10 text-center text-slate-500">Próximamente: {activeTab}</div>;
    }
  };

  const handleQuickSave = async () => {
    if (!user || !quickNote.trim()) return;
    setIsSaving(true);
    try {
      const weekId = getWeekId(0);
      await setDoc(doc(db, 'users', user.uid, 'weekly', weekId), { 
        brain_dump: quickNote 
      }, { merge: true });
      setIsBrainDumpOpen(false);
      setQuickNote('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`app-shell ${isDark ? 'dark' : ''}`}>
      {/* Overlay para móvil */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'sidebar-overlay--open' : ''}`} 
        onClick={closeSidebar} 
      />

      {/* Sidebar - Ahora manejado con clases CSS del sistema responsive */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        isMaster={user?.email === 'josegr1.8@gmail.com'}
        currentStreak={data.streak}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        onLogout={logout}
      />

      {/* Main Content Area */}
      <div className={`main-content ${isDark ? 'bg-slate-950' : 'bg-slate-50'} transition-colors duration-300`}>
        <TopBar 
          user={user} 
          onLogout={logout} 
          toggleTheme={actions.toggleTheme}
          isDark={isDark}
          openManifesto={() => setIsManifestoOpen(true)}
          onOpenSidebar={toggleSidebar}
        />

        <main className="relative z-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 pb-32">
            <MantraBanner />
            {renderTabContent()}
          </div>
        </main>
      </div>


      {/* Floating Action Button (Vaciado Mental) */}
      <button 
        onClick={() => setIsBrainDumpOpen(true)}
        className="fixed bottom-8 right-8 bg-amber-500 text-white p-5 rounded-full shadow-2xl shadow-amber-500/30 hover:scale-110 hover:rotate-12 transition-all z-40 group"
        title="Vaciado Mental"
      >
        <Brain className="w-8 h-8 group-hover:animate-pulse" />
        <span className="absolute right-full mr-4 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          VACIADO MENTAL
        </span>
      </button>

      <Modal 
        isOpen={isBrainDumpOpen} 
        onClose={() => setIsBrainDumpOpen(false)}
        title="Vaciado Mental Rápido"
      >
        <div className="space-y-6">
          <p className="text-xs text-slate-500 font-medium italic">
            "Libera espacio en tu cabeza para enfocar tu energía en la ejecución."
          </p>
          <textarea 
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            placeholder="Escribe todo lo que ocupe espacio ahora mismo..."
            className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/20 resize-none border-none shadow-inner"
            autoFocus
          />
          <button 
            onClick={handleQuickSave}
            disabled={isSaving || !quickNote.trim()}
            className="w-full bg-slate-900 dark:bg-amber-500 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : <><Save className="w-4 h-4" /> Guardar en Mi Plan</>}
          </button>
        </div>
      </Modal>

      {/* Manifesto Modal Premium */}
      <ManifestoModal 
        isOpen={isManifestoOpen} 
        onClose={() => setIsManifestoOpen(false)} 
      />
    </div>
  );
}

export default App;
