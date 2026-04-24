'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useNavigationOrigin } from './NavigationOrigin';

/**
 * Simple, fast page transition — a soft fade with a tiny scale lift.
 * No clip-paths, no multi-stage keyframes — just a smooth cross-dissolve
 * that feels light and responsive.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const { nonce, bump } = useNavigationOrigin();
  const reduce = useReducedMotion();
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      bump();
    }
  }, [pathname, bump]);

  if (reduce) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={`${pathname}:${nonce}`}
        initial={{ opacity: 0, y: 4, scale: 0.995 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
        }}
        exit={{
          opacity: 0,
          y: -2,
          scale: 0.998,
          transition: { duration: 0.14, ease: [0.4, 0, 0.2, 1] },
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
