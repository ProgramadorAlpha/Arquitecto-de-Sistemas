import React, { useRef, useEffect, useState } from 'react';
import { Activity, ClipboardList, Target, Box, Users, Settings, ShieldAlert } from 'lucide-react';
import Button from '../UI/Button';

const TabNavigation = ({ activeTab, onTabChange, isMaster }) => {
  const containerRef = useRef(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(true);

  const tabs = [
    { id: 'dashboard', label: 'Comando Central', icon: Activity },
    { id: 'weekly', label: 'Plan Semanal', icon: ClipboardList },
    { id: 'monthly', label: 'Visión Mensual', icon: Target },
    { id: 'systems', label: 'Mis Sistemas', icon: Box },
    { id: 'network', label: 'Tribu & Apoyo', icon: Users },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setShowLeftScroll(scrollLeft > 0);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    handleScroll();
    
    // Efecto de auto-scroll para centrar y visibilizar la pestaña activa
    if (containerRef.current) {
      const activeElement = containerRef.current.querySelector('[data-active="true"]');
      if (activeElement) {
        const container = containerRef.current;
        // Calcular la posición para centrar el elemento en el contenedor visible
        const scrollPosition = activeElement.offsetLeft - (container.clientWidth / 2) + (activeElement.clientWidth / 2);
        
        container.scrollTo({
          left: scrollPosition,
          behavior: 'smooth'
        });
      }
    }
  }, [activeTab]);

  return (
    <div className="relative mb-8 max-w-4xl mx-auto w-full">
      {/* Scroll Indicators */}
      <div className={`absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-slate-50 dark:from-slate-950 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${showLeftScroll ? 'opacity-100' : 'opacity-0'}`} />
      
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar scroll-smooth whitespace-nowrap snap-x snap-mandatory"
      >
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'primary' : 'secondary'}
            onClick={() => onTabChange(tab.id)}
            icon={tab.icon}
            className="shrink-0 snap-start relative"
            data-active={activeTab === tab.id}
          >
            {tab.label}
          </Button>
        ))}

        {isMaster && (
          <Button
            variant={activeTab === 'admin' ? 'danger' : 'outline'}
            onClick={() => onTabChange('admin')}
            icon={ShieldAlert}
            className="border-red-500/30 bg-red-500/10 text-red-400 shrink-0 snap-start relative"
            data-active={activeTab === 'admin'}
          >
            MASTER
          </Button>
        )}
        {/* Spacer for right padding on mobile scroll */}
        <div className="w-4 shrink-0 sm:hidden"></div>
      </div>

      <div className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${showRightScroll ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
};

export default TabNavigation;
