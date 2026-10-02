// Adapted from React Bits "SplitText" (https://reactbits.dev, MIT + Commons
// Clause — see LICENSE-reactbits.md).
// Changes: plays on load (no ScrollTrigger: it's used above the fold),
// skipped entirely with reduced motion, keeps an accessible full-text label
// so screen readers don't read the split words one by one.
import { useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { SplitText as GSAPSplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(GSAPSplitText, useGSAP);

export default function SplitText({
  text,
  className = '',
  as: Tag = 'span',
  splitType = 'words',
  delay = 0,
  stagger = 0.06,
  duration = 0.9,
  ease = 'power3.out',
  from = { opacity: 0, yPercent: 60, filter: 'blur(6px)' },
}) {
  const ref = useRef(null);
  // Split only after web fonts load, or the measured words would be wrong.
  const [fontsLoaded, setFontsLoaded] = useState(() => document.fonts.status === 'loaded');

  useEffect(() => {
    if (!fontsLoaded) document.fonts.ready.then(() => setFontsLoaded(true));
  }, [fontsLoaded]);

  useGSAP(
    () => {
      if (!ref.current || !fontsLoaded) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const split = new GSAPSplitText(ref.current, { type: splitType, wordsClass: 'split-word', charsClass: 'split-char' });
      const targets = splitType === 'chars' ? split.chars : split.words;
      gsap.from(targets, { ...from, duration, ease, stagger, delay });
      return () => split.revert();
    },
    { dependencies: [text, fontsLoaded], scope: ref }
  );

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      <span aria-hidden="true">{text}</span>
    </Tag>
  );
}
