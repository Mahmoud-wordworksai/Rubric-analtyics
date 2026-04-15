import { loginRequest, msalInstance } from "@/authConfig";
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AccountInfo } from "@azure/msal-browser";
// import { loginRequest, msalInstance } from "../../../authConfig";

// login
export const loginUser = createAsyncThunk<AccountInfo, string>(
  "auth/loginUser",
  async (email, { rejectWithValue }) => {
    try {
      const request = { ...loginRequest, loginHint: email };
      const res = await msalInstance.loginPopup(request);
      if (!res.account) throw new Error("No account returned.");
      msalInstance.setActiveAccount(res.account);
      localStorage.setItem("user", JSON.stringify(res.account));
      // Set flag to skip auth verification right after login
      sessionStorage.setItem("justLoggedIn", "true");
      return JSON.parse(JSON.stringify(res.account));
    } catch (error) {
      return rejectWithValue("Azure AD login failed. " + error);
    }
  }
);

//logout
export const logoutUser = createAsyncThunk("auth/logoutUser", async () => {
  localStorage.clear();
  return null;
});
