'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import api from '../../../../lib/api';

const inputCls =
  'w-full bg-white border border-slate-200 rounded-lg px-3 h-9 text-[12.5px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all placeholder:text-slate-400';

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const publishMode = searchParams.get('publish') === '1';
  const id = params.id as string;
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    setJob((prev: any) => {
      const current: string[] = prev.requiredSkills || [];
      if (current.includes(trimmed)) return prev;
      return { ...prev, requiredSkills: [...current, trimmed] };
    });
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    setJob((prev: any) => ({
      ...prev,
      requiredSkills: (prev.requiredSkills || []).filter((s: string) => s !== skill),
    }));
  };

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await api.get(`/jobs/${id}`);
        setJob(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load job');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setJob((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setJob((prev: any) => ({
      ...prev,
      aiWeights: { ...prev.aiWeights, [name]: parseInt(value) },
    }));
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const skillsArray = e.target.value.split(',').map(s => s.trim()).filter(s => s);
    setJob((prev: any) => ({ ...prev, requiredSkills: skillsArray }));
  };

  const missing = {
    title: !job?.title?.trim(),
    description: !job?.description?.trim(),
    location: !job?.location?.trim(),
    salaryRange: !job?.salaryRange?.trim(),
    skills: !job?.requiredSkills || job.requiredSkills.length === 0,
  };
  const hasMissing = Object.values(missing).some(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (publishMode && hasMissing) {
      setShowErrors(true);
      setError('Please fill in all required fields before publishing.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { _id, createdAt, updatedAt, __v, ...updateData } = job;
      if (publishMode) updateData.status = 'active';
      await api.put(`/jobs/${id}`, updateData);
      router.push(publishMode ? '/jobs' : `/jobs/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update job');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 rounded-lg bg-white/60 animate-pulse" />
        <div className="h-6 w-64 rounded-lg bg-white/60 animate-pulse" />
        <div className="h-80 rounded-xl bg-white/60 animate-pulse mt-4" />
        <div className="h-48 rounded-xl bg-white/60 animate-pulse" />
      </div>
    );
  }

  if (!job && error) {
    return (
      <div>
        <div className="glass-panel rounded-xl p-12 text-center">
          <span className="material-symbols-outlined text-3xl text-rose-400 mb-3 block">error</span>
          <h2 className="text-[15px] font-extrabold text-slate-900 mb-1">Something went wrong</h2>
          <p className="text-[12px] text-slate-500 font-medium mb-4">{error || 'Job not found'}</p>
          <button
            onClick={() => router.push('/jobs')}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white border border-slate-200 text-[12px] font-semibold text-slate-700 hover:border-slate-300 press"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  if (!job) return null;

  const WEIGHT_KEYS = [
    { key: 'technicalSkills', label: 'Technical Match', hint: 'Verified code & platform proficiency' },
    { key: 'yearsOfExperience', label: 'Experience Level', hint: 'Tenure and progression' },
    { key: 'educationCredentials', label: 'Education Fit', hint: 'Degrees and institutions' },
  ];

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <nav className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-1.5">
            <Link href="/jobs" className="hover:text-slate-900 transition-colors">Jobs</Link>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <Link href={`/jobs/${job._id}`} className="hover:text-slate-900 transition-colors truncate max-w-[140px]">
              {job.title}
            </Link>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span className="text-indigo-700">{publishMode ? 'Publish' : 'Edit'}</span>
          </nav>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {publishMode ? 'Complete & Publish Draft' : 'Edit Job'}
          </h1>
          <p className="text-[12px] text-slate-500 font-medium mt-0.5">
            {publishMode
              ? 'Fill in the missing details below. Once all required fields are complete, your draft will be published.'
              : 'Update job details and AI screening configuration.'}
          </p>
        </div>
        <Link
          href={publishMode ? '/jobs' : `/jobs/${job._id}`}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white border border-slate-200 text-[12px] font-semibold text-slate-700 hover:border-slate-300 transition-colors press"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
          Discard
        </Link>
      </section>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200">
          <span className="material-symbols-outlined text-rose-600 text-[16px]">error</span>
          <p className="text-[11px] font-semibold text-rose-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* TWO-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* LEFT: Job Info Fields */}
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-indigo-600 text-[16px]">description</span>
              <h2 className="text-[13px] font-extrabold text-slate-900 tracking-tight">Job Info</h2>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 flex items-center gap-1">
                Job Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={job.title || ''}
                onChange={handleChange}
                className={`${inputCls} mt-1 ${showErrors && missing.title ? 'ring-2 ring-rose-400 border-rose-300' : ''}`}
                placeholder="e.g. Senior AI Research Engineer"
              />
              {showErrors && missing.title && (
                <p className="text-[10px] text-rose-600 font-semibold mt-1">Required</p>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Department</label>
              <input
                type="text"
                name="department"
                value={job.department || ''}
                onChange={handleChange}
                className={`${inputCls} mt-1`}
                placeholder="e.g. Engineering"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 flex items-center gap-1">
                Location <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={job.location || ''}
                onChange={handleChange}
                className={`${inputCls} mt-1 ${showErrors && missing.location ? 'ring-2 ring-rose-400 border-rose-300' : ''}`}
                placeholder="e.g. Kigali, Rwanda"
              />
              {showErrors && missing.location && (
                <p className="text-[10px] text-rose-600 font-semibold mt-1">Required</p>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 flex items-center gap-1">
                Salary Range <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="salaryRange"
                value={job.salaryRange || ''}
                onChange={handleChange}
                className={`${inputCls} mt-1 ${showErrors && missing.salaryRange ? 'ring-2 ring-rose-400 border-rose-300' : ''}`}
                placeholder="e.g. $60k - $90k"
              />
              {showErrors && missing.salaryRange && (
                <p className="text-[10px] text-rose-600 font-semibold mt-1">Required</p>
              )}
            </div>
          </motion.section>

          {/* RIGHT: Description + Skills */}
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-indigo-600 text-[16px]">edit_note</span>
              <h2 className="text-[13px] font-extrabold text-slate-900 tracking-tight">Description & Skills</h2>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 flex items-center gap-1">
                Job Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="description"
                value={job.description || ''}
                onChange={handleChange}
                rows={6}
                className={`w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[12.5px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all placeholder:text-slate-400 leading-relaxed mt-1 ${
                  showErrors && missing.description ? 'ring-2 ring-rose-400 border-rose-300' : ''
                }`}
                placeholder="Mission, responsibilities, impact, and what success looks like..."
              />
              {showErrors && missing.description && (
                <p className="text-[10px] text-rose-600 font-semibold mt-1">Required</p>
              )}
            </div>

            {/* Skills Tag Input */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 flex items-center gap-1">
                Required Skills <span className="text-rose-500">*</span>
              </label>
              <div
                className={`mt-1 flex flex-wrap gap-1.5 p-2 bg-white border rounded-lg ${
                  showErrors && missing.skills ? 'border-rose-400' : 'border-slate-200'
                }`}
              >
                {(job.requiredSkills || []).map((skill: string) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 h-6 pl-2.5 pr-1 rounded-full bg-indigo-600 text-white text-[10.5px] font-semibold"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="w-4 h-4 rounded-full hover:bg-white/20 flex items-center justify-center"
                      aria-label={`Remove ${skill}`}
                    >
                      <span className="material-symbols-outlined text-[12px]">close</span>
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill(skillInput);
                    } else if (e.key === ',') {
                      e.preventDefault();
                      addSkill(skillInput);
                    } else if (e.key === 'Backspace' && !skillInput && (job.requiredSkills || []).length > 0) {
                      removeSkill(job.requiredSkills[job.requiredSkills.length - 1]);
                    }
                  }}
                  onBlur={() => skillInput.trim() && addSkill(skillInput)}
                  className="flex-1 min-w-[140px] bg-transparent text-[12.5px] font-medium placeholder:text-slate-400 focus:outline-none px-2"
                  placeholder={(job.requiredSkills || []).length === 0 ? 'Type a skill and press Enter...' : 'Add more...'}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-1">
                Press Enter or comma to add each skill. Backspace to remove the last one.
              </p>
              {showErrors && missing.skills && (
                <p className="text-[10px] text-rose-600 font-semibold mt-1">Add at least one skill</p>
              )}
            </div>
          </motion.section>
        </div>

        {/* AI WEIGHTING — full width */}
        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="glass-panel rounded-xl p-4 space-y-4"
        >
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-indigo-600 text-[16px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              tune
            </span>
            <h2 className="text-[13px] font-extrabold text-slate-900 tracking-tight">AI Weighting</h2>
          </div>
          <p className="text-[11px] text-slate-500 font-medium -mt-2">
            Control how the AI ranks candidates for this role.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {WEIGHT_KEYS.map((w) => {
              const val = job.aiWeights?.[w.key] || 50;
              return (
                <div key={w.key} className="bg-white/70 border border-slate-100 rounded-lg p-3">
                  <div className="flex items-baseline justify-between mb-1">
                    <p className="text-[11px] font-bold text-slate-900">{w.label}</p>
                    <p className="text-[13px] font-extrabold text-indigo-600 tabular-nums">{val}%</p>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium mb-2.5">{w.hint}</p>
                  <input
                    type="range"
                    name={w.key}
                    min="0"
                    max="100"
                    value={val}
                    onChange={handleWeightChange}
                    className="w-full"
                  />
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* FOOTER ACTIONS */}
        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="glass-panel rounded-xl p-2.5 flex items-center justify-between"
        >
          <Link
            href={publishMode ? '/jobs' : `/jobs/${job._id}`}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/70 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || (publishMode && hasMissing)}
            className={`inline-flex items-center gap-1.5 h-8 px-4 rounded-lg text-white text-[12px] font-semibold shadow-[0_6px_16px_-8px_rgba(70,72,212,0.6),inset_0_1px_0_0_rgba(255,255,255,0.22)] disabled:opacity-40 disabled:cursor-not-allowed transition press ${
              publishMode
                ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-600'
                : 'bg-gradient-to-b from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {publishMode ? 'publish' : 'check'}
            </span>
            {saving ? 'Saving…' : publishMode ? 'Publish Job' : 'Save Changes'}
          </button>
        </motion.section>
      </form>
    </div>
  );
}
