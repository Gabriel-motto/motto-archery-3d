// Adapted from React Bits "Magnet" (https://reactbits.dev, MIT + Commons
// Clause — see LICENSE-reactbits.md).
// Changes: off on touch devices and with reduced motion, inline-flex
// wrapper so it doesn't change the button's layout.
import { useEffect, useRef, useState } from 'react';
import { useFinePointer, useReducedMotion } from '../../hooks/useMotionPrefs.js';

export default function Magnet({ children, padding = 60, magnetStrength = 4, className = '' }) {
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef(null);
  const finePointer = useFinePointer();
  const reducedMotion = useReducedMotion();
  const enabled = finePointer && !reducedMotion;

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e) => {
      if (!ref.current) return;
      const { left, top, width, height } = ref.current.getBoundingClientRect();
      const cx = left + width / 2;
      const cy = top + height / 2;
      if (Math.abs(cx - e.clientX) < width / 2 + padding && Math.abs(cy - e.clientY) < height / 2 + padding) {
        setActive(true);
        setPos({ x: (e.clientX - cx) / magnetStrength, y: (e.clientY - cy) / magnetStrength });
      } else {
        setActive(false);
        setPos({ x: 0, y: 0 });
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [enabled, padding, magnetStrength]);

  const offset = enabled ? pos : { x: 0, y: 0 };

  return (
    <span ref={ref} className={className} style={{ position: 'relative', display: 'inline-flex' }}>
      <span
        style={{
          display: 'inline-flex',
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
          transition: active ? 'transform 0.3s ease-out' : 'transform 0.5s ease-in-out',
        }}
      >
        {children}
      </span>
    </span>
  );
}
