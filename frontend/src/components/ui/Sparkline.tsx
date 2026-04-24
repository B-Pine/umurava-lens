'use client';

import { motion } from 'motion/react';

interface Props {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
}

/** Compact 0-dep SVG sparkline with area fill + animated stroke draw. */
export default function Sparkline({
  values,
  width = 240,
  height = 56,
  stroke = '#4648d4',
  fill = 'rgba(70, 72, 212, 0.12)',
  strokeWidth = 1.75,
}: Props) {
  if (values.length === 0) return <svg width={width} height={height} />;

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const toPoint = (v: number, i: number) => {
    const x = (i / Math.max(values.length - 1, 1)) * (width - 2) + 1;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y] as const;
  };
  const pts = values.map(toPoint);
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0]},${height} L${pts[0][0]},${height} Z`;

  const lastIdx = values.length - 1;
  const [lastX, lastY] = pts[lastIdx];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <motion.path
        d={area}
        fill={fill}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.circle
        cx={lastX}
        cy={lastY}
        r={3}
        fill={stroke}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.35, delay: 0.85, type: 'spring' }}
      />
      <motion.circle
        cx={lastX}
        cy={lastY}
        r={6}
        fill={stroke}
        fillOpacity={0.25}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.85 }}
      />
    </svg>
  );
}
