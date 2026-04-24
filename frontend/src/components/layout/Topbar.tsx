'use client';

import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';

const ROUTE_TITLES: Record<string, { label: string; description?: string }> = {
  '/dashboard': { label: 'Overview', description: 'Your recruiting command center' },
  '/jobs': { label: 'Jobs', description: 'Manage open roles and screening pipelines' },
  '/jobs/create': { label: 'New Role', description: 'Define the role to screen against' },
  '/candidates': { label: 'Candidates', description: 'Everyone in your talent pool' },
  '/candidates/upload': { label: 'Upload Candidates', description: 'Import resumes and profiles' },
  '/shortlisted': { label: 'Shortlisted', description: 'Top-N candidates across all roles' },
};

function matchTitle(pathname: string) {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  if (pathname.startsWith('/jobs/') && pathname.endsWith('/shortlist'))
    return { label: 'Shortlist', description: 'Ranked candidates for this role' };
  if (pathname.startsWith('/jobs/') && pathname.endsWith('/compare'))
    return { label: 'Compare', description: 'Side-by-side candidate analysis' };
  if (pathname.startsWith('/jobs/') && pathname.endsWith('/edit'))
    return { label: 'Edit Role', description: 'Tune job + AI weights' };
  if (pathname.startsWith('/jobs/')) return { label: 'Job Details', description: '' };
  return { label: '', description: '' };
}

export default function Topbar() {
  const pathname = usePathname() || '/';
  const { label, description } = matchTitle(pathname);

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-13rem)] z-50 h-12 glass-header border-b border-slate-200/60">
      <div className="h-full px-6 flex items-center justify-between gap-6">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="min-w-0 flex items-baseline gap-2"
        >
          {label && (
            <>
              <h2 className="text-[13px] font-extrabold text-slate-900 tracking-tight leading-tight">
                {label}
              </h2>
              {description && (
                <p className="text-[11px] text-slate-500 font-medium truncate hidden md:block">
                  · {description}
                </p>
              )}
            </>
          )}
        </motion.div>

        <div className="flex-1 max-w-sm">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[14px]">
              search
            </span>
            <input
              className="w-full pl-8 pr-14 h-8 bg-white/70 border border-slate-200/80 rounded-lg text-[12px] placeholder:text-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300/80 transition-all"
              placeholder="Search"
              type="text"
            />
            <span className="hidden md:inline-flex absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded tracking-wider">
              ⌘K
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className="w-8 h-8 rounded-lg text-slate-600 hover:bg-white/70 hover:text-indigo-600 transition-colors flex items-center justify-center border border-transparent hover:border-slate-200/60">
            <span className="material-symbols-outlined text-[16px]">notifications</span>
          </button>
        </div>
      </div>
    </header>
  );
}
