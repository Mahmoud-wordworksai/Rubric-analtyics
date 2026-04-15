"use client";
import { loginUser } from "@/redux/features/login/authThunks";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Image from "next/image";
import AuthLayout from "@/layout/AuthLayout";
import { useRouter } from "next/navigation";
import { useBasicInfo } from "@/context/BasicInfoContext";

const Login = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { basicInfo } = useBasicInfo();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Only redirect if user exists AND localStorage has user (not cleared by auth failure)
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    // Only redirect if both Redux AND localStorage have user
    // This prevents redirect loop when auth failed and cleared localStorage
    if (user && storedUser) {
      setShouldRedirect(true);
      router.replace("/projects");
    }
  }, [user, router]);

  const handleAzureLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!credentials.email || !emailRegex.test(credentials.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    const result = await dispatch(loginUser(credentials.email));
    console.log(result);

    if (loginUser.fulfilled.match(result)) {
      toast.success("Login successfully!");
      router.push("/projects");
    } else {
      toast.error("Login failed. Please try again.");
    }
  };

  // Don't render login form if user is already authenticated and should redirect
  if (shouldRedirect) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout>
      <div className="min-h-screen flex items-center justify-center bg-[#EEF4F7]">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border-b-0 border-t-4 border-[#04ccfb]">
          <div className="mb-4 flex justify-center">
            {basicInfo && basicInfo?.mainLogoUrl && (
              <Image
                width={200}
                height={42}
                style={{ minHeight: "44px", minWidth: "150px" }}
                src={basicInfo.mainLogoUrl}
                alt="Logo"
              />
            )}
          </div>
          <h3 className="text-[1.6rem] font-bold mb-6 text-center font-black text-[#263978]">
            Sign In
          </h3>
          <form onSubmit={handleAzureLogin}>
            {/* Email Input */}
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-slate-600 font-medium text-sm font-bold mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={credentials.email}
                onChange={(e) =>
                  setCredentials({ ...credentials, email: e.target.value })
                }
                placeholder="you@example.com"
                className="appearance-none border-2 border-grey-600 rounded placeholder:text-md w-full py-2 px-3 text-slate-600 leading-tight focus:outline-none focus:shadow-outline bg-white/70"
                required
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-4">
              <button
                type="submit"
                className="w-full flex items-center justify-center bg-white border border-[#263978] text-[#263978] font-bold py-2 px-4 rounded focus:outline-none focus:ring focus:ring-blue-300"
              >
                <span className="ml-2">Login with</span>
                <Image
                  src="https://upload.wikimedia.org/wikipedia/commons/a/a8/Microsoft_Azure_Logo.svg"
                  alt="Azure Logo"
                  width={60}
                  height={20}
                  className="ms-2"
                />
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
