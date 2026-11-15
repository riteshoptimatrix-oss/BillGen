"use client";

import { useState } from "react";
import Link from "next/link";
import { getApiUrl, warmupBackend } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      warmupBackend();
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Unable to process password reset request. Please try again.");
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit request. Please check your network connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full font-sans">
      {/* LEFT COLUMN - Information & Branding Panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#f8fafc] to-[#eef2f6] flex-col p-12 xl:p-20 justify-center">
        <div className="max-w-xl mx-auto w-full">
          {/* Logo Placeholder */}
          <Link href="/login" className="inline-flex items-center space-x-2 mb-12">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
            <span className="text-2xl font-bold text-gray-900 tracking-tight">SmartERP</span>
          </Link>

          <div className="inline-flex items-center px-3 py-1 rounded-full border border-blue-100 bg-white shadow-xs text-xs font-semibold text-blue-700 mb-8 uppercase tracking-wider">
            <svg className="w-3 h-3 text-[#0260de] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secure Account Recovery
          </div>

          <h1 className="text-5xl xl:text-6xl font-extrabold text-[#0f172a] leading-[1.1] mb-6">
            Recover your account<br />
            with confidence<br />
            <span className="text-[#0260de]">in minutes.</span>
          </h1>

          <p className="text-lg text-gray-600 mb-12 max-w-lg">
            Our multi-layered security infrastructure ensures your enterprise billing data and administrative credentials remain strictly safeguarded.
          </p>

          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-xs border border-gray-100">
                <svg className="w-5 h-5 text-[#0260de]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="ml-4 pt-2">
                <p className="text-sm font-semibold text-gray-800">Single-use cryptographically signed reset tokens</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-xs border border-gray-100">
                <svg className="w-5 h-5 text-[#0260de]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4 pt-2">
                <p className="text-sm font-semibold text-gray-800">Strict 20-minute expiration window to prevent replay</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-xs border border-gray-100">
                <svg className="w-5 h-5 text-[#0260de]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4 pt-2">
                <p className="text-sm font-semibold text-gray-800">Anti-enumeration privacy protection enabled</p>
              </div>
            </div>
          </div>

          <div className="mt-20 text-xs text-gray-400">
            © 2026 SmartERP • Enterprise Financial Platform
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - Form / Confirmation */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center items-center p-8 xl:p-12">
        <div className="max-w-md w-full">
          {isSubmitted ? (
            /* SUCCESS CONFIRMATION STATE */
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 shadow-xs">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Check your email</h2>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                If an account is registered with <strong className="text-gray-900">{email}</strong>, we have dispatched a secure password reset link to your inbox.
              </p>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6 text-xs text-slate-600 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-[#0260de] font-bold">•</span>
                  <span>The reset link is active for <strong>20 minutes</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#0260de] font-bold">•</span>
                  <span>Be sure to check your spam or junk folder if you don&apos;t see it shortly.</span>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href="/login"
                  className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-xs text-sm font-bold text-white bg-[#0260de] hover:bg-[#0252bf] transition-all cursor-pointer active:scale-95"
                >
                  Return to Sign In
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail("");
                    setError("");
                  }}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Try another email address
                </button>
              </div>
            </div>
          ) : (
            /* EMAIL INPUT FORM STATE */
            <div>
              <div className="mb-8">
                <Link
                  href="/login"
                  className="inline-flex items-center text-xs font-semibold text-[#0260de] hover:text-[#0252bf] mb-6 group transition-colors"
                >
                  <svg className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Sign In
                </Link>

                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Forgot Password</h2>
                <p className="text-gray-500 text-sm">
                  Enter your registered email address and we&apos;ll send you instructions to securely reset your password.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 border-l-4 border-red-500 text-sm font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Registered Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0260de] focus:border-transparent transition-shadow sm:text-sm"
                      placeholder="e.g. shaileshbhai123@gmail.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-xs text-sm font-bold text-white bg-[#0260de] hover:bg-[#0252bf] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0260de] transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      <span>Sending reset link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Password Reset Link</span>
                      <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-xs text-gray-500">
                  Remembered your password?{" "}
                  <Link href="/login" className="font-semibold text-[#0260de] hover:underline">
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* Footer Badge */}
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
