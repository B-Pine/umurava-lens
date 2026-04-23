import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Job from './models/Job';
import Candidate from './models/Candidate';
import ScreeningResult from './models/ScreeningResult';
import User from './models/User';

dotenv.config();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@umurava.africa';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'umurava-admin-2026';
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'Umurava Admin';

const jobs = [
  {
    title: 'Senior AI Research Engineer',
    description:
      'Lead our R&D efforts in large-scale transformer models and reinforcement learning architectures. You will drive the design and implementation of production-grade ML systems.',
    department: 'Engineering & Data Science',
    employmentType: 'Full-time Permanent',
    location: 'Kigali, Rwanda (Remote-friendly)',
    salaryRange: '$80k - $120k',
    requiredSkills: ['Python', 'PyTorch', 'Transformers', 'LLM Finetuning', 'Vector DBs'],
    experienceLevel: 'Senior',
    status: 'active' as const,
    aiWeights: {
      technicalSkills: 85,
      yearsOfExperience: 40,
      educationCredentials: 25,
      pastProjectImpact: 70,
    },
    passingScore: 70,
    shortlistCap: 20 as const,
    applicationDeadline: '2026-06-30',
  },
  {
    title: 'Backend Lead',
    description:
      'Scale our high-throughput distributed services. Architecture ownership of core API infrastructure. Build reliable systems serving millions of requests.',
    department: 'Engineering & Data Science',
    employmentType: 'Full-time Permanent',
    location: 'Remote',
    salaryRange: '$60k - $90k',
    requiredSkills: ['Node.js', 'TypeScript', 'MongoDB', 'Kubernetes', 'AWS'],
    experienceLevel: 'Senior',
    status: 'active' as const,
    aiWeights: {
      technicalSkills: 80,
      yearsOfExperience: 60,
      educationCredentials: 20,
      pastProjectImpact: 65,
    },
    passingScore: 70,
    shortlistCap: 10 as const,
    applicationDeadline: '2026-07-31',
  },
  {
    title: 'Product Design Director',
    description:
      'Setting the visual and strategic direction for the Umurava Lens platform experience. Lead a team of designers.',
    department: 'Product Development',
    employmentType: 'Contract (Long term)',
    location: 'Remote',
    salaryRange: '$120/hr',
    requiredSkills: ['Figma', 'Strategy', 'Leadership', 'Design Systems', 'User Research'],
    experienceLevel: 'Director',
    status: 'draft' as const,
    aiWeights: {
      technicalSkills: 50,
      yearsOfExperience: 70,
      educationCredentials: 15,
      pastProjectImpact: 80,
    },
    passingScore: 75,
    shortlistCap: 10 as const,
    applicationDeadline: '2026-08-15',
  },
];

const candidatesForAIJob = [
  {
    firstName: 'Sarah',
    lastName: 'Kalsi',
    email: 'sarah.kalsi@example.com',
    headline: 'Principal AI Scientist — LLM Systems & Generative Models',
    bio: 'World-class AI researcher with 12 years in ML. Led deployment of 5+ enterprise-scale LLM ecosystems at Fortune 500 firms. Strong patent portfolio in generative video synthesis.',
    location: 'San Francisco, USA',
    phone: '+1-555-0101',
    skills: [
      { name: 'Python', level: 'Expert', yearsOfExperience: 12 },
      { name: 'PyTorch', level: 'Expert', yearsOfExperience: 9 },
      { name: 'LLM Fine-tuning', level: 'Expert', yearsOfExperience: 4 },
      { name: 'Transformers', level: 'Expert', yearsOfExperience: 6 },
      { name: 'Distributed Computing', level: 'Advanced', yearsOfExperience: 8 },
      { name: 'Vector DBs', level: 'Advanced', yearsOfExperience: 3 },
    ],
    languages: [
      { name: 'English', proficiency: 'Native' },
      { name: 'Hindi', proficiency: 'Fluent' },
    ],
    experience: [
      {
        company: 'DeepTech AI',
        role: 'Principal Scientist',
        startDate: '2021-03',
        endDate: '',
        description: 'Leading a team of 15+ engineers building next-gen LLM products.',
        technologies: ['Python', 'PyTorch', 'Kubernetes', 'Ray'],
        isCurrent: true,
      },
      {
        company: 'Google Brain',
        role: 'Senior ML Engineer',
        startDate: '2017-06',
        endDate: '2021-02',
        description: 'Developed transformer-based architectures for NLP tasks.',
        technologies: ['TensorFlow', 'JAX', 'Python'],
        isCurrent: false,
      },
    ],
    education: [
      {
        institution: 'Stanford University',
        degree: 'PhD',
        fieldOfStudy: 'Computer Science',
        startYear: 2010,
        endYear: 2014,
      },
    ],
    projects: [
      {
        name: 'Enterprise LLM Platform',
        description: 'End-to-end platform for deploying fine-tuned LLMs.',
        technologies: ['Python', 'PyTorch', 'Kubernetes', 'Ray'],
        role: 'Tech Lead',
        link: 'https://example.com/llm-platform',
        startDate: '2022-01',
        endDate: '2024-06',
      },
    ],
    certifications: [
      { name: 'Google Cloud ML Engineer', issuer: 'Google', issueDate: '2022-05' },
      { name: 'AWS ML Specialty', issuer: 'AWS', issueDate: '2021-11' },
    ],
    availability: {
      status: 'Open to Opportunities',
      type: 'Full-time',
    },
    socialLinks: {
      linkedin: 'https://linkedin.com/in/sarahkalsi',
      github: 'https://github.com/sarahkalsi',
      portfolio: 'https://sarahkalsi.dev',
    },
    source: 'Umurava Platform',
  },
  {
    firstName: 'James',
    lastName: 'Drunner',
    email: 'james.drunner@example.com',
    headline: 'Senior ML Lead — MLOps & Infrastructure',
    bio: 'Exceptional MLOps track record with 9 years in the field. Reduced deployment latency by 40% at TechNext.',
    location: 'Austin, USA',
    phone: '+1-555-0102',
    skills: [
      { name: 'Python', level: 'Advanced', yearsOfExperience: 9 },
      { name: 'TensorFlow', level: 'Advanced', yearsOfExperience: 7 },
      { name: 'MLOps', level: 'Expert', yearsOfExperience: 6 },
      { name: 'Kubernetes', level: 'Expert', yearsOfExperience: 5 },
      { name: 'Go', level: 'Intermediate', yearsOfExperience: 3 },
    ],
    languages: [{ name: 'English', proficiency: 'Native' }],
    experience: [
      {
        company: 'FinCore Systems',
        role: 'Senior ML Lead',
        startDate: '2020-04',
        endDate: '',
        description: 'Architecting ML infrastructure for real-time financial predictions.',
        technologies: ['TensorFlow', 'Kubernetes', 'Spark'],
        isCurrent: true,
      },
      {
        company: 'TechNext',
        role: 'ML Engineer',
        startDate: '2016-08',
        endDate: '2020-03',
        description: 'Reduced deployment latency by 40%.',
        technologies: ['Python', 'Docker', 'Airflow'],
        isCurrent: false,
      },
    ],
    education: [
      {
        institution: 'MIT',
        degree: 'MS',
        fieldOfStudy: 'Computer Science',
        startYear: 2014,
        endYear: 2016,
      },
    ],
    projects: [
      {
        name: 'Real-time Fraud Detection',
        description: 'ML system processing 10M+ transactions daily.',
        technologies: ['TensorFlow', 'Spark', 'Kafka'],
        role: 'Architect',
        link: '',
        startDate: '2020-06',
        endDate: '',
      },
    ],
    certifications: [
      { name: 'Kubernetes Administrator', issuer: 'CNCF', issueDate: '2021-03' },
    ],
    availability: { status: 'Open to Opportunities', type: 'Full-time' },
    socialLinks: { linkedin: 'https://linkedin.com/in/jamesdrunner', github: '', portfolio: '' },
    source: 'Umurava Platform',
  },
  {
    firstName: 'Maya',
    lastName: 'Wong',
    email: 'maya.wong@example.com',
    headline: 'AI Architect — Medical & Ethical AI',
    bio: 'AI architect specializing in medical AI and ethical AI practices. 7 years building AI systems for healthcare.',
    location: 'Toronto, Canada',
    phone: '+1-555-0103',
    skills: [
      { name: 'Python', level: 'Advanced', yearsOfExperience: 7 },
      { name: 'PyTorch', level: 'Intermediate', yearsOfExperience: 4 },
      { name: 'NLP', level: 'Advanced', yearsOfExperience: 5 },
      { name: 'Computer Vision', level: 'Intermediate', yearsOfExperience: 4 },
      { name: 'Ethical AI', level: 'Expert', yearsOfExperience: 5 },
    ],
    languages: [
      { name: 'English', proficiency: 'Fluent' },
      { name: 'Mandarin', proficiency: 'Native' },
      { name: 'French', proficiency: 'Conversational' },
    ],
    experience: [
      {
        company: 'NextGen Health',
        role: 'AI Architect',
        startDate: '2019-09',
        endDate: '',
        description: 'Designing AI systems for medical diagnostics.',
        technologies: ['Python', 'PyTorch', 'BERT'],
        isCurrent: true,
      },
    ],
    education: [
      {
        institution: 'University of Toronto',
        degree: 'MS',
        fieldOfStudy: 'Artificial Intelligence',
        startYear: 2016,
        endYear: 2018,
      },
    ],
    projects: [
      {
        name: 'Clinical NLP Engine',
        description: 'Processing millions of medical records for diagnostic insights.',
        technologies: ['Python', 'BERT', 'spaCy'],
        role: 'Lead Architect',
        link: '',
        startDate: '2020-01',
        endDate: '2023-12',
      },
    ],
    certifications: [{ name: 'AI Ethics Certificate', issuer: 'Montreal Institute', issueDate: '2020-06' }],
    availability: { status: 'Available', type: 'Full-time' },
    socialLinks: { linkedin: 'https://linkedin.com/in/mayawong', github: '', portfolio: '' },
    source: 'CSV',
  },
  {
    firstName: 'Andre',
    lastName: 'Markov',
    email: 'andre.markov@example.com',
    headline: 'Independent Researcher — Bayesian Deep Learning',
    bio: 'Independent AI researcher with publications in Bayesian deep learning.',
    location: 'Berlin, Germany',
    phone: '+49-555-0104',
    skills: [
      { name: 'Python', level: 'Advanced', yearsOfExperience: 4 },
      { name: 'R', level: 'Advanced', yearsOfExperience: 4 },
      { name: 'Statistical Modeling', level: 'Expert', yearsOfExperience: 4 },
    ],
    languages: [
      { name: 'English', proficiency: 'Fluent' },
      { name: 'German', proficiency: 'Native' },
      { name: 'Russian', proficiency: 'Native' },
    ],
    experience: [
      {
        company: 'AI Lab Berlin',
        role: 'Research Scientist',
        startDate: '2023-01',
        endDate: '2024-06',
        description: 'Published papers on Bayesian deep learning.',
        technologies: ['Python', 'R'],
        isCurrent: false,
      },
    ],
    education: [
      {
        institution: 'Humboldt University',
        degree: 'PhD',
        fieldOfStudy: 'Mathematics',
        startYear: 2017,
        endYear: 2021,
      },
    ],
    projects: [],
    certifications: [],
    availability: { status: 'Open to Opportunities', type: 'Contract' },
    socialLinks: { linkedin: '', github: 'https://github.com/amarkov', portfolio: '' },
    source: 'PDF',
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/umurava-lens';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  await Promise.all([
    Job.deleteMany({}),
    Candidate.deleteMany({}),
    ScreeningResult.deleteMany({}),
    User.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // Seed admin
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await User.create({
    email: ADMIN_EMAIL,
    passwordHash,
    name: ADMIN_NAME,
    role: 'admin',
  });
  console.log(`Seeded admin user: ${ADMIN_EMAIL}`);

  const createdJobs = await Job.insertMany(jobs);
  console.log(`Created ${createdJobs.length} jobs`);

  const aiJob = createdJobs[0];
  const candidatesWithJob = candidatesForAIJob.map((c) => ({ ...c, jobId: aiJob._id }));
  const createdCandidates = await Candidate.insertMany(candidatesWithJob);
  console.log(`Created ${createdCandidates.length} candidates for "${aiJob.title}"`);

  // Pre-computed demo screening results so the UI has something without hitting Gemini
  const passingScore = aiJob.passingScore ?? 70;
  const scores = [98, 92, 86, 72];
  const recs: Array<'hire' | 'consider' | 'risky'> = ['hire', 'hire', 'consider', 'consider'];

  const screeningResults = createdCandidates.map((c, i) => {
    const score = scores[i];
    const shortlisted = score >= passingScore;
    return {
      jobId: aiJob._id,
      candidateId: c._id,
      score,
      rank: i + 1,
      strengths: [
        `Concrete experience: ${c.experience[0]?.role || 'N/A'} at ${c.experience[0]?.company || 'N/A'}.`,
        `Strong in ${c.skills.slice(0, 3).map((s) => s.name).join(', ') || 'relevant skills'}.`,
      ],
      gaps:
        score < 85
          ? ['Fewer years in the specific tech stack than top candidates.', 'Less exposure to LLM fine-tuning at scale.']
          : ['May have competing offers.'],
      summary: `${c.firstName} ${c.lastName} is a ${score >= 85 ? 'strong' : 'promising'} fit for the ${aiJob.title} role. ${shortlisted ? 'Recommend outreach.' : 'Keep warm.'}`,
      recommendation: recs[i],
      confidence: 85 + (i % 3) * 3,
      technicalSkillsScore: Math.max(50, score - 2),
      experienceScore: Math.max(50, score - 5),
      educationScore: Math.max(60, score - 1),
      projectImpactScore: Math.max(50, score - 8),
      shortlisted,
      emailSubject: shortlisted
        ? `Interview Invitation — ${aiJob.title} at Umurava`
        : `Your application for ${aiJob.title} at Umurava`,
      emailDraft: shortlisted
        ? `Hi ${c.firstName},\n\nThank you for applying to the ${aiJob.title} role at Umurava. Your background in ${c.skills[0]?.name || 'your field'} and your experience at ${c.experience[0]?.company || 'your current role'} caught our attention.\n\nWe'd love to set up a 30-minute conversation to explore fit. Please reply with 2-3 time slots that work for you this week.\n\nLooking forward,\nThe Umurava Talent Team`
        : `Hi ${c.firstName},\n\nThank you for your interest in the ${aiJob.title} role at Umurava. We had an incredibly strong pool of candidates, and after careful review we've decided to move forward with others whose experience maps more directly to this role's immediate focus.\n\nWe'd love to stay in touch — we publish new roles often, and your profile is now in our talent network.\n\nWarmly,\nThe Umurava Talent Team`,
      emailStatus: 'not_sent' as const,
    };
  });

  await ScreeningResult.insertMany(screeningResults);
  console.log(`Created ${screeningResults.length} screening results`);

  await Job.findByIdAndUpdate(aiJob._id, {
    applicantCount: createdCandidates.length,
    screenedCount: createdCandidates.length,
    shortlistedCount: screeningResults.filter((r) => r.shortlisted).length,
  });

  console.log('\nSeed complete. Summary:');
  console.log(`- Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`- Jobs: ${createdJobs.length}`);
  console.log(`- Candidates: ${createdCandidates.length}`);
  console.log(`- Screening Results: ${screeningResults.length}`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

seed().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
