import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import jobsReducer from './jobsSlice';
import candidatesReducer from './candidatesSlice';
import screeningReducer from './screeningSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    jobs: jobsReducer,
    candidates: candidatesReducer,
    screening: screeningReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
