"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React, { useEffect, useState, Suspense } from "react";
import { useAppSelector } from "@/redux/store";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

// Inner component that uses useSearchParams
function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { user } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedRoom = searchParams.get('room') || 'main';
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted flag after initial render
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Additional authentication check at layout level
  useEffect(() => {
    if (isMounted && !user) {
      router.replace("/login");
    }
  }, [user, isMounted, router]);

  // Route protection for non-main rooms
  useEffect(() => {
    if (!isMounted) return;

    // Only enforce route restrictions for non-main rooms
    if (selectedRoom !== 'main') {
      const allowedRoutes = ['/projects', '/room-and-agents', '/datasheets', '/create-new', '/settings', '/datasheets-template', '/prompts-and-post-call-analysis', '/test-call', '/call-report', '/app-templates'];

      // Check if current path is allowed
      const isAllowed = allowedRoutes.some(route => pathname.startsWith(route));

      if (!isAllowed) {
        // Redirect to /projects with room param preserved
        router.push(`/projects?room=${selectedRoom}`);
      }
    }
  }, [selectedRoom, pathname, isMounted, router]);

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      {/*
        Wrap the sidebar in a container with the "dark" class so that its children use dark styling.
        This ensures that the dark mode is applied only to the sidebar.
      */}
      <div className="dark">
        <AppSidebar />
      </div>

      {/* Backdrop (if needed, can be kept outside or adjusted as per your design) */}
      <Backdrop />

      {/* Main Content Area remains in light theme */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
        style={{ maxWidth: '100%', overflow: 'hidden' }}
      >
        {/* Header */}
        <AppHeader />

        {/* Page Content - key forces re-render when room changes */}
        <div key={selectedRoom} className="p-4 md:p-6 border-0 bg-white" style={{ width: '100%', maxWidth: '100%' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Main export with Suspense boundary
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}
