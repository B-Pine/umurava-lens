import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../lib/api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'recruiter';
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  bootstrapped: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  bootstrapped: false,
};

export const login = createAsyncThunk(
  'auth/login',
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/login', payload);
      return res.data as { token: string; user: AuthUser };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.error || 'Login failed');
    }
  }
);

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/auth/me');
    return res.data.user as AuthUser;
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.error || 'Session invalid');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(state, action) {
      const { token, user } = action.payload as { token: string; user: AuthUser };
      state.token = token;
      state.user = user;
      state.bootstrapped = true;
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.bootstrapped = true;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('umurava_token');
        localStorage.removeItem('umurava_user');
      }
    },
    markBootstrapped(state) {
      state.bootstrapped = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.bootstrapped = true;
        if (typeof window !== 'undefined') {
          localStorage.setItem('umurava_token', action.payload.token);
          localStorage.setItem('umurava_user', JSON.stringify(action.payload.user));
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Login failed';
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.bootstrapped = true;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.token = null;
        state.user = null;
        state.bootstrapped = true;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('umurava_token');
          localStorage.removeItem('umurava_user');
        }
      });
  },
});

export const { setSession, logout, markBootstrapped } = authSlice.actions;
export default authSlice.reducer;
