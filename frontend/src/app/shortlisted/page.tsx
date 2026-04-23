'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchShortlisted } from '../../store/screeningSlice';

export default function ShortlistedPage() {
  const dispatch = useAppDispatch();
  const { shortlisted } = useAppSelector((s) => s.screening);
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await dispatch(fetchShortlisted());
      setLoading(false);
    })();
  }, [dispatch]);

  const jobs = useMemo(() => {
    const map = new Map<string, { _id: string; title: string }>();
    for (const r of shortlisted) {
      const j = (r as any).jobId;
      if (j && j._id && !map.has(j._id)) {
        map.set(j._id, { _id: j._id, title: j.title });
      }
    }
    return Array.from(map.values());
  }, [shortlisted]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return shortlisted.filter((r) => {
      const c = r.candidateId as any;
      const j = (r as any).jobId;
      if (jobFilter !== 'all' && j?._id !== jobFilter) return false;
      if (!q) return true;
      const name = `${c?.firstName || ''} ${c?.lastName || ''}`.toLowerCase();
      const headline = (c?.headline || '').toLowerCase();
      const title = (j?.title || '').toLowerCase();
      const email = (c?.email || '').toLowerCase();
      return name.includes(q) || headline.includes(q) || title.includes(q) || email.includes(q);
    });
  }, [shortlisted, jobFilter, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-primary-fixed flex items-center gap-2">
            <span
              className="material-symbols-outlined text-secondary text-3xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              workspace_premium
            </span>
            Shortlisted
          </h1>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-secondary">{shortlisted.length}</span>
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            candidates
          </span>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, headline, or role"
            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg pl-9 pr-3 h-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-secondary/20"
          />
        </div>
        <div className="md:w-64">
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 h-10 text-sm font-semibold focus:ring-2 focus:ring-secondary/20 cursor-pointer"
          >
            <option value="all">All roles</option>
            {jobs.map((j) => (
              <option key={j._id} value={j._id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-surface-container-low rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/40">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2 block">
            auto_awesome
          </span>
          <h3 className="text-base font-bold text-on-surface">
            {shortlisted.length === 0
              ? 'No shortlisted candidates yet'
              : 'No candidates match your filters'}
          </h3>
          <p className="text-sm text-on-surface-variant mt-1">
            {shortlisted.length === 0 ? 'Run a screening to populate the shortlist.' : 'Try clearing filters.'}
          </p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-hidden divide-y divide-outline-variant/10">
          {/* Column header (hidden on mobile) */}
          <div className="hidden md:grid grid-cols-[auto_minmax(0,2fr)_minmax(0,1.3fr)_auto_auto_auto] items-center gap-4 px-4 py-2 bg-surface-container-low text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            <span className="w-7 text-center">#</span>
            <span>Candidate</span>
            <span>Role</span>
            <span className="w-16 text-right">Score</span>
            <span className="w-20 text-center">Rec.</span>
            <span className="w-24 text-right">Outreach</span>
          </div>

          {filtered.map((r, idx) => {
            const c = r.candidateId as any;
            const j = (r as any).jobId;
            const initials =
              `${c?.firstName?.[0] || ''}${c?.lastName?.[0] || ''}`.toUpperCase() || '?';
            const recStyle =
              r.recommendation === 'hire'
                ? 'bg-secondary/10 text-secondary'
                : r.recommendation === 'consider'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-rose-100 text-rose-700';
            const emailStyle =
              r.emailStatus === 'sent'
                ? 'text-emerald-600'
                : r.emailStatus === 'failed'
                  ? 'text-rose-600'
                  : 'text-on-surface-variant';

            return (
              <Link
                key={r._id}
                href={`/jobs/${j?._id}/shortlist`}
                className="group grid grid-cols-[auto_minmax(0,2fr)_minmax(0,1.3fr)_auto_auto_auto] items-center gap-4 px-4 py-3 hover:bg-surface-container-low transition-colors"
              >
                <span className="w-7 text-center text-xs font-bold text-on-surface-variant tabular-nums">
                  {idx + 1}
                </span>

                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-secondary/25 to-secondary-container/30 flex items-center justify-center text-secondary font-bold text-xs shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">
                      {`${c?.firstName || ''} ${c?.lastName || ''}`.trim() || 'Unknown'}
                    </p>
                    <p className="text-[11px] text-on-surface-variant truncate">
                      {c?.headline || c?.email}
                    </p>
                  </div>
                </div>

                <p className="text-xs font-semibold text-on-surface-variant truncate hidden md:block">
                  {j?.title || '—'}
                </p>

                <div className="w-16 text-right">
                  <span className="text-lg font-extrabold text-secondary tabular-nums">
                    {r.score}
                  </span>
                </div>

                <span
                  className={`w-20 text-center text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${recStyle}`}
                >
                  {r.recommendation}
                </span>

                <span
                  className={`w-24 text-right text-[10px] font-bold uppercase tracking-widest ${emailStyle}`}
                >
                  {r.emailStatus === 'sent' ? '✓ Sent' : r.emailStatus === 'failed' ? '⚠ Failed' : 'Pending'}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
