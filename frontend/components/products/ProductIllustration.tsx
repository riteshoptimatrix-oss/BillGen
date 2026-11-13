"use client";

import React from "react";

interface ProductIllustrationProps {
  name: string;
  category?: string;
  className?: string;
}

type ComponentType =
  | "engine"
  | "chassis"
  | "differential"
  | "suspension"
  | "cabin"
  | "wiring"
  | "cng"
  | "brakes"
  | "tyres"
  | "speedometer"
  | "general";

function detectComponentType(name: string, category: string = ""): ComponentType {
  const text = `${name} ${category}`.toLowerCase();
  if (text.includes("engine") || text.includes("gearbox") || text.includes("4-stroke") || text.includes("piston") || text.includes("motor")) {
    return "engine";
  }
  if (text.includes("chassis") || text.includes("tubular") || text.includes("frame")) {
    return "chassis";
  }
  if (text.includes("differential") || text.includes("axle") || text.includes("crown wheel") || text.includes("pinion")) {
    return "differential";
  }
  if (text.includes("suspension") || text.includes("fork") || text.includes("shock") || text.includes("damper") || text.includes("spring")) {
    return "suspension";
  }
  if (text.includes("cabin") || text.includes("canopy") || text.includes("cowl") || text.includes("hood") || text.includes("body")) {
    return "cabin";
  }
  if (text.includes("wiring") || text.includes("harness") || text.includes("cdi") || text.includes("ignition") || text.includes("fuse") || text.includes("relay")) {
    return "wiring";
  }
  if (text.includes("cng") || text.includes("gas") || text.includes("regulator") || text.includes("lpg") || text.includes("venturi")) {
    return "cng";
  }
  if (text.includes("brake") || text.includes("drum") || text.includes("shoe") || text.includes("disc") || text.includes("caliper")) {
    return "brakes";
  }
  if (text.includes("tyre") || text.includes("tire") || text.includes("rim") || text.includes("wheel") || text.includes("tread")) {
    return "tyres";
  }
  if (text.includes("speedometer") || text.includes("meter") || text.includes("console") || text.includes("dashboard") || text.includes("cluster") || text.includes("odometer")) {
    return "speedometer";
  }
  return "general";
}

export default function ProductIllustration({
  name,
  category = "",
  className = "w-full h-full",
}: ProductIllustrationProps) {
  const type = detectComponentType(name, category);

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100/60 p-4 select-none ${className}`}
    >
      {/* Engineering Technical Grid Background */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="tech-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tech-grid)" />
      </svg>

      {/* Primary Automotive Component Graphic */}
      <div className="relative z-10 w-full max-w-[200px] aspect-[4/3] flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
        {type === "engine" && (
          <svg viewBox="0 0 160 120" className="w-full h-full drop-shadow-sm" fill="none">
            <rect x="35" y="45" width="90" height="55" rx="10" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <path d="M50 45 V 25 H85 V 45" fill="#1e293b" stroke="#0260de" strokeWidth="2" />
            <circle cx="68" cy="30" r="4" fill="#38bdf8" />
            <line x1="53" y1="32" x2="82" y2="32" stroke="#475569" strokeWidth="1.5" />
            <line x1="53" y1="37" x2="82" y2="37" stroke="#475569" strokeWidth="1.5" />
            <rect x="95" y="55" width="25" height="35" rx="4" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
            <circle cx="107" cy="72" r="8" fill="#1e293b" stroke="#0260de" strokeWidth="2" />
            <circle cx="107" cy="72" r="3" fill="#38bdf8" />
            <circle cx="55" cy="72" r="14" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <circle cx="55" cy="72" r="6" fill="#0260de" />
            <path d="M25 68 H35 M25 76 H35" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
            <path d="M60 100 L60 110 H100 L100 100" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
            <text x="80" y="93" textAnchor="middle" fill="#94a3b8" fontSize="6" fontFamily="monospace" fontWeight="bold">
              200cc • 4-STROKE
            </text>
          </svg>
        )}

        {type === "chassis" && (
          <svg viewBox="0 0 160 120" className="w-full h-full drop-shadow-sm" fill="none">
            <line x1="20" y1="60" x2="140" y2="60" stroke="#0260de" strokeWidth="4" strokeLinecap="round" />
            <line x1="30" y1="80" x2="130" y2="80" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="45" y1="60" x2="45" y2="80" stroke="#334155" strokeWidth="3" />
            <line x1="80" y1="60" x2="80" y2="80" stroke="#334155" strokeWidth="3" />
            <line x1="115" y1="60" x2="115" y2="80" stroke="#334155" strokeWidth="3" />
            <line x1="45" y1="60" x2="80" y2="80" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 2" />
            <line x1="80" y1="60" x2="115" y2="80" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 2" />
            <path d="M20 60 L12 40 H28 L20 60" fill="#1e293b" stroke="#0260de" strokeWidth="2" />
            <circle cx="12" cy="40" r="3" fill="#38bdf8" />
            <circle cx="28" cy="40" r="3" fill="#38bdf8" />
            <text x="80" y="48" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="monospace" fontWeight="bold">
              TUBULAR CRCA FRAME
            </text>
          </svg>
        )}

        {type === "differential" && (
          <svg viewBox="0 0 160 120" className="w-full h-full drop-shadow-sm" fill="none">
            <line x1="15" y1="60" x2="145" y2="60" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
            <circle cx="80" cy="60" r="24" fill="#1e293b" stroke="#0260de" strokeWidth="2.5" />
            <circle cx="80" cy="60" r="16" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="80" cy="60" r="6" fill="#0260de" />
            <line x1="80" y1="36" x2="80" y2="84" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="56" y1="60" x2="104" y2="60" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
            <rect x="20" y="48" width="10" height="24" rx="2" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
            <rect x="130" y="48" width="10" height="24" rx="2" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
            <text x="80" y="98" textAnchor="middle" fill="#64748b" fontSize="6.5" fontFamily="monospace" fontWeight="bold">
              HYPOID AXLE GEARBOX
            </text>
          </svg>
        )}

        {type === "suspension" && (
          <svg viewBox="0 0 160 120" className="w-full h-full drop-shadow-sm" fill="none">
            <g transform="translate(48, 15)">
              <rect x="10" y="0" width="8" height="90" rx="3" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
              <rect x="8" y="30" width="12" height="40" rx="2" fill="#1e293b" stroke="#0260de" strokeWidth="1.5" />
              <path d="M6 35 C18 35, 18 40, 6 40 C18 40, 18 45, 6 45 C18 45, 18 50, 6 50 C18 50, 18 55, 6 55 C18 55, 18 60, 6 60 C18 60, 18 65, 6 65" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
            </g>
            <g transform="translate(88, 15)">
              <rect x="10" y="0" width="8" height="90" rx="3" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
              <rect x="8" y="30" width="12" height="40" rx="2" fill="#1e293b" stroke="#0260de" strokeWidth="1.5" />
              <path d="M6 35 C18 35, 18 40, 6 40 C18 40, 18 45, 6 45 C18 45, 18 50, 6 50 C18 50, 18 55, 6 55 C18 55, 18 60, 6 60 C18 60, 18 65, 6 65" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
            </g>
            <line x1="50" y1="20" x2="110" y2="20" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
            <line x1="50" y1="95" x2="110" y2="95" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}

        {type === "cabin" && (
          <svg viewBox="0 0 160 120" className="w-full h-full drop-shadow-sm" fill="none">
            <path
              d="M30 85 L45 35 H105 L130 55 L135 85 Z"
              fill="#facc15"
              stroke="#ca8a04"
              strokeWidth="2.5"
            />
            <path d="M42 35 H108 L115 52 H38 Z" fill="#0f172a" />
            <rect x="52" y="40" width="48" height="15" rx="3" fill="#93c5fd" opacity="0.8" />
            <line x1="30" y1="85" x2="135" y2="85" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
            <circle cx="50" cy="90" r="10" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <circle cx="115" cy="90" r="10" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <text x="80" y="74" textAnchor="middle" fill="#0f172a" fontSize="6.5" fontFamily="sans-serif" fontWeight="900">
              SV 3-WHEELER CABIN
            </text>
          </svg>
        )}

        {type === "wiring" && (
          <svg viewBox="0 0 160 120" className="w-full h-full drop-shadow-sm" fill="none">
            <path d="M25 60 C50 30, 70 90, 95 50 C110 30, 130 70, 140 60" stroke="#0260de" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M25 65 C50 35, 70 95, 95 55 C110 35, 130 75, 140 65" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
            <rect x="40" y="38" width="18" height="14" rx="3" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
            <rect x="85" y="65" width="22" height="16" rx="3" fill="#1e293b" stroke="#0260de" strokeWidth="1.5" />
            <rect x="125" y="48" width="15" height="12" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="96" cy="73" r="3" fill="#38bdf8" />
            <text x="80" y="100" textAnchor="middle" fill="#64748b" fontSize="6" fontFamily="monospace" fontWeight="bold">
              HARNESS & CDI IGNITION
            </text>
          </svg>
        )}

        {type === "cng" && (
          <svg viewBox="0 0 160 120" className="w-full h-full drop-shadow-sm" fill="none">
            <rect x="45" y="45" width="70" height="40" rx="8" fill="#1e293b" stroke="#0260de" strokeWidth="2" />
            <circle cx="80" cy="55" r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="80" y1="55" x2="86" y2="50" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="80" cy="55" r="2" fill="#ffffff" />
            <path d="M30 65 H45 M115 65 H130" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
            <text x="80" y="77" textAnchor="middle" fill="#38bdf8" fontSize="6" fontFamily="sans-serif" fontWeight="bold">
              200 BAR
            </text>
            <text x="80" y="100" textAnchor="middle" fill="#64748b" fontSize="6" fontFamily="monospace" fontWeight="bold">
              CNG REGULATOR KIT
            </text>
          </svg>
        )}

        {type === "brakes" && (
          <svg viewBox="0 0 160 120" className="w-full h-full drop-shadow-sm" fill="none">
            <circle cx="80" cy="60" r="32" fill="#1e293b" stroke="#0f172a" strokeWidth="3" />
            <circle cx="80" cy="60" r="26" fill="#334155" stroke="#0260de" strokeWidth="2" />
            <circle cx="80" cy="60" r="12" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
            <circle cx="80" cy="60" r="4" fill="#38bdf8" />
            <circle cx="80" cy="42" r="2.5" fill="#94a3b8" />
            <circle cx="80" cy="78" r="2.5" fill="#94a3b8" />
            <circle cx="62" cy="60" r="2.5" fill="#94a3b8" />
            <circle cx="98" cy="60" r="2.5" fill="#94a3b8" />
            <text x="80" y="103" textAnchor="middle" fill="#64748b" fontSize="6" fontFamily="monospace" fontWeight="bold">
              HYDRAULIC DRUM BRAKE
            </text>
          </svg>
        )}

        {type === "tyres" && (
          <svg viewBox="0 0 160 120" className="w-full h-full drop-shadow-sm" fill="none">
            <circle cx="80" cy="60" r="34" fill="#0f172a" stroke="#1e293b" strokeWidth="3" />
            <circle cx="80" cy="60" r="26" fill="#475569" stroke="#334155" strokeWidth="1.5" />
            <circle cx="80" cy="60" r="18" fill="#e2e8f0" stroke="#0260de" strokeWidth="2" />
            <circle cx="80" cy="60" r="6" fill="#0f172a" />
            <circle cx="75" cy="55" r="1.5" fill="#64748b" />
            <circle cx="85" cy="55" r="1.5" fill="#64748b" />
            <circle cx="85" cy="65" r="1.5" fill="#64748b" />
            <circle cx="75" cy="65" r="1.5" fill="#64748b" />
            <text x="80" y="105" textAnchor="middle" fill="#64748b" fontSize="6.5" fontFamily="monospace" fontWeight="bold">
              4.00-8 COMMERCIAL RIM
            </text>
          </svg>
        )}

        {type === "speedometer" && (
          <svg viewBox="0 0 160 120" className="w-full h-full drop-shadow-sm" fill="none">
            <rect x="35" y="30" width="90" height="60" rx="14" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <circle cx="65" cy="60" r="18" fill="#1e293b" stroke="#0260de" strokeWidth="1.5" />
            <line x1="65" y1="60" x2="73" y2="52" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="65" cy="60" r="2" fill="#ffffff" />
            <rect x="92" y="48" width="22" height="12" rx="2" fill="#0260de" opacity="0.3" stroke="#38bdf8" strokeWidth="1" />
            <text x="103" y="56" textAnchor="middle" fill="#38bdf8" fontSize="6" fontFamily="monospace" fontWeight="bold">
              0428 km
            </text>
            <circle cx="98" cy="70" r="3" fill="#10b981" />
            <circle cx="108" cy="70" r="3" fill="#eab308" />
            <text x="80" y="101" textAnchor="middle" fill="#64748b" fontSize="6" fontFamily="monospace" fontWeight="bold">
              DIGITAL CONSOLE CLUSTER
            </text>
          </svg>
        )}

        {type === "general" && (
          <svg viewBox="0 0 160 120" className="w-full h-full drop-shadow-sm" fill="none">
            <rect x="40" y="35" width="80" height="50" rx="10" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <circle cx="80" cy="60" r="18" fill="#1e293b" stroke="#0260de" strokeWidth="2" />
            <circle cx="80" cy="60" r="8" fill="#38bdf8" />
            <line x1="80" y1="38" x2="80" y2="82" stroke="#475569" strokeWidth="1.5" strokeDasharray="2 2" />
            <line x1="58" y1="60" x2="102" y2="60" stroke="#475569" strokeWidth="1.5" strokeDasharray="2 2" />
            <text x="80" y="98" textAnchor="middle" fill="#64748b" fontSize="6.5" fontFamily="monospace" fontWeight="bold">
              GENUINE OEM SPARE
            </text>
          </svg>
        )}
      </div>

      {/* Component Type Watermark Pill */}
      <div className="absolute bottom-2.5 inset-x-0 flex justify-center pointer-events-none">
        <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-slate-400 bg-white/80 border border-slate-200/60 px-2 py-0.5 rounded-full shadow-2xs backdrop-blur-xs">
          {category || "OEM COMPONENT"}
        </span>
      </div>
    </div>
  );
}

