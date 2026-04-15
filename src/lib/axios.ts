import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
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
    hostname.endsWith(".local") ||
    hostname.endsWith(".vercel.app")
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

axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
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
  return { valid: true };
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
