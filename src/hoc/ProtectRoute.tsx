"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ComponentType } from "react";
import { useAppSelector } from "@/redux/store";

const withProtection = <P extends object>(WrappedComponent: ComponentType<P>) => {
  const ProtectedComponent = (props: P) => {
    const { user } = useAppSelector((state) => state.auth);
    const router = useRouter();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
      // Check if user is authenticated
      if (!user) {
        // Redirect to login if user is not authenticated
        router.replace("/login");
        setIsChecking(false);
        setIsAuthorized(false);
      } else {
        // User is authenticated, allow access
        setIsAuthorized(true);
        setIsChecking(false);
      }
    }, [user, pathname, router]);

    // Show loading state while checking authentication
    if (isChecking) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying access...</p>
          </div>
        </div>
      );
    }

    // Only render component if authorized
    if (!isAuthorized) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };

  ProtectedComponent.displayName = `WithProtection(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

  return ProtectedComponent;
};

export default withProtection;
