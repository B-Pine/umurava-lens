'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchScreeningResults, runScreening } from '../../../../store/screeningSlice';
import ScoreBadge from '../../../../components/ui/ScoreBadge';
import { TableSkeleton } from '../../../../components/ui/LoadingSkeleton';
import EmptyState from '../../../../components/ui/EmptyState';

export default function ShortlistPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const jobId = params.id as string;
  const { results, job, loading, screening, error } = useAppSelector((s) => s.screening);
  const [filter, setFilter] = useState<'all' | 'top10' | 'top20' | 'score80'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchScreeningResults({ jobId }));
  }, [dispatch, jobId]);

  const getRecommendationStyle = (rec: string) => {
    if (rec === 'hire') return { bg: 'bg-secondary/10', text: 'text-secondary', icon: 'check_circle' };
    if (rec === 'consider') return { bg: 'bg-surface-container-highest', text: 'text-surface-tint', icon: 'explore' };
    return { bg: 'bg-error-container', text: 'text-error', icon: 'report' };
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-secondary';
    if (score >= 70) return 'text-surface-tint';
    return 'text-error';
  };

  const filteredResults = results.filter((r) => {
    if (filter === 'top10') return r.rank <= 10;
    if (filter === 'top20') return r.rank <= 20;
    if (filter === 'score80') return r.score >= 80;
    return true;
  });

  const handleRerun = async () => {
    await dispatch(runScreening(jobId));
    dispatch(fetchScreeningResults({ jobId }));
  };

  return (
    <div className="px-4">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
        <div>
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant font-medium mb-2 uppercase tracking-widest">
            <Link href="/jobs" className="hover:text-secondary">Jobs</Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span>{job?.title ?? 'Loading...'}</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-secondary">Shortlist</span>
          </nav>
          <h2 className="text-4xl font-extrabold tracking-tight text-primary">
            Shortlist for <span className="text-secondary-container">{job?.title ?? '...'}</span>
          </h2>
          <p className="text-on-surface-variant mt-2 max-w-2xl">
            AI-driven analysis of {job?.applicantCount ?? 0} applicants. Shortlist generated based on technical proficiency, leadership trajectory, and cognitive matching scores.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {results.length >= 2 && (
            <Link
              href={`/jobs/${jobId}/compare?candidates=${results.slice(0, 2).map((r) => r.candidateId._id).join(',')}`}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold transition-all hover:opacity-90"
            >
              <span className="material-symbols-outlined text-sm">compare_arrows</span>
              Compare Candidates
            </Link>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-3 mb-8">
        {[
          { key: 'all', label: 'All' },
          { key: 'top10', label: 'Top 10' },
          { key: 'top20', label: 'Top 20' },
          { key: 'score80', label: 'Score Range (80%+)' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as typeof filter)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
              filter === f.key
                ? 'bg-secondary text-white shadow-md shadow-secondary/10'
                : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/10 hover:bg-surface-container'
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-sm">filter_list</span>
          <span>Sorted by Match Score</span>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <TableSkeleton rows={4} />
      ) : error ? (
        <div className="bg-error-container/20 p-8 rounded-xl text-center">
          <span className="material-symbols-outlined text-error text-4xl mb-2">error</span>
          <p className="text-error font-semibold">{error}</p>
          <button onClick={handleRerun} className="mt-4 px-6 py-2 bg-secondary text-white rounded-lg font-bold">
            Retry Screening
          </button>
        </div>
      ) : filteredResults.length === 0 ? (
        <EmptyState
          icon="analytics"
          title="No Screening Results"
          description="Run AI screening to generate candidate rankings for this job."
          action={{ label: screening ? 'Running...' : 'Run AI Screening', onClick: handleRerun }}
        />
      ) : (
        <div className="space-y-6">
          {filteredResults.map((result) => {
            const candidate = result.candidateId;
            const recStyle = getRecommendationStyle(result.recommendation);
            const isExpanded = expandedId === result._id;

            return (
              <div
                key={result._id}
                className={`bg-surface-container-lowest rounded-xl overflow-hidden group ${
                  result.recommendation === 'risky' ? 'opacity-80 hover:opacity-100 transition-opacity' : ''
                }`}
              >
                <div className="p-8 flex items-start gap-8">
                  {/* Rank & Avatar */}
                  <div className="flex flex-col items-center">
                    <span className={`text-2xl font-black mb-3 ${result.rank <= 2 ? 'text-secondary-container' : 'text-on-surface-variant'}`}>
                      #{result.rank}
                    </span>
                    <div className={`w-16 h-16 rounded-full border-2 p-0.5 ${
                      result.recommendation === 'hire' ? 'border-secondary' :
                      result.recommendation === 'consider' ? 'border-surface-tint' : 'border-error'
                    }`}>
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-secondary/20 to-secondary-container/20 flex items-center justify-center text-secondary font-bold text-lg">
                        {candidate.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                    </div>
                  </div>

                  {/* Main Info */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-on-primary-fixed mb-1">{candidate.fullName}</h3>
                        <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                          <span>{candidate.currentTitle} @ {candidate.currentCompany}</span>
                          <span className="w-1 h-1 bg-outline-variant rounded-full" />
                          <span>{candidate.location}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`flex items-center gap-2 px-3 py-1 ${recStyle.bg} ${recStyle.text} rounded-full`}>
                          <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>{recStyle.icon}</span>
                          <span className="text-xs font-bold uppercase tracking-wider">{result.recommendation}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-[10px] uppercase text-on-surface-variant font-bold">Match Score</p>
                            <p className={`text-2xl font-black ${getScoreColor(result.score)}`}>{result.score}%</p>
                          </div>
                          <ScoreBadge score={result.score} />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content for #1 or toggled */}
                    {(result.rank === 1 || isExpanded) && (
                      <div className="mt-6 pt-6 border-t border-surface-container-low">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <h4 className="flex items-center gap-2 text-xs font-bold uppercase text-on-surface-variant tracking-widest mb-4">
                              <span className="material-symbols-outlined text-secondary text-sm">bolt</span>
                              Strengths
                            </h4>
                            <ul className="space-y-2 text-sm text-on-surface">
                              {result.strengths.map((s, i) => (
                                <li key={i} className="flex gap-2">
                                  <span className="text-secondary font-bold">&bull;</span>
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="flex items-center gap-2 text-xs font-bold uppercase text-on-surface-variant tracking-widest mb-4">
                              <span className="material-symbols-outlined text-error text-sm">warning</span>
                              Gaps &amp; Risks
                            </h4>
                            <ul className="space-y-2 text-sm text-on-surface">
                              {result.gaps.map((g, i) => (
                                <li key={i} className="flex gap-2">
                                  <span className="text-error font-bold">&bull;</span>
                                  {g}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <div className="mt-6 p-4 bg-tertiary-container/5 rounded-xl border-l-4 border-tertiary-container">
                          <p className="text-sm font-semibold text-on-tertiary-fixed mb-1">Final AI Recommendation</p>
                          <p className="text-sm text-on-surface-variant leading-relaxed">{result.summary}</p>
                        </div>
                      </div>
                    )}

                    {/* Collapsed summary for non-#1 */}
                    {result.rank !== 1 && !isExpanded && (
                      <div className="mt-4 flex items-center gap-6">
                        <span className="text-sm font-semibold text-on-surface">
                          {result.recommendation === 'risky' ? 'Critical Gaps:' : 'Top Strengths:'}
                        </span>
                        <div className="flex gap-2">
                          {(result.recommendation === 'risky' ? result.gaps : result.strengths).slice(0, 3).map((item, i) => (
                            <span
                              key={i}
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                result.recommendation === 'risky'
                                  ? 'bg-error-container/20 text-error font-bold'
                                  : 'bg-surface-container text-on-surface-variant'
                              }`}
                            >
                              {item.length > 30 ? item.slice(0, 30) + '...' : item}
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : result._id)}
                          className={`ml-auto text-sm font-bold flex items-center gap-1 ${
                            result.recommendation === 'risky' ? 'text-on-surface-variant' : 'text-secondary'
                          }`}
                        >
                          View AI Lens
                          <span className="material-symbols-outlined text-lg">keyboard_arrow_down</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Section */}
      {filteredResults.length > 0 && (
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 p-8 bg-primary-container text-white rounded-2xl flex items-center justify-between overflow-hidden relative">
            <div className="relative z-10">
              <h4 className="text-2xl font-bold mb-2">Need a deeper analysis?</h4>
              <p className="text-on-primary-container text-sm max-w-sm">
                Compare technical stack overlap and leadership potential side-by-side for your top candidates.
              </p>
              {results.length >= 2 && (
                <Link
                  href={`/jobs/${jobId}/compare?candidates=${results.slice(0, 2).map((r) => r.candidateId._id).join(',')}`}
                  className="mt-6 px-8 py-3 bg-secondary text-white rounded-xl font-bold hover:bg-secondary-container transition-colors inline-block"
                >
                  Launch Side-by-Side Comparison
                </Link>
              )}
            </div>
            <div className="absolute right-0 top-0 h-full w-48 bg-gradient-to-l from-secondary/20 to-transparent opacity-50 blur-3xl" />
            <span className="material-symbols-outlined text-[120px] text-white/5 absolute -right-4 -bottom-4 rotate-12 select-none">analytics</span>
          </div>
          <div className="p-8 bg-surface-container-low rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-secondary mb-4">
                <span className="material-symbols-outlined">auto_awesome</span>
                <span className="text-xs font-bold uppercase tracking-widest">AI Status</span>
              </div>
              <h5 className="font-bold text-lg mb-2">Calibration Complete</h5>
              <p className="text-sm text-on-surface-variant">
                Results generated using your custom AI weight configuration. Adjust weights to re-run with different priorities.
              </p>
            </div>
            <button
              onClick={handleRerun}
              disabled={screening}
              className="mt-6 text-sm font-bold text-secondary flex items-center gap-2 disabled:opacity-50"
            >
              {screening ? 'Re-running...' : 'Re-run Screening'}
              <span className="material-symbols-outlined text-lg">tune</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
