'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCandidates } from '../../store/candidatesSlice';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';

export default function CandidatesPage() {
  const dispatch = useAppDispatch();
  const { candidates, loading, total } = useAppSelector((s) => s.candidates);

  useEffect(() => {
    dispatch(fetchCandidates({}));
  }, [dispatch]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-primary-fixed">Candidates</h2>
          <p className="text-on-surface-variant mt-1">{total} total candidates in the system</p>
        </div>
        <Link
          href="/candidates/upload"
          className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-md font-semibold text-sm shadow-lg hover:opacity-90 transition-all"
        >
          <span className="material-symbols-outlined text-lg">upload</span>
          Upload Candidates
        </Link>
      </div>

      {loading ? (
        <TableSkeleton rows={5} />
      ) : candidates.length === 0 ? (
        <EmptyState
          icon="group_off"
          title="No Candidates Yet"
          description="Upload candidates to start building your talent pool."
          action={{ label: 'Upload Candidates', onClick: () => window.location.href = '/candidates/upload' }}
        />
      ) : (
        <div className="space-y-3">
          {candidates.map((c) => (
            <div key={c._id} className="bg-surface-container-lowest p-5 rounded-xl flex items-center gap-6 hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-secondary to-secondary-container flex items-center justify-center text-white font-bold text-lg">
                {c.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-on-surface">{c.fullName}</h4>
                <p className="text-sm text-on-surface-variant">{c.currentTitle} at {c.currentCompany}</p>
                <div className="flex gap-2 mt-2">
                  {c.skills.slice(0, 4).map((skill) => (
                    <span key={skill} className="px-2 py-0.5 bg-surface-container text-on-surface-variant text-[10px] font-medium rounded">
                      {skill}
                    </span>
                  ))}
                  {c.skills.length > 4 && (
                    <span className="text-[10px] text-on-surface-variant font-medium">+{c.skills.length - 4} more</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{c.yearsOfExperience} yrs exp</p>
                <p className="text-xs text-on-surface-variant">{c.location}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
