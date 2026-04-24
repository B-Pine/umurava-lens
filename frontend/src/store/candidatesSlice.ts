import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../lib/api';

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
export type LanguageProficiency = 'Basic' | 'Conversational' | 'Fluent' | 'Native';
export type AvailabilityStatus = 'Available' | 'Open to Opportunities' | 'Not Available';
export type AvailabilityType = 'Full-time' | 'Part-time' | 'Contract';

export interface Skill {
  name: string;
  level: SkillLevel;
  yearsOfExperience: number;
}
export interface Language {
  name: string;
  proficiency: LanguageProficiency;
}
export interface Experience {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  technologies: string[];
  isCurrent: boolean;
}
export interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: number;
  endYear: number;
}
export interface Certification {
  name: string;
  issuer: string;
  issueDate: string;
}
export interface Project {
  name: string;
  description: string;
  technologies: string[];
  role: string;
  link: string;
  startDate: string;
  endDate: string;
}
export interface Availability {
  status: AvailabilityStatus;
  type: AvailabilityType;
  startDate?: string;
}
export interface SocialLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
  [key: string]: string | undefined;
}

export interface Candidate {
  _id: string;
  firstName: string;
  lastName: string;
  fullName?: string; // virtual
  email: string;
  phone: string;
  headline: string;
  bio: string;
  location: string;
  skills: Skill[];
  languages: Language[];
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  projects: Project[];
  availability: Availability;
  socialLinks: SocialLinks;
  yearsOfExperience?: number; // virtual
  resumeUrl: string;
  avatarUrl: string;
  source: 'Umurava Platform' | 'CSV' | 'PDF' | 'Google Drive' | 'Manual' | 'Direct';
  jobId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CandidatesState {
  candidates: Candidate[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  uploading: boolean;
  error: string | null;
}

const initialState: CandidatesState = {
  candidates: [],
  total: 0,
  page: 1,
  totalPages: 1,
  loading: false,
  uploading: false,
  error: null,
};

export const fetchCandidates = createAsyncThunk(
  'candidates/fetchCandidates',
  async (
    params: {
      jobId?: string;
      page?: number;
      dateFrom?: string;
      dateTo?: string;
      search?: string;
      limit?: number;
    } = {}
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
    data.files.forEach((f) => formData.append('files', f));
    const res = await api.post('/candidates/upload/files', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }
);

export const uploadCandidatesCsv = createAsyncThunk(
  'candidates/uploadCsv',
  async (data: { files: File[]; jobId?: string }) => {
    const formData = new FormData();
    if (data.jobId) formData.append('jobId', data.jobId);
    data.files.forEach((f) => formData.append('files', f));
    const res = await api.post('/candidates/upload/csv', formData, {
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
      .addCase(fetchCandidates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCandidates.fulfilled, (state, action) => {
        state.loading = false;
        state.candidates = action.payload.candidates;
        state.total = action.payload.total;
        state.page = action.payload.page || 1;
        state.totalPages = action.payload.totalPages || 1;
      })
      .addCase(fetchCandidates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed';
      })
      .addCase(uploadCandidates.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadCandidates.fulfilled, (state, action) => {
        state.uploading = false;
        state.candidates = [...action.payload.candidates, ...state.candidates];
      })
      .addCase(uploadCandidates.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.error.message || 'Upload failed';
      })
      .addCase(uploadCandidateFiles.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadCandidateFiles.fulfilled, (state, action) => {
        state.uploading = false;
        state.candidates = [...action.payload.candidates, ...state.candidates];
      })
      .addCase(uploadCandidateFiles.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.error.message || 'File Upload failed';
      })
      .addCase(uploadCandidatesCsv.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadCandidatesCsv.fulfilled, (state, action) => {
        state.uploading = false;
        state.candidates = [...action.payload.candidates, ...state.candidates];
      })
      .addCase(uploadCandidatesCsv.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.error.message || 'CSV Upload failed';
      })
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

export function candidateFullName(c: Pick<Candidate, 'firstName' | 'lastName'> | null | undefined): string {
  if (!c) return '';
  return [c.firstName, c.lastName].filter(Boolean).join(' ').trim();
}
