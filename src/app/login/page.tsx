"use client";
import React, { useEffect } from "react";
import AuthLayout from "@/layout/AuthLayout";
import { useRouter } from "next/navigation";

const Login = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/projects");
  }, [router]);

  return (
    <AuthLayout>
      <div className="min-h-screen flex items-center justify-center bg-[#EEF4F7]">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border-b-0 border-t-4 border-[#04ccfb]">
          <h3 className="text-[1.6rem] font-bold mb-6 text-center font-black text-[#263978]">
            Redirecting
          </h3>
          <p className="text-center text-slate-600">Taking you to the dashboard...</p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
