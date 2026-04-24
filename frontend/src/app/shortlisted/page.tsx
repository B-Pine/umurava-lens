'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchShortlisted, sendOutreachBatch } from '../../store/screeningSlice';

export default function ShortlistedPage() {
  const dispatch = useAppDispatch();
  const { shortlisted } = useAppSelector((s) => s.screening);
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [bulkSending, setBulkSending] = useState(false);

  useEffect(() => {
    (async () => {
      await dispatch(fetchShortlisted());
      setLoading(false);
    })();
  }, [dispatch]);

  const jobs = useMemo(() => {
    const map = new Map<string, { _id: string; title: string }>();
    for (const r of shortlisted) {
      const j = (r as any).jobId;
      if (j && j._id && !map.has(j._id)) {
        map.set(j._id, { _id: j._id, title: j.title });
      }
    }
    return Array.from(map.values());
  }, [shortlisted]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return shortlisted.filter((r) => {
      const c = r.candidateId as any;
      const j = (r as any).jobId;
      if (jobFilter !== 'all' && j?._id !== jobFilter) return false;
      if (!q) return true;
      const name = `${c?.firstName || ''} ${c?.lastName || ''}`.toLowerCase();
      const headline = (c?.headline || '').toLowerCase();
      const title = (j?.title || '').toLowerCase();
      const email = (c?.email || '').toLowerCase();
      return name.includes(q) || headline.includes(q) || title.includes(q) || email.includes(q);
    });
  }, [shortlisted, jobFilter, searchQuery]);

  const unsent = filtered.filter((r) => r.emailStatus !== 'sent');

  const handleBulkSend = async () => {
    if (unsent.length === 0) return;
    const confirmed = window.confirm(`Send outreach emails to ${unsent.length} shortlisted candidates?`);
    if (!confirmed) return;
    setBulkSending(true);
    try {
      await dispatch(sendOutreachBatch(unsent.map((r) => r._id))).unwrap();
      await dispatch(fetchShortlisted());
    } catch {
      // handled in slice
    } finally {
      setBulkSending(false);
    }
  };

  const recStyle = (rec: string) =>
    rec === 'hire'
      ? 'bg-emerald-50 text-emerald-700'
      : rec === 'consider'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-rose-50 text-rose-700';

  const scoreColor = (score: number) =>
    score >= 85 ? 'text-emerald-600' : score >= 70 ? 'text-amber-600' : 'text-rose-600';

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <nav className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-1.5">
            <Link href="/jobs" className="hover:text-slate-900 transition-colors">Jobs</Link>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span className="text-indigo-700">All Shortlisted</span>
          </nav>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-tight flex items-center gap-2">
            <span
              className="material-symbols-outlined text-indigo-600 text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              workspace_premium
            </span>
            Shortlisted Candidates
          </h1>
          <p className="text-[12px] text-slate-500 font-medium mt-0.5">
            <span className="tabular-nums font-bold text-indigo-600">{shortlisted.length}</span> candidates across{' '}
            <span className="tabular-nums font-bold">{jobs.length}</span> roles
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unsent.length > 0 && (
            <button
              onClick={handleBulkSend}
              disabled={bulkSending}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-gradient-to-b from-emerald-500 to-emerald-600 text-white text-[11px] font-semibold shadow-[0_4px_12px_-4px_rgba(16,185,129,0.5),inset_0_1px_0_0_rgba(255,255,255,0.22)] disabled:opacity-50 transition press"
            >
              <span className="material-symbols-outlined text-[14px]">forward_to_inbox</span>
              Email all ({unsent.length})
            </button>
          )}
        </div>
      </section>

      {/* FILTERS */}
      <section className="glass-panel rounded-xl p-2 flex flex-col md:flex-row gap-2">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">
            search
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, headline, or role..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 h-8 text-[12px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
          />
        </div>
        <select
          value={jobFilter}
          onChange={(e) => setJobFilter(e.target.value)}
          className="md:w-56 appearance-none bg-white border border-slate-200 rounded-lg px-3 h-8 text-[12px] font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
        >
          <option value="all">All roles</option>
          {jobs.map((j) => (
            <option key={j._id} value={j._id}>{j.title}</option>
          ))}
        </select>
      </section>

      {/* TABLE */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-white/60 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-xl p-12 text-center">
          <span className="material-symbols-outlined text-3xl text-slate-300 mb-3 block">auto_awesome</span>
          <h3 className="text-[14px] font-bold text-slate-800">
            {shortlisted.length === 0 ? 'No shortlisted candidates yet' : 'No candidates match your filters'}
          </h3>
          <p className="text-[12px] text-slate-500 mt-1 font-medium">
            {shortlisted.length === 0 ? 'Run a screening to populate the shortlist.' : 'Try clearing your search or filter.'}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="glass-panel rounded-xl overflow-hidden"
        >
          {/* Column header */}
          <div className="hidden md:grid grid-cols-[40px_1fr_1fr_80px_80px_80px_80px] items-center gap-3 px-3 py-2 border-b border-slate-100 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
            <span className="text-center">#</span>
            <span>Candidate</span>
            <span>Role</span>
            <span className="text-center">Score</span>
            <span className="text-center">Rank</span>
            <span className="text-center">Status</span>
            <span className="text-center">Email</span>
          </div>

          {filtered.map((r, idx) => {
            const c = r.candidateId as any;
            const j = (r as any).jobId;
            const name = `${c?.firstName || ''} ${c?.lastName || ''}`.trim() || 'Unknown';
            const initials = `${c?.firstName?.[0] || ''}${c?.lastName?.[0] || ''}`.toUpperCase() || '?';

            return (
              <Link
                key={r._id}
                href={`/jobs/${j?._id}/shortlist`}
                className="group grid grid-cols-1 md:grid-cols-[40px_1fr_1fr_80px_80px_80px_80px] items-center gap-3 px-3 py-2.5 border-b border-slate-100/60 hover:bg-white/60 transition-colors"
              >
                <span className="hidden md:block text-center text-[11px] font-extrabold text-slate-400 tabular-nums">
                  {idx + 1}
                </span>

                {/* Candidate */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                      {name}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate font-medium">
                      {c?.headline || c?.email || '-'}
                    </p>
                  </div>
                </div>

                {/* Role */}
                <div className="hidden md:block min-w-0">
                  <p className="text-[11px] font-semibold text-slate-700 truncate">{j?.title || '—'}</p>
                  <p className="text-[9px] text-slate-400 font-medium truncate">{j?.department || ''}</p>
                </div>

                {/* Score */}
                <div className="hidden md:flex justify-center">
                  <span className={`text-[15px] font-extrabold tabular-nums ${scoreColor(r.score)}`}>
                    {r.score}
                  </span>
                </div>

                {/* Rank */}
                <div className="hidden md:flex justify-center">
                  <span className="text-[11px] font-bold text-slate-600 tabular-nums">#{r.rank}</span>
                </div>

                {/* Recommendation */}
                <div className="hidden md:flex justify-center">
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${recStyle(r.recommendation)}`}>
                    {r.recommendation}
                  </span>
                </div>

                {/* Email status */}
                <div className="hidden md:flex justify-center">
                  {r.emailStatus === 'sent' ? (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                      Sent
                    </span>
                  ) : r.emailStatus === 'failed' ? (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                      <span className="material-symbols-outlined text-[10px]">error</span>
                      Failed
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pending</span>
                  )}
                </div>
              </Link>
            );
          })}

          {/* Footer */}
          <div className="px-3 py-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400">
              Showing {filtered.length} of {shortlisted.length} candidates
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Sorted by score
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
