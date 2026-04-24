'use client';

import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react';

interface Props {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
}

/** A counter that springs up to its target value and commas numbers. */
export default function AnimatedNumber({
  value,
  duration = 1.2,
  suffix = '',
  prefix = '',
  decimals = 0,
  className = '',
}: Props) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => {
    const n = decimals ? Number(v.toFixed(decimals)) : Math.round(v);
    return `${prefix}${Number.isNaN(n) ? 0 : n.toLocaleString()}${suffix}`;
  });

  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return controls.stop;
  }, [value, duration, reduce, mv]);

  return <motion.span className={className}>{rounded}</motion.span>;
}
