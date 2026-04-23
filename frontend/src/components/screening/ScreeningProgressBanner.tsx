'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { dismissActiveScreening, type ActiveScreening } from '../../store/screeningSlice';

/**
 * A fixed-position, globally mounted banner that tracks all in-flight screenings.
 * Survives navigation because it reads from Redux.
 *
 * Progress is simulated from elapsed time with an asymptotic curve:
 * `p = 100 * (1 - exp(-t / 12))`, which reaches ~90% at ~28 seconds, then
 * snaps to 100% when the screening fulfills. This avoids a "stuck at 0 → jump
 * to 100" UX while being honest about the fact that a single Gemini call has
 * no streaming progress signal.
 */
export default function ScreeningProgressBanner() {
  const dispatch = useAppDispatch();
  const activeScreenings = useAppSelector((s) => s.screening.activeScreenings);

  // Force re-render every 500ms so time-based progress animates smoothly.
  const [, setTick] = useState(0);
  useEffect(() => {
    const running = Object.values(activeScreenings).some((a) => a.status === 'running');
    if (!running) return;
    const interval = setInterval(() => setTick((n) => n + 1), 500);
    return () => clearInterval(interval);
  }, [activeScreenings]);

  // Auto-dismiss finished screenings 6s after they finish.
  useEffect(() => {
    const finished = Object.values(activeScreenings).filter(
      (a) => a.status === 'succeeded' || a.status === 'failed'
    );
    const timeouts = finished.map((a) =>
      setTimeout(() => {
        dispatch(dismissActiveScreening(a.jobId));
      }, 6000)
    );
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [activeScreenings, dispatch]);

  const entries = Object.values(activeScreenings);
  if (entries.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[70] flex flex-col gap-3 items-end pointer-events-none">
      {entries.map((entry) => (
        <BannerCard key={entry.jobId} entry={entry} />
      ))}
    </div>
  );
}

function BannerCard({ entry }: { entry: ActiveScreening }) {
  const dispatch = useAppDispatch();
  const elapsedSec = (Date.now() - entry.startedAt) / 1000;

  let percent: number;
  let statusLabel: string;
  let tone: 'running' | 'success' | 'error';

  if (entry.status === 'succeeded') {
    percent = 100;
    statusLabel = 'Complete';
    tone = 'success';
  } else if (entry.status === 'failed') {
    percent = 100;
    statusLabel = 'Failed';
    tone = 'error';
  } else {
    percent = Math.min(94, Math.round((1 - Math.exp(-elapsedSec / 12)) * 100));
    if (elapsedSec < 3) statusLabel = 'Preparing evaluation…';
    else if (percent < 45) statusLabel = 'Extracting candidate profiles…';
    else if (percent < 75) statusLabel = 'Scoring against job criteria…';
    else statusLabel = 'Finalizing results…';
    tone = 'running';
  }

  const barColor =
    tone === 'success'
      ? 'bg-emerald-500'
      : tone === 'error'
        ? 'bg-rose-500'
        : 'bg-gradient-to-r from-indigo-500 to-secondary';

  const iconName = tone === 'success' ? 'check_circle' : tone === 'error' ? 'error' : 'auto_awesome';
  const iconColor =
    tone === 'success'
      ? 'text-emerald-600'
      : tone === 'error'
        ? 'text-rose-600'
        : 'text-indigo-600';

  return (
    <div className="pointer-events-auto w-[340px] bg-white border border-outline-variant/30 shadow-2xl rounded-xl overflow-hidden">
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 ${iconColor}`}
          >
            <span
              className={`material-symbols-outlined text-lg ${
                tone === 'running' ? 'animate-pulse' : ''
              }`}
            >
              {iconName}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  AI Screening
                </p>
                <p className="text-sm font-bold text-on-surface truncate">{entry.jobTitle}</p>
              </div>
              {tone !== 'running' && (
                <button
                  onClick={() => dispatch(dismissActiveScreening(entry.jobId))}
                  className="text-on-surface-variant hover:text-on-surface -mt-1 -mr-1"
                  aria-label="Dismiss"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1 truncate">
              {statusLabel}
              {entry.candidateCount > 0 && tone === 'running' && (
                <> · {entry.candidateCount} candidate{entry.candidateCount === 1 ? '' : 's'}</>
              )}
            </p>
          </div>
          <span className="text-xs font-bold text-on-surface tabular-nums shrink-0">
            {percent}%
          </span>
        </div>
      </div>

      <div className="h-1.5 w-full bg-surface-container-low overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-500 ease-out`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {tone === 'success' && (
        <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-100">
          <Link
            href={`/jobs/${entry.jobId}/shortlist`}
            onClick={() => dispatch(dismissActiveScreening(entry.jobId))}
            className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
          >
            View shortlist
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      )}

      {tone === 'error' && entry.message && (
        <div className="px-4 py-2 bg-rose-50 border-t border-rose-100">
          <p className="text-[11px] font-semibold text-rose-700 line-clamp-2">{entry.message}</p>
        </div>
      )}
    </div>
  );
}
