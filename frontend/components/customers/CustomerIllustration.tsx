"use client";

import { useMemo } from "react";

interface CustomerIllustrationProps {
  name: string;
  isGstRegistered?: boolean;
  className?: string;
}

export default function CustomerIllustration({
  name,
  isGstRegistered = false,
  className = "w-full h-full"
}: CustomerIllustrationProps) {
  // Deterministic color palette and initials based on company name
  const { initials, colorIndex } = useMemo(() => {
    const clean = (name || "Customer").trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    let inits = "";
    if (parts.length >= 2) {
      inits = (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (clean.length > 0) {
      inits = clean.slice(0, 2).toUpperCase();
    } else {
      inits = "CU";
    }

    let hash = 0;
    for (let i = 0; i < clean.length; i++) {
      hash = (hash << 5) - hash + clean.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % 5;
    return { initials: inits, colorIndex: idx };
  }, [name]);

  const themes = [
    {
      bgGrad: "from-blue-50/90 via-slate-50 to-indigo-50/50",
      accent: "#2563eb",
      subAccent: "#3b82f6",
      shieldBg: "#eff6ff",
      textColor: "text-blue-700"
    },
    {
      bgGrad: "from-emerald-50/90 via-slate-50 to-teal-50/50",
      accent: "#059669",
      subAccent: "#10b981",
      shieldBg: "#ecfdf5",
      textColor: "text-emerald-700"
    },
    {
      bgGrad: "from-sky-50/90 via-slate-50 to-cyan-50/50",
      accent: "#0284c7",
      subAccent: "#0ea5e9",
      shieldBg: "#f0f9ff",
      textColor: "text-sky-700"
    },
    {
      bgGrad: "from-violet-50/90 via-slate-50 to-purple-50/50",
      accent: "#7c3aed",
      subAccent: "#8b5cf6",
      shieldBg: "#f5f3ff",
      textColor: "text-violet-700"
    },
    {
      bgGrad: "from-amber-50/90 via-slate-50 to-orange-50/50",
      accent: "#d97706",
      subAccent: "#f59e0b",
      shieldBg: "#fffbeb",
      textColor: "text-amber-700"
    }
  ];

  const currentTheme = themes[colorIndex];

  return (
    <div
      className={`relative w-full h-full bg-gradient-to-br ${currentTheme.bgGrad} flex flex-col items-center justify-center overflow-hidden select-none p-4 ${className}`}
    >
      {/* Background Architectural Grid Pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.25]"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 400 300"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id={`cust-grid-${colorIndex}`} width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#64748b" strokeWidth="0.75" strokeDasharray="3 3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#cust-grid-${colorIndex})`} />

        {/* Corporate Skyscraper Silhouette Watermark */}
        <g opacity="0.4" stroke={currentTheme.accent} strokeWidth="1.2" fill="none">
          {/* Main Tower */}
          <rect x="140" y="70" width="120" height="190" rx="4" />
          <line x1="160" y1="100" x2="160" y2="240" strokeDasharray="4 4" />
          <line x1="180" y1="100" x2="180" y2="240" strokeDasharray="4 4" />
          <line x1="200" y1="100" x2="200" y2="240" strokeDasharray="4 4" />
          <line x1="220" y1="100" x2="220" y2="240" strokeDasharray="4 4" />
          <line x1="240" y1="100" x2="240" y2="240" strokeDasharray="4 4" />

          {/* Left Wing */}
          <rect x="80" y="120" width="60" height="140" rx="3" />
          <line x1="100" y1="140" x2="100" y2="240" strokeDasharray="3 3" />
          <line x1="120" y1="140" x2="120" y2="240" strokeDasharray="3 3" />

          {/* Right Wing */}
          <rect x="260" y="110" width="60" height="150" rx="3" />
          <line x1="280" y1="130" x2="280" y2="240" strokeDasharray="3 3" />
          <line x1="300" y1="130" x2="300" y2="240" strokeDasharray="3 3" />

          {/* Base Platform Line */}
          <line x1="50" y1="260" x2="350" y2="260" strokeWidth="2" />
        </g>
      </svg>

      {/* Central Enterprise Badge Emblem */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white shadow-md border border-slate-200/90 flex items-center justify-center transform transition-transform group-hover:scale-105 duration-300 relative">
          <span className={`text-xl sm:text-2xl font-black tracking-tight ${currentTheme.textColor}`}>
            {initials}
          </span>

          {/* GST Verified Mini Badge */}
          {isGstRegistered && (
            <div
              title="GST Registered Commercial Entity"
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs border-2 border-white ring-1 ring-emerald-400/50"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>

        {/* Corporate Client Pill */}
        <div className="mt-2.5 px-3 py-0.5 rounded-full bg-white/90 backdrop-blur-xs border border-slate-200/70 shadow-2xs text-[10px] font-semibold text-slate-600 tracking-wide uppercase">
          {isGstRegistered ? "GST Verified Entity" : "Commercial Client"}
        </div>
      </div>
    </div>
  );
}

