// Adapted from React Bits "SpotlightCard" (https://reactbits.dev, MIT +
// Commons Clause — see LICENSE-reactbits.md).
// Changes: brand colours via CSS, renders any element (`as`), the spotlight
// also lights on keyboard focus inside the card.
import { useRef } from 'react';
import './SpotlightCard.css';

export default function SpotlightCard({ as: Tag = 'div', children, className = '', spotlightColor = 'rgba(225, 11, 11, 0.16)', ...rest }) {
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    ref.current.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  return (
    <Tag
      ref={ref}
      onMouseMove={handleMouseMove}
      className={`card-spotlight ${className}`}
      style={{ '--spotlight-color': spotlightColor }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
