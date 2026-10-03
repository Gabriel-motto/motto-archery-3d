import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { VARIANTS } from '../data.js';

const ORDER = VARIANTS.map((v) => v.id);

/** Segmented "En T / Con pinza" switch; the thumb slides under the active option. */
export default function VariantSwitch({ value, onChange, className = '' }) {
  const index = ORDER.indexOf(value);
  const onKey = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = ORDER[(index + (e.key === 'ArrowRight' ? 1 : ORDER.length - 1)) % ORDER.length];
    onChange(next);
    e.currentTarget.parentElement.querySelector(`[data-id="${next}"]`)?.focus();
  };
  return (
    <div className={`vswitch ${className}`} role="radiogroup" aria-label="Modelo" style={{ '--i': index, '--n': ORDER.length }}>
      <span className="vswitch__thumb" aria-hidden="true" />
      {VARIANTS.map((v) => (
        <button
          key={v.id}
          type="button"
          role="radio"
          data-id={v.id}
          aria-checked={v.id === value}
          tabIndex={v.id === value ? 0 : -1}
          className="vswitch__opt"
          onClick={() => onChange(v.id)}
          onKeyDown={onKey}
        >
          {v.name}
        </button>
      ))}
    </div>
  );
}

/**
 * Swaps a section's content when the model changes: the items slide out to
 * one side, the new ones slide in from the other. Going back reverses it, so
 * content returns from the side it left by. Returns the model to render.
 */
export function useSlideSwap(value, scope, selector) {
  const [shown, setShown] = useState(value);
  const latest = useRef(value);
  const dir = useRef(1);
  const swapped = useRef(false);
  latest.current = value;

  useEffect(() => {
    if (value === shown) return;
    dir.current = ORDER.indexOf(value) > ORDER.indexOf(shown) ? 1 : -1;
    const els = scope.current?.querySelectorAll(selector);
    if (!els?.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(value);
      return;
    }
    gsap.killTweensOf(els);
    gsap.to(els, {
      x: -dir.current * 90,
      opacity: 0,
      duration: 0.32,
      ease: 'power2.in',
      stagger: 0.04,
      onComplete: () => {
        if (latest.current === shown) {
          // switched back before the swap: the same items return the way they left
          gsap.to(els, { x: 0, opacity: 1, duration: 0.45, ease: 'power3.out', stagger: 0.04, clearProps: 'transform,opacity' });
          return;
        }
        swapped.current = true;
        setShown(latest.current);
      },
    });
  }, [value, shown, scope, selector]);

  useLayoutEffect(() => {
    if (!swapped.current) return;
    swapped.current = false;
    const els = scope.current?.querySelectorAll(selector);
    if (!els?.length) return;
    gsap.fromTo(
      els,
      { x: dir.current * 90, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.55, ease: 'power3.out', stagger: 0.05, clearProps: 'transform,opacity' }
    );
  }, [shown, scope, selector]);

  return shown;
}
