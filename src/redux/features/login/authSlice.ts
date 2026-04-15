import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { loginUser, logoutUser } from "./authThunks";
import { AccountInfo } from "@azure/msal-browser";


interface AuthState {
  user: AccountInfo | null;
  loading: boolean;
  error: string | null;
}



const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AccountInfo | null>) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
      localStorage.removeItem("user");
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
        state.user = null;
        localStorage.removeItem("user");
      });
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
