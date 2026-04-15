import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { loginUser, logoutUser } from "./authThunks";
import { AccountInfo } from "@azure/msal-browser";


interface AuthState {
  user: AccountInfo | null;
  loading: boolean;
  error: string | null;
}

const guestUser: AccountInfo = {
  homeAccountId: "guest-user",
  environment: "local",
  tenantId: "guest",
  username: "guest@example.com",
  localAccountId: "guest-user",
  name: "Guest User",
} as AccountInfo;

const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
const parsedStoredUser = storedUser ? JSON.parse(storedUser) : null;
const normalizedStoredUser =
  parsedStoredUser?.homeAccountId === guestUser.homeAccountId
    ? { ...guestUser, ...parsedStoredUser, username: guestUser.username, name: guestUser.name }
    : parsedStoredUser;

const initialState: AuthState = {
  user: normalizedStoredUser || guestUser,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AccountInfo | null>) => {
      state.user = action.payload || guestUser;
    },
    clearUser: (state) => {
      state.user = guestUser;
      localStorage.setItem("user", JSON.stringify(guestUser));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<AccountInfo>) => {
        state.loading = false;
        state.user = action.payload;
        localStorage.setItem("user", JSON.stringify(action.payload));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = guestUser;
        localStorage.setItem("user", JSON.stringify(guestUser));
      });
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
