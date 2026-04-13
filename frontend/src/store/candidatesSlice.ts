import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../lib/api';

export interface Candidate {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  currentTitle: string;
  currentCompany: string;
  summary: string;
  skills: string[];
  yearsOfExperience: number;
  education: { degree: string; institution: string; year: number }[];
  experience: { title: string; company: string; startDate: string; endDate: string; description: string }[];
  projects: { name: string; description: string; technologies: string[] }[];
  certifications: string[];
  languages: string[];
  resumeUrl: string;
  avatarUrl: string;
  jobId: string | null;
  createdAt: string;
}

interface CandidatesState {
  candidates: Candidate[];
  total: number;
  loading: boolean;
  uploading: boolean;
  error: string | null;
}

const initialState: CandidatesState = {
  candidates: [],
  total: 0,
  loading: false,
  uploading: false,
  error: null,
};

export const fetchCandidates = createAsyncThunk(
  'candidates/fetchCandidates',
  async (params: { jobId?: string; page?: number } = {}) => {
    const res = await api.get('/candidates', { params });
    return res.data;
  }
);

export const uploadCandidates = createAsyncThunk(
  'candidates/uploadCandidates',
  async (data: { candidates: Partial<Candidate>[]; jobId?: string }) => {
    const res = await api.post('/candidates/upload', data);
    return res.data;
  }
);

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCandidates.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCandidates.fulfilled, (state, action) => {
        state.loading = false;
        state.candidates = action.payload.candidates;
        state.total = action.payload.total;
      })
      .addCase(fetchCandidates.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Failed'; })
      .addCase(uploadCandidates.pending, (state) => { state.uploading = true; state.error = null; })
      .addCase(uploadCandidates.fulfilled, (state, action) => {
        state.uploading = false;
        state.candidates = [...action.payload.candidates, ...state.candidates];
      })
      .addCase(uploadCandidates.rejected, (state, action) => { state.uploading = false; state.error = action.error.message || 'Upload failed'; });
  },
});

export default candidatesSlice.reducer;
