import mongoose, { Schema, Document } from 'mongoose';

export interface IScreeningResult extends Document {
  jobId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  score: number;
  rank: number;
  strengths: string[];
  gaps: string[];
  summary: string;
  recommendation: 'hire' | 'consider' | 'risky';
  confidence: number;
  technicalSkillsScore: number;
  experienceScore: number;
  educationScore: number;
  projectImpactScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const ScreeningResultSchema = new Schema<IScreeningResult>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    rank: { type: Number, required: true },
    strengths: [{ type: String }],
    gaps: [{ type: String }],
    summary: { type: String, default: '' },
    recommendation: {
      type: String,
      enum: ['hire', 'consider', 'risky'],
      required: true,
    },
    confidence: { type: Number, default: 0, min: 0, max: 100 },
    technicalSkillsScore: { type: Number, default: 0, min: 0, max: 100 },
    experienceScore: { type: Number, default: 0, min: 0, max: 100 },
    educationScore: { type: Number, default: 0, min: 0, max: 100 },
    projectImpactScore: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

ScreeningResultSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });

export default mongoose.model<IScreeningResult>('ScreeningResult', ScreeningResultSchema);
