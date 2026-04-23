'use client';

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { setSession, markBootstrapped } from './authSlice';
import type { AuthUser } from './authSlice';

function AuthBootstrap() {
  useEffect(() => {
    try {
      const token = localStorage.getItem('umurava_token');
      const userRaw = localStorage.getItem('umurava_user');
      if (token && userRaw) {
        const user = JSON.parse(userRaw) as AuthUser;
        store.dispatch(setSession({ token, user }));
      } else {
        store.dispatch(markBootstrapped());
      }
    } catch {
      store.dispatch(markBootstrapped());
    }
  }, []);
  return null;
}

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthBootstrap />
      {children}
    </Provider>
  );
}
