import React, { useState } from 'react';
import { Brain, Send, Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { getWeekId } from '../../utils/dateUtils';
import DraggableFAB from './DraggableFAB';
import Modal from './Modal';

const BrainDumpFAB = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!text.trim() || !user || isSaving) return;

    setIsSaving(true);
    try {
      const weekId = getWeekId(0);
      const docRef = doc(db, 'users', user.uid, 'weekly', weekId);
      const newEntry = {
        date: new Date().toISOString(),
        text: text.trim()
      };

      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          brain_dumps: arrayUnion(newEntry)
        });
      } else {
        await setDoc(docRef, {
          brain_dumps: [newEntry]
        });
      }

      setText('');
      setIsOpen(false);
    } catch (err) {
      console.error('Error guardando Vaciado Mental:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <DraggableFAB 
        onClick={() => setIsOpen(true)} 
        tooltip="Vaciado Mental (Manten presionado para mover)"
      >
        <Brain className="w-7 h-7" />
      </DraggableFAB>

      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        title="🧠 Vaciado Mental"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Libera tu mente. Todo lo que escribas aquí se enviará automáticamente a tu historial del Plan Semanal para clasificarlo después. No retengas la idea, libérala.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe tu idea, recordatorio o pensamiento aquí..."
            className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-4 ring-amber-500/20 text-slate-700 dark:text-white transition-all resize-none custom-scrollbar"
            autoFocus
          />
          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => setIsOpen(false)}
              className="px-5 py-2.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={!text.trim() || isSaving}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Registrar Idea
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default BrainDumpFAB;
