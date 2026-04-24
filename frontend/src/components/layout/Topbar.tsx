'use client';

import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { markAllNotificationsRead, clearNotifications } from '../../store/uiSlice';

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

  const dispatch = useAppDispatch();
  const notifications = useAppSelector((s) => s.ui.notifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleBellClick() {
    setShowNotifs(!showNotifs);
    if (!showNotifs && unreadCount > 0) {
      dispatch(markAllNotificationsRead());
    }
  }

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

        <div className="flex items-center gap-1 relative" ref={notifRef}>
          <button
            onClick={handleBellClick}
            className={`relative w-8 h-8 rounded-lg transition-colors flex items-center justify-center border ${showNotifs ? 'bg-white shadow-[0_2px_8px_-2px_rgba(15,23,42,0.15)] border-transparent text-indigo-600' : 'text-slate-600 hover:bg-white/70 hover:text-indigo-600 border-transparent hover:border-slate-200/60'}`}
          >
            <span className="material-symbols-outlined text-[16px]">{unreadCount > 0 ? 'notifications_active' : 'notifications'}</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 border-2 border-[#fafafa]" />
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 top-[calc(100%+8px)] w-80 bg-white/95 backdrop-blur-xl border border-slate-200/80 overflow-hidden shadow-[0_20px_60px_-15px_rgba(15,23,42,0.3)] rounded-xl z-50 flex flex-col"
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                   <h3 className="text-[12px] font-bold text-slate-900">Notifications</h3>
                   <button
                     onClick={() => dispatch(clearNotifications())}
                     className="text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                   >
                     Clear all
                   </button>
                </div>
                
                <div className="max-h-[340px] overflow-y-auto w-full custom-scrollbar flex-col divide-y divide-slate-100/60">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 flex flex-col items-center justify-center text-center">
                       <span className="material-symbols-outlined text-[24px] text-slate-300 mb-2">notifications_off</span>
                       <p className="text-[11px] font-medium text-slate-400">No new notifications</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} className="p-3 hover:bg-slate-50/50 transition-colors flex items-start gap-2.5">
                        <div className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${notif.type === 'error' ? 'bg-rose-50 text-rose-500' : notif.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-indigo-50 text-indigo-500'}`}>
                           <span className="material-symbols-outlined text-[14px]">
                             {notif.type === 'error' ? 'error' : notif.type === 'success' ? 'check_circle' : 'info'}
                           </span>
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex items-start justify-between gap-1 mb-0.5">
                             <h4 className="text-[12px] font-bold text-slate-900 leading-tight">{notif.title}</h4>
                             <span className="text-[9px] font-semibold text-slate-400 tabular-nums shrink-0 mt-0.5">
                               {new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'short' }).format(
                                 Math.round((notif.timestamp - Date.now()) / 60000) || 0,
                                 'minute'
                               ).replace('0 min.', 'Now')}
                             </span>
                           </div>
                           <p className="text-[11px] font-medium text-slate-600 leading-snug">{notif.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
