'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-indigo-600 text-white p-12 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 w-[30rem] h-[30rem] rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-white/10 p-2 rounded-lg border border-white/20">
              <span className="material-symbols-outlined">visibility</span>
            </div>
            <div>
              <h1 className="text-xl font-extrabold leading-tight">Umurava Lens</h1>
              <p className="text-[10px] uppercase tracking-widest text-white/70 font-semibold">
                AI Talent Intelligence
              </p>
            </div>
          </div>

          <h2 className="text-5xl font-extrabold leading-[1.1] mb-6">
            Screen smarter.<br />
            Hire with context.
          </h2>
          <p className="text-white/80 font-medium text-lg max-w-md">
            Umurava Lens ranks candidates against your job criteria using Google Gemini — and always
            leaves the final hiring decision to you.
          </p>
        </div>

        <div className="relative space-y-4 text-white/90 text-sm font-medium">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-white/70">check_circle</span>
            Evaluate dozens of applicants in one pass
          </div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-white/70">check_circle</span>
            Explainable strengths and gaps per candidate
          </div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-white/70">check_circle</span>
            Recruiter-approved outreach emails, never auto-sent
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
              <span className="material-symbols-outlined">visibility</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">Umurava Lens</h1>
          </div>

          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Recruiter sign in</h2>
          <p className="text-slate-500 font-medium mb-8">
            Use your admin credentials to access the recruiter workspace.
          </p>

          {(error || localError) && (
            <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-700 text-sm font-semibold px-4 py-3 rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              {localError || error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@umurava.africa"
                className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-4 h-12 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-4 pr-12 h-12 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-colors disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-10 p-4 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium leading-relaxed">
            <p className="font-bold text-slate-700 mb-1">Demo credentials</p>
            The seeded admin account is <span className="font-mono">admin@umurava.africa</span>.
            The password is defined by the <span className="font-mono">SEED_ADMIN_PASSWORD</span>{' '}
            env var (default <span className="font-mono">umurava-admin-2026</span>).
          </div>
        </div>
      </div>
    </div>
  );
}
