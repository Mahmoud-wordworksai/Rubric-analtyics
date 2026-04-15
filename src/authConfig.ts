import { PublicClientApplication } from "@azure/msal-browser";

const browserOrigin = typeof window !== "undefined" ? window.location.origin : "";
const redirectUri = process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI || browserOrigin;

export const msalConfig = {
  auth: {
    clientId: "463f10d1-8d99-4de8-bedd-b9b9c775d0e1", //client Id
    authority:
      "https://login.microsoftonline.com/a0ced141-38cb-47e3-8c33-2458ecae7f0c", //tenant Id
    redirectUri,
    postLogoutRedirectUri: redirectUri,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: true,
  },
};

export const loginRequest = {
  scopes: ["User.Read", "GroupMember.Read.All"],
};

export const msalInstance = new PublicClientApplication(msalConfig);

// Track initialization status
let msalInitialized = false;
let msalInitializing: Promise<void> | null = null;

// Initialize MSAL (must be called before using msalInstance)
export const initializeMsal = async (): Promise<void> => {
  if (msalInitialized) return;
  if (typeof window === "undefined") return; // Don't initialize on server

  if (!msalInitializing) {
    msalInitializing = msalInstance.initialize().then(() => {
      msalInitialized = true;
    });
  }

  await msalInitializing;
};

// Check if MSAL is ready
export const isMsalInitialized = (): boolean => msalInitialized;
