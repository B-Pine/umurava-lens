'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

/**
 * Figma-style pointer: a crisp SVG arrow with a white stroke and soft drop
 * shadow. Follows the real pointer 1:1 (no lag) so interactive targeting
 * stays precise, then scales up subtly over clickable elements to give the
 * recruiter the "I can click this" cue.
 *
 * Disabled automatically on coarse-pointer (touch) devices.
 */
export default function AppCursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [clicking, setClicking] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  // Tiny spring so the cursor has a touch of weight without lag.
  const sx = useSpring(x, { stiffness: 1400, damping: 60, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 1400, damping: 60, mass: 0.4 });

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setEnabled(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setEnabled(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!enabled) {
      document.documentElement.classList.add('no-custom-cursor');
      return;
    }
    document.documentElement.classList.remove('no-custom-cursor');

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const onDown = () => setClicking(true);
    const onUp = () => setClicking(false);

    const onOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      const interactive = el.closest(
        'a, button, [role="button"], input[type="checkbox"], input[type="radio"], select, label, [data-cursor="hover"]'
      );
      setHovering(Boolean(interactive));
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mouseover', onOver);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mouseover', onOver);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  // Spring under hover/press; scale the arrow itself.
  const scale = clicking ? 0.9 : hovering ? 1.15 : 1;

  return (
    <motion.div
      className="figma-cursor"
      style={{ x: sx, y: sy }}
      aria-hidden
    >
      <motion.div
        animate={{ scale }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{ transformOrigin: '3px 3px' }}
      >
        {/* Figma-style pointer — black fill, white stroke, soft drop shadow */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="cursorShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
              <feOffset dx="0" dy="1" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.35" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M3.5 2.2v13.9c0 .44.53.66.84.35l3.7-3.69a.5.5 0 0 1 .36-.15h5.32a.5.5 0 0 0 .35-.85L4.35 1.85a.5.5 0 0 0-.85.35Z"
            fill={hovering ? '#4648d4' : '#0f172a'}
            stroke="white"
            strokeWidth="1.4"
            strokeLinejoin="round"
            filter="url(#cursorShadow)"
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}
