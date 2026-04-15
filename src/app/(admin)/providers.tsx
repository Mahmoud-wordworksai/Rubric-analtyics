"use client";

import { ReactNode, useEffect, useState } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "../../redux/store";
import { ThemeProvider } from "../../context/ThemeContext";
import { SidebarProvider } from "../../context/SidebarContext";
import { BasicInfoProvider } from "../../context/BasicInfoContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function Providers({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const bootstrap = () => {
      const existingUser = localStorage.getItem("user");
      if (!existingUser) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            homeAccountId: "guest-user",
            environment: "local",
            tenantId: "guest",
            username: "guest@example.com",
            localAccountId: "guest-user",
            name: "Guest User",
          })
        );
      } else {
        const parsedUser = JSON.parse(existingUser);
        if (parsedUser?.homeAccountId === "guest-user") {
          localStorage.setItem(
            "user",
            JSON.stringify({
              ...parsedUser,
              username: "guest@example.com",
              name: "Guest User",
            })
          );
        }
      }
      setIsReady(true);
    };

    bootstrap();
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
  );
}
