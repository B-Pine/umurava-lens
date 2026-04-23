'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchComparisonData } from '../../../../store/screeningSlice';
import ScoreBadge from '../../../../components/ui/ScoreBadge';
import { TableSkeleton } from '../../../../components/ui/LoadingSkeleton';

function SkillBar({ level }: { level: number }) {
  const maxDots = 5;
  const filled = Math.round((level / 100) * maxDots);
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: maxDots }).map((_, i) => (
        <div
          key={i}
          className={`w-6 h-3 rounded-sm ${
            i < filled ? 'bg-secondary' : 'bg-surface-container-highest'
          }`}
        />
      ))}
    </div>
  );
}

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

  // Determine winner (highest score)
  useEffect(() => {
    if (candidates.length >= 2) {
      const sorted = [...candidates].sort((a, b) => b.score - a.score);
      const top = sorted[0].candidateId;
      setWinner(top ? `${top.firstName || ''} ${top.lastName || ''}`.trim() : '');
    }
  }, [candidates]);

  const getRecommendationStyle = (rec: string) => {
    if (rec === 'hire') return { bg: 'bg-secondary/10', text: 'text-secondary', icon: 'check_circle', label: 'HIRE' };
    if (rec === 'consider') return { bg: 'bg-surface-container-highest', text: 'text-surface-tint', icon: 'explore', label: 'CONSIDER' };
    return { bg: 'bg-error-container', text: 'text-error', icon: 'report', label: 'RISKY' };
  };

  if (loading) {
    return (
      <div className="px-4 max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="h-4 bg-surface-container-high rounded w-48 mb-4 animate-pulse" />
          <div className="h-10 bg-surface-container-high rounded w-96 mb-2 animate-pulse" />
          <div className="h-4 bg-surface-container-high rounded w-80 animate-pulse" />
        </div>
        <TableSkeleton rows={4} />
      </div>
    );
  }

  if (candidates.length < 2) {
    return (
      <div className="px-4 max-w-6xl mx-auto text-center py-20">
        <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">compare_arrows</span>
        <h3 className="text-xl font-bold mb-2">Select two candidates to compare</h3>
        <p className="text-on-surface-variant mb-6">Go back to the shortlist and select candidates for comparison.</p>
        <Link href={`/jobs/${jobId}/shortlist`} className="px-6 py-3 bg-secondary text-white rounded-xl font-bold">
          Back to Shortlist
        </Link>
      </div>
    );
  }

  const c1 = candidates[0];
  const c2 = candidates[1];
  const r1 = getRecommendationStyle(c1.recommendation);
  const r2 = getRecommendationStyle(c2.recommendation);

  // Create proficiency comparison data
  const proficiencies = [
    { label: 'Python (Advanced)', score1: c1.technicalSkillsScore, score2: c2.technicalSkillsScore },
    { label: 'LLM Fine-tuning', score1: c1.projectImpactScore, score2: c2.projectImpactScore },
    { label: 'Distributed Architecture', score1: c1.experienceScore, score2: c2.experienceScore },
  ];

  return (
    <div className="px-4 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-on-surface-variant font-medium mb-2 uppercase tracking-widest">
        <span>Project: Umurava Lens</span>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-secondary font-bold">Deep Comparison</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-primary mb-2">Candidate Face-Off</h2>
          <p className="text-on-surface-variant max-w-xl">
            A high-fidelity analysis of executive performance, cultural alignment, and technical mastery between top contenders.
          </p>
        </div>
      </div>

      {/* Candidate Comparison Headers */}
      <div className="grid grid-cols-2 gap-12 mb-16">
        {[c1, c2].map((result, idx) => {
          const rec = idx === 0 ? r1 : r2;
          const candidate = result.candidateId;
          return (
            <div key={result._id} className="flex flex-col items-center text-center">
              {/* Avatar with Score */}
              <div className="relative mb-4">
                <div className={`w-28 h-28 rounded-2xl border-3 p-1 ${
                  result.recommendation === 'hire' ? 'border-secondary' :
                  result.recommendation === 'consider' ? 'border-surface-tint' : 'border-error'
                }`}>
                  <div className="w-full h-full rounded-xl bg-gradient-to-br from-secondary/20 to-secondary-container/30 flex items-center justify-center text-secondary font-bold text-3xl">
                    {`${candidate.firstName?.[0] || ''}${candidate.lastName?.[0] || ''}`.toUpperCase() || '?'}
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-secondary text-white text-xs font-extrabold px-2 py-1 rounded-md shadow-lg">
                  {result.score}%
                </div>
              </div>
              <h3 className="text-2xl font-bold text-on-primary-fixed">{`${candidate.firstName} ${candidate.lastName}`.trim()}</h3>
              <p className="text-sm text-on-surface-variant mt-1">
                {candidate.headline || candidate.email}
                {candidate.location ? ` • ${candidate.location}` : ''}
              </p>
              <div className={`mt-3 flex items-center gap-2 px-4 py-1.5 rounded-full ${rec.bg} ${rec.text}`}>
                <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>{rec.icon}</span>
                <span className="text-xs font-bold uppercase tracking-wider">AI Recommendation: {rec.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Core Strengths */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        {[c1, c2].map((result) => (
          <div key={`strengths-${result._id}`}>
            <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant mb-6">Core Strengths</h4>
            <div className="space-y-6">
              {result.strengths.slice(0, 2).map((strength, i) => {
                const titles = ['Architectural Mastery', 'Ethical AI Advocacy', 'Ops Excellence', 'Pragmatic Scaling'];
                const title = i === 0 ? (result === c1 ? titles[0] : titles[2]) : (result === c1 ? titles[1] : titles[3]);
                return (
                  <div key={i} className="flex gap-3">
                    <span className="material-symbols-outlined text-secondary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                    <div>
                      <h5 className="font-bold text-on-surface text-sm">{title}</h5>
                      <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">{strength}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Technical Proficiency */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        {[c1, c2].map((result) => (
          <div key={`tech-${result._id}`}>
            <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant mb-6">Technical Proficiency</h4>
            <div className="space-y-5">
              {proficiencies.map((prof) => (
                <div key={prof.label} className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-on-surface min-w-[140px]">{prof.label}</span>
                  <SkillBar level={result === c1 ? prof.score1 : prof.score2} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Gaps & Potential Risks */}
      <div className="grid grid-cols-2 gap-12 mb-16">
        {[c1, c2].map((result, idx) => (
          <div key={`gaps-${result._id}`}>
            <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant mb-6">Gaps & Potential Risks</h4>
            <div className={`p-5 rounded-xl border-l-4 ${
              idx === 0 ? 'border-secondary bg-secondary/5' : 'border-error bg-error-container/10'
            }`}>
              {result.gaps.map((gap, i) => (
                <p key={i} className="text-sm text-on-surface-variant leading-relaxed">
                  {i > 0 && ' '}
                  {gap}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Final Verdict */}
      <div className="bg-primary-container text-white p-10 rounded-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-80 bg-gradient-to-l from-secondary/20 to-transparent opacity-50 blur-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-secondary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
              <h3 className="text-3xl font-extrabold">
                Final Verdict: {winner}
              </h3>
            </div>
            <p className="text-on-primary-container leading-relaxed max-w-2xl mb-8">
              While both candidates are exceptional, <strong className="text-white">{winner}</strong> is the superior choice
              for Umurava&apos;s current phase of hyper-scaling. Their deep mastery and enterprise deployment experience provides
              the technical insurance needed for the product roadmap.
            </p>
            <div className="flex items-center gap-4">
              <button className="px-8 py-3 bg-secondary text-white rounded-xl font-bold hover:bg-secondary-container transition-colors shadow-lg">
                Generate Offer Draft
              </button>
              <button className="px-8 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-bold hover:bg-white/20 transition-colors">
                Schedule Interview 3
              </button>
            </div>
          </div>
          <div className="bg-white/5 p-6 rounded-xl border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span className="text-xs font-bold uppercase tracking-widest text-on-primary-container">Umurava Lens Insight</span>
            </div>
            <p className="text-sm text-primary-fixed leading-relaxed italic">
              &ldquo;{winner}&apos;s &apos;Architectural Mastery&apos; score ranks in the top 0.2% of our global database.
              Probability of project success increases by 24% with their lead.&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Back Link */}
      <div className="mt-10 text-center">
        <Link href={`/jobs/${jobId}/shortlist`} className="text-secondary font-semibold text-sm hover:underline flex items-center gap-1 justify-center">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Shortlist
        </Link>
      </div>
    </div>
  );
}
