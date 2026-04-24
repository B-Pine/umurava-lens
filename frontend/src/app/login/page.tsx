'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login } from '../../store/authSlice';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((s) => s.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      router.replace('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center mesh-bg w-full">
      <div className="flex w-full items-center justify-center p-6 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-4 mb-10">
            <img src="/logo.jpg" alt="Umurava Logo" className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover shadow-sm" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Umurava Lens</h1>
          </div>

          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Welcome back</h2>
          <p className="text-slate-500 font-medium mb-8">
            Sign in to the recruiter workspace.
          </p>

          {(error || localError) && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 bg-rose-50 border border-rose-100 text-rose-700 text-sm font-semibold px-4 py-3 rounded-xl flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">error</span>
              {localError || error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@umurava.africa"
                className="mt-1.5 w-full bg-white border border-slate-200 rounded-xl px-4 h-12 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="mt-1.5 w-full bg-white border border-slate-200 rounded-xl px-4 pr-12 h-12 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ y: -1, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              className="w-full h-12 mt-2 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 text-white font-semibold shadow-[0_10px_30px_-10px_rgba(70,72,212,0.55),inset_0_1px_0_0_rgba(255,255,255,0.22)] hover:from-indigo-400 hover:to-indigo-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                'Sign in'
              )}
            </motion.button>
          </form>

        </motion.div>
      </div>
    </div>
  );
}
