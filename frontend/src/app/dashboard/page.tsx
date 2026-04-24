'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchDashboardStats } from '../../store/jobsSlice';
import AnimatedNumber from '../../components/ui/AnimatedNumber';
import Sparkline from '../../components/ui/Sparkline';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { dashboardStats, loading, error } = useAppSelector((s) => s.jobs);
  const { user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  const stats = dashboardStats;

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5) return 'Working late';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    if (h < 21) return 'Good evening';
    return 'Good night';
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'there';

  const trendValues = (stats?.applicationTrend || []).map((t) => t.count);
  const trendTotal = trendValues.reduce((s, n) => s + n, 0);

  const rec = stats?.recommendationSplit || { hire: 0, consider: 0, risky: 0 };
  const recTotal = rec.hire + rec.consider + rec.risky;
  const recPct = (n: number) => (recTotal ? (n / recTotal) * 100 : 0);

  const pipe = stats?.pipeline || { applied: 0, screened: 0, shortlisted: 0 };

  return (
    <div className="space-y-4">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl glass-panel p-5">
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-70">
          <div className="absolute -top-24 -left-10 w-[300px] h-[300px] rounded-full bg-indigo-300/40 blur-[90px] aurora-slow" />
          <div className="absolute top-8 -right-20 w-[280px] h-[280px] rounded-full bg-fuchsia-300/30 blur-[90px] aurora-slow" style={{ animationDelay: '-4s' }} />
          <div className="absolute -bottom-24 left-1/3 w-[260px] h-[260px] rounded-full bg-sky-300/30 blur-[90px] aurora-slow" style={{ animationDelay: '-8s' }} />
        </div>

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-700/80 mb-1.5">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-[22px] md:text-2xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              {greeting}, {firstName}.
            </h1>
            <p className="mt-1 text-[12.5px] text-slate-600 font-medium leading-relaxed">
              Here's what's moving in your pipeline today.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap gap-2"
          >
            <Link
              href="/jobs/create"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 text-white text-[12px] font-semibold shadow-[0_6px_16px_-8px_rgba(70,72,212,0.6),inset_0_1px_0_0_rgba(255,255,255,0.22)] hover:from-indigo-400 hover:to-indigo-600 transition press"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              New role
            </Link>
            <Link
              href="/candidates/upload"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white text-slate-900 border border-slate-200 text-[12px] font-semibold shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-slate-300 transition press"
            >
              <span className="material-symbols-outlined text-[14px]">upload_file</span>
              Upload
            </Link>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard index={0} icon="work" label="Active Jobs" value={stats?.activeJobCount ?? 0} tint="indigo" loading={loading && !stats} />
        <StatCard index={1} icon="group" label="Screened" value={stats?.candidatesScreened ?? 0} tint="emerald" loading={loading && !stats} />
        <StatCard
          index={2}
          icon="insights"
          label="Avg Match"
          value={stats?.averageMatchScore ?? 0}
          suffix={stats?.averageMatchScore != null ? '%' : ''}
          subtitle={stats?.averageMatchCount ? `${stats.averageMatchCount} screenings` : 'no data'}
          tint="amber"
          loading={loading && !stats}
        />
        <StatCard index={3} icon="workspace_premium" label="Shortlisted" value={stats?.topTalents?.length ?? 0} tint="rose" loading={loading && !stats} />
      </section>

      {error && !stats && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 rounded-xl px-3 py-2 text-[12px] font-semibold">
          Failed to load dashboard. Make sure the backend is running.
        </div>
      )}

      {/* INSIGHT ROW */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Application trend */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="md:col-span-6 glass-panel rounded-2xl p-4 relative overflow-hidden"
        >
          <div className="flex items-start justify-between mb-2.5">
            <div>
              <h3 className="text-[12px] font-extrabold text-slate-900 tracking-tight">Application volume</h3>
              <p className="text-[10.5px] text-slate-500 font-medium">Last 14 days</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold text-slate-900 tabular-nums leading-none">
                <AnimatedNumber value={trendTotal} />
              </p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">new applicants</p>
            </div>
          </div>
          <div className="w-full">
            {trendValues.length > 0 ? (
              <Sparkline values={trendValues} width={520} height={72} />
            ) : (
              <div className="h-[72px] w-full bg-slate-100/60 rounded-lg animate-pulse" />
            )}
          </div>
        </motion.div>

        {/* Recommendation split */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="md:col-span-3 glass-panel rounded-2xl p-4"
        >
          <h3 className="text-[12px] font-extrabold text-slate-900 tracking-tight">AI Recommendations</h3>
          <p className="text-[10.5px] text-slate-500 font-medium mb-3">Across all screenings</p>

          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
            <motion.div
              className="h-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${recPct(rec.hire)}%` }}
              transition={{ delay: 0.35, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              className="h-full bg-amber-400"
              initial={{ width: 0 }}
              animate={{ width: `${recPct(rec.consider)}%` }}
              transition={{ delay: 0.45, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              className="h-full bg-rose-500"
              initial={{ width: 0 }}
              animate={{ width: `${recPct(rec.risky)}%` }}
              transition={{ delay: 0.55, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          <div className="mt-3 space-y-1.5">
            <RecRow color="bg-emerald-500" label="Hire" count={rec.hire} total={recTotal} />
            <RecRow color="bg-amber-400" label="Consider" count={rec.consider} total={recTotal} />
            <RecRow color="bg-rose-500" label="Risky" count={rec.risky} total={recTotal} />
          </div>
        </motion.div>

        {/* Pipeline funnel */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="md:col-span-3 glass-panel rounded-2xl p-4"
        >
          <h3 className="text-[12px] font-extrabold text-slate-900 tracking-tight">Pipeline</h3>
          <p className="text-[10.5px] text-slate-500 font-medium mb-3">Funnel to shortlist</p>

          <div className="space-y-2">
            <FunnelBar index={0} label="Applied" value={pipe.applied} max={Math.max(pipe.applied, 1)} tint="indigo" />
            <FunnelBar index={1} label="Screened" value={pipe.screened} max={Math.max(pipe.applied, 1)} tint="emerald" />
            <FunnelBar index={2} label="Shortlisted" value={pipe.shortlisted} max={Math.max(pipe.applied, 1)} tint="rose" />
          </div>
        </motion.div>
      </section>

      {/* BOTTOM ROW */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Recent jobs */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-7 space-y-2"
        >
          <div className="flex items-end justify-between px-0.5">
            <div>
              <h2 className="text-[13px] font-extrabold text-slate-900 tracking-tight">Recent roles</h2>
              <p className="text-[10.5px] text-slate-500 font-medium">Screening progress</p>
            </div>
            <Link
              href="/jobs"
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition inline-flex items-center gap-1"
            >
              View all
              <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
            </Link>
          </div>

          <div className="space-y-1.5">
            {loading && !stats ? (
              <>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-14 rounded-xl bg-white/60 animate-pulse" />
                ))}
              </>
            ) : (stats?.recentJobs?.length ?? 0) === 0 ? (
              <div className="glass-panel rounded-xl p-5 text-center">
                <span className="material-symbols-outlined text-2xl text-slate-400/70 mb-1 block">work_history</span>
                <p className="text-[12px] font-semibold text-slate-600">No active jobs yet.</p>
                <p className="text-[10.5px] text-slate-500 mt-0.5">Create your first role to start screening.</p>
              </div>
            ) : (
              (stats?.recentJobs || []).map((job: any, idx: number) => {
                const progress = job.applicantCount > 0 ? Math.round((job.screenedCount / job.applicantCount) * 100) : 0;
                return (
                  <motion.div
                    key={job._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + idx * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={`/jobs/${job._id}/shortlist`}
                      className="group block glass-panel rounded-xl p-3 hover:shadow-[0_12px_36px_-12px_rgba(70,72,212,0.18)] press transition-all"
                    >
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200/70 flex items-center justify-center text-indigo-700 shrink-0">
                            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>work</span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-[12px] text-slate-900 truncate leading-tight">{job.title}</h4>
                            <p className="text-[10px] text-slate-500 truncate font-medium">
                              {job.location} · {job.employmentType}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[13px] font-extrabold text-slate-900 tabular-nums leading-none">
                            {job.screenedCount}
                            <span className="text-slate-400 font-bold">/{job.applicantCount || 0}</span>
                          </p>
                          <p className="text-[8px] uppercase tracking-widest font-bold text-slate-400 mt-0.5">screened</p>
                        </div>
                      </div>
                      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ delay: 0.25 + idx * 0.04, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                    </Link>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.section>

        {/* Top talents */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-5 space-y-2"
        >
          <div className="flex items-end justify-between px-0.5">
            <div>
              <h2 className="text-[13px] font-extrabold text-slate-900 tracking-tight">Top talents</h2>
              <p className="text-[10.5px] text-slate-500 font-medium">Sorted by match score</p>
            </div>
            <Link
              href="/shortlisted"
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition inline-flex items-center gap-1"
            >
              View all
              <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
            </Link>
          </div>

          {stats?.topTalents && stats.topTalents.length > 0 ? (
            <div className="glass-panel rounded-xl divide-y divide-slate-100/70 max-h-[420px] overflow-y-auto">
              {stats.topTalents.map((t, idx) => {
                const initials = (t.name || 'A')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <motion.div
                    key={t._id}
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + idx * 0.03, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={`/jobs/${t.jobId}/shortlist`}
                      className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/70 transition-colors press"
                    >
                      <div className="relative shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/30 to-fuchsia-400/30 blur-md rounded-full" />
                        <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center text-[9px] font-bold">
                          {initials}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-slate-900 truncate leading-tight">{t.name}</p>
                        <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold truncate">{t.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-extrabold text-slate-900 tabular-nums leading-none">{t.score}</p>
                        <p className="text-[8px] uppercase tracking-widest font-bold text-slate-400 mt-0.5">match</p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel rounded-xl p-5 text-center">
              <span className="material-symbols-outlined text-2xl text-slate-400/70 mb-1 block">insights</span>
              <p className="text-[12px] font-semibold text-slate-600">No shortlisted candidates yet.</p>
              <p className="text-[10.5px] text-slate-500 mt-0.5">Run AI screening on a role to populate this.</p>
            </div>
          )}
        </motion.section>
      </section>
    </div>
  );
}

// -------- Helpers ---------

type Tint = 'indigo' | 'emerald' | 'amber' | 'rose';

function StatCard({
  index,
  icon,
  label,
  value,
  tint,
  suffix,
  subtitle,
  loading,
}: {
  index: number;
  icon: string;
  label: string;
  value: number;
  tint: Tint;
  suffix?: string;
  subtitle?: string;
  loading?: boolean;
}) {
  const tintMap: Record<Tint, { iconBg: string; iconText: string; glow: string }> = {
    indigo: { iconBg: 'bg-indigo-100/80', iconText: 'text-indigo-600', glow: 'from-indigo-300/40' },
    emerald: { iconBg: 'bg-emerald-100/80', iconText: 'text-emerald-600', glow: 'from-emerald-300/40' },
    amber: { iconBg: 'bg-amber-100/80', iconText: 'text-amber-600', glow: 'from-amber-300/40' },
    rose: { iconBg: 'bg-rose-100/80', iconText: 'text-rose-600', glow: 'from-rose-300/40' },
  };
  const t = tintMap[tint];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.08 + index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative glass-panel rounded-xl p-3.5 overflow-hidden press"
    >
      <div className={`pointer-events-none absolute -right-8 -top-8 w-28 h-28 rounded-full bg-gradient-to-br ${t.glow} to-transparent blur-2xl`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${t.iconBg} ${t.iconText}`}>
            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
          </div>
        </div>
        {loading ? (
          <div className="h-6 w-14 bg-slate-200/80 rounded-md animate-pulse" />
        ) : (
          <p className="text-xl font-extrabold text-slate-900 tabular-nums tracking-tight leading-none">
            <AnimatedNumber value={Number(value) || 0} suffix={suffix} />
          </p>
        )}
        <p className="text-[9px] uppercase tracking-[0.18em] text-slate-500 font-bold mt-1.5">{label}</p>
        {subtitle && <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate">{subtitle}</p>}
      </div>
    </motion.div>
  );
}

function RecRow({ color, label, count, total }: { color: string; label: string; count: number; total: number }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="font-semibold text-slate-700 flex-1">{label}</span>
      <span className="font-bold tabular-nums text-slate-900">{count}</span>
      <span className="text-slate-400 font-medium tabular-nums w-8 text-right">{pct}%</span>
    </div>
  );
}

function FunnelBar({
  index,
  label,
  value,
  max,
  tint,
}: {
  index: number;
  label: string;
  value: number;
  max: number;
  tint: 'indigo' | 'emerald' | 'rose';
}) {
  const pct = max ? (value / max) * 100 : 0;
  const barColor = tint === 'indigo' ? 'from-indigo-400 to-indigo-600' : tint === 'emerald' ? 'from-emerald-400 to-emerald-600' : 'from-rose-400 to-rose-600';
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10.5px] font-semibold text-slate-600">{label}</span>
        <span className="text-[11px] font-extrabold text-slate-900 tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.4 + index * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
