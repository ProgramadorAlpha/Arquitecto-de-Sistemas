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
  }, []);

  return (
    <div className="relative mb-8 max-w-4xl mx-auto px-4">
      {/* Scroll Indicators */}
      <div className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${showLeftScroll ? 'opacity-100' : 'opacity-0'}`} />
      
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex gap-2 overflow-x-auto pb-3 no-scrollbar scroll-smooth whitespace-nowrap"
      >
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'primary' : 'secondary'}
            onClick={() => onTabChange(tab.id)}
            icon={tab.icon}
          >
            {tab.label}
          </Button>
        ))}

        {isMaster && (
          <Button
            variant={activeTab === 'admin' ? 'danger' : 'outline'}
            onClick={() => onTabChange('admin')}
            icon={ShieldAlert}
            className="border-red-500/30 bg-red-500/10 text-red-400"
          >
            MASTER
          </Button>
        )}
      </div>

      <div className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${showRightScroll ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
};

export default TabNavigation;
