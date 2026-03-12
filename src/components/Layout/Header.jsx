import React from 'react';
import { Shield, ScrollText, Sun, Moon, LogOut } from 'lucide-react';
import Button from '../UI/Button';

const Header = ({ user, onLogout, toggleTheme, isDark, openManifesto, mantraSubtitle }) => {
  return (
    <header className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-6 pb-12 rounded-b-[40px] shadow-2xl relative overflow-hidden mb-8 transition-colors">
      {/* Top Gradient Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="text-blue-400 w-6 h-6" />
              <h1 className="text-3xl font-bold tracking-tight">ARQUITECTO DE SISTEMAS</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md italic border-l-2 border-blue-500 pl-3">
              {mantraSubtitle || '"Construyendo rutinas a prueba de fallos..."'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* User Avatar */}
            <div className="hidden sm:flex items-center gap-3 bg-slate-100 dark:bg-white/5 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10">
              <div className="relative">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></div>
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-widest font-bold text-green-600 dark:text-green-400">Online</p>
                <p className="font-bold text-slate-800 dark:text-white text-sm truncate max-w-[100px]">{user?.name || 'Arquitecto'}</p>
              </div>
            </div>

            <button 
              onClick={openManifesto}
              className="group flex flex-col items-center gap-1 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 p-3 rounded-xl border border-slate-200 dark:border-white/10 transition-all text-slate-900 dark:text-white"
            >
              <ScrollText className="text-yellow-600 dark:text-yellow-400 w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-slate-500 dark:text-white/50 text-[9px] font-bold uppercase tracking-wider">Manifiesto</span>
            </button>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="relative w-14 h-8 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-full transition-all flex items-center p-1"
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center transition-transform duration-300 ${isDark ? 'translate-x-6' : 'translate-x-0'}`}>
                {isDark ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              </div>
            </button>

            <Button variant="outline" onClick={onLogout} className="p-3">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Glow effects */}
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
    </header>
  );
};

export default Header;
