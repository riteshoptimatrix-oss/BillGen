"use client";

import { GstStatusFilter } from "./types";
import { Users, ShieldCheck, UserCheck, Landmark } from "lucide-react";

interface CustomerStatisticsProps {
  counts: {
    total: number;
    gstRegistered: number;
    retail: number;
    bankLinked: number;
  };
  activeFilter: GstStatusFilter;
  onFilterChange: (filter: GstStatusFilter) => void;
}

export default function CustomerStatistics({
  counts,
  activeFilter,
  onFilterChange
}: CustomerStatisticsProps) {
  const stats = [
    {
      id: "ALL" as GstStatusFilter,
      label: "Total Customers",
      count: counts.total,
      icon: Users,
      iconColor: "text-slate-600",
      indicatorColor: "bg-slate-400",
      activeBg: "bg-slate-900 text-white border-slate-900 shadow-xs",
      inactiveBg: "bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50/80 hover:border-slate-300"
    },
    {
      id: "GST_REGISTERED" as GstStatusFilter,
      label: "GST Registered",
      count: counts.gstRegistered,
      icon: ShieldCheck,
      iconColor: "text-emerald-600",
      indicatorColor: "bg-emerald-500",
      activeBg: "bg-emerald-700 text-white border-emerald-700 shadow-xs",
      inactiveBg: "bg-white text-slate-700 border-slate-200/90 hover:bg-emerald-50/40 hover:border-emerald-200"
    },
    {
      id: "UNREGISTERED" as GstStatusFilter,
      label: "Retail / Regular",
      count: counts.retail,
      icon: UserCheck,
      iconColor: "text-blue-600",
      indicatorColor: "bg-blue-500",
      activeBg: "bg-blue-700 text-white border-blue-700 shadow-xs",
      inactiveBg: "bg-white text-slate-700 border-slate-200/90 hover:bg-blue-50/40 hover:border-blue-200"
    },
    {
      id: "ALL" as GstStatusFilter, // Secondary indicator for bank linked
      label: "Bank Linked",
      count: counts.bankLinked,
      icon: Landmark,
      iconColor: "text-indigo-600",
      indicatorColor: "bg-indigo-500",
      activeBg: "bg-indigo-700 text-white border-indigo-700 shadow-xs",
      inactiveBg: "bg-white text-slate-700 border-slate-200/90 hover:bg-indigo-50/40 hover:border-indigo-200"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
      {stats.map((item, idx) => {
        const isCurrentActive = idx !== 3 && activeFilter === item.id;
        const Icon = item.icon;

        return (
          <button
            key={idx}
            type="button"
            onClick={() => onFilterChange(item.id)}
            className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer group ${
              isCurrentActive ? item.activeBg : item.inactiveBg
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 transition-transform group-hover:scale-125 ${
                  isCurrentActive ? "bg-white" : item.indicatorColor
                }`}
              />
              <div className="truncate">
                <p
                  className={`text-[11px] font-semibold tracking-wider uppercase truncate ${
                    isCurrentActive ? "text-white/80" : "text-slate-400"
                  }`}
                >
                  {item.label}
                </p>
                <p
                  className={`text-lg sm:text-xl font-bold tracking-tight mt-0.5 ${
                    isCurrentActive ? "text-white" : "text-slate-900"
                  }`}
                >
                  {item.count}
                </p>
              </div>
            </div>

            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                isCurrentActive
                  ? "bg-white/20 text-white"
                  : "bg-slate-100/80 text-slate-500 group-hover:bg-slate-200/70"
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>
          </button>
        );
      })}
    </div>
  );
}

