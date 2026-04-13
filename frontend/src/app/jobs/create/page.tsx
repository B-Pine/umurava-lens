'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '../../../store/hooks';
import { createJob } from '../../../store/jobsSlice';

export default function CreateJobPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering & Data Science');
  const [employmentType, setEmploymentType] = useState('Full-time Permanent');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Senior');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [weights, setWeights] = useState({
    technicalSkills: 85,
    yearsOfExperience: 40,
    educationCredentials: 25,
    pastProjectImpact: 70,
  });
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSubmit = async (asDraft: boolean) => {
    setSaving(true);
    try {
      await dispatch(createJob({
        title,
        department,
        employmentType,
        description,
        location,
        salaryRange,
        experienceLevel,
        requiredSkills: skills,
        status: asDraft ? 'draft' : 'active',
        aiWeights: weights,
      })).unwrap();
      router.push('/jobs');
    } catch {
      alert('Failed to create job');
    } finally {
      setSaving(false);
    }
  };

  const lensProgress = Math.round(((title ? 1 : 0) + (description ? 1 : 0) + (skills.length > 0 ? 1 : 0)) / 3 * 100);

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Breadcrumbs & Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-on-surface-variant text-sm mb-4">
          <span>Jobs</span>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-secondary font-semibold">New Job Opening</span>
        </div>
        <h2 className="text-4xl font-extrabold tracking-tight text-primary">Define the Perfect Role</h2>
        <p className="text-on-surface-variant mt-2 text-lg">Configure your talent intelligence parameters to find the highest-match candidates.</p>
      </div>

      {/* Multi-step Layout */}
      <div className="grid grid-cols-12 gap-8">
        {/* Step Navigation Sidebar */}
        <div className="col-span-3">
          <div className="sticky top-28 space-y-6">
            <div className="space-y-4">
              {[
                { num: 1, label: 'Job Details' },
                { num: 2, label: 'AI Weighting' },
                { num: 3, label: 'Skills & Tags' },
              ].map((s) => (
                <div key={s.num}>
                  <button
                    onClick={() => setStep(s.num)}
                    className={`flex items-center gap-4 group w-full text-left ${s.num > step ? 'opacity-50' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      s.num === step ? 'bg-primary text-white ring-4 ring-primary-fixed' :
                      s.num < step ? 'bg-secondary text-white' :
                      'bg-surface-container-highest text-on-surface-variant'
                    }`}>
                      {s.num < step ? <span className="material-symbols-outlined text-sm">check</span> : s.num}
                    </div>
                    <span className={`font-bold ${s.num === step ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {s.label}
                    </span>
                  </button>
                  {s.num < 3 && <div className="w-0.5 h-8 bg-surface-container-highest ml-5" />}
                </div>
              ))}
            </div>

            {/* Lens Precision Card */}
            <div className="bg-tertiary-container p-6 rounded-xl text-white mt-12 relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="font-bold mb-2">Lens Precision</h4>
                <p className="text-xs text-on-tertiary-container mb-4">
                  {lensProgress < 50 ? 'Currently optimized for broad discovery.' : lensProgress < 100 ? 'Getting more precise...' : 'Fully calibrated!'}
                </p>
                <div className="h-1.5 w-full bg-on-tertiary-container/20 rounded-full">
                  <div className="h-full bg-on-tertiary-container rounded-full transition-all duration-500" style={{ width: `${lensProgress}%` }} />
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <span className="material-symbols-outlined text-8xl">psychology</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Canvas */}
        <div className="col-span-9 space-y-10">
          {/* Section 1: Core Job Identity */}
          {step >= 1 && (
            <section className="bg-surface-container-lowest p-10 rounded-xl shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-secondary">description</span>
                <h3 className="text-xl font-bold">Section 1: Core Job Identity</h3>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-on-surface-variant mb-2">Internal Job Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-surface border-none rounded-lg py-4 px-5 text-lg font-bold focus:ring-2 focus:ring-secondary/30 placeholder:text-surface-variant"
                    placeholder="e.g. Senior AI Research Engineer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-2">Department</label>
                  <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full bg-surface border-none rounded-lg py-3 px-5 focus:ring-2 focus:ring-secondary/30">
                    <option>Engineering &amp; Data Science</option>
                    <option>Product Development</option>
                    <option>Executive Leadership</option>
                    <option>Operations</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-2">Employment Type</label>
                  <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className="w-full bg-surface border-none rounded-lg py-3 px-5 focus:ring-2 focus:ring-secondary/30">
                    <option>Full-time Permanent</option>
                    <option>Contract (Long term)</option>
                    <option>Interim Leadership</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-2">Location</label>
                  <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-surface border-none rounded-lg py-3 px-5 focus:ring-2 focus:ring-secondary/30" placeholder="e.g. San Francisco, Remote" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-2">Salary Range</label>
                  <input value={salaryRange} onChange={(e) => setSalaryRange(e.target.value)} className="w-full bg-surface border-none rounded-lg py-3 px-5 focus:ring-2 focus:ring-secondary/30" placeholder="e.g. $180k - $240k" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-on-surface-variant mb-2">Comprehensive Job Narrative</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-surface border-none rounded-lg py-4 px-5 focus:ring-2 focus:ring-secondary/30"
                    placeholder="Describe the mission, the impact, and the day-to-day excellence required..."
                    rows={6}
                  />
                </div>
              </div>
            </section>
          )}

          {/* Section 2: AI Lens Calibration */}
          {step >= 2 && (
            <section className="bg-surface-container-low p-10 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full -mr-20 -mt-20 blur-3xl" />
              <div className="flex justify-between items-center mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>tune</span>
                  <h3 className="text-xl font-bold">Section 2: AI Lens Calibration</h3>
                </div>
                <span className="px-3 py-1 bg-secondary/10 text-secondary text-xs font-bold rounded-full uppercase tracking-widest">Critical Tuning</span>
              </div>
              <p className="text-on-surface-variant mb-10 max-w-xl">Adjust how Umurava AI prioritizes candidate data points. This directly influences your match scores.</p>
              <div className="grid grid-cols-2 gap-12">
                {[
                  { key: 'technicalSkills' as const, label: 'Technical Skills', desc: 'Prioritizes verified code & platform proficiency.' },
                  { key: 'yearsOfExperience' as const, label: 'Years of Experience', desc: 'Emphasis on tenure and historical progression.' },
                  { key: 'educationCredentials' as const, label: 'Education Credentials', desc: 'Weighting for specific degrees and institutions.' },
                  { key: 'pastProjectImpact' as const, label: 'Past Project Impact', desc: 'Focus on portfolio quality and proven outcomes.' },
                ].map((w) => (
                  <div key={w.key} className="space-y-4">
                    <div className="flex justify-between">
                      <span className="font-bold">{w.label}</span>
                      <span className="text-secondary font-bold">{weights[w.key]}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={weights[w.key]}
                      onChange={(e) => setWeights({ ...weights, [w.key]: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <p className="text-xs text-on-surface-variant italic">{w.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 3: Mandatory Stack */}
          {step >= 3 && (
            <section className="bg-surface-container-lowest p-10 rounded-xl shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-secondary">terminal</span>
                <h3 className="text-xl font-bold">Section 3: Mandatory Stack</h3>
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-4">Required Technical Proficiencies</label>
                <div className="flex flex-wrap gap-2 p-4 bg-surface rounded-xl border-2 border-dashed border-outline-variant/20 mb-4">
                  {skills.map((skill) => (
                    <span key={skill} className="flex items-center gap-2 bg-secondary text-white px-3 py-1.5 rounded-lg text-sm font-semibold">
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="hover:text-primary-fixed transition-colors">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </span>
                  ))}
                  <input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }}
                    className="flex-1 min-w-[200px] bg-transparent border-none focus:ring-0 text-sm"
                    placeholder="Type and press Enter..."
                  />
                </div>
                <div className="flex gap-4">
                  <p className="text-xs text-on-surface-variant">Recommended:</p>
                  <div className="flex gap-2">
                    {['TensorFlow', 'AWS Sagemaker', 'LangChain'].filter((s) => !skills.includes(s)).map((s) => (
                      <button key={s} onClick={() => addSkill(s)} className="text-xs bg-surface-container px-2 py-1 rounded hover:bg-surface-container-high transition-colors font-semibold">
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-8 border-t border-surface-container">
            <button onClick={() => handleSubmit(true)} disabled={saving} className="flex items-center gap-2 text-on-surface-variant font-semibold hover:text-primary transition-colors">
              <span className="material-symbols-outlined">save</span>
              Save Draft
            </button>
            <div className="flex gap-4">
              {step < 3 ? (
                <button onClick={() => setStep(step + 1)} className="px-10 py-3 bg-ai-gradient text-white rounded-lg font-bold shadow-lg shadow-secondary/30 flex items-center gap-2">
                  Next Step
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              ) : (
                <>
                  <button onClick={() => router.push('/jobs')} className="px-8 py-3 rounded-lg border border-outline font-semibold hover:bg-surface-container transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSubmit(false)}
                    disabled={saving || !title || !description}
                    className="px-10 py-3 bg-ai-gradient text-white rounded-lg font-bold shadow-lg shadow-secondary/30 flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Review & Post Job'}
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
