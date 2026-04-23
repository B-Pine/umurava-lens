'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchDashboardStats } from '../../store/jobsSlice';
import { StatSkeleton, CardSkeleton } from '../../components/ui/LoadingSkeleton';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { dashboardStats, loading, error } = useAppSelector((s) => s.jobs);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  const stats = dashboardStats;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Stats grid — four equal-width cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading && !stats ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : error && !stats ? (
          <div className="col-span-full bg-error-container/20 p-4 rounded-lg text-error text-sm text-center">
            <span className="material-symbols-outlined mr-2 align-middle text-base">error</span>
            Failed to load dashboard. Make sure the backend is running.
          </div>
        ) : (
          <>
            <StatCard
              icon="work"
              label="Active Jobs"
              value={stats?.activeJobCount ?? 0}
              iconBg="bg-indigo-50 text-indigo-600"
            />
            <StatCard
              icon="group"
              label="Candidates Screened"
              value={stats?.candidatesScreened ?? 0}
              iconBg="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              icon="insights"
              label="Avg Match Score"
              value={stats?.averageMatchScore != null ? `${stats.averageMatchScore}%` : '—'}
              iconBg="bg-amber-50 text-amber-600"
              subtitle={
                stats?.averageMatchCount
                  ? `across ${stats.averageMatchCount} screenings`
                  : 'no screenings yet'
              }
            />
            <StatCard
              icon="workspace_premium"
              label="Top Talents"
              value={stats?.topTalents?.length ?? 0}
              iconBg="bg-rose-50 text-rose-600"
            />
          </>
        )}
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Active Jobs */}
        <section className="lg:col-span-3 space-y-3">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-lg font-extrabold text-on-surface">Recent Active Jobs</h2>
              <p className="text-on-surface-variant text-xs">
                Current openings and their screening progress
              </p>
            </div>
            <Link
              href="/jobs"
              className="text-secondary font-semibold text-xs flex items-center gap-1 hover:underline"
            >
              View all
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          <div className="space-y-2">
            {loading && !stats ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : (stats?.recentJobs?.length ?? 0) === 0 ? (
              <div className="bg-surface-container-lowest rounded-lg p-6 text-center text-sm text-on-surface-variant">
                No active jobs yet. Create one to get started.
              </div>
            ) : (
              (stats?.recentJobs || []).map((job: any) => {
                const progress =
                  job.applicantCount > 0
                    ? Math.round((job.screenedCount / job.applicantCount) * 100)
                    : 0;
                return (
                  <Link
                    key={job._id}
                    href={`/jobs/${job._id}/shortlist`}
                    className="block bg-surface-container-lowest p-4 rounded-lg hover:shadow-sm transition-all border border-outline-variant/20"
                  >
                    <div className="flex justify-between items-start mb-2 gap-3">
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-on-surface truncate">{job.title}</h4>
                        <p className="text-on-surface-variant text-xs truncate">
                          {job.location} · {job.employmentType}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                          Screened
                        </p>
                        <p className="text-sm font-bold text-secondary">
                          {job.screenedCount}/{job.applicantCount || 0}
                        </p>
                      </div>
                    </div>
                    <div className="h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-secondary to-secondary-container rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        {/* Right column: Quick Actions + Top Talents */}
        <aside className="lg:col-span-2 space-y-6">
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-on-surface">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/jobs/create"
                className="flex flex-col items-center justify-center p-4 bg-surface-container-lowest hover:bg-surface-container rounded-lg transition-all gap-1 text-center border border-outline-variant/20"
              >
                <span className="material-symbols-outlined text-secondary text-2xl">add_box</span>
                <span className="text-xs font-bold text-on-surface">New Job</span>
              </Link>
              <Link
                href="/candidates/upload"
                className="flex flex-col items-center justify-center p-4 bg-surface-container-lowest hover:bg-surface-container rounded-lg transition-all gap-1 text-center border border-outline-variant/20"
              >
                <span className="material-symbols-outlined text-secondary text-2xl">upload_file</span>
                <span className="text-xs font-bold text-on-surface">Upload</span>
              </Link>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex justify-between items-end">
              <h2 className="text-lg font-extrabold text-on-surface">Top Talents</h2>
              <Link
                href="/shortlisted"
                className="text-secondary font-semibold text-xs flex items-center gap-1 hover:underline"
              >
                View all
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
            {stats?.topTalents && stats.topTalents.length > 0 ? (
              <div className="bg-surface-container-lowest rounded-lg border border-outline-variant/20 divide-y divide-outline-variant/10 max-h-[420px] overflow-y-auto">
                {stats.topTalents.map((talent) => {
                  const initials = (talent.name || 'A')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <Link
                      key={talent._id}
                      href={`/jobs/${talent.jobId}/shortlist`}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-container-low transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary/25 to-secondary-container/30 flex items-center justify-center text-secondary font-bold text-[11px]">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-on-surface truncate">{talent.name}</p>
                        <p className="text-[10px] text-on-surface-variant uppercase truncate font-medium">
                          {talent.role}
                        </p>
                      </div>
                      <span className="text-sm font-extrabold text-secondary tabular-nums">
                        {talent.score}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-lg p-5 text-center text-xs text-on-surface-variant border border-outline-variant/20">
                <span className="material-symbols-outlined text-2xl text-on-surface-variant/50 mb-1 block">
                  insights
                </span>
                Run a screening to see top talents here.
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  iconBg,
  subtitle,
}: {
  icon: string;
  label: string;
  value: string | number;
  iconBg: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/20">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
          <span className="material-symbols-outlined text-lg">{icon}</span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          {label}
        </span>
      </div>
      <p className="text-2xl font-extrabold text-on-surface tabular-nums">{value}</p>
      {subtitle && (
        <p className="text-[11px] font-medium text-on-surface-variant mt-1 truncate">{subtitle}</p>
      )}
    </div>
  );
}
