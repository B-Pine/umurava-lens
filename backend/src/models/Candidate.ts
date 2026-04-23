import mongoose, { Schema, Document } from 'mongoose';

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
export type LanguageProficiency = 'Basic' | 'Conversational' | 'Fluent' | 'Native';
export type AvailabilityStatus = 'Available' | 'Open to Opportunities' | 'Not Available';
export type AvailabilityType = 'Full-time' | 'Part-time' | 'Contract';

export interface ISkill {
  name: string;
  level: SkillLevel;
  yearsOfExperience: number;
}

export interface ILanguage {
  name: string;
  proficiency: LanguageProficiency;
}

export interface IExperience {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  technologies: string[];
  isCurrent: boolean;
}

export interface IEducation {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: number;
  endYear: number;
}

export interface ICertification {
  name: string;
  issuer: string;
  issueDate: string;
}

export interface IProject {
  name: string;
  description: string;
  technologies: string[];
  role: string;
  link: string;
  startDate: string;
  endDate: string;
}

export interface IAvailability {
  status: AvailabilityStatus;
  type: AvailabilityType;
  startDate?: string;
}

export interface ISocialLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
  [key: string]: string | undefined;
}

export interface ICandidate extends Document {
  firstName: string;
  lastName: string;
  email: string;
  headline: string;
  bio: string;
  location: string;
  phone: string;
  skills: ISkill[];
  languages: ILanguage[];
  experience: IExperience[];
  education: IEducation[];
  certifications: ICertification[];
  projects: IProject[];
  availability: IAvailability;
  socialLinks: ISocialLinks;
  resumeUrl: string;
  avatarUrl: string;
  source: string;
  jobId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const SkillSchema = new Schema<ISkill>(
  {
    name: { type: String, required: true },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Intermediate',
    },
    yearsOfExperience: { type: Number, default: 0 },
  },
  { _id: false }
);

const LanguageSchema = new Schema<ILanguage>(
  {
    name: { type: String, required: true },
    proficiency: {
      type: String,
      enum: ['Basic', 'Conversational', 'Fluent', 'Native'],
      default: 'Conversational',
    },
  },
  { _id: false }
);

const ExperienceSchema = new Schema<IExperience>(
  {
    company: { type: String, required: true },
    role: { type: String, required: true },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    description: { type: String, default: '' },
    technologies: [{ type: String }],
    isCurrent: { type: Boolean, default: false },
  },
  { _id: false }
);

const EducationSchema = new Schema<IEducation>(
  {
    institution: { type: String, required: true },
    degree: { type: String, required: true },
    fieldOfStudy: { type: String, default: '' },
    startYear: { type: Number, default: 0 },
    endYear: { type: Number, default: 0 },
  },
  { _id: false }
);

const CertificationSchema = new Schema<ICertification>(
  {
    name: { type: String, required: true },
    issuer: { type: String, default: '' },
    issueDate: { type: String, default: '' },
  },
  { _id: false }
);

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    technologies: [{ type: String }],
    role: { type: String, default: '' },
    link: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
  },
  { _id: false }
);

const AvailabilitySchema = new Schema<IAvailability>(
  {
    status: {
      type: String,
      enum: ['Available', 'Open to Opportunities', 'Not Available'],
      default: 'Open to Opportunities',
    },
    type: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract'],
      default: 'Full-time',
    },
    startDate: { type: String },
  },
  { _id: false }
);

const SocialLinksSchema = new Schema<ISocialLinks>(
  {
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    portfolio: { type: String, default: '' },
  },
  { _id: false, strict: false }
);

const CandidateSchema = new Schema<ICandidate>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    headline: { type: String, required: true, default: '' },
    bio: { type: String, default: '' },
    location: { type: String, required: true, default: '' },
    phone: { type: String, default: '' },
    skills: { type: [SkillSchema], default: [] },
    languages: { type: [LanguageSchema], default: [] },
    experience: { type: [ExperienceSchema], default: [] },
    education: { type: [EducationSchema], default: [] },
    certifications: { type: [CertificationSchema], default: [] },
    projects: { type: [ProjectSchema], default: [] },
    availability: { type: AvailabilitySchema, default: () => ({}) },
    socialLinks: { type: SocialLinksSchema, default: () => ({}) },
    resumeUrl: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    source: {
      type: String,
      enum: ['Umurava Platform', 'CSV', 'PDF', 'Google Drive', 'Manual', 'Direct'],
      default: 'Manual',
    },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', default: null },
  },
  { timestamps: true }
);

CandidateSchema.virtual('fullName').get(function (this: ICandidate) {
  return `${this.firstName} ${this.lastName}`.trim();
});

CandidateSchema.virtual('yearsOfExperience').get(function (this: ICandidate) {
  if (!this.experience || this.experience.length === 0) return 0;
  let total = 0;
  for (const exp of this.experience) {
    const start = parseInt((exp.startDate || '').slice(0, 4), 10);
    const endStr = exp.isCurrent ? String(new Date().getFullYear()) : (exp.endDate || '').slice(0, 4);
    const end = parseInt(endStr, 10);
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      total += end - start;
    }
  }
  return total;
});

CandidateSchema.set('toJSON', { virtuals: true });
CandidateSchema.set('toObject', { virtuals: true });

export default mongoose.model<ICandidate>('Candidate', CandidateSchema);
