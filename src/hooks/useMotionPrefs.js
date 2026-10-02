import { useEffect, useState } from 'react';

function useMedia(query) {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** True when the visitor asked the OS for reduced motion. */
export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)');

/** True on mouse/trackpad devices — hover-driven effects only make sense there. */
export const useFinePointer = () => useMedia('(hover: hover) and (pointer: fine)');
