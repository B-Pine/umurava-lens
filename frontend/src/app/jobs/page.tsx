'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchJobs } from '../../store/jobsSlice';
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

  useEffect(() => {
    dispatch(fetchJobs({ status: status || undefined, page: 1, limit: 10, sort: sort === 'applicants' ? 'applicants' : undefined }));
  }, [dispatch, status, sort]);

  const handleRunScreening = async (jobId: string) => {
    await dispatch(runScreening(jobId));
    router.push(`/jobs/${jobId}/shortlist`);
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <div
              key={job._id}
              className="bg-surface-container-lowest p-6 rounded-xl border-0 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all flex flex-col"
            >
              {/* Status badges */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wide ${
                    job.status === 'active' ? 'bg-secondary/10 text-secondary' :
                    job.status === 'draft' ? 'bg-surface-container-highest text-on-surface-variant' :
                    'bg-error-container/20 text-error'
                  }`}>
                    {job.status}
                  </span>
                  {job.screenedCount > 0 && (
                    <div className="flex items-center gap-1 bg-tertiary-fixed px-2 py-0.5 rounded text-[10px] font-bold text-on-tertiary-fixed">
                      <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                      <span>AI Screened</span>
                    </div>
                  )}
                </div>
                <button className="text-outline hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined">more_horiz</span>
                </button>
              </div>

              {/* Title and description */}
              <h3 className="text-xl font-bold mb-2">{job.title}</h3>
              <p className="text-sm text-on-surface-variant line-clamp-2 mb-4 leading-relaxed">{job.description}</p>

              {/* Skills */}
              <div className="flex flex-wrap gap-2 mb-6">
                {job.requiredSkills.slice(0, 3).map((skill) => (
                  <span key={skill} className="px-2.5 py-1 bg-surface-container text-on-surface-variant text-[11px] font-medium rounded">
                    {skill}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 py-4 mb-6 border-y border-surface-container-low">
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter mb-1">Applicants</p>
                  <p className="text-lg font-bold">{job.applicantCount}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter mb-1">Shortlisted</p>
                  <p className="text-lg font-bold text-secondary">{job.shortlistedCount}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter mb-1">Screened</p>
                  <p className="text-lg font-bold">{job.screenedCount}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-auto space-y-2">
                {job.status === 'active' && job.screenedCount > 0 ? (
                  <Link
                    href={`/jobs/${job._id}/shortlist`}
                    className="w-full py-2.5 bg-gradient-to-r from-secondary to-secondary-container text-white rounded-lg text-sm font-bold shadow-md hover:shadow-secondary/20 transition-all text-center block"
                  >
                    View Shortlist
                  </Link>
                ) : job.status === 'draft' ? (
                  <button className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-bold transition-all">
                    Publish Posting
                  </button>
                ) : null}
                <div className="flex gap-2">
                  <Link href={`/jobs/${job._id}/shortlist`} className="flex-1 py-2 text-on-surface-variant border border-outline-variant hover:bg-surface-container-low rounded-lg text-xs font-bold transition-all text-center">
                    View Details
                  </Link>
                  <button
                    onClick={() => handleRunScreening(job._id)}
                    disabled={screening || job.applicantCount === 0}
                    className="flex-1 py-2 text-secondary bg-secondary-fixed/30 hover:bg-secondary-fixed/50 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {screening ? 'Running...' : 'Run Screening'}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* AI Suggestion Card */}
          <div className="bg-primary-container p-8 rounded-xl border-0 shadow-lg flex flex-col md:col-span-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-[160px] text-white">psychology</span>
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-secondary px-3 py-1 rounded-full text-[10px] font-extrabold text-white uppercase tracking-widest mb-6">
                Smart Suggestion
              </div>
              <h3 className="text-3xl font-bold text-white mb-4 max-w-lg">
                Optimize your &apos;Senior AI&apos; listing for 24% more qualified matches
              </h3>
              <p className="text-on-primary-container text-sm max-w-md mb-8 leading-relaxed">
                Our AI analyzed similar high-performing roles and suggests adding &apos;LLM Fine-tuning&apos; to your required skill set to attract top tier research talent.
              </p>
              <div className="flex items-center gap-4">
                <button className="bg-white text-primary-container px-6 py-3 rounded-md font-bold text-sm hover:bg-secondary-fixed transition-colors">
                  Apply Auto-Edit
                </button>
                <button className="text-white border border-white/20 px-6 py-3 rounded-md font-bold text-sm hover:bg-white/5 transition-colors">
                  See Analysis
                </button>
              </div>
            </div>
          </div>
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
