'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import api from '../../../../lib/api';

const DEPARTMENTS = [
  'Engineering & Data Science',
  'Product Development',
  'Executive Leadership',
  'Operations',
  'Design',
  'Sales & Marketing',
];

const EMPLOYMENT_TYPES = ['Full-time Permanent', 'Part-time', 'Contract (Long term)', 'Interim Leadership', 'Internship'];
const EXPERIENCE_LEVELS = ['Junior', 'Mid-level', 'Senior', 'Director', 'Executive'];

const WEIGHT_KEYS = [
  { key: 'technicalSkills', label: 'Technical Skills', hint: 'Verified code & platform proficiency' },
  { key: 'yearsOfExperience', label: 'Years of Experience', hint: 'Tenure and progression' },
  { key: 'educationCredentials', label: 'Education', hint: 'Degrees and institutions' },
  { key: 'pastProjectImpact', label: 'Project Impact', hint: 'Portfolio and outcomes' },
] as const;

export default function EditJobPage() {
    const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const publishMode = searchParams.get('publish') === '1';
  const id = params.id as string;
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [employmentType, setEmploymentType] = useState(EMPLOYMENT_TYPES[0]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Mid-level');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [weights, setWeights] = useState({
    technicalSkills: 85,
    yearsOfExperience: 40,
    educationCredentials: 25,
    pastProjectImpact: 70,
  });
  const [passingScore, setPassingScore] = useState<number>(70);
  const [shortlistCap, setShortlistCap] = useState<10 | 20>(20);
  const [applicationDeadline, setApplicationDeadline] = useState('');
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);


  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await api.get(`/jobs/${id}`);
        const data = response.data;
        setJob(data);
        setTitle(data.title || '');
        setDepartment(data.department || DEPARTMENTS[0]);
        setEmploymentType(data.employmentType || EMPLOYMENT_TYPES[0]);
        setDescription(data.description || '');
        setLocation(data.location || '');
        setSalaryRange(data.salaryRange || '');
        setExperienceLevel(data.experienceLevel || 'Mid-level');
        setSkills(data.requiredSkills || []);
        if (data.aiWeights) {
          setWeights({
            technicalSkills: data.aiWeights.technicalSkills ?? 85,
            yearsOfExperience: data.aiWeights.yearsOfExperience ?? 40,
            educationCredentials: data.aiWeights.educationCredentials ?? 25,
            pastProjectImpact: data.aiWeights.pastProjectImpact ?? 70,
          });
        }
        setPassingScore(data.passingScore || 70);
        setShortlistCap(data.shortlistCap || 20);
        if (data.applicationDeadline) {
          setApplicationDeadline(new Date(data.applicationDeadline).toISOString().split('T')[0]);
        }
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  if (loading) {
    return <div className="space-y-4 p-8">Loading edit wizard...</div>;
  }
  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.find((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkills([...skills, trimmed]);
    }
    setSkillInput('');
  };
  const removeSkill = (skill: string) => setSkills(skills.filter((s) => s !== skill));

  const step1Err = {
    title: !title.trim() ? 'Job title is required' : '',
    description: !description.trim() ? 'Job description is required' : '',
    location: !location.trim() ? 'Location is required' : '',
    salaryRange: !salaryRange.trim() ? 'Salary range is required' : '',
  };
  const step3Err = { skills: skills.length === 0 ? 'Add at least one required skill' : '' };
  const step1Valid = Object.values(step1Err).every((e) => !e);
  const step3Valid = Object.values(step3Err).every((e) => !e);

  const handleNextStep = () => {
    if (currentStep === 1 && !step1Valid) {
      setShowErrors(true);
    } else {
      setCurrentStep(currentStep + 1);
      setShowErrors(false);
    }
  };

  
  const handleSubmit = async (asDraft: boolean) => {
    if (asDraft) {
      if (!title.trim()) {
        setShowErrors(true);
        setCurrentStep(1);
        return;
      }
    } else {
      if (!step1Valid) {
        setShowErrors(true);
        setCurrentStep(1);
        return;
      }
      if (!step3Valid) {
        setShowErrors(true);
        setCurrentStep(3);
        return;
      }
    }
    setSaving(true);
    try {
      const updateData: any = {
        title: title.trim(),
        department,
        employmentType,
        description: description.trim() || (asDraft ? '(draft — description pending)' : ''),
        location,
        salaryRange,
        experienceLevel,
        requiredSkills: skills,
        aiWeights: weights,
        passingScore,
        shortlistCap,
        applicationDeadline,
      };
      if (!asDraft) {
        updateData.status = 'active';
      }
      await api.put(`/jobs/${id}`, updateData);
      router.push(publishMode || !asDraft ? '/jobs' : `/jobs/${id}`);
    } catch (err: any) {
      alert('Failed to update job: ' + (err?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };


  const steps = [
    { num: 1, label: 'Job details', icon: 'description' },
    { num: 2, label: 'AI weighting', icon: 'tune' },
    { num: 3, label: 'Skills config', icon: 'terminal' },
  ];

  return (
    <div className="space-y-4 w-full max-w-5xl mx-auto">
      {/* HEADER */}
      <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <nav className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-1.5">
            <Link href="/jobs" className="hover:text-slate-900 transition-colors">Jobs</Link>
            <span className="material-symbols-outlined text-[10px] md:text-[12px]">chevron_right</span>
            <span className="text-indigo-700">New role</span>
          </nav>
          <h1 className="text-[18px] md:text-2xl font-extrabold tracking-tight text-slate-900 leading-tight">{publishMode ? 'Publish Draft' : 'Edit role'}</h1>
          <p className="text-[10px] md:text-[12px] text-slate-500 font-medium mt-0.5">
            {publishMode ? 'Fill in any missing details and publish.' : 'Update the job spec and how the AI should weight candidates.'}
          </p>
        </div>
      </section>

      {/* MAIN LAYOUT */}
      <div className="flex flex-col lg:flex-row gap-4 md:gap-5">
        
        {/* LEFT PANE: Progress Tracker */}
        <div className="lg:w-64 shrink-0">
          <div className="glass-panel p-3 md:p-5 min-h-[100px] lg:min-h-[360px] rounded-xl flex flex-row lg:flex-col gap-2 overflow-x-auto hide-scrollbar">
            {steps.map(s => {
              const isActive = currentStep === s.num;
              const isCompleted = currentStep > s.num;
              return (
              <div
                 key={s.num}
                 className={`flex items-center gap-3 px-3 py-2.5 md:py-3.5 rounded-xl text-left transition-colors whitespace-nowrap lg:whitespace-normal ${
                   isActive ? 'bg-indigo-50/80 shadow-[0_1px_2px_0_rgba(70,72,212,0.05)] border border-indigo-100/50' : 'border border-transparent'
                 }`}
              >
                 <div className={`w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                   isActive || isCompleted ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500'
                 }`}>
                   {isCompleted ? (
                     <span className="material-symbols-outlined text-[13px] md:text-[15px]" style={{ fontVariationSettings: "'wght' 700" }}>check</span>
                   ) : (
                     <span className="text-[10px] md:text-[11px] font-extrabold">{s.num}</span>
                   )}
                 </div>
                 <div className="flex-1">
                   <p className={`text-[10px] md:text-[11px] font-bold uppercase tracking-widest ${
                     isActive || isCompleted ? 'text-indigo-900' : 'text-slate-500'
                   }`}>{s.label}</p>
                 </div>
              </div>
            )})}
          </div>
        </div>

        {/* RIGHT PANE */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <AnimatePresence mode="wait">
            <motion.div
               key={currentStep}
               initial={{ opacity: 0, x: 10 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -10 }}
               transition={{ duration: 0.2 }}
            >
              {currentStep === 1 && (
                <Step1
                  title={title} setTitle={setTitle}
                  department={department} setDepartment={setDepartment}
                  employmentType={employmentType} setEmploymentType={setEmploymentType}
                  location={location} setLocation={setLocation}
                  salaryRange={salaryRange} setSalaryRange={setSalaryRange}
                  experienceLevel={experienceLevel} setExperienceLevel={setExperienceLevel}
                  description={description} setDescription={setDescription}
                  applicationDeadline={applicationDeadline} setApplicationDeadline={setApplicationDeadline}
                  showErrors={showErrors} step1Err={step1Err}
                />
              )}
              {currentStep === 2 && (
                <Step2 weights={weights} setWeights={setWeights} passingScore={passingScore} setPassingScore={setPassingScore} />
              )}
              {currentStep === 3 && (
                <Step3
                  skills={skills} addSkill={addSkill} removeSkill={removeSkill}
                  skillInput={skillInput} setSkillInput={setSkillInput}
                  shortlistCap={shortlistCap} setShortlistCap={setShortlistCap}
                  showErrors={showErrors} step3Err={step3Err}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* ACTION BAR */}
          <section className="glass-panel rounded-xl p-2 md:p-3 flex flex-row items-center justify-between gap-3">
             <button
               onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : router.push(publishMode ? '/jobs' : `/jobs/${id}`)}
               disabled={saving}
               className="inline-flex items-center h-7 md:h-8 px-3 md:px-4 rounded-lg bg-white border border-slate-200 text-[10px] md:text-[11px] font-bold text-slate-700 hover:border-slate-300 disabled:opacity-40 transition-colors press"
             >
               {currentStep === 1 ? 'Cancel' : 'Back'}
             </button>
             
             <div className="flex items-center gap-1.5 md:gap-2">
               <button
                 onClick={() => handleSubmit(true)}
                 disabled={saving || !title.trim()}
                 className="inline-flex items-center gap-1 md:gap-1.5 h-7 md:h-8 px-2.5 md:px-3 rounded-lg bg-white border border-slate-200 text-[10px] md:text-[11px] font-bold text-slate-700 hover:border-slate-300 disabled:opacity-40 press"
               >
                 <span className="material-symbols-outlined text-[12px] md:text-[13px]">save</span>
                 <span className="hidden sm:inline">{saving ? 'Saving…' : publishMode ? 'Save as draft' : 'Save changes'}</span>
                 <span className="inline sm:hidden">Draft</span>
               </button>

               {currentStep < 3 ? (
                 <button
                   onClick={handleNextStep}
                   className="inline-flex items-center gap-1 md:gap-1.5 h-7 md:h-8 px-3 md:px-4 rounded-lg bg-indigo-100 text-indigo-700 text-[10px] md:text-[11px] font-extrabold hover:bg-indigo-200 transition press"
                 >
                   Next step
                   <span className="material-symbols-outlined text-[12px] md:text-[14px]">arrow_forward</span>
                 </button>
               ) : (
                 <button
                   onClick={() => handleSubmit(false)}
                   disabled={saving || !step1Valid || !step3Valid}
                   className="inline-flex items-center gap-1 md:gap-1.5 h-7 md:h-8 px-3 md:px-5 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 text-white text-[10px] md:text-[11px] font-bold shadow-[0_4px_12px_-4px_rgba(70,72,212,0.6),inset_0_1px_0_0_rgba(255,255,255,0.22)] hover:from-indigo-400 hover:to-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition press"
                 >
                   {saving ? 'Publishing…' : 'Publish role'}
                   <span className="material-symbols-outlined text-[12px] md:text-[14px]">check</span>
                 </button>
               )}
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ---------- Sub-components ----------

const inputCls =
  'w-full bg-white border border-slate-200 rounded-lg px-3 h-9 text-[12.5px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all placeholder:text-slate-400';

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 flex items-center gap-1">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="mt-1">{children}</div>
      {error && <p className="text-[10px] text-rose-600 font-semibold mt-1">{error}</p>}
    </div>
  );
}

function Step1(props: {
  title: string;
  setTitle: (v: string) => void;
  department: string;
  setDepartment: (v: string) => void;
  employmentType: string;
  setEmploymentType: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  salaryRange: string;
  setSalaryRange: (v: string) => void;
  experienceLevel: string;
  setExperienceLevel: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  applicationDeadline: string;
  setApplicationDeadline: (v: string) => void;
  showErrors: boolean;
  step1Err: Record<string, string>;
}) {
  const p = props;
  return (
    <section className="glass-panel rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-indigo-600 text-[16px]">description</span>
        <h2 className="text-[13px] font-extrabold text-slate-900 tracking-tight">Job details</h2>
      </div>

      <Field label="Job title" required error={p.showErrors ? p.step1Err.title : ''}>
        <input
          value={p.title}
          onChange={(e) => p.setTitle(e.target.value)}
          className={inputCls}
          placeholder="e.g. Senior AI Research Engineer"
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Department">
          <select value={p.department} onChange={(e) => p.setDepartment(e.target.value)} className={inputCls}>
            {DEPARTMENTS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Field>
        <Field label="Employment type">
          <select value={p.employmentType} onChange={(e) => p.setEmploymentType(e.target.value)} className={inputCls}>
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="Location" required error={p.showErrors ? p.step1Err.location : ''}>
          <input
            value={p.location}
            onChange={(e) => p.setLocation(e.target.value)}
            className={inputCls}
            placeholder="e.g. Kigali, Rwanda"
          />
        </Field>
        <Field label="Salary range" required error={p.showErrors ? p.step1Err.salaryRange : ''}>
          <input
            value={p.salaryRange}
            onChange={(e) => p.setSalaryRange(e.target.value)}
            className={inputCls}
            placeholder="e.g. $60k – $90k"
          />
        </Field>
        <Field label="Experience level">
          <select value={p.experienceLevel} onChange={(e) => p.setExperienceLevel(e.target.value)} className={inputCls}>
            {EXPERIENCE_LEVELS.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Application deadline">
        <input
          type="date"
          value={p.applicationDeadline}
          onChange={(e) => p.setApplicationDeadline(e.target.value)}
          className={inputCls}
        />
      </Field>

      <Field label="Description" required error={p.showErrors ? p.step1Err.description : ''}>
        <textarea
          value={p.description}
          onChange={(e) => p.setDescription(e.target.value)}
          rows={6}
          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[12.5px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all placeholder:text-slate-400 leading-relaxed"
          placeholder="Mission, responsibilities, impact, and what success looks like…"
        />
      </Field>
    </section>
  );
}

function Step2(props: {
  weights: Record<string, number>;
  setWeights: (w: any) => void;
  passingScore: number;
  setPassingScore: (n: number) => void;
}) {
  const { weights, setWeights, passingScore, setPassingScore } = props;
  return (
    <section className="glass-panel rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <span
          className="material-symbols-outlined text-indigo-600 text-[16px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          tune
        </span>
        <h2 className="text-[13px] font-extrabold text-slate-900 tracking-tight">AI weighting</h2>
      </div>
      <p className="text-[11px] text-slate-500 font-medium -mt-2">
        Tell the AI how much each dimension matters when ranking candidates.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {WEIGHT_KEYS.map((w) => (
          <div key={w.key} className="bg-white/70 border border-slate-100 rounded-lg p-3">
            <div className="flex items-baseline justify-between mb-1">
              <p className="text-[12px] font-bold text-slate-900">{w.label}</p>
              <p className="text-[14px] font-extrabold text-indigo-600 tabular-nums">{weights[w.key]}%</p>
            </div>
            <p className="text-[10.5px] text-slate-500 font-medium mb-2.5">{w.hint}</p>
            <input
              type="range"
              min={0}
              max={100}
              value={weights[w.key]}
              onChange={(e) => setWeights({ ...weights, [w.key]: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        ))}
      </div>

      <div className="bg-white/70 border border-slate-100 rounded-lg p-3">
        <div className="flex items-baseline justify-between mb-1">
          <div>
            <p className="text-[12px] font-bold text-slate-900">Passing score</p>
            <p className="text-[10.5px] text-slate-500 font-medium">Minimum match score to enter the shortlist</p>
          </div>
          <p className="text-[14px] font-extrabold text-indigo-600 tabular-nums">{passingScore}%</p>
        </div>
        <input
          type="range"
          min={50}
          max={95}
          step={1}
          value={passingScore}
          onChange={(e) => setPassingScore(parseInt(e.target.value))}
          className="w-full mt-2"
        />
      </div>
    </section>
  );
}

function Step3(props: {
  skills: string[];
  addSkill: (s: string) => void;
  removeSkill: (s: string) => void;
  skillInput: string;
  setSkillInput: (s: string) => void;
  shortlistCap: 10 | 20;
  setShortlistCap: (n: 10 | 20) => void;
  showErrors: boolean;
  step3Err: Record<string, string>;
}) {
  const p = props;
  const suggestions = ['React', 'TypeScript', 'Node.js', 'Python', 'Postgres', 'Figma', 'GraphQL', 'AWS'];
  return (
    <section className="glass-panel rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-indigo-600 text-[16px]">terminal</span>
        <h2 className="text-[13px] font-extrabold text-slate-900 tracking-tight">Skills & shortlist config</h2>
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Required skills <span className="text-rose-500">*</span>
        </label>
        <div
          className={`mt-1 flex flex-wrap gap-1.5 p-2 bg-white border rounded-lg ${
            p.showErrors && p.step3Err.skills ? 'border-rose-400' : 'border-slate-200'
          }`}
        >
          {p.skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 h-6 pl-2.5 pr-1 rounded-full bg-indigo-600 text-white text-[10.5px] font-semibold"
            >
              {skill}
              <button
                onClick={() => p.removeSkill(skill)}
                className="w-4 h-4 rounded-full hover:bg-white/20 flex items-center justify-center"
                aria-label={`Remove ${skill}`}
              >
                <span className="material-symbols-outlined text-[12px]">close</span>
              </button>
            </span>
          ))}
          <input
            value={p.skillInput}
            onChange={(e) => p.setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                p.addSkill(p.skillInput);
              }
              if (e.key === 'Backspace' && !p.skillInput && p.skills.length > 0) {
                p.removeSkill(p.skills[p.skills.length - 1]);
              }
            }}
            placeholder={p.skills.length === 0 ? 'Type a skill and press Enter…' : 'Add more…'}
            className="flex-1 min-w-[160px] bg-transparent text-[12.5px] font-medium placeholder:text-slate-400 focus:outline-none px-2"
          />
        </div>
        {p.showErrors && p.step3Err.skills && (
          <p className="text-[10px] text-rose-600 font-semibold mt-1">{p.step3Err.skills}</p>
        )}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="text-[10px] font-semibold text-slate-400 mr-1">Suggested:</span>
          {suggestions
            .filter((s) => !p.skills.find((x) => x.toLowerCase() === s.toLowerCase()))
            .map((s) => (
              <button
                key={s}
                onClick={() => p.addSkill(s)}
                className="text-[10.5px] font-semibold bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-700 h-6 px-2 rounded-full transition-colors"
              >
                + {s}
              </button>
            ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Shortlist cap</label>
        <p className="text-[10.5px] text-slate-500 font-medium mt-0.5 mb-2">
          How many top candidates to include in the shortlist
        </p>
        <div className="inline-flex gap-1 p-1 bg-white border border-slate-200 rounded-lg">
          {[10, 20].map((n) => (
            <button
              key={n}
              onClick={() => p.setShortlistCap(n as 10 | 20)}
              className={`h-8 px-4 rounded-md text-[12px] font-bold transition-colors ${
                p.shortlistCap === n
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Top {n}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
