import { createSlice } from "@reduxjs/toolkit";

// const initialState = {
//   refresh:
//     "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTczMTcyOTI1OCwiaWF0IjoxNzMxNjQyODU4LCJqdGkiOiJjMGYwY2M4MjRhODU0OGFmOWFhYjllNzc3MGM5NDZiYSIsInVzZXJfaWQiOiIyZDRiMGRlYS1iZGQyLTQ2MWItOGZmNC0xMTU1ZDdkZWEyOGUifQ.KUWMFHTdWPlftVHaG5AEeDN6CU7iehNcKZJ5TW_6zfc",
//   access:
//     "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzMxNjQzMTU4LCJpYXQiOjE3MzE2NDI4NTgsImp0aSI6IjY5NmNmMTkyMTQwYTQ2NDE4N2E2NWZlNzRkMjgyZTdlIiwidXNlcl9pZCI6IjJkNGIwZGVhLWJkZDItNDYxYi04ZmY0LTExNTVkN2RlYTI4ZSJ9.QNVpWM_K8VvcGdpPTNSDFRkzZmOxPRnlXuoaGgIFPLw",
//   data: {
//     user_id: "2d4b0dea-bdd2-461b-8ff4-1155d7dea28e",
//     user_name: "testuser",
//     roles: "Superuser",
//   },
//   isAuth: true, // Initialize to false
// };

const authSlice = createSlice({
  name: "auth",
  initialState: {
    refresh: "",
    access: "",
    data: {
      user_id: "",
      user_name: "",
      roles: "",
    },
    isAuth: false,
  },
  reducers: {
    setUser: (state, action) => {
      return {
        ...state, // Spread the current state
        refresh: action.payload.refresh,
        access: action.payload.access,
        data: action.payload.data,
        isAuth: true,
      };
    },
    logOut: (state) => {
      state.refresh = "";
      state.access = "";
      state.data = {
        user_id: "",
        user_name: "",
        roles: "",
      };
      state.isAuth = false;
      localStorage.removeItem("darkMode");
      localStorage.removeItem("menuItems");
      localStorage.removeItem("mobileMenu");
      localStorage.removeItem("persist:auth");
      localStorage.removeItem("persist:layout");
      localStorage.removeItem("persist:root");
      localStorage.removeItem("sidebarCollapsed");
    },
  },
});

export const { setUser, logOut } = authSlice.actions;
export default authSlice.reducer;
