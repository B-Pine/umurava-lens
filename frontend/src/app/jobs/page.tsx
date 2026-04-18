'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchJobs, deleteJob } from '../../store/jobsSlice';
import { runScreening } from '../../store/screeningSlice';
import FilterBar from '../../components/ui/FilterBar';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';

export default function JobsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { jobs, loading, total, page, totalPages } = useAppSelector((s) => s.jobs);
  const { screening } = useAppSelector((s) => s.screening);

  const [status, setStatus] = useState('');
  const [experience, setExperience] = useState('');
  const [sort, setSort] = useState('newest');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('jobsView') : null;
    if (stored === 'grid' || stored === 'list') setView(stored);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('jobsView', view);
  }, [view]);

  useEffect(() => {
    dispatch(fetchJobs({ status: status || undefined, page: 1, limit: 10, sort: sort === 'applicants' ? 'applicants' : undefined }));
  }, [dispatch, status, sort]);

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
    setActiveScreeningId(jobId);
    await dispatch(runScreening(jobId));
    setActiveScreeningId(null);
    router.push(`/jobs/${jobId}/shortlist`);
  };

  const handleDeleteJob = async (jobId: string, title: string) => {
    if (!confirm(`Delete job "${title}"?\n\nThis will remove its screening results and unassign its candidates. This cannot be undone.`)) return;
    try {
      await dispatch(deleteJob(jobId)).unwrap();
    } catch (err: any) {
      alert('Failed to delete job: ' + (err?.message || 'Unknown error'));
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-primary-fixed">Jobs</h2>
          <p className="text-on-surface-variant mt-1">Manage and track all job postings</p>
        </div>
        <Link
          href="/jobs/create"
          className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-md font-semibold text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          <span>Create Job</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={[
          {
            label: 'Status',
            value: status,
            onChange: setStatus,
            options: [
              { value: '', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'draft', label: 'Draft' },
              { value: 'closed', label: 'Closed' },
            ],
          },
          {
            label: 'Experience',
            value: experience,
            onChange: setExperience,
            options: [
              { value: '', label: 'All Levels' },
              { value: 'Junior', label: 'Junior' },
              { value: 'Mid-level', label: 'Mid-level' },
              { value: 'Senior', label: 'Senior' },
              { value: 'Director', label: 'Director' },
            ],
          },
        ]}
        sortValue={sort}
        sortOptions={[
          { value: 'newest', label: 'Newest First' },
          { value: 'applicants', label: 'Most candidates' },
        ]}
        onSortChange={setSort}
      />

      {/* View toggle */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex bg-surface-container-low rounded-lg p-1">
          <button
            onClick={() => setView('grid')}
            title="Grid view"
            className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors ${view === 'grid' ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-lg">grid_view</span>
          </button>
          <button
            onClick={() => setView('list')}
            title="List view"
            className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors ${view === 'list' ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-lg">view_list</span>
          </button>
        </div>
      </div>

      {/* Job Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon="work_off"
          title="No Jobs Found"
          description="Create your first job posting to start finding top talent."
          action={{ label: 'Create Job', onClick: () => router.push('/jobs/create') }}
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {jobs.map((job) => {
            const statusColor =
              job.status === 'active' ? 'bg-secondary text-white' :
              job.status === 'draft' ? 'bg-surface-container-highest text-on-surface-variant' :
              'bg-error text-white';
            const stopNav = (e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
            };
            return (
              <Link
                key={job._id}
                href={`/jobs/${job._id}`}
                className="group bg-surface-container-lowest p-4 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] transition-all flex flex-col items-center text-center"
              >
                {/* File icon with status flag */}
                <div className="relative mb-3">
                  <div className="w-28 h-32 rounded-md bg-linear-to-br from-primary-fixed to-secondary-fixed flex items-center justify-center group-hover:scale-[1.03] transition-transform">
                    <span className="material-symbols-outlined text-7xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      description
                    </span>
                  </div>
                  <span className={`absolute -top-1 -right-1.5 px-1.5 py-0.5 text-[9px] font-extrabold rounded uppercase tracking-wide shadow ${statusColor}`}>
                    {job.status}
                  </span>
                </div>

                {/* Title + inline three-dots */}
                <div className="w-full flex items-start justify-between gap-1">
                  <h3 className="flex-1 text-sm font-bold text-on-surface line-clamp-2 leading-tight text-left">
                    {job.title}
                  </h3>
                  <div className="relative shrink-0" ref={openMenuId === job._id ? menuRef : null}>
                    <button
                      onClick={(e) => {
                        stopNav(e);
                        setOpenMenuId(openMenuId === job._id ? null : job._id);
                      }}
                      title="More actions"
                      className="w-6 h-6 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">more_vert</span>
                    </button>
                    {openMenuId === job._id && (
                      <div
                        onClick={stopNav}
                        className="absolute top-full right-0 mt-1 w-36 bg-surface rounded-lg shadow-lg border border-outline-variant/20 z-10 overflow-hidden text-left"
                      >
                        <button
                          onClick={(e) => {
                            stopNav(e);
                            setOpenMenuId(null);
                            handleRunScreening(job._id);
                          }}
                          disabled={screening || job.applicantCount === 0 || job.status !== 'active'}
                          className="w-full px-3 py-2 text-xs font-semibold flex items-center gap-2 text-on-surface hover:bg-secondary/10 hover:text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <span className="material-symbols-outlined text-sm">
                            {screening && activeScreeningId === job._id ? 'progress_activity' : 'auto_awesome'}
                          </span>
                          {screening && activeScreeningId === job._id ? 'Running...' : 'Run Screening'}
                        </button>
                        <button
                          onClick={(e) => {
                            stopNav(e);
                            setOpenMenuId(null);
                            handleDeleteJob(job._id, job.title);
                          }}
                          className="w-full px-3 py-2 text-xs font-semibold flex items-center gap-2 text-on-surface hover:bg-error/10 hover:text-error transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const statusColor =
              job.status === 'active' ? 'bg-secondary text-white' :
              job.status === 'draft' ? 'bg-surface-container-highest text-on-surface-variant' :
              'bg-error text-white';
            return (
              <div
                key={job._id}
                className="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-4 hover:shadow-md transition-all"
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-14 rounded-md bg-linear-to-br from-primary-fixed to-secondary-fixed flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      description
                    </span>
                  </div>
                  <span className={`absolute -top-1 -right-1 px-1.5 py-px text-[8px] font-extrabold rounded uppercase tracking-wide shadow ${statusColor}`}>
                    {job.status}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-on-surface truncate">{job.title}</h4>
                  <p className="text-xs text-on-surface-variant truncate">
                    {(job.description || 'No description').split(/\n/)[0]}
                  </p>
                  <div className="flex gap-4 mt-1 text-[10px] font-semibold text-on-surface-variant">
                    <span>{job.applicantCount} applied</span>
                    <span>{job.screenedCount} screened</span>
                    <span>{job.shortlistedCount} shortlisted</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Link
                    href={`/jobs/${job._id}`}
                    title="View more"
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">visibility</span>
                  </Link>
                  <button
                    onClick={() => handleRunScreening(job._id)}
                    disabled={screening || job.applicantCount === 0 || job.status !== 'active'}
                    title={job.applicantCount === 0 ? 'Upload candidates first' : 'Run AI screening'}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-secondary/10 hover:text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {screening && activeScreeningId === job._id ? 'progress_activity' : 'auto_awesome'}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDeleteJob(job._id, job.title)}
                    title="Delete job"
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-between border-t border-surface-container-high pt-8">
          <p className="text-sm text-on-surface-variant font-medium">
            Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, total)} of {total} job postings
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => dispatch(fetchJobs({ page: page - 1 }))}
              disabled={page <= 1}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((p) => (
              <button
                key={p}
                onClick={() => dispatch(fetchJobs({ page: p }))}
                className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold ${
                  p === page ? 'bg-primary text-white' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                } transition-colors`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => dispatch(fetchJobs({ page: page + 1 }))}
              disabled={page >= totalPages}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
