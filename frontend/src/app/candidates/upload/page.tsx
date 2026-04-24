'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchJobs } from '../../../store/jobsSlice';
import { uploadCandidateFiles, uploadCandidatesCsv } from '../../../store/candidatesSlice';
import { useGoogleDrivePicker } from '../../../hooks/useGoogleDrivePicker';

interface QueueItem {
  name: string;
  status: 'parsing' | 'analyzing' | 'waiting' | 'done' | 'failed';
  progress: number;
  reason?: string;
  startedAt?: number;
}

type Mode = 'pdf' | 'csv';

export default function CandidateUploadPage() {
  const dispatch = useAppDispatch();
  const { jobs } = useAppSelector((s) => s.jobs);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [mode, setMode] = useState<Mode>('pdf');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const {
    ready: driveReady,
    configured: driveConfigured,
    openPicker,
    fetchPickedFiles,
  } = useGoogleDrivePicker();
  const [driveNotice, setDriveNotice] = useState<string | null>(null);

  // Force re-render for smooth asymptotic progress curve
  const [, setTick] = useState(0);
  useEffect(() => {
    const isProcessing = queue.some((q) => q.status === 'parsing' || q.status === 'analyzing');
    if (!isProcessing) return;
    const interval = setInterval(() => setTick((n) => n + 1), 500);
    return () => clearInterval(interval);
  }, [queue]);

  useEffect(() => {
    dispatch(fetchJobs({ limit: 50 }));
  }, [dispatch]);

  useEffect(() => {
    if (jobs.length > 0 && !selectedJobId) {
      setSelectedJobId(jobs[0]._id);
    }
  }, [jobs, selectedJobId]);

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (!files || files.length === 0) return;
      if (!selectedJobId) {
        alert('Please select a target job first.');
        return;
      }

      const newItems: QueueItem[] = files.map((f) => ({
        name: f.name,
        status: 'parsing',
        progress: 0,
        startedAt: Date.now(),
      }));
      setQueue(newItems);

      try {
        const action = mode === 'pdf' ? uploadCandidateFiles : uploadCandidatesCsv;
        const result: any = await dispatch(action({ files, jobId: selectedJobId })).unwrap();
        const failed: { file: string; reason: string }[] = result?.failed || [];
        const failedSet = new Map(failed.map((f) => [f.file, f.reason]));

        setQueue((prev) =>
          prev.map((q) =>
            failedSet.has(q.name)
              ? { ...q, status: 'failed', progress: 100, reason: failedSet.get(q.name) }
              : { ...q, status: 'done', progress: 100 }
          )
        );
        dispatch(fetchJobs({ limit: 50 }));

        if (failed.length > 0) {
          // Non-blocking notice — stays in queue UI.
        }
        setTimeout(() => {
          window.location.href = `/jobs/${selectedJobId}`;
        }, 1200);
      } catch (error: any) {
        setQueue((prev) => prev.map((q) => ({ ...q, status: 'failed', progress: 100, reason: error.message })));
      }
    },
    [dispatch, selectedJobId, mode]
  );

  const handleFileInput = useCallback(
    (list: FileList | null) => {
      if (!list) return;
      handleFiles(Array.from(list));
    },
    [handleFiles]
  );

  const handleDrivePick = useCallback(() => {
    setDriveNotice(null);
    openPicker(
      async (picked) => {
        const files = await fetchPickedFiles(picked);
        if (files.length === 0) {
          setDriveNotice('Could not fetch files from Google Drive.');
          return;
        }
        handleFiles(files);
      },
      (err) => {
        setDriveNotice(
          err.code === 'not_configured'
            ? 'Google Drive integration is not set up. See frontend/.env.example for the keys you need.'
            : `${err.message}${err.details ? ` - ${err.details}` : ''}`
        );
      }
    );
  }, [openPicker, fetchPickedFiles, handleFiles]);

  const accept = mode === 'pdf' ? '.pdf' : '.csv';
  const isProcessing = queue.some((q) => q.status !== 'done' && q.status !== 'failed');
  const doneCount = queue.filter((q) => q.status === 'done').length;
  const failedCount = queue.filter((q) => q.status === 'failed').length;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* HEADER */}
      <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <nav className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-1.5">
            <Link href="/candidates" className="hover:text-slate-900 transition-colors">Candidates</Link>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span className="text-indigo-700">Upload</span>
          </nav>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Upload Candidates
          </h1>
          <p className="text-[12px] text-slate-500 font-medium mt-0.5">
            Import resumes or spreadsheets. AI extracts profiles into the talent schema instantly.
          </p>
        </div>

        {/* Target Job Selector */}
        <div className="w-full md:w-64">
          <label className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Target Job
          </label>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full mt-1 bg-white border border-slate-200/80 rounded-lg px-2.5 h-8 text-[12px] font-medium text-slate-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
          >
            <option value="">Choose a job...</option>
            {jobs.map((job) => (
              <option key={job._id} value={job._id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* MODE TABS */}
      <section className="glass-panel rounded-xl p-1.5 inline-flex gap-1">
        {(['pdf', 'csv'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`relative flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-bold transition-colors ${
              mode === m
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {m === 'pdf' ? 'picture_as_pdf' : 'table_view'}
            </span>
            <span className="uppercase tracking-widest text-[10px]">
              {m === 'pdf' ? 'PDF Resumes' : 'CSV / Spreadsheet'}
            </span>
          </button>
        ))}
      </section>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - Drop Zone + Queue */}
        <div className="lg:col-span-2 space-y-4">
          {/* Drop Zone */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel rounded-xl overflow-hidden"
          >
            <div
              className={`relative flex flex-col items-center justify-center p-10 transition-all ${
                dragActive
                  ? 'bg-indigo-50/80 border-2 border-dashed border-indigo-400'
                  : 'border-2 border-dashed border-transparent'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                handleFileInput(e.dataTransfer.files);
              }}
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                dragActive ? 'bg-indigo-100' : 'bg-slate-100'
              }`}>
                <span className={`material-symbols-outlined text-[28px] transition-colors ${
                  dragActive ? 'text-indigo-600' : 'text-slate-400'
                }`}>
                  {mode === 'pdf' ? 'cloud_upload' : 'table_view'}
                </span>
              </div>

              <h3 className="text-[14px] font-extrabold text-slate-900 mb-1 text-center">
                {dragActive
                  ? 'Release to upload'
                  : mode === 'pdf'
                    ? 'Drop PDF resumes here'
                    : 'Drop CSV files here'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium text-center max-w-sm mb-5 leading-relaxed">
                {mode === 'pdf'
                  ? 'Gemini AI extracts skills, experience, education, projects and more into a structured talent profile.'
                  : 'Columns: Full Name, Email, Phone, Headline, Location, Skills (semicolon-separated), LinkedIn, GitHub.'}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <label className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 text-white text-[12px] font-semibold shadow-[0_6px_16px_-8px_rgba(70,72,212,0.6),inset_0_1px_0_0_rgba(255,255,255,0.22)] hover:from-indigo-400 hover:to-indigo-600 transition cursor-pointer press">
                  <span className="material-symbols-outlined text-[14px]">attach_file</span>
                  Browse Files
                  <input
                    type="file"
                    multiple
                    accept={accept}
                    className="hidden"
                    onChange={(e) => handleFileInput(e.target.files)}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleDrivePick}
                  disabled={driveConfigured && !driveReady}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white border border-slate-200 text-[12px] font-semibold text-slate-700 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors press"
                >
                  <span className="material-symbols-outlined text-[14px]">folder_open</span>
                  {driveConfigured && !driveReady ? 'Loading...' : 'Google Drive'}
                </button>
              </div>

              {/* Drive Notice */}
              {driveNotice && (
                <div className="mt-4 flex items-start gap-2 max-w-md p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                  <span className="material-symbols-outlined text-amber-600 text-[14px] mt-0.5 shrink-0">warning</span>
                  <p className="text-[10px] font-semibold text-amber-700 leading-relaxed">{driveNotice}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Processing Queue */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel rounded-xl overflow-hidden"
          >
            {/* Queue Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-[16px]">queue</span>
                <h2 className="text-[13px] font-extrabold text-slate-900 tracking-tight">
                  Processing Queue
                </h2>
                <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                  {queue.length}
                </span>
              </div>
              {isProcessing && (
                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[12px] animate-spin">progress_activity</span>
                  AI Active
                </span>
              )}
              {queue.length > 0 && !isProcessing && (
                <span className="text-[10px] font-bold text-slate-500">
                  {doneCount} done{failedCount > 0 ? ` · ${failedCount} failed` : ''}
                </span>
              )}
            </div>

            {/* Queue Items */}
            <div className="divide-y divide-slate-100/80">
              {queue.length === 0 ? (
                <div className="p-6 text-center">
                  <span className="material-symbols-outlined text-2xl text-slate-300 mb-2 block">inbox</span>
                  <p className="text-[11px] text-slate-400 font-medium">
                    No files in queue. Upload files to begin.
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {queue.map((item, idx) => {
                    let percent = item.progress;
                    if (item.status === 'parsing' && item.startedAt) {
                      const elapsedSec = (Date.now() - item.startedAt) / 1000;
                      // Simulation curve: 1 - exp(-t/k) reaches 90% at t = 2.3k. 
                      // For PDF (heavy Gemini extraction), use 6 to reach 90% around 14s.
                      // For CSV use 2 to reach 90% in ~4.5s.
                      percent = Math.min(94, Math.round((1 - Math.exp(-elapsedSec / (mode === 'pdf' ? 6 : 2))) * 100));
                    } else if (item.status === 'done' || item.status === 'failed') {
                      percent = 100;
                    }

                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03, duration: 0.25 }}
                        className="flex items-center gap-3 px-3 py-2.5"
                      >
                        {/* File Icon */}
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            item.status === 'failed'
                              ? 'bg-rose-50'
                              : item.status === 'done'
                                ? 'bg-emerald-50'
                                : 'bg-slate-100'
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined text-[16px] ${
                              item.status === 'failed'
                                ? 'text-rose-500'
                                : item.status === 'done'
                                  ? 'text-emerald-600'
                                  : 'text-slate-400'
                            }`}
                            style={item.status === 'done' ? { fontVariationSettings: "'FILL' 1" } : undefined}
                          >
                            {item.status === 'failed' ? 'error' : item.status === 'done' ? 'check_circle' : 'description'}
                          </span>
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-[12px] font-bold text-slate-900 truncate">{item.name}</p>
                            <span
                              className={`text-[9px] font-bold uppercase tracking-[0.18em] shrink-0 ${
                                item.status === 'done'
                                  ? 'text-emerald-600'
                                  : item.status === 'failed'
                                    ? 'text-rose-600'
                                    : 'text-indigo-600'
                              }`}
                            >
                              {item.status === 'parsing'
                                ? 'Extracting...'
                                : item.status === 'done'
                                  ? 'Complete'
                                  : item.status === 'failed'
                                    ? 'Failed'
                                    : 'Waiting'}
                            </span>
                          </div>
                          {item.status === 'failed' && item.reason && (
                            <p className="text-[10px] text-rose-600 font-medium mb-1 truncate">{item.reason}</p>
                          )}
                          {/* Progress Bar */}
                          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${
                                item.status === 'failed'
                                  ? 'bg-rose-400'
                                  : item.status === 'done'
                                    ? 'bg-emerald-500'
                                    : 'bg-gradient-to-r from-indigo-500 to-fuchsia-400'
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column - Info Cards */}
        <div className="space-y-4">
          {/* AI Extraction Info */}
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-[14px] text-indigo-600"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  psychology
                </span>
              </div>
              <h2 className="text-[13px] font-extrabold text-slate-900 tracking-tight">AI Extraction</h2>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-3">
              Every resume is parsed by Gemini into the Umurava Talent Profile Schema - skills with level and years, experience timeline, education, and projects.
            </p>
            <div className="space-y-1.5">
              {[
                { label: 'Semantic Skill Mapping', icon: 'auto_awesome' },
                { label: 'Experience Normalization', icon: 'timeline' },
                { label: 'Availability Inference', icon: 'event_available' },
                { label: 'Education Credentials', icon: 'school' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 bg-white/50 border border-slate-100 rounded-lg px-2.5 py-1.5">
                  <span
                    className="material-symbols-outlined text-emerald-600 text-[14px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  <span className="text-[11px] font-semibold text-slate-700">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.section>

          {/* CSV Format Guide */}
          <AnimatePresence>
            {mode === 'csv' && (
              <motion.section
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="glass-panel rounded-xl p-4 overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[14px] text-violet-600">table_view</span>
                  </div>
                  <h2 className="text-[13px] font-extrabold text-slate-900 tracking-tight">CSV Format</h2>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-3">
                  Your CSV should have a header row with these columns:
                </p>
                <div className="space-y-1">
                  {[
                    { col: 'Full Name', note: 'or First Name + Last Name' },
                    { col: 'Email', note: 'required' },
                    { col: 'Phone', note: 'optional' },
                    { col: 'Headline', note: 'current title / role' },
                    { col: 'Location', note: 'city, country' },
                    { col: 'Skills', note: 'semicolon-separated' },
                    { col: 'LinkedIn', note: 'profile URL' },
                    { col: 'GitHub', note: 'profile URL' },
                  ].map((item) => (
                    <div key={item.col} className="flex items-center justify-between bg-white/50 border border-slate-100 rounded-md px-2 py-1">
                      <code className="text-[10px] font-bold text-indigo-700">{item.col}</code>
                      <span className="text-[9px] text-slate-400 font-medium">{item.note}</span>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Privacy Info */}
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-[14px] text-emerald-600"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  shield
                </span>
              </div>
              <h2 className="text-[13px] font-extrabold text-slate-900 tracking-tight">Privacy</h2>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Candidate data is encrypted in transit and at rest. We maintain strict GDPR and CCPA compliance for all analyzed talent intelligence.
            </p>
          </motion.section>

          {/* Quick Stats */}
          {selectedJobId && (
            <motion.section
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="glass-panel rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-[14px] text-amber-600"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    work
                  </span>
                </div>
                <h2 className="text-[13px] font-extrabold text-slate-900 tracking-tight">Target Role</h2>
              </div>
              {(() => {
                const job = jobs.find((j) => j._id === selectedJobId);
                if (!job) return null;
                return (
                  <div className="space-y-2">
                    <p className="text-[12px] font-bold text-slate-900">{job.title}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white/50 border border-slate-100 rounded-lg p-2">
                        <p className="text-[16px] font-extrabold text-slate-900 tabular-nums leading-none">{job.applicantCount}</p>
                        <p className="text-[8px] uppercase tracking-widest font-bold text-slate-400 mt-0.5">current</p>
                      </div>
                      <div className="bg-white/50 border border-slate-100 rounded-lg p-2">
                        <p className="text-[16px] font-extrabold text-emerald-600 tabular-nums leading-none">{job.screenedCount}</p>
                        <p className="text-[8px] uppercase tracking-widest font-bold text-slate-400 mt-0.5">screened</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.section>
          )}
        </div>
      </div>
    </div>
  );
}
