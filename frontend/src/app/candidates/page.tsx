'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchCandidates,
  deleteCandidate,
  deleteCandidatesBulk,
} from '../../store/candidatesSlice';
import { fetchJobs } from '../../store/jobsSlice';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';

export default function CandidatesPage() {
  const dispatch = useAppDispatch();
  const { candidates, loading, total } = useAppSelector((s) => s.candidates);
  const { jobs } = useAppSelector((s) => s.jobs);

  const [jobId, setJobId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    dispatch(fetchJobs({ limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    const t = setTimeout(() => {
      dispatch(
        fetchCandidates({
          jobId: jobId || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          search: search || undefined,
        })
      );
      setSelected(new Set());
    }, 300);
    return () => clearTimeout(t);
  }, [dispatch, jobId, dateFrom, dateTo, search]);

  const allSelected = useMemo(
    () => candidates.length > 0 && selected.size === candidates.length,
    [candidates, selected]
  );

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(candidates.map((c) => c._id)));
  };

  const handleDeleteOne = async (id: string, name: string) => {
    if (!confirm(`Delete candidate "${name}"? This cannot be undone.`)) return;
    await dispatch(deleteCandidate(id));
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} selected candidate(s)? This cannot be undone.`)) return;
    await dispatch(deleteCandidatesBulk(Array.from(selected)));
    setSelected(new Set());
  };

  const clearFilters = () => {
    setJobId('');
    setDateFrom('');
    setDateTo('');
    setSearch('');
  };

  const hasFilters = jobId || dateFrom || dateTo || search;

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

      {/* Filters */}
      <div className="bg-surface-container-lowest rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, email, title, skill..."
            className="w-full mt-1 bg-surface-container rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-secondary/20 outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Job</label>
          <select
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            className="w-full mt-1 bg-surface-container rounded-lg py-2 px-3 text-sm cursor-pointer"
          >
            <option value="">All jobs</option>
            <option value="unassigned">Unassigned</option>
            {jobs.map((j) => (
              <option key={j._id} value={j._id}>{j.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full mt-1 bg-surface-container rounded-lg py-2 px-3 text-sm"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full mt-1 bg-surface-container rounded-lg py-2 px-3 text-sm"
          />
        </div>
        {hasFilters && (
          <div className="md:col-span-5 flex justify-end">
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-on-surface-variant hover:text-on-surface inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Bulk actions bar */}
      {candidates.length > 0 && (
        <div className="flex items-center justify-between mb-3 px-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant cursor-pointer">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-primary" />
            {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
          </label>
          {selected.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="inline-flex items-center gap-2 bg-error text-white px-4 py-2 rounded-md font-semibold text-xs hover:opacity-90 transition-all"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              Delete selected
            </button>
          )}
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={5} />
      ) : candidates.length === 0 ? (
        <EmptyState
          icon="group_off"
          title={hasFilters ? 'No candidates match your filters' : 'No Candidates Yet'}
          description={hasFilters ? 'Try adjusting your filters.' : 'Upload candidates to start building your talent pool.'}
          action={
            hasFilters
              ? { label: 'Clear filters', onClick: clearFilters }
              : { label: 'Upload Candidates', onClick: () => (window.location.href = '/candidates/upload') }
          }
        />
      ) : (
        <div className="space-y-3">
          {candidates.map((c) => {
            const job = jobs.find((j) => j._id === c.jobId);
            return (
              <div
                key={c._id}
                className="bg-surface-container-lowest p-5 rounded-xl flex items-center gap-4 hover:shadow-md transition-all"
              >
                <input
                  type="checkbox"
                  checked={selected.has(c._id)}
                  onChange={() => toggleOne(c._id)}
                  className="accent-primary w-4 h-4"
                />
                <div className="w-14 h-14 rounded-full bg-linear-to-br from-secondary to-secondary-container flex items-center justify-center text-white font-bold text-lg">
                  {c.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-on-surface truncate">{c.fullName}</h4>
                  <p className="text-sm text-on-surface-variant truncate">
                    {c.currentTitle}{c.currentCompany ? ` at ${c.currentCompany}` : ''}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2 items-center">
                    {c.skills.slice(0, 4).map((skill) => (
                      <span key={skill} className="px-2 py-0.5 bg-surface-container text-on-surface-variant text-[10px] font-medium rounded">
                        {skill}
                      </span>
                    ))}
                    {c.skills.length > 4 && (
                      <span className="text-[10px] text-on-surface-variant font-medium">+{c.skills.length - 4} more</span>
                    )}
                    {job && (
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded">
                        {job.title}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold">{c.yearsOfExperience} yrs exp</p>
                  <p className="text-xs text-on-surface-variant">{c.location}</p>
                  <p className="text-[10px] text-on-surface-variant mt-1">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteOne(c._id, c.fullName)}
                  title="Delete candidate"
                  className="w-9 h-9 rounded-lg text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
