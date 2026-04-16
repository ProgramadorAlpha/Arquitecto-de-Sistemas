import { useState, useEffect, useRef } from 'react';

/**
 * Hook para animaciones de "count-up" dopaminérgicas.
 * El número anima desde 0 (o `from`) hasta `target` cuando `trigger` es true.
 *
 * @param {number} target - Valor final
 * @param {number} duration - Duración en ms (default 1200)
 * @param {number} from - Valor inicial (default 0)
 * @param {boolean} trigger - Iniciar animación cuando true (default true)
 * @param {boolean} decimals - Decimales a mostrar (default 0)
 */
export const useCountUp = (target, duration = 1200, { from = 0, trigger = true, decimals = 0 } = {}) => {
  const [value, setValue] = useState(from);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!trigger) {
      setValue(from);
      return;
    }

    const startTime = performance.now();
    const startValue = from;
    const endValue = target;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing: ease-out cubic para efecto "deceleración dopaminérgica"
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * eased;

      setValue(Number(current.toFixed(decimals)));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, from, trigger, decimals]);

  return value;
};

export default useCountUp;