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
    <div className="min-h-screen grid lg:grid-cols-2 mesh-bg">
      {/* Left — poetic brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 text-white p-12 relative overflow-hidden">
        <div className="absolute -top-40 -left-24 w-[420px] h-[420px] rounded-full bg-indigo-400/30 blur-[120px] aurora-slow" />
        <div className="absolute -bottom-32 -right-20 w-[480px] h-[480px] rounded-full bg-fuchsia-500/25 blur-[140px] aurora-slow" style={{ animationDelay: '-6s' }} />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-sky-400/15 blur-[100px] aurora-slow" style={{ animationDelay: '-12s' }} />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="flex items-center gap-3 mb-14">
            <div className="relative">
              <div className="absolute inset-0 bg-white/40 blur-xl rounded-full" />
              <div className="relative w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xl border border-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  visibility
                </span>
              </div>
            </div>
            <div>
              <h1 className="text-lg font-extrabold leading-tight tracking-tight">Umurava Lens</h1>
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/60 font-bold">
                AI Talent Intelligence
              </p>
            </div>
          </div>

          <h2 className="text-5xl xl:text-6xl font-extrabold leading-[1.02] tracking-tight">
            Screen smarter.<br />
            Hire with context.
          </h2>
          <p className="text-white/75 font-medium text-lg max-w-md mt-6 leading-relaxed">
            Evaluate an entire candidate pool in one pass, see why each person matches,
            and let your team make the call.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative space-y-4 text-white/85 text-sm font-medium"
        >
          {[
            'Evaluate dozens of applicants in one pass',
            'Explainable strengths and gaps per candidate',
            'Review every outreach before it sends',
          ].map((line, i) => (
            <motion.div
              key={line}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.35 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-white/70 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
              {line}
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                visibility
              </span>
            </div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Umurava Lens</h1>
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

          <div className="mt-10 p-4 bg-slate-100/70 backdrop-blur border border-slate-200/70 rounded-xl text-xs text-slate-500 font-medium leading-relaxed">
            <p className="font-bold text-slate-700 mb-1">Demo credentials</p>
            The seeded admin account is{' '}
            <span className="font-mono text-slate-700">admin@umurava.africa</span>. The password is
            defined by the <span className="font-mono">SEED_ADMIN_PASSWORD</span> env var (default{' '}
            <span className="font-mono text-slate-700">umurava-admin-2026</span>).
          </div>
        </motion.div>
      </div>
    </div>
  );
}
