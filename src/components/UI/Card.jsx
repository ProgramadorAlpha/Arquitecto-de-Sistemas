import React from 'react';

const Card = ({ children, className = '', title, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'text-blue-500 bg-blue-100',
    indigo: 'text-indigo-600 bg-indigo-100',
    orange: 'text-orange-600 bg-orange-100',
    red: 'text-red-600 bg-red-100',
    green: 'text-green-600 bg-green-100',
    emerald: 'text-emerald-500 bg-emerald-100',
    cyan: 'text-cyan-500 bg-cyan-100',
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 relative overflow-hidden group ${className}`}>
      {(title || Icon) && (
        <div className="flex items-center gap-3 mb-6">
          {Icon && (
            <div className={`p-2.5 rounded-xl ${colorClasses[color] || colorClasses.blue}`}>
              {React.isValidElement(Icon) ? Icon : <Icon className="w-6 h-6" />}
            </div>
          )}
          {title && (
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{title}</h3>
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
