import React, { useState, Suspense, lazy } from 'react';
import { Brain, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import DraggableFAB from './DraggableFAB';

// Code-split: LyaHub carga pesada (camera, confetti, genai) se separa del bundle principal
const LyaHubDashboard = lazy(() => import('../LyaHub/LyaHubDashboard'));

const LyaHubLoader = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-3xl">
    <div className="flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-500 p-[2px] animate-spin-slow shadow-[0_0_30px_rgba(99,102,241,0.5)]">
        <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
        </div>
      </div>
      <p className="text-slate-400 text-sm font-medium tracking-wider uppercase animate-pulse">Cargando Lya AI Hub...</p>
    </div>
  </div>
);

const BrainDumpFAB = () => {
  const { user } = useAuth();
  const { data, actions } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <DraggableFAB
        onClick={() => setIsOpen(true)}
        tooltip="Lya AI Hub (Mantén presionado para mover)"
      >
        <Brain className="w-7 h-7" />
      </DraggableFAB>

      {isOpen && (
        <Suspense fallback={<LyaHubLoader />}>
          <LyaHubDashboard
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            user={user}
            actions={actions}
            data={data}
          />
        </Suspense>
      )}
    </>
  );
};

export default BrainDumpFAB;