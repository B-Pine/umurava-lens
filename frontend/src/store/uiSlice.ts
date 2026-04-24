import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warn' | 'error';
  title: string;
  message: string;
  read: boolean;
  timestamp: number;
}

interface UIState {
  notifications: AppNotification[];
}

const initialState: UIState = {
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<AppNotification, 'id' | 'read' | 'timestamp'>>) => {
      state.notifications.unshift({
        ...action.payload,
        id: Math.random().toString(36).substring(2, 9),
        read: false,
        timestamp: Date.now(),
      });
      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications.pop();
      }
    },
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const idx = state.notifications.findIndex((n) => n.id === action.payload);
      if (idx !== -1) {
        state.notifications[idx].read = true;
      }
    },
    markAllNotificationsRead: (state) => {
      state.notifications.forEach((n) => {
        n.read = true;
      });
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const { addNotification, markNotificationRead, markAllNotificationsRead, clearNotifications } = uiSlice.actions;

export default uiSlice.reducer;
