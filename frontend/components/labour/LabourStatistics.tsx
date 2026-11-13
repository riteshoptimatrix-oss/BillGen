"use client";

import { LabourStatusFilter } from "./types";
import { Users, UserCheck, Clock, Ban } from "lucide-react";

interface LabourStatisticsProps {
  counts: {
    total: number;
    active: number;
    leave: number;
    inactive: number;
  };
  activeFilter: LabourStatusFilter;
  onFilterChange: (filter: LabourStatusFilter) => void;
}

export default function LabourStatistics({
  counts,
  activeFilter,
  onFilterChange
}: LabourStatisticsProps) {
  const stats = [
    {
      id: "ALL" as LabourStatusFilter,
      label: "Total Staff",
      count: counts.total,
      icon: Users,
      iconColor: "text-slate-600",
      indicatorColor: "bg-slate-400",
      activeBg: "bg-slate-900 text-white border-slate-900 shadow-xs",
      inactiveBg: "bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50/80 hover:border-slate-300"
    },
    {
      id: "Active" as LabourStatusFilter,
      label: "Active Staff",
      count: counts.active,
      icon: UserCheck,
      iconColor: "text-emerald-600",
      indicatorColor: "bg-emerald-500",
      activeBg: "bg-emerald-700 text-white border-emerald-700 shadow-xs",
      inactiveBg: "bg-white text-slate-700 border-slate-200/90 hover:bg-emerald-50/40 hover:border-emerald-200"
    },
    {
      id: "On Leave" as LabourStatusFilter,
      label: "On Leave",
      count: counts.leave,
      icon: Clock,
      iconColor: "text-amber-600",
      indicatorColor: "bg-amber-500",
      activeBg: "bg-amber-700 text-white border-amber-700 shadow-xs",
      inactiveBg: "bg-white text-slate-700 border-slate-200/90 hover:bg-amber-50/40 hover:border-amber-200"
    },
    {
      id: "Inactive" as LabourStatusFilter,
      label: "Inactive",
      count: counts.inactive,
      icon: Ban,
      iconColor: "text-rose-600",
      indicatorColor: "bg-rose-500",
      activeBg: "bg-rose-700 text-white border-rose-700 shadow-xs",
      inactiveBg: "bg-white text-slate-700 border-slate-200/90 hover:bg-rose-50/40 hover:border-rose-200"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
      {stats.map((item) => {
        const isActive = activeFilter === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onFilterChange(item.id)}
            className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer group ${
              isActive ? item.activeBg : item.inactiveBg
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 transition-transform group-hover:scale-125 ${
                  isActive ? "bg-white" : item.indicatorColor
                }`}
              />
              <div className="min-w-0">
                <span
                  className={`text-[11px] font-semibold tracking-tight uppercase block truncate ${
                    isActive ? "text-white/80" : "text-slate-500"
                  }`}
                >
                  {item.label}
                </span>
                <span className="text-lg sm:text-xl font-bold tracking-tight block">
                  {item.count}
                </span>
              </div>
            </div>

            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                isActive ? "bg-white/10 text-white" : "bg-slate-100 text-slate-500"
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

