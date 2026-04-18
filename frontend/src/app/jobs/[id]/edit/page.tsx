'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../../../lib/api';

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

  if (loading) return <div className="px-4 text-center py-20">Loading...</div>;
  if (error || !job) return <div className="px-4 text-center py-20 text-error">{error || 'Job not found'}</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 pb-12">
      <nav className="flex items-center gap-2 text-xs text-on-surface-variant font-medium mb-6 uppercase tracking-widest">
        <Link href="/jobs" className="hover:text-secondary">Jobs</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <Link href={`/jobs/${job._id}`} className="hover:text-secondary">{job.title}</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-secondary">{publishMode ? 'Complete & Publish' : 'Edit'}</span>
      </nav>

      <h2 className="text-3xl font-extrabold text-primary mb-2">
        {publishMode ? 'Complete & Publish Draft' : 'Edit Job'}
      </h2>
      {publishMode && (
        <p className="text-on-surface-variant mb-8">
          Fill in the missing details below. Once all required fields are complete, your draft will be published as an active job.
        </p>
      )}
      {!publishMode && <div className="mb-8" />}

      {error && (
        <div className="bg-error-container/20 text-error p-4 rounded-xl mb-6 font-semibold text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-outline-variant/10">
          <h3 className="text-lg font-bold mb-4">Job Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-2">Internal Job Title <span className="text-error">*</span></label>
              <input type="text" name="title" value={job.title || ''} onChange={handleChange} required className={`w-full border-none bg-surface-container-low rounded-xl px-4 py-3 ${showErrors && missing.title ? 'ring-2 ring-error' : ''}`} />
              {showErrors && missing.title && <p className="text-error text-xs mt-1 font-semibold">Required</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-2">Department</label>
              <input type="text" name="department" value={job.department || ''} onChange={handleChange} className="w-full border-none bg-surface-container-low rounded-xl px-4 py-3" />
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-2">Location <span className="text-error">*</span></label>
              <input type="text" name="location" value={job.location || ''} onChange={handleChange} className={`w-full border-none bg-surface-container-low rounded-xl px-4 py-3 ${showErrors && missing.location ? 'ring-2 ring-error' : ''}`} />
              {showErrors && missing.location && <p className="text-error text-xs mt-1 font-semibold">Required</p>}
            </div>
             <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-2">Salary Range <span className="text-error">*</span></label>
              <input type="text" name="salaryRange" value={job.salaryRange || ''} onChange={handleChange} className={`w-full border-none bg-surface-container-low rounded-xl px-4 py-3 ${showErrors && missing.salaryRange ? 'ring-2 ring-error' : ''}`} />
              {showErrors && missing.salaryRange && <p className="text-error text-xs mt-1 font-semibold">Required</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-2">Job Description <span className="text-error">*</span></label>
            <textarea name="description" value={job.description || ''} onChange={handleChange} rows={5} className={`w-full border-none bg-surface-container-low rounded-xl px-4 py-3 ${showErrors && missing.description ? 'ring-2 ring-error' : ''}`} />
            {showErrors && missing.description && <p className="text-error text-xs mt-1 font-semibold">Required</p>}
          </div>
          <div className="mt-6">
            <label className="block text-sm font-bold text-on-surface-variant mb-2">
              Required Skills <span className="text-error">*</span>
            </label>
            <div className={`flex flex-wrap gap-2 p-3 bg-surface-container-low rounded-xl border-2 border-dashed ${showErrors && missing.skills ? 'border-error' : 'border-outline-variant/20'}`}>
              {(job.requiredSkills || []).map((skill: string) => (
                <span key={skill} className="flex items-center gap-2 bg-secondary text-white px-3 py-1.5 rounded-lg text-sm font-semibold">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="hover:text-primary-fixed transition-colors">
                    <span className="material-symbols-outlined text-sm">close</span>
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
                  }
                }}
                onBlur={() => skillInput.trim() && addSkill(skillInput)}
                className="flex-1 min-w-50 bg-transparent border-none focus:ring-0 text-sm outline-none px-2"
                placeholder={(job.requiredSkills || []).length === 0 ? 'Type a skill and press Enter...' : 'Add another...'}
              />
            </div>
            <p className="text-xs text-on-surface-variant mt-2">Press Enter or comma to add each skill.</p>
            {showErrors && missing.skills && <p className="text-error text-xs mt-1 font-semibold">Add at least one skill</p>}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-outline-variant/10">
          <h3 className="text-lg font-bold mb-4">AI Weighting</h3>
          <div className="space-y-6">
            <div>
              <label className="flex justify-between text-sm font-bold mb-2">
                <span>Technical Match</span>
                <span className="text-secondary">{job.aiWeights?.technicalSkills || 85}%</span>
              </label>
              <input type="range" name="technicalSkills" min="0" max="100" value={job.aiWeights?.technicalSkills || 85} onChange={handleWeightChange} className="w-full" />
            </div>
            <div>
              <label className="flex justify-between text-sm font-bold mb-2">
                <span>Experience Level</span>
                <span className="text-secondary">{job.aiWeights?.yearsOfExperience || 40}%</span>
              </label>
              <input type="range" name="yearsOfExperience" min="0" max="100" value={job.aiWeights?.yearsOfExperience || 40} onChange={handleWeightChange} className="w-full" />
            </div>
            <div>
              <label className="flex justify-between text-sm font-bold mb-2">
                <span>Education Fit</span>
                <span className="text-secondary">{job.aiWeights?.educationCredentials || 25}%</span>
              </label>
              <input type="range" name="educationCredentials" min="0" max="100" value={job.aiWeights?.educationCredentials || 25} onChange={handleWeightChange} className="w-full" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link href={publishMode ? '/jobs' : `/jobs/${job._id}`} className="px-6 py-3 font-bold text-on-surface-variant">Cancel</Link>
          <button
            type="submit"
            disabled={saving || (publishMode && hasMissing)}
            className={`px-8 py-3 text-white font-bold rounded-xl disabled:opacity-50 ${publishMode ? 'bg-primary' : 'bg-secondary'}`}
          >
            {saving ? 'Saving...' : publishMode ? 'Publish Job' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
