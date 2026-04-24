'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchCandidates,
  deleteCandidate,
  deleteCandidatesBulk,
} from '../../store/candidatesSlice';
import { fetchJobs } from '../../store/jobsSlice';

export default function CandidatesPage() {
  const dispatch = useAppDispatch();
  const { candidates, loading, total, page, totalPages } = useAppSelector((s) => s.candidates);
  const { jobs } = useAppSelector((s) => s.jobs);

  const [jobId, setJobId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const LIMIT = 50;

  useEffect(() => {
    dispatch(fetchJobs({ limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    const t = setTimeout(() => {
      dispatch(
        fetchCandidates({
          jobId: jobId || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          search: search || undefined,
          page: 1,
          limit: LIMIT,
        })
      );
      setSelected(new Set());
    }, 300);
    return () => clearTimeout(t);
  }, [dispatch, jobId, dateFrom, dateTo, search]);

  const goToPage = (p: number) => {
    dispatch(
      fetchCandidates({
        jobId: jobId || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: search || undefined,
        page: p,
        limit: LIMIT,
      })
    );
    setSelected(new Set());
  };

  const allSelected = useMemo(
    () => candidates.length > 0 && selected.size === candidates.length,
    [candidates, selected]
  );

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(candidates.map((c) => c._id)));
  };

  const handleDeleteOne = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await dispatch(deleteCandidate(id));
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} candidate${selected.size === 1 ? '' : 's'}? This cannot be undone.`)) return;
    await dispatch(deleteCandidatesBulk(Array.from(selected)));
    setSelected(new Set());
  };

  const clearFilters = () => {
    setJobId('');
    setDateFrom('');
    setDateTo('');
    setSearch('');
  };

  const hasFilters = jobId || dateFrom || dateTo || search;

  const jobsMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const j of jobs) m[j._id] = j.title;
    return m;
  }, [jobs]);

  const sourceStyles: Record<string, string> = {
    'Umurava Platform': 'bg-indigo-50 text-indigo-700',
    CSV: 'bg-amber-50 text-amber-700',
    PDF: 'bg-emerald-50 text-emerald-700',
    'Google Drive': 'bg-sky-50 text-sky-700',
    Manual: 'bg-slate-100 text-slate-700',
    Direct: 'bg-slate-100 text-slate-700',
  };
  const sourceLabel = (s: string) => (s === 'Umurava Platform' ? 'Umurava' : s);

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-tight">Candidates</h1>
          <p className="text-[12px] text-slate-500 font-medium mt-0.5">
            <span className="tabular-nums">{total}</span>{' '}
            {total === 1 ? 'candidate' : 'candidates'} across all roles
          </p>
        </div>
        <Link
          href="/candidates/upload"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 text-white text-[12px] font-semibold shadow-[0_6px_16px_-8px_rgba(70,72,212,0.6),inset_0_1px_0_0_rgba(255,255,255,0.22)] hover:from-indigo-400 hover:to-indigo-600 transition press"
        >
          <span className="material-symbols-outlined text-[14px]">upload_file</span>
          Upload
        </Link>
      </section>

      {/* FILTERS */}
      <section className="glass-panel rounded-xl p-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
          <div className="md:col-span-5">
            <label className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">Search</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[14px]">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, email, headline, skill…"
                className="w-full mt-1 bg-white border border-slate-200/80 rounded-lg pl-8 pr-3 h-8 text-[12px] placeholder:text-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
              />
            </div>
          </div>
          <div className="md:col-span-3">
            <label className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">Job</label>
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="w-full mt-1 bg-white border border-slate-200/80 rounded-lg px-2.5 h-8 text-[12px] font-medium text-slate-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            >
              <option value="">All jobs</option>
              <option value="unassigned">Unassigned</option>
              {jobs.map((j) => (
                <option key={j._id} value={j._id}>{j.title}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full mt-1 bg-white border border-slate-200/80 rounded-lg px-2.5 h-8 text-[12px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full mt-1 bg-white border border-slate-200/80 rounded-lg px-2.5 h-8 text-[12px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            />
          </div>
        </div>
        {hasFilters && (
          <div className="flex justify-end mt-2">
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
              Clear filters
            </button>
          </div>
        )}
      </section>

      {/* LIST */}
      {loading && candidates.length === 0 ? (
        <div className="space-y-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-white/60 animate-pulse" />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="glass-panel rounded-xl p-10 text-center">
          <span className="material-symbols-outlined text-3xl text-slate-400/70 mb-2 block">group_off</span>
          <h3 className="text-[13px] font-bold text-slate-700">
            {hasFilters ? 'No candidates match your filters' : 'No candidates yet'}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
            {hasFilters
              ? 'Try adjusting the filters or clearing them.'
              : 'Upload resumes, spreadsheets, or structured profiles to start building your talent pool.'}
          </p>
          <div className="mt-4">
            {hasFilters ? (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white border border-slate-200 text-slate-900 text-[11px] font-semibold hover:border-slate-300"
              >
                Clear filters
              </button>
            ) : (
              <Link
                href="/candidates/upload"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 text-white text-[11px] font-semibold press"
              >
                <span className="material-symbols-outlined text-[14px]">upload_file</span>
                Upload candidates
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-xl overflow-hidden">
          {/* Column header */}
          <div className="hidden md:grid grid-cols-[auto_auto_auto_minmax(0,1.6fr)_minmax(0,1.3fr)_minmax(0,1.6fr)_auto_auto] items-center gap-2 px-3 py-2 bg-white/60 border-b border-slate-100 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
            <span className="w-4 flex justify-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="accent-indigo-600 w-3.5 h-3.5 cursor-pointer"
              />
            </span>
            <span className="w-6 text-right">#</span>
            <span className="w-7" />
            <span>Candidate</span>
            <span>Role</span>
            <span>Skills</span>
            <span className="w-20 text-right">Source</span>
            <span className="w-16 text-right">Added</span>
          </div>

          <div className="divide-y divide-slate-100/80">
            <AnimatePresence initial={false}>
              {candidates.map((c, idx) => {
                const isSelected = selected.has(c._id);
                const name = `${c.firstName} ${c.lastName}`.trim() || c.email || 'Unknown';
                const initials = `${c.firstName?.[0] || ''}${c.lastName?.[0] || ''}`.toUpperCase() || '?';
                const job = c.jobId ? jobsMap[c.jobId] : null;
                const sourceCls = sourceStyles[c.source] || sourceStyles.Manual;

                return (
                  <motion.div
                    key={c._id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{
                      delay: Math.min(0.02 * idx, 0.25),
                      duration: 0.28,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={`group grid grid-cols-[auto_auto_auto_minmax(0,1.6fr)_minmax(0,1.3fr)_minmax(0,1.6fr)_auto_auto] items-center gap-2 px-3 py-2 hover:bg-white/70 transition-colors ${
                      isSelected ? 'bg-indigo-50/50' : ''
                    }`}
                  >
                    {/* Select */}
                    <label className="w-4 flex justify-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(c._id)}
                        className="accent-indigo-600 w-3.5 h-3.5 cursor-pointer"
                      />
                    </label>

                    {/* Row number */}
                    <span className="w-6 text-right text-[10px] font-bold text-slate-400 tabular-nums mr-6">
                      {(page - 1) * LIMIT + idx + 1}
                    </span>

                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/25 to-fuchsia-400/25 blur-md rounded-full" />
                      <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center text-[9px] font-bold shadow-sm">
                        {initials}
                      </div>
                    </div>

                    {/* Name + email */}
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-slate-900 truncate leading-tight">{name}</p>
                      <p className="text-[10px] text-slate-500 truncate font-medium">{c.email || '—'}</p>
                    </div>

                    {/* Role/headline */}
                    <div className="min-w-0">
                      {c.headline ? (
                        <p className="text-[11px] text-slate-700 font-semibold truncate">{c.headline}</p>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">No headline</p>
                      )}
                      {job && (
                        <p className="text-[9.5px] text-indigo-700 font-bold truncate uppercase tracking-wider mt-0.5">
                          {job}
                        </p>
                      )}
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1 min-w-0">
                      {(c.skills || []).slice(0, 3).map((s) => (
                        <span
                          key={s.name}
                          className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-slate-600 bg-slate-100/80 rounded-md px-1.5 py-0.5"
                        >
                          {s.name}
                        </span>
                      ))}
                      {(c.skills || []).length > 3 && (
                        <span className="text-[9.5px] font-semibold text-slate-400 self-center">
                          +{c.skills.length - 3}
                        </span>
                      )}
                      {(c.skills || []).length === 0 && (
                        <span className="text-[10px] text-slate-400 italic">No skills listed</span>
                      )}
                    </div>

                    {/* Source */}
                    <div className="w-20 text-right">
                      <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${sourceCls}`}>
                        {sourceLabel(c.source)}
                      </span>
                    </div>

                    {/* Added + delete */}
                    <div className="w-16 text-right flex items-center justify-end gap-1">
                      <p className="text-[10px] font-medium text-slate-400 tabular-nums">
                        {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                      <button
                        onClick={() => handleDeleteOne(c._id, name)}
                        title="Delete candidate"
                        className="w-6 h-6 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200/60">
          <p className="text-[11px] text-slate-500 font-medium">
            Showing <span className="tabular-nums">{(page - 1) * LIMIT + 1}-{Math.min(page * LIMIT, total)}</span> of{' '}
            <span className="tabular-nums">{total}</span>
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-white transition-colors disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[14px]">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => {
                if (totalPages <= 7) return true;
                if (p === 1 || p === totalPages) return true;
                if (Math.abs(p - page) <= 1) return true;
                return false;
              })
              .reduce<(number | 'dots')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('dots');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === 'dots' ? (
                  <span key={`dots-${i}`} className="w-7 h-7 flex items-center justify-center text-[11px] text-slate-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p as number)}
                    className={`w-7 h-7 flex items-center justify-center rounded-md text-[11px] font-bold transition-colors ${
                      p === page
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-white transition-colors disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}

      {/* FLOATING BULK ACTION BAR */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70]"
          >
            <div className="bg-white border border-slate-200/60 rounded-full px-3 py-2 flex items-center gap-3 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.25)]">
              <span className="text-[11px] font-bold text-slate-900 pl-2 pr-1">
                {selected.size} selected
              </span>
              <button
                onClick={() => setSelected(new Set())}
                className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 px-2"
              >
                Clear
              </button>
              <button
                onClick={handleDeleteSelected}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-gradient-to-b from-rose-500 to-rose-600 text-white text-[11px] font-semibold shadow-[0_6px_16px_-8px_rgba(244,63,94,0.5),inset_0_1px_0_0_rgba(255,255,255,0.22)] hover:from-rose-400 hover:to-rose-600 transition press"
              >
                <span className="material-symbols-outlined text-[14px]">delete</span>
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
