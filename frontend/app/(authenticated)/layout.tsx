"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import NavigationProgressBar from "@/components/NavigationProgressBar";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("isAuthenticated");
    if (auth !== "true") {
      router.push("/login");
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  // Automatically close mobile menu whenever route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex flex-row h-screen h-[100dvh] w-full overflow-hidden bg-[#f4f7fc] relative">
      {/* Top Navigation Progress Line */}
      <NavigationProgressBar />

      {/* Sidebar for Desktop & Compact Slide Drawer for Mobile */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        onOpenMobileDrawer={() => setIsMobileSidebarOpen(true)}
      />

      {/* ==================================================================== */}
      {/* MOBILE TOP HEADER: Fixed permanently to top of screen on mobile      */}
      {/* Never scrolls away, never disappears, never requires a refresh       */}
      {/* ==================================================================== */}
      <header className="fixed top-0 left-0 right-0 z-40 lg:hidden flex items-center justify-between h-[68px] px-4 sm:px-6 bg-white/95 backdrop-blur-md border-b border-[#e2e8f0] shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-[#0f172a] hover:bg-slate-100 rounded-2xl transition-colors active:scale-95 border border-[#e2e8f0] shrink-0 cursor-pointer shadow-2xs"
            aria-label="Open navigation menu"
          >
            <svg className="w-5 h-5 text-[#0260de]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#0260de] text-white flex items-center justify-center font-black text-xs sm:text-sm shadow-xs shrink-0">
              SV
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="font-black text-sm sm:text-base text-[#0f172a] tracking-tight truncate">
                SiddhiVinayak
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-[#64748b] uppercase tracking-wider truncate">
                Enterprise ERP
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/bill-invoice/create"
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-[#0260de] hover:bg-[#0252bf] text-white text-xs font-bold rounded-2xl shadow-xs transition-all active:scale-95 shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Bill</span>
          </Link>

          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0260de] font-bold text-xs sm:text-sm flex items-center justify-center border border-blue-200 shrink-0">
            SV
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* MAIN CONTENT WRAPPER: Padded by header height on mobile, 0 on desktop*/}
      {/* ==================================================================== */}
      <div className="flex-1 flex flex-col min-w-0 h-screen h-[100dvh] overflow-hidden pt-[68px] lg:pt-0 relative">
        {/* Scrollable Content Container */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 bg-[#f4f7fc] overscroll-contain">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
