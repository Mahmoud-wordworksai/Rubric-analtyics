import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AccountInfo } from "@azure/msal-browser";

const guestUser: AccountInfo = {
  homeAccountId: "guest-user",
  environment: "local",
  tenantId: "guest",
  username: "guest@example.com",
  localAccountId: "guest-user",
  name: "Guest User",
} as AccountInfo;

// login
export const loginUser = createAsyncThunk<AccountInfo, string>(
  "auth/loginUser",
  async (email) => {
    try {
      const user = {
        ...guestUser,
        username: email || guestUser.username,
        name: email || guestUser.name,
      } as AccountInfo;
      localStorage.setItem("user", JSON.stringify(user));
      return JSON.parse(JSON.stringify(user));
    } catch (error) {
      return JSON.parse(JSON.stringify(guestUser));
    }
  }
);

//logout
export const logoutUser = createAsyncThunk("auth/logoutUser", async () => {
  localStorage.setItem("user", JSON.stringify(guestUser));
  return null;
});
