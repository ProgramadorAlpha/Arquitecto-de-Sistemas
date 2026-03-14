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

  const { login, register, loginWithGoogle } = useAuth();

  const handleSubmit = async (e) => {
    e?.preventDefault();
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

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0C0D10] z-[100] flex items-center justify-center p-4 overflow-y-auto">
      {/* Background gradients for depth */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="bg-[#13151A] border border-white/5 backdrop-blur-xl p-8 rounded-[32px] max-w-sm w-full shadow-2xl relative overflow-hidden group">
        
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-transparent opacity-50 pointer-events-none" />

        {/* Logo/Title */}
        <div className="flex flex-col items-center mb-8 relative z-10">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-4 rounded-2xl mb-4 shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Arquitecto</h2>
            <span className="text-[10px] text-blue-400 font-bold tracking-[0.3em] uppercase -mt-1">De Sistemas</span>
        </div>

        {/* Tab selector */}
        <div className="flex gap-1 mb-8 bg-black/40 p-1.5 rounded-2xl border border-white/5">
          <button 
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 ${isLogin ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Ingresar
          </button>
          <button 
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 ${!isLogin ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Registro
          </button>
        </div>

        {error && (
            <div className="bg-red-500/10 text-red-400 text-[11px] font-medium p-3.5 rounded-xl border border-red-500/20 mb-6 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
              <span className="mt-0.5">⚠️</span>
              {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          {!isLogin && (
            <div className="group/field">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1 block group-focus-within/field:text-blue-400 transition-colors">Nombre Completo</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required 
                className="w-full p-4 bg-black/20 rounded-2xl border border-white/5 focus:border-blue-500/50 focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-white text-sm transition-all"
                placeholder="Jose Luis González"
              />
            </div>
          )}

          <div className="group/field">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1 block group-focus-within/field:text-blue-400 transition-colors">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              className="w-full p-4 bg-black/20 rounded-2xl border border-white/5 focus:border-blue-500/50 focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-white text-sm transition-all"
              placeholder="tu@email.com"
            />
          </div>

          <div className="group/field pb-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1 block group-focus-within/field:text-blue-400 transition-colors">Contraseña</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className="w-full p-4 bg-black/20 rounded-2xl border border-white/5 focus:border-blue-500/50 focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-white text-sm pr-12 transition-all"
                placeholder="••••••••"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                title={showPassword ? "Ocultar" : "Mostrar"}
              >
                <Eye className="w-5 h-5" />
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg shadow-blue-600/20 border-b-4 border-blue-800 disabled:opacity-50 disabled:pointer-events-none"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (isLogin ? 'Iniciar Misión' : 'Crear Perfil')}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
            <span className="bg-[#13151A] px-3 text-slate-500 font-bold">O continúa con</span>
          </div>
        </div>

        <button 
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3.5 bg-white/5 hover:bg-white/10 active:scale-[0.98] text-white font-bold text-sm rounded-2xl transition-all border border-white/10 flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          Google
        </button>

        <div className="mt-8 text-center space-y-2">
            {isLogin && (
                <button type="button" className="text-[10px] uppercase font-black tracking-widest text-blue-400/80 hover:text-blue-400 transition-colors">
                ¿Olvidaste tu contraseña?
                </button>
            )}
        </div>
      </div>
    </div>
  );
};


export default Login;
