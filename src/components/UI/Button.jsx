import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '', 
  icon: Icon,
  type = 'button'
}) => {
  const baseStyles = 'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all font-bold text-sm whitespace-nowrap border cursor-pointer';
  
  const variants = {
    primary: 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50 hover:bg-blue-700',
    secondary: 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white',
    ghost: 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800/50',
    danger: 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20',
    success: 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20',
    dark: 'bg-slate-900 text-white hover:bg-slate-850',
    outline: 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
  };

  return (
    <button 
      type={type}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${className}`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};

export default Button;
