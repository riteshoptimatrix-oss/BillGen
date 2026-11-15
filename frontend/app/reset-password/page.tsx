"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getApiUrl, warmupBackend } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isVerifying, setIsVerifying] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [targetEmail, setTargetEmail] = useState("");
  const [tokenError, setTokenError] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Validate reset token on mount
  useEffect(() => {
    warmupBackend();
    if (!token) {
      setIsVerifying(false);
      setTokenError("No reset token provided. Please click the full reset link from your email.");
      return;
    }

    const verify = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || "This reset link is invalid or has expired.");
        }

        setIsTokenValid(true);
        if (data.email) setTargetEmail(data.email);
      } catch (err: any) {
        setTokenError(err.message || "Invalid or expired reset link. Please request a new one.");
      } finally {
        setIsVerifying(false);
      }
    };

    verify();
  }, [token]);

  // Auto-redirect to login after successful reset
  useEffect(() => {
    if (!isSuccess) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/login");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSuccess, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please verify both fields.");
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token,
          new_password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to reset password. Please try again.");
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Password rules evaluation
  const hasMinLength = newPassword.length >= 6;
  const passwordsMatch = Boolean(newPassword && confirmPassword && newPassword === confirmPassword);

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Credential Hardening
          </div>

          <h1 className="text-5xl xl:text-6xl font-extrabold text-[#0f172a] leading-[1.1] mb-6">
            Set your new<br />
            secure account<br />
            <span className="text-[#0260de]">password.</span>
          </h1>

          <p className="text-lg text-gray-600 mb-12 max-w-lg">
            Choose a strong password to protect your invoices, customer database, ledger accounting, and business intelligence reports.
          </p>

          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-xs border border-gray-100">
                <svg className="w-5 h-5 text-[#0260de]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="ml-4 pt-2">
                <p className="text-sm font-semibold text-gray-800">Bcrypt cryptographic password hashing (cost factor 12)</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-xs border border-gray-100">
                <svg className="w-5 h-5 text-[#0260de]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="ml-4 pt-2">
                <p className="text-sm font-semibold text-gray-800">Instant invalidation of old passwords and reset tokens</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-xs border border-gray-100">
                <svg className="w-5 h-5 text-[#0260de]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4 pt-2">
                <p className="text-sm font-semibold text-gray-800">Seamless real-time synchronization across devices</p>
              </div>
            </div>
          </div>

          <div className="mt-20 text-xs text-gray-400">
            © 2026 SmartERP • Enterprise Financial Platform
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - Form / Token Verification Status */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center items-center p-8 xl:p-12">
        <div className="max-w-md w-full">
          {/* 1. LOADING / TOKEN VERIFICATION STATE */}
          {isVerifying && (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-[#0260de]/20 border-t-[#0260de] rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900">Verifying secure reset link...</h3>
              <p className="text-xs text-gray-500 mt-1">Checking signature integrity and expiration status</p>
            </div>
          )}

          {/* 2. INVALID OR EXPIRED TOKEN STATE */}
          {!isVerifying && !isTokenValid && (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center text-red-600 mb-6 shadow-xs">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">Reset link invalid or expired</h2>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                {tokenError || "This password reset link has expired or has already been used. For your security, reset links are single-use and expire in 20 minutes."}
              </p>

              <div className="space-y-3">
                <Link
                  href="/forgot-password"
                  className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-xs text-sm font-bold text-white bg-[#0260de] hover:bg-[#0252bf] transition-all cursor-pointer active:scale-95"
                >
                  Request a New Reset Link
                </Link>

                <Link
                  href="/login"
                  className="w-full flex justify-center items-center py-2.5 px-4 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          )}

          {/* 3. SUCCESS STATE */}
          {!isVerifying && isTokenValid && isSuccess && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 shadow-xs">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Password Reset Successfully!</h2>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Your password has been securely updated. Your previous password has been invalidated.
              </p>

              <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl mb-6 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {countdown}
                </div>
                <p className="text-xs text-emerald-900 font-medium">
                  Redirecting to Sign In in {countdown} {countdown === 1 ? "second" : "seconds"}...
                </p>
              </div>

              <Link
                href="/login"
                className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-xs text-sm font-bold text-white bg-[#0260de] hover:bg-[#0252bf] transition-all cursor-pointer active:scale-95"
              >
                Proceed to Sign In Now &rarr;
              </Link>
            </div>
          )}

          {/* 4. ACTIVE RESET FORM */}
          {!isVerifying && isTokenValid && !isSuccess && (
            <div>
              <div className="mb-8">
                <Link
                  href="/login"
                  className="inline-flex items-center text-xs font-semibold text-[#0260de] hover:text-[#0252bf] mb-6 group transition-colors"
                >
                  <svg className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Cancel and Return to Sign In
                </Link>

                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Set New Password</h2>
                {targetEmail ? (
                  <p className="text-gray-500 text-sm">
                    Resetting password for: <span className="font-semibold text-gray-900">{targetEmail}</span>
                  </p>
                ) : (
                  <p className="text-gray-500 text-sm">Choose a strong, unique password for your account.</p>
                )}
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 border-l-4 border-red-500 text-sm font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Field 1: New Password */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0260de] focus:border-transparent transition-shadow sm:text-sm"
                      placeholder="Enter new password (min. 6 characters)"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer p-1"
                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Field 2: Confirm New Password */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">Confirm New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0260de] focus:border-transparent transition-shadow sm:text-sm"
                      placeholder="Re-enter new password"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer p-1"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Validation checklist */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={hasMinLength ? "text-emerald-600 font-bold" : "text-slate-400"}>
                      {hasMinLength ? "✓" : "○"}
                    </span>
                    <span className={hasMinLength ? "text-slate-800 font-medium" : "text-slate-500"}>
                      At least 6 characters long
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={passwordsMatch ? "text-emerald-600 font-bold" : "text-slate-400"}>
                      {passwordsMatch ? "✓" : "○"}
                    </span>
                    <span className={passwordsMatch ? "text-slate-800 font-medium" : "text-slate-500"}>
                      Passwords match exactly
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !hasMinLength || !passwordsMatch}
                  className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-xs text-sm font-bold text-white bg-[#0260de] hover:bg-[#0252bf] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0260de] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      <span>Updating password...</span>
                    </>
                  ) : (
                    <>
                      <span>Save New Password</span>
                      <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
          <div className="w-10 h-10 border-4 border-[#0260de]/20 border-t-[#0260de] rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
