"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import withProtection from "@/hoc/ProtectRoute";

const ProjectsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const destination = `/rubric-analytics${params.toString() ? `?${params.toString()}` : ""}`;
    router.replace(destination);
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Opening rubric analytics...</p>
      </div>
    </div>
  );
};

export default withProtection(ProjectsPage);
