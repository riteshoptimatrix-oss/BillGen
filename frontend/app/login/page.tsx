"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === "ritesh.work.1510@gmail.com" && password === "8980614160@.com") {
      localStorage.setItem("isAuthenticated", "true");
      router.push("/dashboard");
    } else {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex w-full font-sans">
      
      {/* LEFT COLUMN - Information Panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#f8fafc] to-[#eef2f6] flex-col p-12 xl:p-20 justify-center">
        <div className="max-w-xl mx-auto w-full">
          {/* Logo Placeholder */}
          <div className="flex items-center space-x-2 mb-12">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
            <span className="text-2xl font-bold text-gray-900 tracking-tight">BillGenerator</span>
          </div>

          <div className="inline-flex items-center px-3 py-1 rounded-full border border-blue-100 bg-white shadow-sm text-xs font-semibold text-blue-700 mb-8 uppercase tracking-wider">
            <svg className="w-3 h-3 text-[#0260de] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Enterprise Account
          </div>

          <h1 className="text-5xl xl:text-6xl font-extrabold text-[#0f172a] leading-[1.1] mb-6">
            Start managing your<br />
            billing process<br />
            <span className="text-[#0260de]">today.</span>
          </h1>

          <p className="text-lg text-gray-600 mb-12 max-w-lg">
            Join BillGenerator to create professional invoices, manage products, and automate your financial reports at scale.
          </p>

          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100">
                <svg className="w-5 h-5 text-[#0260de]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div className="ml-4 pt-2">
                <p className="text-sm font-semibold text-gray-800">Precision invoice generation & tracking</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100">
                <svg className="w-5 h-5 text-[#0260de]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4 pt-2">
                <p className="text-sm font-semibold text-gray-800">Real-time product and inventory intelligence</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100">
                <svg className="w-5 h-5 text-[#0260de]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <div className="ml-4 pt-2">
                <p className="text-sm font-semibold text-gray-800">Email & WhatsApp automation at scale</p>
              </div>
            </div>
          </div>
          
          <div className="mt-20 text-xs text-gray-400">
            © 2026 BillGenerator • Enterprise Financial Platform
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - Login Form */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center items-center p-8 xl:p-12">
        <div className="max-w-md w-full">
          <div className="mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Welcome back</h2>
            <p className="text-gray-500 text-sm">Please enter your details to sign in.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 border-l-4 border-red-500 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-shadow sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-shadow sm:text-sm"
                  placeholder="Enter your password"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button type="button" className="text-gray-400 hover:text-gray-600 focus:outline-none">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Checkbox and Forgot Password */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer font-medium">
                  Remember for 30 days
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-semibold text-red-600 hover:text-red-500">
                  Forgot password?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-xs text-sm font-bold text-white bg-[#0260de] hover:bg-[#0252bf] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0260de] transition-colors mt-4 active:scale-95 cursor-pointer"
            >
              Sign in to Dashboard
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>

          {/* Footer badge */}
          <div className="mt-10 flex justify-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-700">
              <svg className="mr-1.5 h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Enterprise-grade encryption
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
