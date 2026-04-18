import mongoose, { Schema, Document } from 'mongoose';

export interface ICandidate extends Document {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  currentTitle: string;
  currentCompany: string;
  summary: string;
  skills: string[];
  yearsOfExperience: number;
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
  experience: {
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  projects: {
    name: string;
    description: string;
    technologies: string[];
  }[];
  certifications: string[];
  languages: string[];
  resumeUrl: string;
  avatarUrl: string;
  source: string;
  jobId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateSchema = new Schema<ICandidate>(
  {
    fullName: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    currentTitle: { type: String, default: '' },
    currentCompany: { type: String, default: '' },
    summary: { type: String, default: '' },
    skills: [{ type: String }],
    yearsOfExperience: { type: Number, default: 0 },
    education: [
      {
        degree: { type: String },
        institution: { type: String },
        year: { type: String, default: '' },
      },
    ],
    experience: [
      {
        title: { type: String },
        company: { type: String },
        startDate: { type: String },
        endDate: { type: String },
        description: { type: String },
      },
    ],
    projects: [
      {
        name: { type: String },
        description: { type: String },
        technologies: [{ type: String }],
      },
    ],
    certifications: [{ type: String }],
    languages: [{ type: String }],
    resumeUrl: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    source: { type: String, default: 'upload' },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', default: null },
  },
  { timestamps: true }
);

export default mongoose.model<ICandidate>('Candidate', CandidateSchema);
