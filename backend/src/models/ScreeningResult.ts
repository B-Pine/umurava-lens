import mongoose, { Schema, Document } from 'mongoose';

export type Recommendation = 'hire' | 'consider' | 'risky';
export type EmailStatus = 'not_sent' | 'sent' | 'failed';
export type InterviewStatus = 'pending' | 'passed' | 'failed' | 'no_show';

export interface IScreeningResult extends Document {
  jobId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  score: number;
  rank: number;
  strengths: string[];
  gaps: string[];
  summary: string;
  recommendation: Recommendation;
  confidence: number;
  technicalSkillsScore: number;
  experienceScore: number;
  educationScore: number;
  projectImpactScore: number;
  shortlisted: boolean;
  emailDraft: string;
  emailSubject: string;
  emailStatus: EmailStatus;
  emailSentAt: Date | null;
  interviewStatus: InterviewStatus;
  interviewDecisionAt: Date | null;
  postInterviewEmailDraft: string;
  postInterviewEmailSubject: string;
  postInterviewEmailStatus: EmailStatus;
  postInterviewEmailSentAt: Date | null;
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
    shortlisted: { type: Boolean, default: false, index: true },
    emailDraft: { type: String, default: '' },
    emailSubject: { type: String, default: '' },
    emailStatus: {
      type: String,
      enum: ['not_sent', 'sent', 'failed'],
      default: 'not_sent',
    },
    emailSentAt: { type: Date, default: null },
    interviewStatus: {
      type: String,
      enum: ['pending', 'passed', 'failed', 'no_show'],
      default: 'pending',
      index: true,
    },
    interviewDecisionAt: { type: Date, default: null },
    postInterviewEmailDraft: { type: String, default: '' },
    postInterviewEmailSubject: { type: String, default: '' },
    postInterviewEmailStatus: {
      type: String,
      enum: ['not_sent', 'sent', 'failed'],
      default: 'not_sent',
    },
    postInterviewEmailSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ScreeningResultSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });

export default mongoose.model<IScreeningResult>('ScreeningResult', ScreeningResultSchema);
