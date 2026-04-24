'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchJobs, deleteJob } from '../../store/jobsSlice';
import { runScreening } from '../../store/screeningSlice';

export default function JobsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { jobs, loading, total, page, totalPages } = useAppSelector((s) => s.jobs);
  const { screening } = useAppSelector((s) => s.screening);

  const [status, setStatus] = useState('');
  const [experience, setExperience] = useState('');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    dispatch(
      fetchJobs({
        status: status || undefined,
        experienceLevel: experience || undefined,
        page: 1,
        limit: 12,
        sort: sort === 'applicants' ? 'applicants' : undefined,
      }) as any
    );
  }, [dispatch, status, experience, sort]);

  const [activeScreeningId, setActiveScreeningId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openMenuId) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [openMenuId]);

  const handleRunScreening = async (jobId: string) => {
    const job = jobs.find((j) => j._id === jobId);
    setActiveScreeningId(jobId);
    dispatch(
      runScreening({
        jobId,
        jobTitle: job?.title || 'Job',
        candidateCount: job?.applicantCount || 0,
      })
    ).finally(() => setActiveScreeningId(null));
  };

  const handleDeleteJob = async (jobId: string, title: string) => {
    if (!confirm(`Delete job "${title}"?\n\nThis will remove its screening results and unassign its candidates. This cannot be undone.`)) return;
    try {
      await dispatch(deleteJob(jobId)).unwrap();
    } catch (err: any) {
      alert('Failed to delete job: ' + (err?.message || 'Unknown error'));
    }
  };

  const statusStyles: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700',
    draft: 'bg-slate-100 text-slate-600',
    closed: 'bg-rose-50 text-rose-700',
  };

  const hasFilters = status || experience || sort !== 'newest';
  const clearFilters = () => {
    setStatus('');
    setExperience('');
    setSort('newest');
  };

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-tight">Jobs</h1>
          <p className="text-[12px] text-slate-500 font-medium mt-0.5">
            <span className="tabular-nums">{total}</span>{' '}
            {total === 1 ? 'role' : 'roles'} in the system
          </p>
        </div>
        <Link
          href="/jobs/create"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 text-white text-[12px] font-semibold shadow-[0_6px_16px_-8px_rgba(70,72,212,0.6),inset_0_1px_0_0_rgba(255,255,255,0.22)] hover:from-indigo-400 hover:to-indigo-600 transition press"
        >
          <span className="material-symbols-outlined text-[14px]">add</span>
          Create role
        </Link>
      </section>

      {/* FILTERS */}
      <section className="glass-panel rounded-xl p-3">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-2 items-end">
          <div className="md:col-span-3">
            <label className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full mt-1 bg-white border border-slate-200/80 rounded-lg px-2.5 h-8 text-[12px] font-medium text-slate-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">Experience</label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full mt-1 bg-white border border-slate-200/80 rounded-lg px-2.5 h-8 text-[12px] font-medium text-slate-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            >
              <option value="">All levels</option>
              <option value="Junior">Junior</option>
              <option value="Mid-level">Mid-level</option>
              <option value="Senior">Senior</option>
              <option value="Director">Director</option>
              <option value="Executive">Executive</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">Sort</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full mt-1 bg-white border border-slate-200/80 rounded-lg px-2.5 h-8 text-[12px] font-medium text-slate-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            >
              <option value="newest">Newest first</option>
              <option value="applicants">Most candidates</option>
            </select>
          </div>
          {hasFilters && (
            <div className="md:col-span-3 flex md:justify-end items-center">
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
                Clear
              </button>
            </div>
          )}
        </div>
      </section>

      {/* GRID */}
      {loading && jobs.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-white/60 animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-panel rounded-xl p-10 text-center">
          <span className="material-symbols-outlined text-3xl text-slate-400/70 mb-2 block">work_off</span>
          <h3 className="text-[13px] font-bold text-slate-700">No jobs match your filters</h3>
          <p className="text-[11px] text-slate-500 mt-1">
            {hasFilters ? 'Try clearing the filters.' : 'Create your first role to start screening.'}
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
                href="/jobs/create"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 text-white text-[11px] font-semibold press"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                Create role
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          <AnimatePresence initial={false}>
            {jobs.map((job, idx) => {
              const progress =
                job.applicantCount > 0
                  ? Math.round((job.screenedCount / job.applicantCount) * 100)
                  : 0;
              const stCls = statusStyles[job.status] || statusStyles.draft;
              const isActiveScreening = screening && activeScreeningId === job._id;

              return (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.25), duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="relative glass-panel rounded-xl p-3 press group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <Link href={`/jobs/${job._id}`} className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${stCls}`}>
                          {job.status}
                        </span>
                        {job.experienceLevel && (
                          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                            · {job.experienceLevel}
                          </span>
                        )}
                      </div>
                      <h3 className="text-[13px] font-extrabold text-slate-900 leading-tight tracking-tight line-clamp-2 mb-0.5">
                        {job.title}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium truncate">
                        {job.location} · {job.employmentType}
                      </p>
                    </Link>
                    <div className="relative shrink-0" ref={openMenuId === job._id ? menuRef : null}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === job._id ? null : job._id);
                        }}
                        title="More actions"
                        className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">more_vert</span>
                      </button>
                      {openMenuId === job._id && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                          className="absolute top-full right-0 mt-1 w-40 bg-white rounded-lg overflow-hidden z-20 shadow-[0_8px_30px_-4px_rgba(15,23,42,0.15),0_2px_6px_-1px_rgba(15,23,42,0.08)] border border-slate-200/80"
                        >
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOpenMenuId(null);
                              handleRunScreening(job._id);
                            }}
                            disabled={screening || job.applicantCount === 0 || job.status !== 'active'}
                            className="w-full px-3 py-2 text-[11px] font-semibold flex items-center gap-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {isActiveScreening ? 'progress_activity' : 'auto_awesome'}
                            </span>
                            {isActiveScreening ? 'Running…' : 'Run screening'}
                          </button>
                          <Link
                            href={`/jobs/${job._id}/shortlist`}
                            onClick={() => setOpenMenuId(null)}
                            className="w-full px-3 py-2 text-[11px] font-semibold flex items-center gap-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
                            View shortlist
                          </Link>
                          <Link
                            href={`/jobs/${job._id}/edit`}
                            onClick={() => setOpenMenuId(null)}
                            className="w-full px-3 py-2 text-[11px] font-semibold flex items-center gap-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                            Edit
                          </Link>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOpenMenuId(null);
                              handleDeleteJob(job._id, job.title);
                            }}
                            className="w-full px-3 py-2 text-[11px] font-semibold flex items-center gap-2 text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                            Delete
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Stats strip */}
                  <Link href={`/jobs/${job._id}`} className="block mt-2">
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100/80">
                      <div>
                        <p className="text-[13px] font-extrabold text-slate-900 tabular-nums leading-none">
                          {job.applicantCount}
                        </p>
                        <p className="text-[8px] uppercase tracking-widest font-bold text-slate-400 mt-0.5">applied</p>
                      </div>
                      <div>
                        <p className="text-[13px] font-extrabold text-slate-900 tabular-nums leading-none">
                          {job.screenedCount}
                        </p>
                        <p className="text-[8px] uppercase tracking-widest font-bold text-slate-400 mt-0.5">screened</p>
                      </div>
                      <div>
                        <p className="text-[13px] font-extrabold text-emerald-600 tabular-nums leading-none">
                          {job.shortlistedCount}
                        </p>
                        <p className="text-[8px] uppercase tracking-widest font-bold text-slate-400 mt-0.5">shortlist</p>
                      </div>
                    </div>

                    {/* Action row */}
                    <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100/80">
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRunScreening(job._id); }}
                        disabled={screening || job.applicantCount === 0 || job.status !== 'active'}
                        title={job.applicantCount === 0 ? 'Upload candidates first' : 'Run AI screening'}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 h-7 rounded-md bg-white border border-slate-200 text-[10.5px] font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {isActiveScreening ? 'progress_activity' : 'auto_awesome'}
                        </span>
                        {isActiveScreening ? 'Running' : 'Screen'}
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/jobs/${job._id}/shortlist`; }}
                        className="group/btn relative inline-flex items-center justify-center h-7 px-1.5 rounded-md bg-slate-900 text-white text-[10.5px] font-semibold hover:bg-slate-800 transition-all duration-300 ease-out"
                      >
                        <span className="material-symbols-outlined text-[14px] z-10 relative">arrow_forward</span>
                        <span className="overflow-hidden max-w-0 opacity-0 group-hover/btn:max-w-[40px] group-hover/btn:opacity-100 group-hover/btn:ml-1 -translate-x-3 group-hover/btn:translate-x-0 transition-all duration-300 ease-out whitespace-nowrap">
                          Open
                        </span>
                      </button>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200/60">
          <p className="text-[11px] text-slate-500 font-medium">
            Showing <span className="tabular-nums">{(page - 1) * 12 + 1}-{Math.min(page * 12, total)}</span> of{' '}
            <span className="tabular-nums">{total}</span>
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => dispatch(fetchJobs({ page: page - 1, limit: 12 }) as any)}
              disabled={page <= 1}
              className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-white transition-colors disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[14px]">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((p) => (
              <button
                key={p}
                onClick={() => dispatch(fetchJobs({ page: p, limit: 12 }) as any)}
                className={`w-7 h-7 flex items-center justify-center rounded-md text-[11px] font-bold transition-colors ${
                  p === page
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200 text-slate-600 hover:bg-white'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => dispatch(fetchJobs({ page: page + 1, limit: 12 }) as any)}
              disabled={page >= totalPages}
              className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-white transition-colors disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
