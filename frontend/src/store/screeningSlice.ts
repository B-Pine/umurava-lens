import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../lib/api';
import type { Candidate } from './candidatesSlice';
import type { Job } from './jobsSlice';

export type Recommendation = 'hire' | 'consider' | 'risky';
export type EmailStatus = 'not_sent' | 'sent' | 'failed';
export type InterviewStatus = 'pending' | 'passed' | 'failed' | 'no_show';
export type OutreachPhase = 'invitation' | 'post_interview';

export interface ScreeningResult {
  _id: string;
  jobId: string;
  candidateId: Candidate;
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
  emailSentAt: string | null;
  interviewStatus: InterviewStatus;
  interviewDecisionAt: string | null;
  postInterviewEmailDraft: string;
  postInterviewEmailSubject: string;
  postInterviewEmailStatus: EmailStatus;
  postInterviewEmailSentAt: string | null;
  createdAt: string;
}

export interface ShortlistedResult extends Omit<ScreeningResult, 'jobId'> {
  jobId: Job;
}

export interface ActiveScreening {
  jobId: string;
  jobTitle: string;
  startedAt: number;
  candidateCount: number;
  status: 'running' | 'succeeded' | 'failed';
  message?: string;
}

interface ScreeningState {
  results: ScreeningResult[];
  shortlisted: ShortlistedResult[];
  job: Job | null;
  comparisonData: { job: Job | null; candidates: ScreeningResult[] };
  activeScreenings: Record<string, ActiveScreening>;
  loading: boolean;
  screening: boolean;
  sendingEmail: boolean;
  error: string | null;
}

const initialState: ScreeningState = {
  results: [],
  shortlisted: [],
  job: null,
  comparisonData: { job: null, candidates: [] },
  activeScreenings: {},
  loading: false,
  screening: false,
  sendingEmail: false,
  error: null,
};

export const runScreening = createAsyncThunk(
  'screening/run',
  async (payload: {
    jobId: string;
    candidateIds?: string[];
    jobTitle?: string;
    candidateCount?: number;
  }) => {
    const { jobTitle: _jt, candidateCount: _cc, ...body } = payload;
    const res = await api.post('/screening/run', body);
    return res.data;
  }
);

export const fetchScreeningResults = createAsyncThunk(
  'screening/fetchResults',
  async (params: {
    jobId: string;
    minScore?: number;
    recommendation?: string;
    shortlistedOnly?: boolean;
  }) => {
    const { jobId, ...query } = params;
    const res = await api.get(`/screening/${jobId}`, { params: query });
    return res.data;
  }
);

export const fetchComparisonData = createAsyncThunk(
  'screening/fetchComparison',
  async (params: { candidateIds: string[]; jobId: string }) => {
    const res = await api.get('/screening/compare', {
      params: { candidateIds: params.candidateIds.join(','), jobId: params.jobId },
    });
    return res.data;
  }
);

export const fetchShortlisted = createAsyncThunk('screening/fetchShortlisted', async () => {
  const res = await api.get('/screening/shortlisted');
  return res.data;
});

export const updateEmailDraft = createAsyncThunk(
  'screening/updateEmailDraft',
  async (payload: {
    resultId: string;
    emailDraft?: string;
    emailSubject?: string;
    phase?: OutreachPhase;
  }) => {
    const { resultId, ...body } = payload;
    const res = await api.patch(`/screening/results/${resultId}/email`, body);
    return res.data as ScreeningResult;
  }
);

export const setInterviewDecision = createAsyncThunk(
  'screening/setInterviewDecision',
  async (payload: { resultId: string; decision: Exclude<InterviewStatus, 'pending'> }) => {
    const res = await api.patch(
      `/screening/results/${payload.resultId}/interview-decision`,
      { decision: payload.decision }
    );
    return res.data as ScreeningResult;
  }
);

export const sendOutreachEmail = createAsyncThunk(
  'screening/sendOutreach',
  async (payload: {
    screeningResultId: string;
    to?: string;
    subject?: string;
    body?: string;
    phase?: OutreachPhase;
  }) => {
    const res = await api.post('/outreach/send', payload);
    return res.data;
  }
);

export const sendOutreachBatch = createAsyncThunk(
  'screening/sendOutreachBatch',
  async (payload: { screeningResultIds: string[]; phase?: OutreachPhase }) => {
    const res = await api.post('/outreach/send/batch', payload);
    return res.data;
  }
);

const screeningSlice = createSlice({
  name: 'screening',
  initialState,
  reducers: {
    patchResultLocal(state, action) {
      const { id, patch } = action.payload as { id: string; patch: Partial<ScreeningResult> };
      const idx = state.results.findIndex((r) => r._id === id);
      if (idx !== -1) {
        state.results[idx] = { ...state.results[idx], ...patch };
      }
    },
    dismissActiveScreening(state, action) {
      const jobId = action.payload as string;
      delete state.activeScreenings[jobId];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runScreening.pending, (state, action) => {
        state.screening = true;
        state.error = null;
        const arg = action.meta.arg;
        state.activeScreenings[arg.jobId] = {
          jobId: arg.jobId,
          jobTitle: arg.jobTitle || 'Screening',
          candidateCount: arg.candidateCount || 0,
          startedAt: Date.now(),
          status: 'running',
        };
      })
      .addCase(runScreening.fulfilled, (state, action) => {
        state.screening = false;
        const arg = action.meta.arg;
        const entry = state.activeScreenings[arg.jobId];
        if (entry) {
          entry.status = 'succeeded';
          entry.message = action.payload?.message;
        }
      })
      .addCase(runScreening.rejected, (state, action) => {
        state.screening = false;
        state.error = action.error.message || 'Screening failed';
        const arg = action.meta.arg;
        const entry = state.activeScreenings[arg.jobId];
        if (entry) {
          entry.status = 'failed';
          entry.message = action.error.message;
        }
      })
      .addCase(fetchScreeningResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchScreeningResults.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload.results;
        state.job = action.payload.job;
      })
      .addCase(fetchScreeningResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed';
      })
      .addCase(fetchComparisonData.fulfilled, (state, action) => {
        state.comparisonData = action.payload;
      })
      .addCase(fetchShortlisted.fulfilled, (state, action) => {
        state.shortlisted = action.payload.results;
      })
      .addCase(updateEmailDraft.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.results.findIndex((r) => r._id === updated._id);
        if (idx !== -1) state.results[idx] = { ...state.results[idx], ...updated };
      })
      .addCase(sendOutreachEmail.pending, (state) => {
        state.sendingEmail = true;
      })
      .addCase(sendOutreachEmail.fulfilled, (state, action) => {
        state.sendingEmail = false;
        const updated = action.payload.result;
        if (updated) {
          const idx = state.results.findIndex((r) => r._id === updated._id);
          if (idx !== -1) state.results[idx] = { ...state.results[idx], ...updated };
        }
      })
      .addCase(sendOutreachEmail.rejected, (state, action) => {
        state.sendingEmail = false;
        state.error = action.error.message || 'Email send failed';
      })
      .addCase(setInterviewDecision.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.results.findIndex((r) => r._id === updated._id);
        if (idx !== -1) state.results[idx] = { ...state.results[idx], ...updated };
      });
  },
});

export const { patchResultLocal, dismissActiveScreening } = screeningSlice.actions;
export default screeningSlice.reducer;
