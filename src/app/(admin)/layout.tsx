"use client";

import AdminLayout from "../../layout/AdminLayout";
import { useAppSelector } from "../../redux/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for client-side hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Wait for hydration and Redux loading to complete
    if (!isHydrated || loading) {
      return;
    }

    // Check authentication status
    if (!user) {
      // Also check localStorage as fallback during hydration
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        // Redirect to login if not authenticated
        router.replace("/login");
        return;
      }
    }

    // User is authenticated, allow access
    setIsChecking(false);
  }, [user, loading, router, isHydrated]);

  // Show loading state while checking authentication
  if (isChecking || !isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Only render admin layout if user is authenticated
  return (
    <AdminLayout>{children}</AdminLayout>
  );
}
