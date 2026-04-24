'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/authSlice';
import { useRouter } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', icon: 'dashboard', href: '/dashboard' },
  { label: 'Jobs', icon: 'work', href: '/jobs' },
  { label: 'Candidates', icon: 'group', href: '/candidates' },
  { label: 'Shortlisted', icon: 'workspace_premium', href: '/shortlisted' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname?.startsWith(href);
  };

  const initials =
    (user?.name || user?.email || 'U')
      .split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';

  const handleLogout = () => {
    dispatch(logout());
    router.replace('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-52 z-[60] flex flex-col glass-panel rounded-none border-r border-slate-200/60">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-slate-100/60 flex h-[72px] items-center">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <img src="/logo.jpg" alt="Umurava Logo" className="h-10 w-10 rounded-lg object-contain" />
          <div className="min-w-0">
            <h1 className="text-[12px] font-extrabold text-slate-900 leading-tight tracking-tight truncate">
              Umurava Lens
            </h1>
            <p className="text-[7px] uppercase tracking-[0.22em] text-indigo-600/80 font-bold mt-0.5">
              AI Talent Intelligence
            </p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 pt-3 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative group flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold text-[12.5px] transition-colors ${
                active ? 'text-indigo-700' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 bg-white rounded-lg shadow-[0_1px_2px_rgba(15,23,42,0.06),0_6px_16px_-8px_rgba(70,72,212,0.18)] border border-slate-100"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2.5">
                <span
                  className={`material-symbols-outlined text-[16px] transition-colors ${
                    active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-700'
                  }`}
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Profile */}
      <div className="p-2 border-t border-slate-100/60">
        <div className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/60 transition-colors group">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/40 to-fuchsia-400/40 blur-md rounded-full" />
            <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center text-[9px] font-bold shadow-md">
              {initials}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-slate-900 truncate leading-tight">
              {user?.name || 'Recruiter'}
            </p>
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold truncate">
              {user?.role || 'Member'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="w-7 h-7 rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
