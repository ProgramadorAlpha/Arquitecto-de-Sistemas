import React, { useState } from 'react';
import { Eye, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from './UI/Button';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl max-w-sm w-full shadow-2xl">
        
        {/* Logo/Title */}
        <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-600 p-3 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
                <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Arquitecto</h2>
        </div>

        {/* Tab selector */}
        <div className="flex gap-2 mb-6 bg-slate-100 dark:bg-slate-700 p-1 rounded-2xl">
          <button 
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${isLogin ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
          >
            Ingresar
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${!isLogin ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
          >
            Registro
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs p-3 rounded-xl border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1 block">Nombre Completo</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required 
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
                placeholder="Jose Luis González"
              />
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1 block">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1 block">Contraseña</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm pr-12"
                placeholder="••••••••"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <Eye className="w-5 h-5" />
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full py-4 text-base" 
            disabled={loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Ingresar' : 'Crear Cuenta')}
          </Button>

          {isLogin && (
            <button type="button" className="w-full text-xs text-blue-600 hover:underline mt-2">
              ¿Olvidaste tu contraseña?
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
