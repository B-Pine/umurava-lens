import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Job from './models/Job';
import Candidate from './models/Candidate';
import ScreeningResult from './models/ScreeningResult';

dotenv.config();

const jobs = [
  {
    title: 'Senior AI Research Engineer',
    description: 'Lead our R&D efforts in large-scale transformer models and reinforcement learning architectures. You will drive the design and implementation of production-grade ML systems.',
    department: 'Engineering & Data Science',
    employmentType: 'Full-time Permanent',
    location: 'San Francisco',
    salaryRange: '$180k - $240k',
    requiredSkills: ['Python', 'PyTorch', 'Transformers', 'LLM Finetuning', 'Vector DBs'],
    experienceLevel: 'Senior',
    status: 'active' as const,
    aiWeights: { technicalSkills: 85, yearsOfExperience: 40, educationCredentials: 25, pastProjectImpact: 70 },
    applicantCount: 142,
    shortlistedCount: 28,
    screenedCount: 110,
  },
  {
    title: 'Backend Lead',
    description: 'Scale our high-throughput distributed services. Architecture ownership of core API infrastructure. Build reliable systems serving millions of requests.',
    department: 'Engineering & Data Science',
    employmentType: 'Full-time Permanent',
    location: 'Remote',
    salaryRange: '$160k - $210k',
    requiredSkills: ['Go', 'Kubernetes', 'PostgreSQL', 'gRPC', 'AWS'],
    experienceLevel: 'Senior',
    status: 'active' as const,
    aiWeights: { technicalSkills: 80, yearsOfExperience: 60, educationCredentials: 20, pastProjectImpact: 65 },
    applicantCount: 86,
    shortlistedCount: 12,
    screenedCount: 32,
  },
  {
    title: 'Product Design Director',
    description: 'Setting the visual and strategic direction for the Umurava Lens platform experience across all verticals. Lead a team of designers.',
    department: 'Product Development',
    employmentType: 'Contract (Long term)',
    location: 'Remote',
    salaryRange: '$120/hr',
    requiredSkills: ['Figma', 'Strategy', 'Leadership', 'Design Systems', 'User Research'],
    experienceLevel: 'Director',
    status: 'draft' as const,
    aiWeights: { technicalSkills: 50, yearsOfExperience: 70, educationCredentials: 15, pastProjectImpact: 80 },
    applicantCount: 0,
    shortlistedCount: 0,
    screenedCount: 0,
  },
];

const candidatesForAIJob = [
  {
    fullName: 'Sarah Kalsi',
    email: 'sarah.kalsi@email.com',
    phone: '+1-555-0101',
    location: 'San Francisco, CA',
    currentTitle: 'Principal Scientist',
    currentCompany: 'DeepTech AI',
    summary: 'World-class AI researcher with 12 years in ML/AI. Led deployment of 5+ enterprise-scale LLM ecosystems at Fortune 500 firms. Strong patent portfolio in generative video synthesis.',
    skills: ['Python', 'PyTorch', 'TensorFlow', 'LLM Fine-tuning', 'Neural Architecture Search', 'Distributed Architecture', 'Vector DBs', 'CUDA', 'Kubernetes'],
    yearsOfExperience: 12,
    education: [{ degree: 'PhD Computer Science', institution: 'Stanford University', year: '2014' }],
    experience: [
      { title: 'Principal Scientist', company: 'DeepTech AI', startDate: '2021', endDate: 'Present', description: 'Leading a team of 15+ engineers building next-gen LLM products.' },
      { title: 'Senior ML Engineer', company: 'Google Brain', startDate: '2017', endDate: '2021', description: 'Developed transformer-based architectures for NLP tasks.' },
    ],
    projects: [
      { name: 'Enterprise LLM Platform', description: 'End-to-end platform for deploying fine-tuned LLMs', technologies: ['Python', 'PyTorch', 'Kubernetes', 'Ray'] },
      { name: 'Video Synthesis Engine', description: 'Generative model for high-fidelity video creation', technologies: ['PyTorch', 'CUDA', 'Diffusion Models'] },
    ],
    certifications: ['Google Cloud ML Engineer', 'AWS ML Specialty'],
    languages: ['English', 'Hindi'],
    avatarUrl: '',
  },
  {
    fullName: 'James Drunner',
    email: 'james.drunner@email.com',
    phone: '+1-555-0102',
    location: 'Austin, TX',
    currentTitle: 'Senior ML Lead',
    currentCompany: 'FinCore Systems',
    summary: 'Exceptional MLOps track record with 9 years in the field. Reduced deployment latency by 40% at TechNext. Specializes in cost-efficient scaling for mid-market cloud infrastructures.',
    skills: ['Python', 'TensorFlow', 'Distributed Computing', 'MLOps', 'Kubernetes', 'Spark', 'Go'],
    yearsOfExperience: 9,
    education: [{ degree: 'MS Computer Science', institution: 'MIT', year: '2016' }],
    experience: [
      { title: 'Senior ML Lead', company: 'FinCore Systems', startDate: '2020', endDate: 'Present', description: 'Architecting ML infrastructure for real-time financial predictions.' },
      { title: 'ML Engineer', company: 'TechNext', startDate: '2016', endDate: '2020', description: 'Reduced deployment latency by 40% and built scalable ML pipelines.' },
    ],
    projects: [
      { name: 'Real-time Fraud Detection', description: 'ML system processing 10M+ transactions daily', technologies: ['TensorFlow', 'Spark', 'Kafka'] },
    ],
    certifications: ['Kubernetes Administrator', 'TensorFlow Developer Certificate'],
    languages: ['English'],
    avatarUrl: '',
  },
  {
    fullName: 'Maya Wong',
    email: 'maya.wong@email.com',
    phone: '+1-555-0103',
    location: 'Toronto, Canada',
    currentTitle: 'AI Architect',
    currentCompany: 'NextGen Health',
    summary: 'AI architect specializing in medical AI and ethical AI practices. 7 years of experience building AI systems for healthcare.',
    skills: ['Python', 'PyTorch', 'Ethical AI', 'Medical AI', 'NLP', 'Computer Vision'],
    yearsOfExperience: 7,
    education: [{ degree: 'MS Artificial Intelligence', institution: 'University of Toronto', year: '2018' }],
    experience: [
      { title: 'AI Architect', company: 'NextGen Health', startDate: '2019', endDate: 'Present', description: 'Designing AI systems for medical diagnostics and patient care.' },
      { title: 'ML Engineer', company: 'HealthTech Labs', startDate: '2018', endDate: '2019', description: 'Built NLP models for clinical document processing.' },
    ],
    projects: [
      { name: 'Clinical NLP Engine', description: 'Processing millions of medical records for diagnostic insights', technologies: ['Python', 'BERT', 'spaCy'] },
    ],
    certifications: ['AI Ethics Certificate - Montreal Institute'],
    languages: ['English', 'Mandarin', 'French'],
    avatarUrl: '',
  },
  {
    fullName: 'Andre Markov',
    email: 'andre.markov@email.com',
    phone: '+49-555-0104',
    location: 'Berlin, DE',
    currentTitle: 'Independent Researcher',
    currentCompany: 'Self-employed',
    summary: 'Independent AI researcher with interesting papers but limited industry experience. Frequent job changes in the past 2 years.',
    skills: ['Python', 'R', 'Statistical Modeling', 'Bayesian Methods', 'Julia'],
    yearsOfExperience: 4,
    education: [{ degree: 'PhD Mathematics', institution: 'Humboldt University', year: '2021' }],
    experience: [
      { title: 'Research Scientist', company: 'AI Lab Berlin', startDate: '2023', endDate: '2024', description: 'Published papers on Bayesian deep learning.' },
      { title: 'Data Scientist', company: 'StartupX', startDate: '2022', endDate: '2023', description: 'Built basic ML models for recommendation systems.' },
      { title: 'Junior ML Engineer', company: 'DataCorp', startDate: '2021', endDate: '2022', description: 'Data pipeline work and basic model training.' },
    ],
    projects: [],
    certifications: [],
    languages: ['English', 'German', 'Russian'],
    avatarUrl: '',
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/umurava-lens';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([Job.deleteMany({}), Candidate.deleteMany({}), ScreeningResult.deleteMany({})]);
  console.log('Cleared existing data');

  // Insert jobs
  const createdJobs = await Job.insertMany(jobs);
  console.log(`Created ${createdJobs.length} jobs`);

  // Insert candidates linked to the first job (AI Research Engineer)
  const aiJob = createdJobs[0];
  const candidatesWithJob = candidatesForAIJob.map((c) => ({ ...c, jobId: aiJob._id }));
  const createdCandidates = await Candidate.insertMany(candidatesWithJob);
  console.log(`Created ${createdCandidates.length} candidates for "${aiJob.title}"`);

  // Pre-create screening results (demo data)
  const screeningResults = [
    {
      jobId: aiJob._id,
      candidateId: createdCandidates[0]._id,
      score: 98,
      rank: 1,
      strengths: [
        'Expert in Neural Architecture Search and LLM Fine-tuning.',
        'Led high-performance teams of 15+ engineers to ship global products.',
        'Strong patent portfolio in generative video synthesis.',
      ],
      gaps: [
        'Higher salary expectations than the initial budget range.',
        'Likely to have competing offers from Tier 1 tech firms.',
      ],
      summary: 'Sarah is the definitive top candidate. Her technical mastery in AI research aligns perfectly with our 2024 roadmap. Recommend immediate outreach before she enters wider market rotation.',
      recommendation: 'hire' as const,
      confidence: 96,
      technicalSkillsScore: 99,
      experienceScore: 95,
      educationScore: 98,
      projectImpactScore: 97,
    },
    {
      jobId: aiJob._id,
      candidateId: createdCandidates[1]._id,
      score: 92,
      rank: 2,
      strengths: [
        'Exceptional MLOps track record with proven infrastructure scaling.',
        'Strong distributed computing expertise with TensorFlow.',
        'Demonstrated scalability wins at FinCore Systems.',
      ],
      gaps: [
        'Less direct LLM fine-tuning experience compared to top candidate.',
        'May need onboarding time for PyTorch-heavy workflows.',
      ],
      summary: 'James is a strong hire for infrastructure-heavy ML roles. His pragmatic approach to scaling makes him ideal for our growth phase. Consider for the Backend Lead role if not placed here.',
      recommendation: 'hire' as const,
      confidence: 91,
      technicalSkillsScore: 90,
      experienceScore: 92,
      educationScore: 90,
      projectImpactScore: 88,
    },
    {
      jobId: aiJob._id,
      candidateId: createdCandidates[2]._id,
      score: 86,
      rank: 3,
      strengths: [
        'Unique medical AI background brings valuable domain diversity.',
        'Strong ethical AI specialist with formal certification.',
      ],
      gaps: [
        'Limited experience with large-scale transformer models.',
        'Healthcare focus may not directly transfer to our product domain.',
      ],
      summary: 'Maya brings a unique perspective from medical AI. Her ethical AI expertise is valuable but her core technical stack may need supplementing for our specific LLM research focus.',
      recommendation: 'consider' as const,
      confidence: 82,
      technicalSkillsScore: 78,
      experienceScore: 80,
      educationScore: 85,
      projectImpactScore: 75,
    },
    {
      jobId: aiJob._id,
      candidateId: createdCandidates[3]._id,
      score: 72,
      rank: 4,
      strengths: [
        'Strong mathematical foundations from PhD in Mathematics.',
        'Published research in Bayesian deep learning.',
      ],
      gaps: [
        'Low collaboration score - primarily solo researcher.',
        'Job hopping pattern: 4 roles in 2 years.',
        'No production-scale ML deployment experience.',
      ],
      summary: 'Andre has interesting research credentials but lacks the industry experience and team leadership this senior role requires. High risk due to frequent job changes and limited production work.',
      recommendation: 'risky' as const,
      confidence: 88,
      technicalSkillsScore: 65,
      experienceScore: 55,
      educationScore: 90,
      projectImpactScore: 50,
    },
  ];

  await ScreeningResult.insertMany(screeningResults);
  console.log(`Created ${screeningResults.length} screening results`);

  console.log('\nSeed complete! Summary:');
  console.log(`- Jobs: ${createdJobs.length}`);
  console.log(`- Candidates: ${createdCandidates.length}`);
  console.log(`- Screening Results: ${screeningResults.length}`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

seed().catch(console.error);
