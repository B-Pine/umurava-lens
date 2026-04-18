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
  async (
    params: { jobId?: string; page?: number; dateFrom?: string; dateTo?: string; search?: string; limit?: number } = {}
  ) => {
    const res = await api.get('/candidates', { params });
    return res.data;
  }
);

export const deleteCandidate = createAsyncThunk(
  'candidates/deleteCandidate',
  async (id: string) => {
    await api.delete(`/candidates/${id}`);
    return id;
  }
);

export const deleteCandidatesBulk = createAsyncThunk(
  'candidates/deleteCandidatesBulk',
  async (ids: string[]) => {
    await api.delete('/candidates', { data: { ids } });
    return ids;
  }
);

export const uploadCandidates = createAsyncThunk(
  'candidates/uploadCandidates',
  async (data: { candidates: Partial<Candidate>[]; jobId?: string }) => {
    const res = await api.post('/candidates/upload', data);
    return res.data;
  }
);

export const uploadCandidateFiles = createAsyncThunk(
  'candidates/uploadFiles',
  async (data: { files: File[]; jobId?: string }) => {
    const formData = new FormData();
    if (data.jobId) formData.append('jobId', data.jobId);
    data.files.forEach(f => formData.append('files', f));
    const res = await api.post('/candidates/upload/files', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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
      .addCase(uploadCandidates.rejected, (state, action) => { state.uploading = false; state.error = action.error.message || 'Upload failed'; })
      .addCase(uploadCandidateFiles.pending, (state) => { state.uploading = true; state.error = null; })
      .addCase(uploadCandidateFiles.fulfilled, (state, action) => {
        state.uploading = false;
        state.candidates = [...action.payload.candidates, ...state.candidates];
      })
      .addCase(uploadCandidateFiles.rejected, (state, action) => { state.uploading = false; state.error = action.error.message || 'File Upload failed'; })
      .addCase(deleteCandidate.fulfilled, (state, action) => {
        state.candidates = state.candidates.filter((c) => c._id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(deleteCandidatesBulk.fulfilled, (state, action) => {
        const ids = new Set(action.payload);
        state.candidates = state.candidates.filter((c) => !ids.has(c._id));
        state.total = Math.max(0, state.total - action.payload.length);
      });
  },
});

export default candidatesSlice.reducer;
