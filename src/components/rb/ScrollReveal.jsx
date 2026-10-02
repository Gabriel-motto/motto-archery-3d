// Adapted from React Bits "ScrollReveal" (https://reactbits.dev, MIT + Commons
// Clause — see LICENSE-reactbits.md).
// Changes: no container rotation, words split once with plain spans, the
// whole thing skipped with reduced motion (text simply shows), screen readers
// get the sentence once instead of word by word.
import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function ScrollReveal({ children, as: Tag = 'p', className = '', baseOpacity = 0.14, blur = 4, start = 'top 82%', end = 'bottom 45%' }) {
  const ref = useRef(null);
  const words = children.split(/(\s+)/);

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const targets = ref.current.querySelectorAll('.sr-word');
      gsap.fromTo(
        targets,
        { opacity: baseOpacity, filter: `blur(${blur}px)` },
        {
          opacity: 1,
          filter: 'blur(0px)',
          ease: 'none',
          stagger: 0.05,
          scrollTrigger: { trigger: ref.current, start, end, scrub: true, invalidateOnRefresh: true },
        }
      );
    },
    { scope: ref }
  );

  return (
    <Tag ref={ref} className={className} aria-label={children}>
      <span aria-hidden="true">
        {words.map((w, i) => (/^\s+$/.test(w) ? w : <span key={i} className="sr-word">{w}</span>))}
      </span>
    </Tag>
  );
}
