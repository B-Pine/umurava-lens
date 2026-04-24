import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../lib/api';

export interface Job {
  _id: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface TopTalent {
  _id: string;
  candidateId: string;
  jobId: string;
  name: string;
  role: string;
  score: number;
  recommendation: 'hire' | 'consider' | 'risky';
}

interface DashboardStats {
  activeJobCount: number;
  candidatesScreened: number;
  averageMatchScore: number | null;
  averageMatchCount: number;
  recentJobs: Job[];
  topTalents: TopTalent[];
  applicationTrend: Array<{ date: string; count: number }>;
  recommendationSplit: { hire: number; consider: number; risky: number };
  pipeline: { applied: number; screened: number; shortlisted: number };
}

interface JobsState {
  jobs: Job[];
  currentJob: Job | null;
  dashboardStats: DashboardStats | null;
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

const initialState: JobsState = {
  jobs: [],
  currentJob: null,
  dashboardStats: null,
  total: 0,
  page: 1,
  totalPages: 1,
  loading: false,
  error: null,
};

export const fetchDashboardStats = createAsyncThunk('jobs/fetchDashboardStats', async () => {
  const res = await api.get('/jobs/dashboard/stats');
  return res.data;
});

export const fetchJobs = createAsyncThunk(
  'jobs/fetchJobs',
  async (
    params: { status?: string; experienceLevel?: string; page?: number; limit?: number; sort?: string } = {}
  ) => {
    const res = await api.get('/jobs', { params });
    return res.data;
  }
);

export const fetchJobById = createAsyncThunk('jobs/fetchJobById', async (id: string) => {
  const res = await api.get(`/jobs/${id}`);
  return res.data;
});

export const createJob = createAsyncThunk('jobs/createJob', async (data: Partial<Job>) => {
  const res = await api.post('/jobs', data);
  return res.data;
});

export const updateJob = createAsyncThunk(
  'jobs/updateJob',
  async ({ id, data }: { id: string; data: Partial<Job> }) => {
    const res = await api.put(`/jobs/${id}`, data);
    return res.data;
  }
);

export const deleteJob = createAsyncThunk('jobs/deleteJob', async (id: string) => {
  await api.delete(`/jobs/${id}`);
  return id;
});

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    clearCurrentJob(state) {
      state.currentJob = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardStats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch stats';
      })
      .addCase(fetchJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.jobs = action.payload.jobs;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch jobs';
      })
      .addCase(fetchJobById.fulfilled, (state, action) => {
        state.currentJob = action.payload;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.jobs.unshift(action.payload);
      })
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.jobs = state.jobs.filter((j) => j._id !== action.payload);
      });
  },
});

export const { clearCurrentJob } = jobsSlice.actions;
export default jobsSlice.reducer;
