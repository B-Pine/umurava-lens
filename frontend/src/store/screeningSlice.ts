import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../lib/api';
import type { Candidate } from './candidatesSlice';
import type { Job } from './jobsSlice';

export interface ScreeningResult {
  _id: string;
  jobId: string;
  candidateId: Candidate;
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
  createdAt: string;
}

interface ScreeningState {
  results: ScreeningResult[];
  job: Job | null;
  comparisonData: { job: Job | null; candidates: ScreeningResult[] };
  loading: boolean;
  screening: boolean;
  error: string | null;
}

const initialState: ScreeningState = {
  results: [],
  job: null,
  comparisonData: { job: null, candidates: [] },
  loading: false,
  screening: false,
  error: null,
};

export const runScreening = createAsyncThunk('screening/run', async (jobId: string) => {
  const res = await api.post('/screening/run', { jobId });
  return res.data;
});

export const fetchScreeningResults = createAsyncThunk(
  'screening/fetchResults',
  async (params: { jobId: string; minScore?: number; recommendation?: string }) => {
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

const screeningSlice = createSlice({
  name: 'screening',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(runScreening.pending, (state) => { state.screening = true; state.error = null; })
      .addCase(runScreening.fulfilled, (state) => { state.screening = false; })
      .addCase(runScreening.rejected, (state, action) => { state.screening = false; state.error = action.error.message || 'Screening failed'; })
      .addCase(fetchScreeningResults.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchScreeningResults.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload.results;
        state.job = action.payload.job;
      })
      .addCase(fetchScreeningResults.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Failed'; })
      .addCase(fetchComparisonData.fulfilled, (state, action) => { state.comparisonData = action.payload; });
  },
});

export default screeningSlice.reducer;
