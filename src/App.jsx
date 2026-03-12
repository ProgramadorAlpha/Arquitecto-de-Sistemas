import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useAppContext } from './context/AppContext';
import Header from './components/Layout/Header';
import TabNavigation from './components/Layout/TabNavigation';
import DashboardTab from './components/Tabs/DashboardTab';
import WeeklyTab from './components/Tabs/WeeklyTab';
import MonthlyTab from './components/Tabs/MonthlyTab';
import SettingsTab from './components/Tabs/SettingsTab';
import SystemsTab from './components/Tabs/SystemsTab';
import NetworkTab from './components/Tabs/NetworkTab';
import MantraBanner from './components/Layout/MantraBanner';
import Login from './components/Login';

function App() {
  const { user, logout } = useAuth();
  const { data, actions, isDark } = useAppContext();
  const [activeTab, setActiveTab] = useState('dashboard');

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

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-slate-950' : 'bg-slate-50'} transition-colors duration-300`}>
      <Header 
        user={user} 
        onLogout={logout} 
        toggleTheme={actions.toggleTheme}
        isDark={isDark}
        mantraSubtitle={data.mantra}
        openManifesto={() => alert('Manifiesto próximamente')}
      />

      <TabNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        isMaster={user?.email === 'josegr1.8@gmail.com'} // Ejemplo de Master
      />

        <main className="max-w-4xl mx-auto px-4 pb-20 mt-8 relative z-10">
          {user && (
            <>
              <MantraBanner />
              {renderTabContent()}
            </>
          )}
        </main>

      {/* Floating Action Button (Deep Work) */}
      <button 
        onClick={() => alert('Modo Enfoque próximamente')}
        className="fixed bottom-8 right-8 bg-amber-500 text-white p-5 rounded-full shadow-2xl shadow-amber-500/30 hover:scale-110 hover:rotate-12 transition-all z-40"
      >
        <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M13 10V3L4 14H11V21L20 10H13Z"/></svg>
      </button>
    </div>
  );
}

export default App;
