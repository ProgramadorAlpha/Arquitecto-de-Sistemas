import { 
  Shield, Activity, ClipboardList, Target, Box, Users, Settings, ShieldAlert, X, LogOut, Globe
} from 'lucide-react';

import { useAppContext } from '../../context/AppContext';

const Sidebar = ({ activeTab, onTabChange, isMaster, currentStreak, isOpen, onClose, onLogout }) => {
  const { actions } = useAppContext();
  
  const tabs = [
    { id: 'dashboard', label: actions.t('nav_dashboard'), icon: Activity },
    { id: 'languages', label: actions.t('nav_languages'), icon: Globe },
    { id: 'weekly', label: actions.t('nav_weekly'), icon: ClipboardList },
    { id: 'monthly', label: actions.t('nav_monthly'), icon: Target },
    { id: 'systems', label: actions.t('nav_systems'), icon: Box },
    { id: 'network', label: actions.t('nav_network'), icon: Users },
    { id: 'settings', label: actions.t('nav_settings'), icon: Settings },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      {/* Header / Logo */}
      <div className="p-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/10 p-2 rounded-xl border border-blue-500/20 shadow-inner">
            <Shield className="text-blue-400 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-white font-black tracking-tight leading-none text-lg">ARQUITECTO</h1>
            <span className="text-blue-400 text-[10px] font-bold tracking-widest uppercase">DE SISTEMAS</span>
          </div>
        </div>
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="md:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
        <div className="px-3 mb-3">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Navegación Módulos</h2>
        </div>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id);
                onClose();
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 text-[15px] font-bold
                ${isActive
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
              {tab.label}
            </button>
          );
        })}

        {isMaster && (
          <div className="pt-6 mt-6 border-t border-white/5 relative">
            <div className="absolute inset-0 bg-red-500/5 blur-xl pointer-events-none rounded-full" />
            <button
              onClick={() => {
                onTabChange('admin');
                onClose();
              }}
              className={`
                relative w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 text-[15px] font-bold
                ${activeTab === 'admin'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}
              `}
            >
              <ShieldAlert className={`w-5 h-5 ${activeTab === 'admin' ? 'text-red-400' : 'text-slate-500'}`} />
              MASTER ADMIN
            </button>
          </div>
        )}
      </nav>

      {/* Footer Area: Streak & Logout */}
      <div className="p-6 border-t border-white/5 space-y-4">
        {currentStreak !== undefined && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-4 flex items-center justify-between relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3 relative z-10">
              <span className="text-2xl drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">🔥</span>
              <div>
                <div className="text-amber-500 font-black text-xl tracking-tight leading-none">{currentStreak}</div>
                <div className="text-[9px] font-bold text-amber-500/70 uppercase tracking-widest mt-0.5">{actions.t('nav_streak')}</div>
              </div>
            </div>
          </div>
        )}

        {/* Global Logout Button inside Sidebar for easier access */}
        <button
          onClick={() => {
            if (typeof onLogout === 'function') {
              onLogout();
              onClose();
            }
          }}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 text-[14px] font-bold text-slate-500 hover:bg-red-500/10 hover:text-red-400 group/logout"
        >
          <div className="bg-slate-800 group-hover/logout:bg-red-500/20 p-2 rounded-xl transition-colors">
            <LogOut className="w-5 h-5" />
          </div>
          <span>{actions.t('nav_logout')}</span>
        </button>
      </div>
    </aside>

  );
};

export default Sidebar;
