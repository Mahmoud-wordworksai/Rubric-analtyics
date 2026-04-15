import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { msalInstance, loginRequest, initializeMsal, isMsalInitialized } from "@/authConfig";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { API_BASE_URL, API_KEY } from "@/constants";

const DEFAULT_PROJECT = process.env.NEXT_PUBLIC_DEFAULT_PROJECT || "tata-capital";

// Get room from URL search params
const getRoomFromUrl = (): string | null => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("room");
};

// Get project dynamically from URL or subdomain
const getProjectFromUrl = (): string => {
  if (typeof window === "undefined") return DEFAULT_PROJECT;

  // First check URL search params for project
  const params = new URLSearchParams(window.location.search);
  const projectParam = params.get("project");
  if (projectParam) {
    return projectParam;
  }

  const hostname = window.location.hostname;
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local")
  ) {
    return DEFAULT_PROJECT;
  }

  // Fallback to subdomain-based detection
  const subdomain = hostname.split(".")[0];

  return subdomain || DEFAULT_PROJECT;
};

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const getUrlObject = (url: string | undefined): URL | null => {
  if (!url) return null;

  try {
    return new URL(url, API_BASE_URL);
  } catch {
    return null;
  }
};

const hasQueryParamInUrl = (url: string | undefined, key: string): boolean => {
  const urlObj = getUrlObject(url);
  return urlObj?.searchParams.has(key) ?? false;
};

// Add project and room params dynamically from URL
axiosInstance.interceptors.request.use((config) => {
  const nextParams = {
    ...(config.params || {}),
  } as Record<string, string>;

  if (!("api_key" in nextParams) && !hasQueryParamInUrl(config.url, "api_key")) {
    nextParams.api_key = API_KEY;
  }

  // Add project param dynamically
  if (!("project" in nextParams) && !hasQueryParamInUrl(config.url, "project")) {
    nextParams.project = getProjectFromUrl();
  }

  // Add room param if not "main"
  const room = getRoomFromUrl();
  if (room && room !== "main" && !("room" in nextParams) && !hasQueryParamInUrl(config.url, "room")) {
    nextParams.room = room;
  }

  config.params = nextParams;
  return config;
});

// Routes that don't require authentication
const publicRoutes = ["/health", "/auth/status", "/auth/verify"];

// Helper to check if a route is public
const isPublicRoute = (url: string | undefined): boolean => {
  if (!url) return false;
  return publicRoutes.some((route) => url.startsWith(route));
};

// Get Azure AD token from MSAL
const getAccessToken = async (): Promise<string | null> => {
  // Don't try to get token on server-side
  if (typeof window === "undefined") {
    return null;
  }

  try {
    // Ensure MSAL is initialized
    await initializeMsal();

    if (!isMsalInitialized()) {
      console.warn("MSAL not initialized yet");
      return null;
    }

    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) {
      return null;
    }

    const account = accounts[0];
    const response = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account,
    });

    return response.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      // Token expired or requires interaction - trigger login
      try {
        const response = await msalInstance.acquireTokenPopup(loginRequest);
        return response.accessToken;
      } catch (popupError) {
        console.error("Failed to acquire token via popup:", popupError);
        return null;
      }
    }
    console.error("Failed to acquire token:", error);
    return null;
  }
};

// Request interceptor - add Authorization header
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Skip auth for public routes
    if (isPublicRoute(config.url)) {
      return config;
    }

    let token: string | null = null;

    try {
      // Try to get token from MSAL first
      token = await getAccessToken();
    } catch (error) {
      console.error("Error getting MSAL token:", error);
    }

    // Fallback to localStorage if MSAL token not available
    if (!token && typeof window !== "undefined") {
      token = localStorage.getItem("accessToken");
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // No token available - check if user should be redirected
      const hasLocalUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (!hasLocalUser) {
        console.log("No auth token available and no user stored. Will redirect on 401.");
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper to redirect to login page
const redirectToLogin = () => {
  // Only redirect if we're in the browser and not already on login page
  if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
    // Clear any stored tokens and user data
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    // Redirect to login
    window.location.href = "/login";
  }
};

// Response interceptor - handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Don't auto-redirect for auth check endpoints - let the calling code handle it
    const requestUrl = originalRequest?.url || "";
    if (requestUrl.includes("/auth/status") || requestUrl.includes("/auth/verify")) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // If we haven't retried yet, try to refresh token
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Try to refresh token
          const newToken = await getAccessToken();
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
          }
        } catch (tokenError) {
          console.error("Token refresh failed:", tokenError);
        }
      }

      // Token refresh failed or already retried - redirect to login
      console.log("Session expired or unauthorized. Redirecting to login...");
      redirectToLogin();
      return Promise.reject(error);
    }

    // Handle 403 Forbidden - user doesn't have permission, redirect to login
    if (error.response?.status === 403) {
      console.log("Access forbidden. Redirecting to login...");
      redirectToLogin();
      return Promise.reject(error);
    }

    // Handle 404 Not Found - check if it's due to authentication issue
    // Some APIs return 404 for unauthenticated requests instead of 401
    if (error.response?.status === 404) {
      try {
        // Only check MSAL accounts if initialized
        let accounts: { length: number } = { length: 0 };
        if (isMsalInitialized()) {
          accounts = msalInstance.getAllAccounts();
        }
        const hasLocalUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;

        if (accounts.length === 0 && !hasLocalUser) {
          console.log("User not authenticated. Redirecting to login...");
          redirectToLogin();
          return Promise.reject(error);
        }
      } catch (checkError) {
        console.error("Error checking auth status:", checkError);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// Auth API Functions
// ============================================

export interface AuthStatus {
  enabled: boolean;
  provider: string;
  configured: boolean;
}

export interface AuthVerifyResponse {
  valid: boolean;
  expired?: boolean;
  error?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roles?: string[];
  groups?: string[];
}

/**
 * Get auth configuration status (no token needed)
 * GET /auth/status
 */
export const getAuthStatus = async (): Promise<AuthStatus> => {
  try {
    const response = await axiosInstance.get<AuthStatus>("/auth/status");
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 405)) {
      return {
        enabled: false,
        provider: "unknown",
        configured: false,
      };
    }
    throw error;
  }
};

/**
 * Verify if token is valid
 * GET /auth/verify
 */
export const verifyToken = async (): Promise<AuthVerifyResponse> => {
  // Get token from MSAL
  const token = await getAccessToken();

  if (!token) {
    // No token available, return invalid
    return { valid: false, error: "No token available" };
  }

  const response = await axiosInstance.get<AuthVerifyResponse>("/auth/verify", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Get current authenticated user info
 * GET /auth/me
 */
export const getCurrentUser = async (): Promise<AuthUser> => {
  const response = await axiosInstance.get<AuthUser>("/auth/me");
  return response.data;
};

/**
 * Health check endpoint (no auth required)
 * GET /health
 */
export const healthCheck = async (): Promise<{ status: string }> => {
  const response = await axiosInstance.get<{ status: string }>("/health");
  return response.data;
};

// Export helper functions for use elsewhere
export { getProjectFromUrl, getRoomFromUrl };

export default axiosInstance;
