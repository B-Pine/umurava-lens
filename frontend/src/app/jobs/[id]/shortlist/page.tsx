'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  fetchScreeningResults,
  runScreening,
  sendOutreachBatch,
  setInterviewDecision,
  type ScreeningResult,
  type InterviewStatus,
} from '../../../../store/screeningSlice';
import OutreachPanel from '../../../../components/screening/OutreachPanel';

type FilterKey = 'shortlisted' | 'interviewing' | 'top10' | 'top20' | 'score80' | 'all';

export default function ShortlistPage() {
  const params = useParams();
  const dispatch = useAppDispatch();
  const jobId = params.id as string;
  const { results, job, loading, screening, error } = useAppSelector((s) => s.screening);
  const [filter, setFilter] = useState<FilterKey>('shortlisted');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bulkSending, setBulkSending] = useState(false);

  useEffect(() => {
    dispatch(fetchScreeningResults({ jobId }));
  }, [dispatch, jobId]);

  const filtered = results.filter((r) => {
    if (filter === 'shortlisted') return r.shortlisted;
    if (filter === 'interviewing')
      return r.emailStatus === 'sent' && r.interviewStatus === 'pending';
    if (filter === 'top10') return r.rank <= 10;
    if (filter === 'top20') return r.rank <= 20;
    if (filter === 'score80') return r.score >= 80;
    return true;
  });

  const selectedResult = results.find((r) => r._id === selectedId) || null;

  const handleRerun = async () => {
    await dispatch(
      runScreening({
        jobId,
        jobTitle: job?.title || 'Job',
        candidateCount: job?.applicantCount || 0,
      })
    );
    dispatch(fetchScreeningResults({ jobId }));
  };

  const passingScore = job?.passingScore ?? 70;
  const shortlistedResults = results.filter((r) => r.shortlisted);
  const rejectedResults = results.filter((r) => !r.shortlisted && r.score < passingScore);
  const shortlistedCount = shortlistedResults.length;
  const shortlistedUnsent = shortlistedResults.filter((r) => r.emailStatus !== 'sent');
  const rejectedUnsent = rejectedResults.filter((r) => r.emailStatus !== 'sent');

  const interviewingPending = results.filter(
    (r) => r.emailStatus === 'sent' && r.interviewStatus === 'pending'
  );
  const offerUnsent = results.filter(
    (r) => r.interviewStatus === 'passed' && r.postInterviewEmailStatus !== 'sent'
  );
  const postInterviewDeclineUnsent = results.filter(
    (r) =>
      (r.interviewStatus === 'failed' || r.interviewStatus === 'no_show') &&
      r.postInterviewEmailStatus !== 'sent'
  );

  const handleBulkSend = async (
    type: 'shortlisted' | 'rejected' | 'offers' | 'post_interview_decline'
  ) => {
    const config: Record<typeof type, { targets: ScreeningResult[]; phase: 'invitation' | 'post_interview'; label: string; verb: string }> = {
      shortlisted: { targets: shortlistedUnsent, phase: 'invitation', label: 'shortlisted', verb: 'outreach' },
      rejected: { targets: rejectedUnsent, phase: 'invitation', label: 'rejected', verb: 'rejection' },
      offers: { targets: offerUnsent, phase: 'post_interview', label: 'passing', verb: 'offer' },
      post_interview_decline: {
        targets: postInterviewDeclineUnsent,
        phase: 'post_interview',
        label: 'non-passing',
        verb: 'post-interview decline',
      },
    };
    const { targets, phase, label, verb } = config[type];
    if (targets.length === 0) return;
    const confirmed = window.confirm(
      `Send ${verb} emails to ${targets.length} ${label} candidates?`
    );
    if (!confirmed) return;

    setBulkSending(true);
    try {
      await dispatch(
        sendOutreachBatch({ screeningResultIds: targets.map((r) => r._id), phase })
      ).unwrap();
      dispatch(fetchScreeningResults({ jobId }));
    } catch {
      // error handled in slice
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

  const barColor = (v: number) =>
    v >= 85 ? 'bg-emerald-500' : v >= 70 ? 'bg-amber-500' : 'bg-rose-500';

  const filters: Array<{ key: FilterKey; label: string; count?: number }> = [
    { key: 'shortlisted', label: `Shortlist (${job?.shortlistCap ?? 20})`, count: shortlistedCount },
    { key: 'interviewing', label: 'Interviewing', count: interviewingPending.length },
    { key: 'top10', label: 'Top 10' },
    { key: 'top20', label: 'Top 20' },
    { key: 'score80', label: 'Score ≥ 80' },
    { key: 'all', label: 'All', count: results.length },
  ];

  const canCompare = results.length >= 2;
  const compareIds = results.slice(0, 2).map((r) => r.candidateId._id).join(',');

  return (
    <div className="space-y-4 flex flex-col" style={{ height: 'calc(100vh - 100px)' }}>
      {/* HEADER */}
      <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 shrink-0">
        <div>
          <nav className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-1.5">
            <Link href="/jobs" className="hover:text-slate-900 transition-colors">Jobs</Link>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <Link href={`/jobs/${jobId}`} className="hover:text-slate-900 transition-colors truncate max-w-[140px]">{job?.title || '...'}</Link>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span className="text-indigo-700">Shortlist</span>
          </nav>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-tight">Shortlist</h1>
          <p className="text-[12px] text-slate-500 font-medium mt-0.5">
            <span className="tabular-nums">{job?.applicantCount ?? 0}</span> applicants ·{' '}
            <span className="tabular-nums">{results.length}</span> screened ·{' '}
            <span className="tabular-nums text-emerald-600 font-bold">{shortlistedCount}</span> shortlisted
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Bulk email actions */}
          {shortlistedUnsent.length > 0 && (
            <button
              onClick={() => handleBulkSend('shortlisted')}
              disabled={bulkSending}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-gradient-to-b from-emerald-500 to-emerald-600 text-white text-[11px] font-semibold shadow-[0_4px_12px_-4px_rgba(16,185,129,0.5),inset_0_1px_0_0_rgba(255,255,255,0.22)] disabled:opacity-50 transition press"
            >
              <span className="material-symbols-outlined text-[14px]">forward_to_inbox</span>
              Email shortlisted ({shortlistedUnsent.length})
            </button>
          )}
          {rejectedUnsent.length > 0 && (
            <button
              onClick={() => handleBulkSend('rejected')}
              disabled={bulkSending}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:border-slate-300 disabled:opacity-50 transition press"
            >
              <span className="material-symbols-outlined text-[14px]">mark_email_unread</span>
              Email rejected ({rejectedUnsent.length})
            </button>
          )}
          {offerUnsent.length > 0 && (
            <button
              onClick={() => handleBulkSend('offers')}
              disabled={bulkSending}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-gradient-to-b from-emerald-500 to-emerald-600 text-white text-[11px] font-semibold shadow-[0_4px_12px_-4px_rgba(16,185,129,0.5),inset_0_1px_0_0_rgba(255,255,255,0.22)] disabled:opacity-50 transition press"
            >
              <span className="material-symbols-outlined text-[14px]">celebration</span>
              Send offers ({offerUnsent.length})
            </button>
          )}
          {postInterviewDeclineUnsent.length > 0 && (
            <button
              onClick={() => handleBulkSend('post_interview_decline')}
              disabled={bulkSending}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:border-slate-300 disabled:opacity-50 transition press"
            >
              <span className="material-symbols-outlined text-[14px]">mark_email_unread</span>
              Post-interview decline ({postInterviewDeclineUnsent.length})
            </button>
          )}
          {canCompare && (
            <Link
              href={`/jobs/${jobId}/compare?candidates=${compareIds}`}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white border border-slate-200 text-[12px] font-semibold text-slate-700 hover:border-slate-300 press"
            >
              <span className="material-symbols-outlined text-[14px]">compare_arrows</span>
              Compare
            </Link>
          )}
          <button
            onClick={handleRerun}
            disabled={screening}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 text-white text-[12px] font-semibold shadow-[0_6px_16px_-8px_rgba(70,72,212,0.6),inset_0_1px_0_0_rgba(255,255,255,0.22)] hover:from-indigo-400 hover:to-indigo-600 disabled:opacity-50 transition press"
          >
            <span className="material-symbols-outlined text-[14px]">
              {screening ? 'progress_activity' : 'auto_awesome'}
            </span>
            {screening ? 'Running...' : 'Re-run'}
          </button>
        </div>
      </section>

      {/* FILTERS */}
      <section className="glass-panel rounded-xl p-1.5 flex flex-wrap items-center gap-1 shrink-0">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[11px] font-bold transition-colors ${
              filter === f.key
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-white/70'
            }`}
          >
            {f.label}
            {typeof f.count === 'number' && (
              <span className={`text-[9.5px] font-extrabold tabular-nums ${filter === f.key ? 'text-white/80' : 'text-slate-400'}`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
        <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Sorted by match score
        </span>
      </section>

      {/* MAIN SPLIT PANEL */}
      {loading ? (
        <div className="space-y-2 flex-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-white/60 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="glass-panel rounded-xl p-6 text-center flex-1">
          <span className="material-symbols-outlined text-rose-500 text-2xl mb-2 block">error</span>
          <p className="text-[12px] font-semibold text-rose-700">{error}</p>
          <button onClick={handleRerun} className="mt-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 text-white text-[11px] font-semibold press">
            Retry screening
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-xl p-10 text-center flex-1">
          <span className="material-symbols-outlined text-3xl text-slate-400/70 mb-2 block">analytics</span>
          <h3 className="text-[13px] font-bold text-slate-700">No screening results</h3>
          <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
            {results.length === 0 ? 'Run AI screening to evaluate candidates.' : 'No candidates match this filter.'}
          </p>
          <div className="mt-4">
            <button onClick={handleRerun} disabled={screening} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 text-white text-[11px] font-semibold press disabled:opacity-50">
              {screening ? 'Running...' : 'Run screening'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
          {/* LEFT: Candidate List — 4 of 12 cols */}
          <div className="lg:col-span-4 xl:col-span-3 glass-panel rounded-xl overflow-hidden flex flex-col min-h-0">
            <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">Candidates</span>
              <span className="text-[10px] font-bold text-slate-400 tabular-nums">{filtered.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence initial={false}>
                {filtered.map((r, idx) => {
                  const c = r.candidateId as any;
                  const name = `${c?.firstName || ''} ${c?.lastName || ''}`.trim() || 'Unknown';
                  const initials = `${c?.firstName?.[0] || ''}${c?.lastName?.[0] || ''}`.toUpperCase() || '?';
                  const isActive = selectedId === r._id;

                  return (
                    <motion.button
                      key={r._id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.2), duration: 0.22 }}
                      onClick={() => setSelectedId(r._id)}
                      className={`group w-full flex items-center gap-2 px-2.5 py-2 text-left transition-colors border-b border-slate-100/60 ${
                        isActive ? 'bg-indigo-50/70' : 'hover:bg-white/60'
                      }`}
                    >
                      <span className="w-5 text-center text-[10px] font-extrabold text-slate-400 tabular-nums shrink-0">{r.rank}</span>
                      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center text-[8px] font-bold shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-900 truncate leading-tight">{name}</p>
                        <p className="text-[9px] text-slate-500 truncate font-medium">{c?.headline || c?.email || '-'}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {r.emailStatus === 'sent' && (
                          <span className={`material-symbols-outlined text-[10px] text-emerald-500 transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
                        )}
                        <span className={`text-[12px] font-extrabold tabular-nums ${scoreColor(r.score)}`}>{r.score}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT: Candidate Detail — 8 of 12 cols */}
          <div className="lg:col-span-8 xl:col-span-9 glass-panel rounded-xl overflow-hidden flex flex-col min-h-0">
            {selectedResult ? (
              <CandidateDetail
                result={selectedResult}
                passingScore={passingScore}
                scoreColor={scoreColor}
                recStyle={recStyle}
                barColor={barColor}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div>
                  <span className="material-symbols-outlined text-3xl text-slate-300 mb-2 block">person_search</span>
                  <p className="text-[12px] text-slate-400 font-medium">Select a candidate to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ DETAIL PANEL ============ */
function CandidateDetail({
  result,
  passingScore,
  scoreColor,
  recStyle,
  barColor,
}: {
  result: ScreeningResult;
  passingScore: number;
  scoreColor: (s: number) => string;
  recStyle: (r: string) => string;
  barColor: (v: number) => string;
}) {
  const c = result.candidateId as any;
  const name = `${c?.firstName || ''} ${c?.lastName || ''}`.trim() || 'Unknown';
  const initials = `${c?.firstName?.[0] || ''}${c?.lastName?.[0] || ''}`.toUpperCase() || '?';
  const passed = result.score >= passingScore;

  return (
    <>
      {/* Sticky Header */}
      <div className="px-4 py-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/25 to-fuchsia-400/25 blur-md rounded-full" />
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center text-[12px] font-bold shadow-sm">
              {initials}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-extrabold text-slate-900 truncate">{name}</h2>
              <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${recStyle(result.recommendation)}`}>
                {result.recommendation}
              </span>
              {result.emailStatus === 'sent' && (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                  <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  Emailed
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              {c?.headline || c?.email || '-'} {c?.location ? `· ${c.location}` : ''}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-[22px] font-extrabold tabular-nums leading-none ${scoreColor(result.score)}`}>{result.score}</p>
            <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">score</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Top Row: AI Evaluation & Candidate Profile */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Score Breakdown */}
            <div className="bg-white/70 border border-slate-100 rounded-lg p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-4">AI Evaluation Criteria</p>
              <div className="space-y-3.5">
                {[
                  { label: 'Technical Skills', value: result.technicalSkillsScore },
                  { label: 'Experience Level', value: result.experienceScore },
                  { label: 'Education Quality', value: result.educationScore },
                  { label: 'Project Impact', value: result.projectImpactScore },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-700">{item.label}</span>
                      <span className="text-[11px] font-extrabold text-slate-900 tabular-nums">{item.value}/100</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-indigo-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Candidate Profile */}
            {c ? (
              <div className="bg-white/70 border border-slate-100 rounded-lg p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-3 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">badge</span>
                  Candidate Profile
                </p>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  {c.email && (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Email</p>
                      <p className="text-slate-700 font-medium truncate" title={c.email}>{c.email}</p>
                    </div>
                  )}
                  {c.phone && (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Phone</p>
                      <p className="text-slate-700 font-medium">{c.phone}</p>
                    </div>
                  )}
                  {c.location && (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Location</p>
                      <p className="text-slate-700 font-medium">{c.location}</p>
                    </div>
                  )}
                  {c.source && (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Source</p>
                      <p className="text-slate-700 font-medium">{c.source}</p>
                    </div>
                  )}
                </div>
                {/* Skills */}
                {c.skills && c.skills.length > 0 && (
                  <div className="mt-3.5">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {c.skills.map((s: any, i: number) => (
                        <span key={i} className="inline-flex items-center h-5 px-2 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[9px] font-semibold">
                          {s.name || s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Social */}
                {(c.socialLinks?.linkedin || c.socialLinks?.github) && (
                  <div className="mt-3.5 flex gap-3">
                    {c.socialLinks.linkedin && (
                      <a href={c.socialLinks.linkedin} target="_blank" rel="noopener" className="text-[10px] font-semibold text-indigo-600 hover:underline flex items-center gap-0.5">
                        LinkedIn <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                      </a>
                    )}
                    {c.socialLinks.github && (
                      <a href={c.socialLinks.github} target="_blank" rel="noopener" className="text-[10px] font-semibold text-slate-600 hover:underline flex items-center gap-0.5">
                        GitHub <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/70 border border-slate-100 rounded-lg p-4 flex items-center justify-center">
                <p className="text-[11px] text-slate-400 font-medium">Profile data missing</p>
              </div>
            )}
          </div>

          {/* Rank + Confidence + Status row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/70 border border-slate-100 rounded-lg px-3 py-2 flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">Rank</span>
              <span className="text-[14px] font-extrabold text-slate-900 tabular-nums">#{result.rank}</span>
            </div>
            <div className="bg-white/70 border border-slate-100 rounded-lg px-3 py-2 flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">Confidence</span>
              <span className="text-[14px] font-extrabold text-indigo-600 tabular-nums">{result.confidence}%</span>
            </div>
            <div className="bg-white/70 border border-slate-100 rounded-lg px-3 py-2 flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">Pass</span>
              <span className={`text-[11px] font-bold ${passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                {passed ? 'Yes' : 'No'} ({passingScore}%)
              </span>
            </div>
          </div>

          {/* Strengths + Gaps side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white/70 border border-emerald-100 rounded-lg p-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-700 mb-2">
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
            <div className="bg-white/70 border border-amber-100 rounded-lg p-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-700 mb-2">
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
            <div className="bg-indigo-50/60 border-l-2 border-indigo-500 rounded-r-lg p-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-indigo-700 mb-1">AI Summary</p>
              <p className="text-[11px] text-slate-700 leading-relaxed font-medium">{result.summary}</p>
            </div>
          )}

          {/* Email Panel — show for BOTH passed and rejected */}
          <OutreachPanel
            result={result}
            variant={passed ? 'outreach' : 'rejection'}
          />

          {/* Interview decision + post-interview email — only after invitation sent */}
          {result.emailStatus === 'sent' && (
            <InterviewDecisionSection result={result} />
          )}
        </div>
      </div>
    </>
  );
}

function InterviewDecisionSection({ result }: { result: ScreeningResult }) {
  const dispatch = useAppDispatch();
  const [saving, setSaving] = useState<InterviewStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const status = result.interviewStatus;
  const postSent = result.postInterviewEmailStatus === 'sent';

  const decide = async (decision: Exclude<InterviewStatus, 'pending'>) => {
    if (status === decision) return;
    if (status !== 'pending') {
      const ok = window.confirm(
        `Change interview outcome to "${decision.replace('_', ' ')}"? This will overwrite the current draft.`
      );
      if (!ok) return;
    }
    setSaving(decision);
    setError(null);
    try {
      await dispatch(setInterviewDecision({ resultId: result._id, decision })).unwrap();
    } catch (e: any) {
      setError(e.message || 'Failed to save decision.');
    } finally {
      setSaving(null);
    }
  };

  const buttons: Array<{ key: Exclude<InterviewStatus, 'pending'>; label: string; tone: string; activeTone: string }> = [
    {
      key: 'passed',
      label: 'Passed',
      tone: 'border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-700',
      activeTone: 'border-emerald-500 bg-emerald-50 text-emerald-700',
    },
    {
      key: 'failed',
      label: "Didn't pass",
      tone: 'border-slate-200 text-slate-700 hover:border-rose-300 hover:text-rose-700',
      activeTone: 'border-rose-500 bg-rose-50 text-rose-700',
    },
    {
      key: 'no_show',
      label: 'No show',
      tone: 'border-slate-200 text-slate-700 hover:border-amber-300 hover:text-amber-700',
      activeTone: 'border-amber-500 bg-amber-50 text-amber-700',
    },
  ];

  return (
    <div className="bg-white/70 border border-slate-100 rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">how_to_reg</span>
          Interview Outcome
        </p>
        {status !== 'pending' && (
          <span
            className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
              status === 'passed'
                ? 'bg-emerald-50 text-emerald-700'
                : status === 'failed'
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-amber-50 text-amber-700'
            }`}
          >
            {status === 'no_show' ? 'No show' : status}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {buttons.map((b) => {
          const isActive = status === b.key;
          const isSaving = saving === b.key;
          return (
            <button
              key={b.key}
              onClick={() => decide(b.key)}
              disabled={postSent || saving !== null}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[11px] font-semibold transition press disabled:opacity-50 ${
                isActive ? b.activeTone : `bg-white ${b.tone}`
              }`}
            >
              {isSaving && (
                <span className="material-symbols-outlined text-[12px] animate-spin">progress_activity</span>
              )}
              {b.label}
            </button>
          );
        })}
        {postSent && (
          <span className="text-[10px] font-medium text-slate-500 self-center">
            Decision locked — email already sent.
          </span>
        )}
      </div>

      {error && (
        <p className="text-[10px] font-medium text-rose-600">{error}</p>
      )}

      {status !== 'pending' && (
        <OutreachPanel
          result={result}
          phase="post_interview"
          variant={status === 'passed' ? 'offer' : 'rejection'}
        />
      )}
    </div>
  );
}
