"use client";

import { ReactNode, useEffect, useState } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "../../redux/store";
import { ThemeProvider } from "../../context/ThemeContext";
import { SidebarProvider } from "../../context/SidebarContext";
import { BasicInfoProvider } from "../../context/BasicInfoContext";
import { MsalProvider } from "@azure/msal-react";
import { msalInstance, initializeMsal } from "../../authConfig";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getAuthStatus, verifyToken } from "../../lib/axios";

export function Providers({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initAndCheckAuth = async () => {
      try {
        // Initialize MSAL first
        await initializeMsal();

        const isLoginPage = window.location.pathname === "/login";

        // Skip verification for login page
        if (isLoginPage) {
          setIsReady(true);
          return;
        }

        // Skip verification if user just logged in (prevents redirect loop)
        const justLoggedIn = sessionStorage.getItem("justLoggedIn");
        if (justLoggedIn) {
          console.log("Just logged in, skipping verification");
          sessionStorage.removeItem("justLoggedIn");
          setIsReady(true);
          return;
        }

        // Step 1: Check auth status (no token needed)
        console.log("Checking auth status...");
        const status = await getAuthStatus();
        console.log("Auth status:", status);

        // If auth is not enabled or not configured, allow access
        if (!status.enabled || !status.configured) {
          console.log("Auth not enabled/configured, allowing access");
          setIsReady(true);
          return;
        }

        // Step 2: Auth is enabled, check if user has stored credentials
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
          console.log("No stored user, redirecting to login...");
          window.location.href = "/login";
          return;
        }

        // Step 3: Verify token with backend
        console.log("Verifying token...");
        try {
          const authVerify = await verifyToken();
          if (authVerify.valid) {
            console.log("Token verified successfully");
            setIsReady(true);
          } else {
            console.log("Token invalid or expired:", authVerify.error);
            localStorage.removeItem("user");
            localStorage.removeItem("accessToken");
            window.location.href = "/login";
            return;
          }
        } catch (error) {
          console.error("Token verification failed:", error);
          localStorage.removeItem("user");
          localStorage.removeItem("accessToken");
          window.location.href = "/login";
          return;
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        // On error, still allow app to load - axios interceptors will handle 401
        setIsReady(true);
      }
    };

    initAndCheckAuth();
  }, []);

  // Show loading while initializing
  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <MsalProvider instance={msalInstance}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ThemeProvider>
            <BasicInfoProvider>
              <SidebarProvider>
                {children}
                <ToastContainer />
              </SidebarProvider>
            </BasicInfoProvider>
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </MsalProvider>
  );
}
