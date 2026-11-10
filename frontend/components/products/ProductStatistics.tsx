"use client";

import { StockFilter } from "./types";
import { Package, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface ProductStatisticsProps {
  counts: {
    total: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
  activeFilter: StockFilter;
  onFilterChange: (filter: StockFilter) => void;
}

export default function ProductStatistics({
  counts,
  activeFilter,
  onFilterChange
}: ProductStatisticsProps) {
  const stats = [
    {
      id: "ALL" as StockFilter,
      label: "Total Products",
      count: counts.total,
      icon: Package,
      iconColor: "text-slate-600",
      indicatorColor: "bg-slate-400",
      activeBg: "bg-slate-900 text-white border-slate-900 shadow-xs",
      inactiveBg: "bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50/80 hover:border-slate-300"
    },
    {
      id: "IN_STOCK" as StockFilter,
      label: "In Stock",
      count: counts.inStock,
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
      indicatorColor: "bg-emerald-500",
      activeBg: "bg-emerald-700 text-white border-emerald-700 shadow-xs",
      inactiveBg: "bg-white text-slate-700 border-slate-200/90 hover:bg-emerald-50/40 hover:border-emerald-200"
    },
    {
      id: "LOW_STOCK" as StockFilter,
      label: "Low Stock",
      count: counts.lowStock,
      icon: AlertTriangle,
      iconColor: "text-amber-600",
      indicatorColor: "bg-amber-500",
      activeBg: "bg-amber-700 text-white border-amber-700 shadow-xs",
      inactiveBg: "bg-white text-slate-700 border-slate-200/90 hover:bg-amber-50/40 hover:border-amber-200"
    },
    {
      id: "OUT_OF_STOCK" as StockFilter,
      label: "Out of Stock",
      count: counts.outOfStock,
      icon: XCircle,
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
                <span
                  className={`text-lg sm:text-xl font-bold tracking-tight block leading-tight ${
                    isActive ? "text-white" : "text-slate-900"
                  }`}
                >
                  {item.count}
                </span>
              </div>
            </div>

            <Icon
              className={`w-4 h-4 shrink-0 transition-opacity ${
                isActive ? "text-white/80" : `${item.iconColor} opacity-70 group-hover:opacity-100`
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

