'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import api from '../../../lib/api';

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await api.get(`/jobs/${id}`);
        setJob(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load job');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-lg bg-white/60 animate-pulse" />
        <div className="h-6 w-72 rounded-lg bg-white/60 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="md:col-span-2 space-y-4">
            <div className="h-48 rounded-xl bg-white/60 animate-pulse" />
            <div className="h-24 rounded-xl bg-white/60 animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-32 rounded-xl bg-white/60 animate-pulse" />
            <div className="h-40 rounded-xl bg-white/60 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div>
        <div className="glass-panel rounded-xl p-12 text-center">
          <span className="material-symbols-outlined text-3xl text-rose-400 mb-3 block">
            error
          </span>
          <h2 className="text-[15px] font-extrabold text-slate-900 mb-1">Something went wrong</h2>
          <p className="text-[12px] text-slate-500 font-medium mb-4">{error || 'Job not found'}</p>
          <button
            onClick={() => router.push('/jobs')}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white border border-slate-200 text-[12px] font-semibold text-slate-700 hover:border-slate-300 press"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const statusStyles: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700',
    draft: 'bg-amber-50 text-amber-700',
    closed: 'bg-rose-50 text-rose-700',
  };
  const stCls = statusStyles[job.status] || statusStyles.draft;

  const techWeight = job.aiWeights?.technicalSkills || 85;
  const expWeight = job.aiWeights?.yearsOfExperience || 40;
  const eduWeight = job.aiWeights?.educationCredentials || 25;
  const projectWeight = job.aiWeights?.pastProjectImpact || 70;
  const passingScore = job.passingScore || 70;

  const progress =
    job.applicantCount > 0
      ? Math.round((job.screenedCount / job.applicantCount) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <nav className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-1.5">
            <Link href="/jobs" className="hover:text-slate-900 transition-colors">Jobs</Link>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span className="text-indigo-700 truncate max-w-[200px]">{job.title}</span>
          </nav>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-tight">
              {job.title}
            </h1>
            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${stCls}`}>
              {job.status}
            </span>
          </div>
          <p className="text-[12px] text-slate-500 font-medium">
            {[job.department, job.location, job.employmentType, job.salaryRange]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {job.status === 'draft' ? (
            <Link
              href={`/jobs/${job._id}/edit?publish=1`}
              className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 text-white text-[12px] font-semibold shadow-[0_6px_16px_-8px_rgba(70,72,212,0.6),inset_0_1px_0_0_rgba(255,255,255,0.22)] hover:from-indigo-400 hover:to-indigo-600 transition press"
            >
              <span className="material-symbols-outlined text-[14px]">publish</span>
              Complete & Publish
            </Link>
          ) : (
            <>
              <Link
                href={`/jobs/${job._id}/edit`}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white border border-slate-200 text-[12px] font-semibold text-slate-700 hover:border-slate-300 transition-colors press"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
                Edit
              </Link>
              <Link
                href={`/jobs/${job._id}/shortlist`}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 text-white text-[12px] font-semibold shadow-[0_6px_16px_-8px_rgba(70,72,212,0.6),inset_0_1px_0_0_rgba(255,255,255,0.22)] hover:from-indigo-400 hover:to-indigo-600 transition press"
              >
                <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
                Shortlist
              </Link>
            </>
          )}
        </div>
      </section>

      {/* KEY METRICS ROW */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Applicants',
            value: job.applicantCount || 0,
            icon: 'group',
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
          },
          {
            label: 'Screened',
            value: job.screenedCount || 0,
            icon: 'auto_awesome',
            color: 'text-violet-600',
            bg: 'bg-violet-50',
          },
          {
            label: 'Shortlisted',
            value: job.shortlistedCount || 0,
            icon: 'workspace_premium',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Pass Score',
            value: `${passingScore}%`,
            icon: 'target',
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
        ].map((metric, idx) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel rounded-xl p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-lg ${metric.bg} flex items-center justify-center`}>
                <span
                  className={`material-symbols-outlined text-[14px] ${metric.color}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {metric.icon}
                </span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                {metric.label}
              </span>
            </div>
            <p className="text-[20px] font-extrabold text-slate-900 tabular-nums leading-none">
              {metric.value}
            </p>
          </motion.div>
        ))}
      </section>

      {/* Screening progress bar */}
      {job.applicantCount > 0 && (
        <section className="glass-panel rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Screening Progress
            </span>
            <span className="text-[10px] font-bold text-slate-600 tabular-nums">{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </section>
      )}

      {/* MAIN CONTENT — 3 COLUMNS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Column 1: Description */}
        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="glass-panel rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-indigo-600 text-[16px]">description</span>
            <h2 className="text-[13px] font-extrabold text-slate-900 tracking-tight">Description</h2>
          </div>
          <p className="text-[12px] text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
            {job.description || 'No description provided.'}
          </p>
        </motion.section>

        {/* Column 2: Skills + Details */}
        <div className="space-y-4">
          {/* Required Skills */}
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-indigo-600 text-[16px]">terminal</span>
              <h2 className="text-[13px] font-extrabold text-slate-900 tracking-tight">Required Skills</h2>
              <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                {(job.requiredSkills || []).length}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(job.requiredSkills || []).length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No skills specified.</p>
              ) : (
                (job.requiredSkills || []).map((skill: string, idx: number) => (
                  <motion.span
                    key={skill}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 + idx * 0.03, duration: 0.2 }}
                    className="inline-flex items-center h-6 px-2.5 rounded-full bg-indigo-600 text-white text-[10.5px] font-semibold"
                  >
                    {skill}
                  </motion.span>
                ))
              )}
            </div>
          </motion.section>

          {/* Job Info Detail Grid */}
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-indigo-600 text-[16px]">info</span>
              <h2 className="text-[13px] font-extrabold text-slate-900 tracking-tight">Details</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Department', value: job.department, icon: 'domain' },
                { label: 'Location', value: job.location, icon: 'location_on' },
                { label: 'Employment', value: job.employmentType, icon: 'schedule' },
                { label: 'Salary', value: job.salaryRange, icon: 'payments' },
                { label: 'Experience', value: job.experienceLevel, icon: 'trending_up' },
                {
                  label: 'Created',
                  value: job.createdAt
                    ? new Date(job.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—',
                  icon: 'calendar_today',
                },
              ].map((item) => (
                <div key={item.label} className="bg-white/50 border border-slate-100 rounded-lg p-2">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="material-symbols-outlined text-slate-400 text-[12px]">
                      {item.icon}
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      {item.label}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-900 truncate">
                    {item.value || '—'}
                  </p>
                </div>
              ))}
            </div>
          </motion.section>
        </div>

        {/* Column 3: AI Weights + Actions + Timeline */}
        <div className="space-y-4">
          {/* AI Weights */}
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className="material-symbols-outlined text-indigo-600 text-[16px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                tune
              </span>
              <h2 className="text-[13px] font-extrabold text-slate-900 tracking-tight">AI Weights</h2>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Technical Match', value: techWeight, color: 'from-indigo-500 to-indigo-400' },
                { label: 'Experience Level', value: expWeight, color: 'from-violet-500 to-violet-400' },
                { label: 'Education Fit', value: eduWeight, color: 'from-fuchsia-500 to-fuchsia-400' },
                { label: 'Project Impact', value: projectWeight, color: 'from-sky-500 to-sky-400' },
              ].map((w) => (
                <div key={w.label} className="bg-white/50 border border-slate-100 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-700">{w.label}</span>
                    <span className="text-[11px] font-extrabold text-indigo-600 tabular-nums">{w.value}%</span>
                  </div>
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full bg-gradient-to-r ${w.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${w.value}%` }}
                      transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Quick Actions */}
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-indigo-600 text-[16px]">bolt</span>
              <h2 className="text-[13px] font-extrabold text-slate-900 tracking-tight">Quick Actions</h2>
            </div>
            <div className="space-y-1">
              {[
                { href: '/candidates/upload', label: 'Upload candidates', icon: 'upload_file', iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
                { href: `/jobs/${job._id}/shortlist`, label: 'View shortlist', icon: 'workspace_premium', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
                { href: `/jobs/${job._id}/compare`, label: 'Compare candidates', icon: 'compare_arrows', iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
                { href: `/jobs/${job._id}/edit`, label: 'Edit job details', icon: 'edit', iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
              ].map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-slate-700 hover:bg-white/70 border border-transparent hover:border-slate-200/60 transition-all"
                >
                  <span className={`w-6 h-6 rounded-md ${a.iconBg} flex items-center justify-center shrink-0`}>
                    <span className={`material-symbols-outlined text-[13px] ${a.iconColor}`}>{a.icon}</span>
                  </span>
                  {a.label}
                </Link>
              ))}
            </div>
          </motion.section>

          {/* Timeline */}
          {(job.applicationDeadline || job.createdAt) && (
            <motion.section
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="glass-panel rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-indigo-600 text-[16px]">event</span>
                <h2 className="text-[13px] font-extrabold text-slate-900 tracking-tight">Timeline</h2>
              </div>
              <div className="space-y-2">
                {job.createdAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-500">Created</span>
                    <span className="text-[11px] font-bold text-slate-700 tabular-nums">
                      {new Date(job.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                )}
                {job.applicationDeadline && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-500">Deadline</span>
                    <span className="text-[11px] font-bold text-slate-700 tabular-nums">
                      {new Date(job.applicationDeadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                )}
                {job.updatedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-500">Last updated</span>
                    <span className="text-[11px] font-bold text-slate-700 tabular-nums">
                      {new Date(job.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </div>
      </div>
    </div>
  );
}
