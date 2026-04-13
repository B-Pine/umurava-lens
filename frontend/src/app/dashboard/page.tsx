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
    <div className="space-y-8">
      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading && !stats ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <div className="lg:col-span-2"><StatSkeleton /></div>
          </>
        ) : error && !stats ? (
          <div className="col-span-full bg-error-container/20 p-6 rounded-xl text-error text-center">
            <span className="material-symbols-outlined mr-2">error</span>
            Failed to load dashboard. Make sure the backend is running.
          </div>
        ) : (
          <>
            {/* Active Jobs Card */}
            <div className="col-span-1 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">work</span>
                </div>
                <span className="text-xs font-medium text-on-surface-variant bg-surface-container px-2 py-1 rounded">THIS MONTH</span>
              </div>
              <h3 className="text-3xl font-extrabold text-on-surface tracking-tight">{stats?.activeJobCount ?? 24}</h3>
              <p className="text-sm text-on-surface-variant mt-1">Active Job Listings</p>
            </div>

            {/* Candidates Screened Card */}
            <div className="col-span-1 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed">
                  <span className="material-symbols-outlined">verified_user</span>
                </div>
                <span className="text-xs font-medium text-on-surface-variant bg-surface-container px-2 py-1 rounded">AI VERIFIED</span>
              </div>
              <h3 className="text-3xl font-extrabold text-on-surface tracking-tight">
                {stats?.candidatesScreened?.toLocaleString() ?? '1,284'}
              </h3>
              <p className="text-sm text-on-surface-variant mt-1">Candidates Screened</p>
            </div>

            {/* Average Match Score Card */}
            <div className="col-span-1 md:col-span-1 lg:col-span-2 bg-primary-container p-6 rounded-xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  <p className="text-on-primary-container text-xs uppercase tracking-widest font-bold">Average Match Score</p>
                  <h3 className="text-5xl font-extrabold text-white mt-2">
                    {stats?.averageMatchScore ?? 84.2}<span className="text-lg opacity-50 ml-1">%</span>
                  </h3>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex -space-x-3">
                    <div className="w-8 h-8 rounded-full border-2 border-primary-container bg-secondary flex items-center justify-center text-white text-xs font-bold">S</div>
                    <div className="w-8 h-8 rounded-full border-2 border-primary-container bg-secondary-container flex items-center justify-center text-white text-xs font-bold">J</div>
                    <div className="w-8 h-8 rounded-full border-2 border-primary-container bg-on-tertiary-container flex items-center justify-center text-white text-xs font-bold">M</div>
                  </div>
                  <p className="text-on-primary-container text-xs">Based on 450 recent matches</p>
                </div>
              </div>
              <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-secondary/30 blur-[100px] rounded-full" />
            </div>
          </>
        )}
      </div>

      {/* Dashboard Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Active Jobs */}
        <section className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-extrabold text-on-surface">Recent Active Jobs</h2>
              <p className="text-on-surface-variant text-sm">Monitor screening progress for your current openings</p>
            </div>
            <Link href="/jobs" className="text-secondary font-semibold text-sm flex items-center gap-1 hover:underline">
              View All Jobs <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          <div className="space-y-4">
            {loading && !stats ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : (
              (stats?.recentJobs ?? [
                { _id: '1', title: 'Senior AI Engineer', location: 'San Francisco', employmentType: 'Full-time', salaryRange: '$180k - $240k', applicantCount: 142, screenedCount: 110, shortlistedCount: 28, status: 'active' },
                { _id: '2', title: 'Product Design Director', location: 'Remote', employmentType: 'Contract', salaryRange: '$120/hr', applicantCount: 85, screenedCount: 36, shortlistedCount: 12, status: 'active' },
                { _id: '3', title: 'Backend Lead (Node.js)', location: 'Hybrid', employmentType: 'Full-time', salaryRange: '$160k - $210k', applicantCount: 214, screenedCount: 32, shortlistedCount: 8, status: 'active' },
              ]).map((job: any) => {
                const progress = job.applicantCount > 0 ? Math.round((job.screenedCount / job.applicantCount) * 100) : 0;
                return (
                  <div key={job._id} className="bg-surface-container-lowest p-5 rounded-xl transition-all hover:shadow-md">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-on-surface">{job.title}</h4>
                        <p className="text-on-surface-variant text-sm">{job.location} &bull; {job.employmentType} &bull; {job.salaryRange}</p>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant cursor-pointer">more_vert</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-on-surface-variant">Screening Progress</span>
                        <span className="text-secondary">{progress}% Complete</span>
                      </div>
                      <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-secondary to-secondary-container rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="flex justify-between mt-3">
                        <div className="flex items-center gap-4 text-xs font-medium text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">group</span> {job.applicantCount} Applied
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">check_circle</span> {job.screenedCount} Screened
                          </span>
                        </div>
                        <Link href={`/jobs/${job._id}/shortlist`} className="text-xs font-bold text-secondary-fixed-dim bg-secondary/5 px-3 py-1 rounded-lg hover:bg-secondary/10 transition-colors">
                          Review Pool
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-8">
          {/* Quick Actions */}
          <section className="space-y-4">
            <h2 className="text-xl font-extrabold text-on-surface">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/jobs/create" className="flex flex-col items-center justify-center p-4 bg-surface-container-low hover:bg-surface-container rounded-xl transition-all gap-2 text-center group">
                <span className="material-symbols-outlined text-secondary text-3xl group-hover:scale-110 transition-transform">add_box</span>
                <span className="text-xs font-bold text-on-surface">Create New Job</span>
              </Link>
              <Link href="/candidates/upload" className="flex flex-col items-center justify-center p-4 bg-surface-container-low hover:bg-surface-container rounded-xl transition-all gap-2 text-center group">
                <span className="material-symbols-outlined text-secondary text-3xl group-hover:scale-110 transition-transform">upload_file</span>
                <span className="text-xs font-bold text-on-surface">Upload Candidates</span>
              </Link>
            </div>
          </section>

          {/* Top Talent Highlights */}
          <section className="space-y-4">
            <h2 className="text-xl font-extrabold text-on-surface">Top Talent Highlights</h2>
            <div className="space-y-3">
              {[
                { name: 'Marcus Thorne', role: 'Senior Backend Lead', score: 98, initials: 'MT' },
                { name: 'Elena Rodriguez', role: 'AI Research Lead', score: 96, initials: 'ER' },
                { name: 'David Chen', role: 'Full Stack Developer', score: 94, initials: 'DC' },
              ].map((talent) => (
                <div key={talent.name} className="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-4 border-l-4 border-secondary">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary to-secondary-container flex items-center justify-center text-white font-bold text-sm">
                    {talent.initials}
                  </div>
                  <div className="flex-1">
                    <h5 className="text-sm font-bold text-on-surface">{talent.name}</h5>
                    <p className="text-[10px] text-on-surface-variant uppercase">{talent.role}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-secondary font-extrabold text-lg">{talent.score}</div>
                    <div className="text-[8px] text-on-surface-variant font-bold uppercase tracking-widest">SCORE</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-3 text-sm font-bold text-on-surface-variant hover:text-secondary transition-colors text-center bg-surface-container-low rounded-lg">
              Analyze More Matches
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
