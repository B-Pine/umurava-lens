'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchJobs } from '../../../store/jobsSlice';
import { uploadCandidateFiles } from '../../../store/candidatesSlice';

interface QueueItem {
  name: string;
  status: 'parsing' | 'analyzing' | 'waiting' | 'done';
  progress: number;
}

export default function CandidateUploadPage() {
  const dispatch = useAppDispatch();
  const { jobs } = useAppSelector((s) => s.jobs);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    dispatch(fetchJobs({ limit: 50 }));
  }, [dispatch]);

  useEffect(() => {
    if (jobs.length > 0 && !selectedJobId) {
      setSelectedJobId(jobs[0]._id);
    }
  }, [jobs, selectedJobId]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const newItems: QueueItem[] = fileArray.map((f) => ({
      name: f.name,
      status: 'parsing' as const,
      progress: 30,
    }));
    setQueue(newItems);

    try {
      const result: any = await dispatch(
        uploadCandidateFiles({ files: fileArray, jobId: selectedJobId })
      ).unwrap();
      setQueue((prev) => prev.map((q) => ({ ...q, status: 'done' as const, progress: 100 })));
      dispatch(fetchJobs({ limit: 50 }));
      const failed: { file: string; reason: string }[] = result?.failed || [];
      if (failed.length > 0) {
        alert(
          `${result.message}\n\nFailed files:\n` +
            failed.map((f) => `• ${f.file}: ${f.reason}`).join('\n')
        );
      } else {
        alert('Files parsed and candidates uploaded successfully!');
      }
      window.location.href = `/jobs/${selectedJobId}`;
    } catch (error: any) {
      alert('Failed to upload files: ' + error.message);
      setQueue([]);
    }
  }, [dispatch, selectedJobId]);

  return (
    <div className="max-w-6xl mx-auto space-y-10 px-4">
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <span className="text-secondary font-semibold text-sm tracking-widest uppercase">Talent Acquisition</span>
          <h2 className="text-4xl font-extrabold text-on-primary-fixed tracking-tight">Bulk Candidate Upload</h2>
          <p className="text-on-surface-variant">Ingest resumes at scale. Our AI Lens extracts skills, experience, and intent instantly.</p>
        </div>
        <div className="w-full md:w-72 space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter">Target Job Opening</label>
          <div className="relative">
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full appearance-none bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-secondary/20 cursor-pointer"
            >
              {jobs.map((job) => (
                <option key={job._id} value={job._id}>{job.title}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Drop Zone */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-secondary/20 to-tertiary-container/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            <div
              className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-16 transition-all ${
                dragActive ? 'border-secondary bg-secondary/5' : 'border-outline-variant bg-surface-container-lowest hover:border-secondary group-hover:bg-white'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
            >
              <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-4xl text-secondary">cloud_upload</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2 text-center">Drop resumes here</h3>
              <p className="text-on-surface-variant text-center max-w-sm mb-8">
                Upload PDF, DOCX, or TXT files. You can select multiple files or drag a whole folder to begin the analysis.
              </p>
              <label className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-[1.02] transition-transform active:scale-95 shadow-xl shadow-primary/10 cursor-pointer">
                <span className="material-symbols-outlined">attach_file</span>
                Browse Files
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </label>
            </div>
          </div>

          {/* Processing Queue */}
          <div className="bg-surface-container-low rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center">
              <h4 className="font-bold text-sm uppercase tracking-wider text-on-surface-variant">Processing Queue ({queue.length})</h4>
              {queue.some((q) => q.status !== 'done') && (
                <span className="text-xs font-medium text-secondary bg-secondary/10 px-2 py-1 rounded-full">AI Active</span>
              )}
            </div>
            <div className="divide-y divide-outline-variant/20">
              {queue.length === 0 ? (
                <div className="p-6 text-center text-on-surface-variant text-sm">No files in queue. Upload files to begin.</div>
              ) : (
                queue.map((item) => (
                  <div key={item.name} className="p-6 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant">description</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-semibold text-sm">{item.name}</p>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${
                          item.status === 'done' ? 'text-secondary' :
                          item.status === 'analyzing' ? 'text-tertiary-container' :
                          item.status === 'parsing' ? 'text-secondary' : 'text-on-surface-variant'
                        }`}>
                          {item.status === 'parsing' ? 'Parsing Data...' :
                           item.status === 'analyzing' ? 'AI Analyzing Match...' :
                           item.status === 'waiting' ? 'Waiting in Queue' : 'Complete'}
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-secondary to-tertiary-container h-full rounded-full transition-all duration-1000"
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

        {/* Sidebar Cards */}
        <div className="space-y-6">
          {/* Neural Data Extraction */}
          <div className="bg-primary-container text-white p-8 rounded-xl relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-secondary opacity-20 rounded-full blur-3xl" />
            <span className="material-symbols-outlined text-secondary-fixed text-4xl mb-4">psychology</span>
            <h4 className="text-xl font-bold mb-4">Neural Data Extraction</h4>
            <p className="text-on-primary-container text-sm leading-relaxed mb-6">
              Our proprietary LENS engine doesn&apos;t just keywords search. It understands context, technical hierarchies, and career trajectories within unstructured documents.
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
            </ul>
          </div>

          {/* Privacy Standards */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-outline-variant/10">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-4">shield_lock</span>
            <h4 className="text-xl font-bold text-on-surface mb-4">Privacy Standards</h4>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Candidate data is encrypted in transit and at rest. We maintain strict GDPR and CCPA compliance for all analyzed talent intelligence.
            </p>
          </div>

          {/* Total Ingested */}
          <div className="bg-gradient-to-br from-tertiary-container to-primary-container text-white p-8 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold">Total Ingested</h4>
              <span className="text-3xl font-extrabold text-secondary-fixed-dim">14.2k</span>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-widest text-primary-fixed-dim mb-2">Network Health</p>
              <div className="flex gap-1">
                {[20, 40, 60, 80, 100].map((opacity) => (
                  <div key={opacity} className="h-4 w-full bg-secondary rounded-sm" style={{ opacity: opacity / 100 }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-outline-variant/10 pt-8 text-on-surface-variant text-xs flex justify-between items-center">
        <p>&copy; 2024 Umurava Lens. High-Performance Talent Architecture.</p>
        <div className="flex gap-6">
          <span className="hover:text-primary cursor-pointer">System Status</span>
          <span className="hover:text-primary cursor-pointer">Documentation</span>
          <span className="hover:text-primary cursor-pointer">Support</span>
        </div>
      </footer>
    </div>
  );
}
