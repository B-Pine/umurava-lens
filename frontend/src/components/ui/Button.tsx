'use client';

import { forwardRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
  style?: React.CSSProperties;
}

const base =
  'relative inline-flex items-center justify-center gap-2 font-semibold rounded-xl select-none transition-[background-color,color,border-color,box-shadow] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap';

const sizeCls: Record<Size, string> = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-base',
};

const variantCls: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-[0_8px_24px_-10px_rgba(70,72,212,0.6),inset_0_1px_0_0_rgba(255,255,255,0.22)] hover:from-indigo-400 hover:to-indigo-600',
  secondary:
    'bg-white text-slate-900 border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.18)] hover:border-slate-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_12px_32px_-12px_rgba(15,23,42,0.22)]',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100/70',
  outline:
    'bg-transparent text-slate-900 border border-slate-200 hover:bg-white hover:border-slate-300',
  danger:
    'bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-[0_8px_24px_-10px_rgba(244,63,94,0.55),inset_0_1px_0_0_rgba(255,255,255,0.22)] hover:from-rose-400 hover:to-rose-600',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    icon,
    iconRight,
    fullWidth,
    loading,
    className = '',
    children,
    disabled,
    ...props
  },
  ref
) {
  const reduce = useReducedMotion();

  const content = (
    <>
      {loading ? (
        <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
      ) : (
        icon
      )}
      <span>{children}</span>
      {!loading && iconRight}
    </>
  );

  return (
    <motion.button
      ref={ref}
      whileHover={reduce ? undefined : { y: -1, scale: 1.015 }}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      className={`${base} ${sizeCls[size]} ${variantCls[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...(props as any)}
    >
      {content}
    </motion.button>
  );
});

export default Button;
