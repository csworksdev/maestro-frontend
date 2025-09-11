import { createSlice } from "@reduxjs/toolkit";

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    list: [],
    unread: 0,
  },
  reducers: {
    setNotifications: (state, action) => {
      state.list = action.payload;
      state.unread = action.payload.filter((n) => !n.is_read).length;
    },
    addNotification: (state, action) => {
      state.list.unshift(action.payload);
      state.unread += 1;
    },
    markAsRead: (state, action) => {
      const notif = state.list.find((n) => n.id === action.payload);
      if (notif && !notif.is_read) {
        notif.is_read = true;
        state.unread -= 1;
      }
    },
  },
});

export const { setNotifications, addNotification, markAsRead } =
  notificationsSlice.actions;
export default notificationsSlice.reducer;
