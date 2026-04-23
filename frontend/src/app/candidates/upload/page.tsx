'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchJobs } from '../../../store/jobsSlice';
import { uploadCandidateFiles, uploadCandidatesCsv } from '../../../store/candidatesSlice';
import { useGoogleDrivePicker } from '../../../hooks/useGoogleDrivePicker';

interface QueueItem {
  name: string;
  status: 'parsing' | 'analyzing' | 'waiting' | 'done' | 'failed';
  progress: number;
  reason?: string;
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
        progress: mode === 'pdf' ? 30 : 60,
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
            : `${err.message}${err.details ? ` — ${err.details}` : ''}`
        );
      }
    );
  }, [openPicker, fetchPickedFiles, handleFiles]);

  const accept = mode === 'pdf' ? '.pdf' : '.csv';

  return (
    <div className="max-w-6xl mx-auto space-y-10 px-4">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <span className="text-secondary font-semibold text-sm tracking-widest uppercase">
            Talent Acquisition
          </span>
          <h2 className="text-4xl font-extrabold text-on-primary-fixed tracking-tight">
            Bulk Candidate Upload
          </h2>
          <p className="text-on-surface-variant">
            Ingest resumes at scale. Our AI Lens extracts skills, experience, and intent into the
            Umurava Talent Profile Schema instantly.
          </p>
        </div>
        <div className="w-full md:w-72 space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter">
            Target Job Opening
          </label>
          <div className="relative">
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full appearance-none bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-secondary/20 cursor-pointer"
            >
              <option value="">Choose a job…</option>
              {jobs.map((job) => (
                <option key={job._id} value={job._id}>
                  {job.title}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
              expand_more
            </span>
          </div>
        </div>
      </section>

      {/* Mode tabs */}
      <div className="inline-flex rounded-xl bg-surface-container-low p-1 border border-outline-variant/20">
        {(['pdf', 'csv'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              mode === m
                ? 'bg-white shadow-sm text-secondary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {m === 'pdf' ? 'PDF Resumes' : 'CSV / Spreadsheet'}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-secondary/20 to-tertiary-container/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            <div
              className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-16 transition-all ${
                dragActive
                  ? 'border-secondary bg-secondary/5'
                  : 'border-outline-variant bg-surface-container-lowest hover:border-secondary group-hover:bg-white'
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
              <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-4xl text-secondary">
                  {mode === 'pdf' ? 'cloud_upload' : 'table_view'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2 text-center">
                {mode === 'pdf' ? 'Drop PDF resumes here' : 'Drop CSV files here'}
              </h3>
              <p className="text-on-surface-variant text-center max-w-sm mb-8">
                {mode === 'pdf'
                  ? 'AI will extract firstName, lastName, skills, experience, education, projects, and more into the Umurava Talent Profile Schema.'
                  : 'Columns recognized: Full Name, Email, Phone, Headline, Location, Skills (comma-separated), LinkedIn, GitHub.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <label className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-[1.02] transition-transform active:scale-95 shadow-xl shadow-primary/10 cursor-pointer">
                  <span className="material-symbols-outlined">attach_file</span>
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
                  className="px-6 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-bold flex items-center gap-2 hover:border-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-base">folder_open</span>
                  {driveConfigured && !driveReady ? 'Loading Drive…' : 'From Google Drive'}
                </button>
              </div>
              {driveNotice && (
                <div className="mt-6 max-w-md text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-center">
                  {driveNotice}
                </div>
              )}
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center">
              <h4 className="font-bold text-sm uppercase tracking-wider text-on-surface-variant">
                Processing Queue ({queue.length})
              </h4>
              {queue.some((q) => q.status !== 'done' && q.status !== 'failed') && (
                <span className="text-xs font-medium text-secondary bg-secondary/10 px-2 py-1 rounded-full">
                  AI Active
                </span>
              )}
            </div>
            <div className="divide-y divide-outline-variant/20">
              {queue.length === 0 ? (
                <div className="p-6 text-center text-on-surface-variant text-sm">
                  No files in queue. Upload files to begin.
                </div>
              ) : (
                queue.map((item) => (
                  <div key={item.name} className="p-6 flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        item.status === 'failed' ? 'bg-rose-100 text-rose-600' : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined">
                        {item.status === 'failed' ? 'error' : 'description'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-semibold text-sm truncate">{item.name}</p>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-widest ml-4 shrink-0 ${
                            item.status === 'done'
                              ? 'text-secondary'
                              : item.status === 'failed'
                                ? 'text-error'
                                : 'text-on-surface-variant'
                          }`}
                        >
                          {item.status === 'parsing'
                            ? 'Parsing & Extracting…'
                            : item.status === 'done'
                              ? 'Complete'
                              : item.status === 'failed'
                                ? 'Failed'
                                : 'Waiting'}
                        </span>
                      </div>
                      {item.status === 'failed' && item.reason && (
                        <p className="text-xs text-error mt-1">{item.reason}</p>
                      )}
                      <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden mt-2">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            item.status === 'failed'
                              ? 'bg-error'
                              : 'bg-gradient-to-r from-secondary to-tertiary-container'
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-primary-container text-white p-8 rounded-xl relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-secondary opacity-20 rounded-full blur-3xl" />
            <span className="material-symbols-outlined text-secondary-fixed text-4xl mb-4">
              psychology
            </span>
            <h4 className="text-xl font-bold mb-4">Structured Extraction</h4>
            <p className="text-on-primary-container text-sm leading-relaxed mb-6">
              Every resume is parsed by Gemini into the Umurava Talent Profile Schema — skills with
              level and years, languages with proficiency, structured experience, education,
              projects, and availability.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-xs font-medium text-primary-fixed">
                <span className="material-symbols-outlined text-lg text-secondary">check_circle</span>
                Semantic Skill Mapping
              </li>
              <li className="flex items-center gap-3 text-xs font-medium text-primary-fixed">
                <span className="material-symbols-outlined text-lg text-secondary">check_circle</span>
                Experience Normalization
              </li>
              <li className="flex items-center gap-3 text-xs font-medium text-primary-fixed">
                <span className="material-symbols-outlined text-lg text-secondary">check_circle</span>
                Availability Inference
              </li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-outline-variant/10">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-4">
              shield_lock
            </span>
            <h4 className="text-xl font-bold text-on-surface mb-4">Privacy Standards</h4>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Candidate data is encrypted in transit and at rest. We maintain strict GDPR and
              CCPA compliance for all analyzed talent intelligence.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
