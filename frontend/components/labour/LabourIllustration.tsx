"use client";

import React from "react";

interface LabourIllustrationProps {
  name: string;
  workType?: string;
  labourId?: string;
  className?: string;
}

export default function LabourIllustration({
  name,
  workType = "Staff",
  labourId = "LBR",
  className = "w-full h-full"
}: LabourIllustrationProps) {
  const initial = (name || "W").trim().charAt(0).toUpperCase();

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100/60 p-4 select-none ${className}`}
    >
      {/* Engineering Technical Grid Background */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="labour-tech-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#labour-tech-grid)" />
      </svg>

      {/* Industrial Technician Avatar Graphic */}
      <div className="relative z-10 flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-105">
        <svg viewBox="0 0 100 100" className="w-20 h-20 drop-shadow-sm" fill="none">
          {/* Base Circle */}
          <circle cx="50" cy="50" r="44" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />

          {/* Safety Helmet / HardHat */}
          <path
            d="M 32 38 C 32 24, 68 24, 68 38 L 72 42 H 28 Z"
            fill="#facc15"
            stroke="#ca8a04"
            strokeWidth="2"
          />
          <rect x="47" y="22" width="6" height="6" rx="1.5" fill="#ca8a04" />
          <line x1="26" y1="42" x2="74" y2="42" stroke="#a16207" strokeWidth="2.5" strokeLinecap="round" />

          {/* Head */}
          <circle cx="50" cy="50" r="14" fill="#fed7aa" stroke="#fb923c" strokeWidth="1.5" />

          {/* Torso & Safety Vest */}
          <path
            d="M 28 86 C 28 66, 72 66, 72 86 Z"
            fill="#0260de"
            stroke="#1d4ed8"
            strokeWidth="2"
          />
          {/* High-vis Vest Straps */}
          <path d="M 40 68 L 36 86 M 60 68 L 64 86" stroke="#facc15" strokeWidth="3" strokeLinecap="round" />
          <line x1="38" y1="78" x2="62" y2="78" stroke="#facc15" strokeWidth="2.5" />
        </svg>

        {/* Worker Initial Badge */}
        <div className="mt-1 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-[#0260de] text-white text-[10px] font-black flex items-center justify-center shadow-2xs">
            {initial}
          </span>
          <span className="text-[10px] font-mono font-bold text-slate-500">
            {labourId}
          </span>
        </div>
      </div>

      {/* Role Watermark Pill */}
      <div className="absolute bottom-2.5 inset-x-0 flex justify-center pointer-events-none">
        <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-slate-400 bg-white/80 border border-slate-200/60 px-2 py-0.5 rounded-full shadow-2xs backdrop-blur-xs">
          {workType}
        </span>
      </div>
    </div>
  );
}

