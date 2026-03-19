import React, { useState, useRef, useEffect } from 'react';

const DraggableFAB = ({ onClick, children, tooltip }) => {
  // Use absolute bottom/right positioning
  const [position, setPosition] = useState({ right: 32, bottom: 32 }); 
  const [isDragging, setIsDragging] = useState(false);
  
  const dragRef = useRef({ 
    startX: 0, 
    startY: 0, 
    initialRight: 32, 
    initialBottom: 32, 
    didMove: false 
  });

  useEffect(() => {
    const saved = localStorage.getItem('fab_position_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure within bounds when loading
        const ww = window.innerWidth;
        const wh = window.innerHeight;
        const size = 48; // reduced size approximation
        const right = Math.max(16, Math.min(parsed.right, ww - size - 16));
        const bottom = Math.max(16, Math.min(parsed.bottom, wh - size - 16));
        setPosition({ right, bottom });
      } catch (e) {}
    }
  }, []);

  const handleStart = (e) => {
    // Only drag with left click or touch
    if (e.type === 'mousedown' && e.button !== 0) return;

    dragRef.current.didMove = false;
    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    
    dragRef.current.startX = clientX;
    dragRef.current.startY = clientY;
    dragRef.current.initialRight = position.right;
    dragRef.current.initialBottom = position.bottom;

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
  };

  const handleMove = (e) => {
    // Don't mark as moving for tiny jitters
    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    
    const deltaX = dragRef.current.startX - clientX;
    const deltaY = dragRef.current.startY - clientY;

    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      dragRef.current.didMove = true;
      setIsDragging(true);
      if (e.cancelable) e.preventDefault(); // prevent scroll on mobile
    }

    if (!dragRef.current.didMove) return;

    let newRight = dragRef.current.initialRight + deltaX;
    let newBottom = dragRef.current.initialBottom + deltaY;

    // Constrain to window bounds (size ~48px, min margin ~16px)
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    const size = 48; 
    
    newRight = Math.max(16, Math.min(newRight, ww - size - 16));
    newBottom = Math.max(16, Math.min(newBottom, wh - size - 16));

    setPosition({ right: newRight, bottom: newBottom });
  };

  const handleEnd = () => {
    window.removeEventListener('mousemove', handleMove);
    window.removeEventListener('mouseup', handleEnd);
    window.removeEventListener('touchmove', handleMove);
    window.removeEventListener('touchend', handleEnd);
    
    setTimeout(() => setIsDragging(false), 50);
  };

  // Save to local storage after drag ends
  useEffect(() => {
    if (!isDragging && dragRef.current.didMove) {
      localStorage.setItem('fab_position_v3', JSON.stringify(position));
    }
  }, [isDragging, position]);

  const handleClick = (e) => {
    if (dragRef.current.didMove) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (onClick) onClick(e);
  };

  return (
    <button 
      onMouseDown={handleStart}
      onTouchStart={handleStart}
      onClick={handleClick}
      style={{ 
        right: `${position.right}px`, 
        bottom: `${position.bottom}px`, 
        touchAction: 'none' // critical for mobile dragging without scrolling
      }}
      className={`fixed bg-amber-500/90 backdrop-blur-md text-white p-3 rounded-full shadow-lg shadow-amber-500/20 z-[999] group border border-amber-400/40 outline-none flex items-center justify-center
        ${isDragging 
          ? 'scale-90 cursor-grabbing bg-amber-600 opacity-90 transition-none' 
          : 'hover:scale-110 cursor-grab hover:-translate-y-0.5 transition-all duration-300'
        }`}
      title="Vaciado Mental (Manten presionado para mover)"
    >
      {children}
      
      {!isDragging && tooltip && (
        <span className="absolute right-full mr-3 bg-slate-900/90 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-slate-700/50 hidden md:block">
          {tooltip}
        </span>
      )}
    </button>
  );
};

export default DraggableFAB;
