import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  title: string;
  description: string;
  department: string;
  employmentType: string;
  location: string;
  salaryRange: string;
  requiredSkills: string[];
  experienceLevel: string;
  status: 'active' | 'draft' | 'closed';
  aiWeights: {
    technicalSkills: number;
    yearsOfExperience: number;
    educationCredentials: number;
    pastProjectImpact: number;
  };
  passingScore: number;
  shortlistCap: 10 | 20;
  applicationDeadline: string;
  applicantCount: number;
  shortlistedCount: number;
  screenedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    department: { type: String, default: 'Engineering & Data Science' },
    employmentType: { type: String, default: 'Full-time Permanent' },
    location: { type: String, default: 'Remote' },
    salaryRange: { type: String, default: '' },
    requiredSkills: [{ type: String }],
    experienceLevel: {
      type: String,
      enum: ['Junior', 'Mid-level', 'Senior', 'Director', 'Executive'],
      default: 'Senior',
    },
    status: {
      type: String,
      enum: ['active', 'draft', 'closed'],
      default: 'active',
    },
    aiWeights: {
      technicalSkills: { type: Number, default: 85, min: 0, max: 100 },
      yearsOfExperience: { type: Number, default: 40, min: 0, max: 100 },
      educationCredentials: { type: Number, default: 25, min: 0, max: 100 },
      pastProjectImpact: { type: Number, default: 70, min: 0, max: 100 },
    },
    passingScore: { type: Number, default: 70, min: 0, max: 100 },
    shortlistCap: { type: Number, enum: [10, 20], default: 20 },
    applicationDeadline: { type: String, default: '' },
    applicantCount: { type: Number, default: 0 },
    shortlistedCount: { type: Number, default: 0 },
    screenedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IJob>('Job', JobSchema);
