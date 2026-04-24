'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

export interface Origin {
  x: number;
  y: number;
}

interface Ctx {
  origin: Origin;
  nonce: number; // bumps on each nav to retrigger enter animation even for same pathname
  bump: (o?: Origin) => void;
}

const NavigationOriginContext = createContext<Ctx>({
  origin: { x: 0, y: 0 },
  nonce: 0,
  bump: () => {},
});

export function useNavigationOrigin() {
  return useContext(NavigationOriginContext);
}

/**
 * Tracks where the last interactive click/keypress happened so the next
 * route transition can "unfold" from that point. Captured globally via a
 * pointerdown listener + programmatic `bump()` for keyboard navigation.
 */
export default function NavigationOriginProvider({ children }: { children: React.ReactNode }) {
  const originRef = useRef<Origin>({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
  });
  const [state, setState] = useState<{ origin: Origin; nonce: number }>(() => ({
    origin: originRef.current,
    nonce: 0,
  }));

  // Any click updates the origin ref — it becomes the source of the NEXT transition.
  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      // Ignore events on non-interactive surfaces (body drag, etc.) only if far from
      // a nav-triggering element. Cheap check: store them all.
      originRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('pointerdown', onPointer, { capture: true });
    return () => window.removeEventListener('pointerdown', onPointer, { capture: true } as any);
  }, []);

  const bump = useCallback((o?: Origin) => {
    const origin = o || originRef.current;
    setState((prev) => ({ origin, nonce: prev.nonce + 1 }));
  }, []);

  // Bump on every pathname change — done by the PageTransition consumer.
  return (
    <NavigationOriginContext.Provider value={{ origin: state.origin, nonce: state.nonce, bump }}>
      {children}
    </NavigationOriginContext.Provider>
  );
}
