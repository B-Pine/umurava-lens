'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchComparisonData } from '../../../../store/screeningSlice';

export default function ComparePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const jobId = params.id as string;
  const candidateIdsParam = searchParams.get('candidates') || '';
  const { comparisonData, loading } = useAppSelector((s) => s.screening);
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    if (candidateIdsParam && jobId) {
      const ids = candidateIdsParam.split(',');
      dispatch(fetchComparisonData({ candidateIds: ids, jobId }));
    }
  }, [dispatch, candidateIdsParam, jobId]);

  const candidates = comparisonData.candidates || [];
  const job = comparisonData.job;

  useEffect(() => {
    if (candidates.length >= 2) {
      const sorted = [...candidates].sort((a, b) => b.score - a.score);
      const top = sorted[0].candidateId;
      setWinner(top ? `${top.firstName || ''} ${top.lastName || ''}`.trim() : '');
    }
  }, [candidates]);

  const recStyle = (rec: string) =>
    rec === 'hire'
      ? 'bg-emerald-50 text-emerald-700'
      : rec === 'consider'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-rose-50 text-rose-700';

  const scoreColor = (score: number) =>
    score >= 85 ? 'text-emerald-600' : score >= 70 ? 'text-amber-600' : 'text-rose-600';

  const barColor = (v: number) =>
    v >= 85 ? 'bg-emerald-500' : v >= 70 ? 'bg-amber-500' : 'bg-rose-500';

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-lg bg-white/60 animate-pulse" />
        <div className="h-6 w-72 rounded-lg bg-white/60 animate-pulse" />
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="h-80 rounded-xl bg-white/60 animate-pulse" />
          <div className="h-80 rounded-xl bg-white/60 animate-pulse" />
        </div>
      </div>
    );
  }

  if (candidates.length < 2) {
    return (
      <div className="space-y-4">
        <nav className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
          <Link href="/jobs" className="hover:text-slate-900 transition-colors">Jobs</Link>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <Link href={`/jobs/${jobId}/shortlist`} className="hover:text-slate-900 transition-colors">Shortlist</Link>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <span className="text-indigo-700">Compare</span>
        </nav>
        <div className="glass-panel rounded-xl p-12 text-center">
          <span className="material-symbols-outlined text-3xl text-slate-300 mb-3 block">compare_arrows</span>
          <h2 className="text-[15px] font-extrabold text-slate-900 mb-1">Select two candidates</h2>
          <p className="text-[12px] text-slate-500 font-medium mb-4">Go back to the shortlist and select candidates for comparison.</p>
          <Link
            href={`/jobs/${jobId}/shortlist`}
            className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 text-white text-[12px] font-semibold press"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Back to Shortlist
          </Link>
        </div>
      </div>
    );
  }

  const c1 = candidates[0];
  const c2 = candidates[1];
  const cand1 = c1.candidateId as any;
  const cand2 = c2.candidateId as any;
  const name1 = `${cand1?.firstName || ''} ${cand1?.lastName || ''}`.trim();
  const name2 = `${cand2?.firstName || ''} ${cand2?.lastName || ''}`.trim();
  const init1 = `${cand1?.firstName?.[0] || ''}${cand1?.lastName?.[0] || ''}`.toUpperCase();
  const init2 = `${cand2?.firstName?.[0] || ''}${cand2?.lastName?.[0] || ''}`.toUpperCase();

  const dimensions = [
    { label: 'Technical Skills', key: 'technicalSkillsScore' as const },
    { label: 'Experience', key: 'experienceScore' as const },
    { label: 'Education', key: 'educationScore' as const },
    { label: 'Project Impact', key: 'projectImpactScore' as const },
  ];

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <nav className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-1.5">
            <Link href="/jobs" className="hover:text-slate-900 transition-colors">Jobs</Link>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <Link href={`/jobs/${jobId}`} className="hover:text-slate-900 transition-colors truncate max-w-[120px]">{job?.title || '...'}</Link>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <Link href={`/jobs/${jobId}/shortlist`} className="hover:text-slate-900 transition-colors">Shortlist</Link>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span className="text-indigo-700">Compare</span>
          </nav>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Candidate Comparison
          </h1>
          <p className="text-[12px] text-slate-500 font-medium mt-0.5">
            Side-by-side analysis of {name1} vs {name2} for {job?.title || 'this role'}
          </p>
        </div>
        <Link
          href={`/jobs/${jobId}/shortlist`}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white border border-slate-200 text-[12px] font-semibold text-slate-700 hover:border-slate-300 press"
        >
          <span className="material-symbols-outlined text-[14px]">arrow_back</span>
          Back to Shortlist
        </Link>
      </section>

      {/* CANDIDATE PROFILES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { result: c1, cand: cand1, name: name1, initials: init1 },
          { result: c2, cand: cand2, name: name2, initials: init2 },
        ].map(({ result, cand, name, initials }, idx) => {
          const isWinner = name === winner;
          return (
            <motion.div
              key={result._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={`glass-panel rounded-xl overflow-hidden ${isWinner ? 'ring-2 ring-indigo-500/30' : ''}`}
            >
              {/* Winner badge */}
              {isWinner && (
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-3 py-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-white text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/90">Top Candidate</span>
                </div>
              )}

              {/* Profile Header */}
              <div className="p-4 text-center border-b border-slate-100">
                <div className="relative inline-block mb-3">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/25 to-fuchsia-400/25 blur-lg rounded-full" />
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center text-[18px] font-bold shadow-lg mx-auto">
                    {initials}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-lg ${
                    result.score >= 85 ? 'bg-emerald-500' : result.score >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                  } text-white flex items-center justify-center text-[10px] font-extrabold shadow-sm`}>
                    {result.score}
                  </div>
                </div>
                <h3 className="text-[15px] font-extrabold text-slate-900">{name}</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {cand?.headline || cand?.email || '-'}
                </p>
                {cand?.location && (
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{cand.location}</p>
                )}
                <span className={`inline-block mt-2 text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${recStyle(result.recommendation)}`}>
                  {result.recommendation}
                </span>
              </div>

              {/* Score Breakdown */}
              <div className="p-4 space-y-2.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-1">Score Breakdown</p>
                {dimensions.map((d) => {
                  const val = (result as any)[d.key] || 0;
                  return (
                    <div key={d.key} className="bg-white/60 border border-slate-100 rounded-lg px-3 py-2">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-700">{d.label}</span>
                        <span className="text-[12px] font-extrabold text-slate-900 tabular-nums">{val}</span>
                      </div>
                      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${barColor(val)}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${val}%` }}
                          transition={{ delay: 0.3 + idx * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Strengths */}
              <div className="px-4 pb-3">
                <div className="bg-white/70 border border-emerald-100 rounded-lg p-3">
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-700 flex items-center gap-1 mb-2">
                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                    Strengths
                  </p>
                  <ul className="space-y-1.5 text-[11px] text-slate-700 font-medium">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex gap-1.5 leading-snug">
                        <span className="text-emerald-600 font-bold shrink-0 mt-0.5">·</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Gaps */}
              <div className="px-4 pb-3">
                <div className="bg-white/70 border border-amber-100 rounded-lg p-3">
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-700 flex items-center gap-1 mb-2">
                    <span className="material-symbols-outlined text-[12px]">warning</span>
                    Gaps
                  </p>
                  <ul className="space-y-1.5 text-[11px] text-slate-700 font-medium">
                    {result.gaps.map((g, i) => (
                      <li key={i} className="flex gap-1.5 leading-snug">
                        <span className="text-amber-600 font-bold shrink-0 mt-0.5">·</span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Summary */}
              {result.summary && (
                <div className="px-4 pb-4">
                  <div className="bg-indigo-50/60 border-l-2 border-indigo-500 rounded-r-lg p-3">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-indigo-700 mb-1">Summary</p>
                    <p className="text-[11px] text-slate-700 leading-relaxed font-medium">{result.summary}</p>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* HEAD-TO-HEAD TABLE */}
      <motion.section
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="glass-panel rounded-xl overflow-hidden"
      >
        <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-600 text-[16px]">compare_arrows</span>
          <h2 className="text-[13px] font-extrabold text-slate-900 tracking-tight">Head-to-Head</h2>
        </div>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-slate-100 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
              <th className="text-left px-3 py-2 w-32">Dimension</th>
              <th className="text-center px-3 py-2">{name1}</th>
              <th className="text-center px-3 py-2">{name2}</th>
              <th className="text-center px-3 py-2 w-16">Edge</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/60">
            {[
              { label: 'Overall Score', v1: c1.score, v2: c2.score },
              ...dimensions.map((d) => ({
                label: d.label,
                v1: (c1 as any)[d.key] || 0,
                v2: (c2 as any)[d.key] || 0,
              })),
              { label: 'Confidence', v1: c1.confidence, v2: c2.confidence },
            ].map((row) => {
              const diff = row.v1 - row.v2;
              return (
                <tr key={row.label} className="hover:bg-white/50 transition-colors">
                  <td className="px-3 py-2 font-semibold text-slate-700">{row.label}</td>
                  <td className={`px-3 py-2 text-center font-extrabold tabular-nums ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-slate-500' : 'text-slate-900'}`}>
                    {row.v1}
                  </td>
                  <td className={`px-3 py-2 text-center font-extrabold tabular-nums ${diff < 0 ? 'text-emerald-600' : diff > 0 ? 'text-slate-500' : 'text-slate-900'}`}>
                    {row.v2}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {diff > 0 ? (
                      <span className="text-[9px] font-bold text-emerald-600">+{diff}</span>
                    ) : diff < 0 ? (
                      <span className="text-[9px] font-bold text-emerald-600">+{Math.abs(diff)}</span>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-400">Tie</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.section>

      {/* VERDICT */}
      {winner && (
        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-5 text-white overflow-hidden relative"
        >
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-fuchsia-500/15 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-indigo-400 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <h3 className="text-[15px] font-extrabold">AI Verdict: {winner}</h3>
            </div>
            <p className="text-[12px] text-slate-400 font-medium leading-relaxed max-w-2xl mb-4">
              Based on the weighted analysis across all dimensions, <strong className="text-white">{winner}</strong> is the stronger candidate for this role. Their combination of technical depth, relevant experience, and project impact gives them an edge.
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={`/jobs/${jobId}/shortlist`}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/10 border border-white/15 text-[12px] font-semibold text-white hover:bg-white/20 transition press"
              >
                <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                Back to Shortlist
              </Link>
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
}
