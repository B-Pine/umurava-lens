import { configureStore, isRejected, Middleware } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import jobsReducer from './jobsSlice';
import candidatesReducer from './candidatesSlice';
import screeningReducer from './screeningSlice';
import uiReducer, { addNotification } from './uiSlice';

const rtkQueryErrorLogger: Middleware = (api) => (next) => (action: any) => {
  if (isRejected(action) && action.error?.message && action.error.message !== 'Aborted') {
    let title = 'Operation Failed';
    if (action.type.startsWith('screening/run')) title = 'AI Screening Error';
    if (action.type.startsWith('candidates/upload')) title = 'Upload Error';
    if (action.type.startsWith('outreach')) title = 'Email Delivery Error';

    api.dispatch(
      addNotification({
        type: 'error',
        title,
        message: action.error.message,
      })
    );
  }
  return next(action);
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    jobs: jobsReducer,
    candidates: candidatesReducer,
    screening: screeningReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(rtkQueryErrorLogger),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
