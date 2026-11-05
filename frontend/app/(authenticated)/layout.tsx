"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

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
    <div className="flex flex-row h-screen overflow-hidden bg-[#faf7f4]">
      {/* Sidebar for Desktop & Docked Rail + Slide-out for Mobile */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        onOpenMobileDrawer={() => setIsMobileSidebarOpen(true)}
      />

      {/* Main Column Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Top Navigation Header */}
        <header className="lg:hidden flex items-center justify-between px-3.5 sm:px-5 py-2.5 sm:py-3 bg-white/95 backdrop-blur-md border-b border-[#ede5dd] z-20 flex-shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 -ml-1 text-[#23160e] hover:bg-[#faf7f4] rounded-xl transition-colors active:scale-95 border border-[#ede5dd]"
              aria-label="Open navigation menu"
            >
              <svg className="w-5 h-5 text-[#5c341f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#5c341f] text-white flex items-center justify-center font-black text-xs shadow-xs">
                SV
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-black text-sm text-[#23160e] tracking-tight">
                  SiddhiVinayak
                </span>
                <span className="text-[9px] font-bold text-[#8a7566] uppercase tracking-wider">
                  Enterprise ERP
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/bill-invoice/create"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5c341f] hover:bg-[#472716] text-white text-[11px] font-bold rounded-xl shadow-xs transition-all active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Bill</span>
            </Link>

            <div className="w-8 h-8 rounded-xl bg-[#f4ece6] text-[#5c341f] font-bold text-xs flex items-center justify-center border border-[#ede5dd]">
              SV
            </div>
          </div>
        </header>

        {/* Scrollable Content Container - Full Width Expansion */}
        <main className="flex-1 overflow-y-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 bg-[#fbf9f6]">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
