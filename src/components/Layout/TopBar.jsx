import React from 'react';
import { Menu, Sun, Moon, ScrollText, LogOut } from 'lucide-react';

const TopBar = ({ 
  user, onLogout, toggleTheme, isDark, openManifesto, onOpenSidebar 
}) => {
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const today = new Date().toLocaleDateString('es-ES', dateOptions);

  return (
    <header className="topbar">
      
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button 
          onClick={onOpenSidebar}
          className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Greeting & Date */}
        <div className="hidden sm:block">
          <h2 className="text-slate-900 dark:text-white font-bold text-lg leading-tight tracking-tight">
            Hola, {user?.name?.split(' ')[0] || 'Arquitecto'} 👋
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold capitalize mt-0.5">
            {today}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
          title="Alternar Tema"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Manifesto Button */}
        <button 
          onClick={openManifesto}
          className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors shadow-sm"
          title="Leer Manifiesto"
        >
          <ScrollText className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline pr-1">Manifiesto</span>
        </button>

        {/* User / Logout Divider */}
        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-1"></div>

        {/* User / Logout */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white dark:ring-slate-950">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <button 
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
