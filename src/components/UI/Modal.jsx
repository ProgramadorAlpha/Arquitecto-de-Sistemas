import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      ></div>
      
      {/* Content */}
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300 overflow-hidden">
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{title}</h3>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
                {children}
            </div>

            {footer && (
                <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-end gap-3">
                    {footer}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
