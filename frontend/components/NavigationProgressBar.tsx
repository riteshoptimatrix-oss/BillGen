"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Reset/complete progress bar whenever pathname or search params change
  useEffect(() => {
    if (isVisible) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept click on internal links to trigger loading animation instantly
  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest("a");

      if (
        anchor &&
        anchor.href &&
        !anchor.target &&
        !anchor.download &&
        anchor.origin === window.location.origin
      ) {
        const targetPath = anchor.pathname;
        const currentPath = window.location.pathname;

        // If navigating to a different page or query
        if (targetPath !== currentPath || anchor.search !== window.location.search) {
          setIsVisible(true);
          setProgress(25);

          // Animate forward smoothly while route is loading
          setTimeout(() => setProgress((prev) => (prev < 65 ? 65 : prev)), 120);
          setTimeout(() => setProgress((prev) => (prev < 85 ? 85 : prev)), 300);
        }
      }
    };

    document.addEventListener("click", handleAnchorClick, true);
    return () => {
      document.removeEventListener("click", handleAnchorClick, true);
    };
  }, []);

  if (!isVisible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none transition-opacity duration-300"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      {/* Top Gradient Progress Line */}
      <div
        className="h-[3.5px] bg-gradient-to-r from-[#0260de] via-[#3b82f6] to-[#93c5fd] transition-all duration-200 ease-out shadow-[0_0_12px_rgba(2,96,222,0.8)] relative"
        style={{ width: `${progress}%` }}
      >
        {/* Glow head indicator */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-white/60 blur-[2px] rounded-full" />
      </div>

      {/* Floating Modern Mini Loading Badge - Positioned at bottom right to NEVER block header buttons */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-white/95 backdrop-blur-md border border-[#e2e8f0] px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150 z-[99999]">
        <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-100 border-t-[#0260de] animate-spin" />
        <span className="text-xs font-bold text-[#0f172a] tracking-tight">Loading page...</span>
      </div>
    </div>
  );
}
