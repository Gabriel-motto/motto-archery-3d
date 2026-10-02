// Adapted from React Bits "TiltedCard" (https://reactbits.dev, MIT + Commons
// Clause — see LICENSE-reactbits.md).
// Changes: springs driven by GSAP quickTo instead of motion/react (GSAP is
// already on the page — saves ~48 KB gzip), responsive <img>, tilt only on
// fine pointers and never with reduced motion, no tooltip/mobile warning,
// overlay slot for the "Diseño propio" badge.
import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { useFinePointer, useReducedMotion } from '../../hooks/useMotionPrefs.js';
import './TiltedCard.css';

export default function TiltedCard({
  src,
  srcSet,
  sizes,
  alt,
  fetchPriority,
  className = '',
  scaleOnHover = 1.04,
  rotateAmplitude = 8,
  overlay = null,
}) {
  const ref = useRef(null);
  const innerRef = useRef(null);
  const quick = useRef(null);
  const finePointer = useFinePointer();
  const reducedMotion = useReducedMotion();
  const enabled = finePointer && !reducedMotion;

  useGSAP(() => {
    const opts = { duration: 0.6, ease: 'power3.out' };
    quick.current = {
      rx: gsap.quickTo(innerRef.current, 'rotationX', opts),
      ry: gsap.quickTo(innerRef.current, 'rotationY', opts),
      s: gsap.quickTo(innerRef.current, 'scale', opts),
    };
  }, { scope: ref });

  function handleMouse(e) {
    if (!enabled || !quick.current) return;
    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;
    quick.current.rx((offsetY / (rect.height / 2)) * -rotateAmplitude);
    quick.current.ry((offsetX / (rect.width / 2)) * rotateAmplitude);
  }

  function handleEnter() {
    if (enabled) quick.current?.s(scaleOnHover);
  }

  function handleLeave() {
    if (!quick.current) return;
    quick.current.s(1);
    quick.current.rx(0);
    quick.current.ry(0);
  }

  return (
    <figure
      ref={ref}
      className={`tilted-card ${className}`}
      onMouseMove={handleMouse}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <div ref={innerRef} className="tilted-card__inner">
        <img className="tilted-card__img" src={src} srcSet={srcSet} sizes={sizes} alt={alt} fetchPriority={fetchPriority} />
        {overlay && <div className="tilted-card__overlay">{overlay}</div>}
      </div>
    </figure>
  );
}
