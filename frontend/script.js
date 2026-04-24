const fs = require('fs');

const createContent = fs.readFileSync('src/app/jobs/create/page.tsx', 'utf8');

let newContent = createContent.replace('export default function CreateJobPage() {', 'export default function EditJobPage() {');

// Replace imports
const imports = `import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import api from '../../../../lib/api';`;

newContent = newContent.replace(/import \{ useState \} from 'react';[\s\S]*?import \{ createJob \} from '\.\.\/\.\.\/\.\.\/store\/jobsSlice';/, imports);

// Replace hook initializations
newContent = newContent.replace('const dispatch = useAppDispatch();\n  const router = useRouter();', `  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const publishMode = searchParams.get('publish') === '1';
  const id = params.id as string;
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);`);

// We need to write a useEffect to fetch the job and populate the state. We'll append it before `const addSkill ...`
const useEffectStr = `
  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await api.get(\`/jobs/\${id}\`);
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
`;

newContent = newContent.replace('  const addSkill = (skill: string) => {', useEffectStr + '  const addSkill = (skill: string) => {');

// Replace submission logic
const submitLogic = `
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
      await api.put(\`/jobs/\${id}\`, updateData);
      router.push(publishMode || !asDraft ? '/jobs' : \`/jobs/\${id}\`);
    } catch (err: any) {
      alert('Failed to update job: ' + (err?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };
`;

newContent = newContent.replace(/const handleSubmit = async \(asDraft: boolean\) => \{[\s\S]*?finally \{\n      setSaving\(false\);\n    \}\n  \};/, submitLogic);

// Modify header texts
newContent = newContent.replace("Define the role", "{publishMode ? 'Publish Draft' : 'Edit role'}");
newContent = newContent.replace("Configure the job spec and how the AI should weight candidates.", "{publishMode ? 'Fill in any missing details and publish.' : 'Update the job spec and how the AI should weight candidates.'}");

// Add discard link and publish states in action bar
newContent = newContent.replace("onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : router.push('/jobs')}", "onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : router.push(publishMode ? '/jobs' : `/jobs/${id}`)}");
newContent = newContent.replace("save</span>", "save</span>");
newContent = newContent.replace("{saving ? 'Saving…' : 'Save draft'}", "{saving ? 'Saving…' : publishMode ? 'Save as draft' : 'Save changes'}");

// Write out
fs.writeFileSync('src/app/jobs/[id]/edit/page.tsx', newContent);
