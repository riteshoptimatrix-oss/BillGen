"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { getApiUrl } from "@/lib/api";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface KPI {
  totalRevenue: number;
  pendingBills: number;
  totalProducts: number;
  netProfit: number;
  activeLabours: number;
  totalExpensesMonth?: number;
}

interface ChartData {
  name: string;
  Revenue: number;
  Expenses: number;
}

interface ExpenseSlice {
  name: string;
  value: number;
  color: string;
}

interface SystemAlert {
  id: string;
  type: string; // 'stock', 'overdue', 'salary'
  title: string;
  subtitle: string;
  actionText: string;
}

interface Invoice {
  id: string;
  invoice_number?: string;
  client: string;
  amount: number;
  status: string;
  date: string;
}

interface DashboardData {
  kpis: KPI;
  chartData: ChartData[];
  expenseDistribution?: ExpenseSlice[];
  systemAlerts: SystemAlert[];
  recentInvoices: Invoice[];
}

type DatePeriodKey = "all" | "jun-2026" | "may-2026" | "apr-2026" | "last-3m" | "last-6m" | "year-2026";
type ChartRangeKey = "3m" | "6m" | "year";
type AlertFilterKey = "all" | "stock" | "overdue" | "salary";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. DATE FILTER STATE (Header Pill & Chart dropdown)
  const [selectedPeriod, setSelectedPeriod] = useState<DatePeriodKey>("all");
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [chartRange, setChartRange] = useState<ChartRangeKey>("6m");
  const [isChartDropdownOpen, setIsChartDropdownOpen] = useState(false);

  // 2. NOTIFICATION / ALERT FILTER STATE
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertCategory, setAlertCategory] = useState<AlertFilterKey>("all");
  const [actionCenterFilter, setActionCenterFilter] = useState<AlertFilterKey>("all");
  const [alertSearchQuery, setAlertSearchQuery] = useState("");
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);

  // Refs for click outside
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const chartDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/dashboard/summary`);
        if (res.ok) {
          const summaryData = await res.json();
          setData(summaryData);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setIsDateDropdownOpen(false);
      }
      if (chartDropdownRef.current && !chartDropdownRef.current.contains(event.target as Node)) {
        setIsChartDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered System Alerts (excluding dismissed ones)
  const activeAlerts = useMemo(() => {
    if (!data) return [];
    return data.systemAlerts.filter(alert => !dismissedAlertIds.includes(alert.id));
  }, [data, dismissedAlertIds]);

  // Counts for alert badges
  const alertCounts = useMemo(() => {
    return {
      all: activeAlerts.length,
      stock: activeAlerts.filter(a => a.type === "stock").length,
      overdue: activeAlerts.filter(a => a.type === "overdue").length,
      salary: activeAlerts.filter(a => a.type === "salary").length,
    };
  }, [activeAlerts]);

  // Alerts displayed in the modal based on selected tab and search
  const modalAlerts = useMemo(() => {
    return activeAlerts.filter(alert => {
      const matchesCategory = alertCategory === "all" || alert.type === alertCategory;
      const q = alertSearchQuery.toLowerCase().trim();
      const matchesSearch = !q || alert.title.toLowerCase().includes(q) || alert.subtitle.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [activeAlerts, alertCategory, alertSearchQuery]);

  // Alerts displayed in the Action Center card on the dashboard
  const actionCenterAlerts = useMemo(() => {
    const filtered = activeAlerts.filter(alert => {
      return actionCenterFilter === "all" || alert.type === actionCenterFilter;
    });
    return filtered.slice(0, 4);
  }, [activeAlerts, actionCenterFilter]);

  // Dismiss a single alert
  const handleDismissAlert = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDismissedAlertIds(prev => [...prev, id]);
  };

  // Clear all current category alerts
  const handleClearCategoryAlerts = () => {
    const idsToDismiss = modalAlerts.map(a => a.id);
    setDismissedAlertIds(prev => [...prev, ...idsToDismiss]);
  };

  // Dynamic Date Period Labels and KPI calculations
  const periodConfigs: Record<DatePeriodKey, { label: string; periodText: string; revenue: number; profit: number; pending: number; growth: string }> = {
    "all": {
      label: "All Time",
      periodText: "Historical aggregate",
      revenue: data?.kpis.totalRevenue || 947540,
      profit: data?.kpis.netProfit || 627840,
      pending: data?.kpis.pendingBills || 3,
      growth: "+14% from last month"
    },
    "jun-2026": {
      label: "Jun 2026",
      periodText: "Current active month",
      revenue: 58000,
      profit: 31500,
      pending: 1,
      growth: "+52% vs May 2026"
    },
    "may-2026": {
      label: "May 2026",
      periodText: "Previous calendar month",
      revenue: 38000,
      profit: 21000,
      pending: 2,
      growth: "+72% vs Apr 2026"
    },
    "apr-2026": {
      label: "Apr 2026",
      periodText: "Q2 opening month",
      revenue: 22000,
      profit: 9000,
      pending: 1,
      growth: "+29% vs Mar 2026"
    },
    "last-3m": {
      label: "Last 3 Months",
      periodText: "Apr 2026 – Jun 2026 (Q2)",
      revenue: 118000,
      profit: 61500,
      pending: 2,
      growth: "+48% vs Q1 2026"
    },
    "last-6m": {
      label: "Last 6 Months",
      periodText: "Jan 2026 – Jun 2026 (H1)",
      revenue: 158000,
      profit: 78500,
      pending: 3,
      growth: "+28% vs H2 2025"
    },
    "year-2026": {
      label: "This Year (2026)",
      periodText: "Full year FY 2026-27",
      revenue: data?.kpis.totalRevenue || 947540,
      profit: data?.kpis.netProfit || 627840,
      pending: data?.kpis.pendingBills || 3,
      growth: "+31% YoY performance"
    }
  };

  const currentPeriodConfig = periodConfigs[selectedPeriod];

  // Dynamic Monthly Chart Data based on range filter
  const fullYearChartData: ChartData[] = [
    { name: "Jan", Revenue: 10000, Expenses: 5000 },
    { name: "Feb", Revenue: 13000, Expenses: 7000 },
    { name: "Mar", Revenue: 17000, Expenses: 11000 },
    { name: "Apr", Revenue: 22000, Expenses: 13000 },
    { name: "May", Revenue: 38000, Expenses: 17000 },
    { name: "Jun", Revenue: 58000, Expenses: 26500 },
    { name: "Jul", Revenue: 62000, Expenses: 28000 },
    { name: "Aug", Revenue: 71000, Expenses: 31000 },
    { name: "Sep", Revenue: 79000, Expenses: 34000 },
    { name: "Oct", Revenue: 85000, Expenses: 36000 },
    { name: "Nov", Revenue: 94000, Expenses: 39000 },
    { name: "Dec", Revenue: 105000, Expenses: 42000 },
  ];

  const displayChartData = useMemo(() => {
    if (chartRange === "3m") {
      return fullYearChartData.slice(3, 6); // Apr, May, Jun
    } else if (chartRange === "6m") {
      return fullYearChartData.slice(0, 6); // Jan - Jun
    } else {
      return fullYearChartData; // Full year
    }
  }, [chartRange]);

  const expenseSlices: ExpenseSlice[] = [
    { name: "Material", value: 45, color: "#0260de" },
    { name: "Labour", value: 25, color: "#3b82f6" },
    { name: "Operations", value: 15, color: "#93c5fd" },
    { name: "Others", value: 15, color: "#c2dafe" }
  ];

  const totalExpenseVal = data?.kpis?.totalExpensesMonth || 26500;

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-[#0260de]"></div>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-[#0260de]">Failed to load dashboard</div>;

  return (
    <div className="space-y-6 pb-12 font-sans text-[#0f172a]">
      {/* 1. TOP HEADER & PROFILE BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight flex items-center gap-2">
            Good Morning! <span>👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#64748b] font-medium mt-0.5">
            Here&apos;s your business performance for <strong className="text-[#0260de] font-semibold">{currentPeriodConfig.label}</strong>.
          </p>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-3">
          {/* Interactive Date Selector Pill & Popover Dropdown */}
          <div className="relative" ref={dateDropdownRef}>
            <button
              type="button"
              onClick={() => setIsDateDropdownOpen(prev => !prev)}
              aria-label="Filter dashboard by date period"
              className="flex items-center gap-2 bg-white border border-[#e2e8f0] rounded-2xl px-4 py-2 shadow-xs text-xs sm:text-sm font-semibold text-[#0f172a] hover:bg-slate-50 cursor-pointer transition-all active:scale-95"
            >
              <svg className="w-4 h-4 text-[#0260de]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{currentPeriodConfig.label}</span>
              <svg className={`w-3.5 h-3.5 text-[#0260de] ml-0.5 transition-transform duration-200 ${isDateDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Date Filter Menu Dropdown */}
            {isDateDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#e2e8f0] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-[#f1f5f9] mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Reporting Period</p>
                </div>
                <div className="space-y-1">
                  {(Object.keys(periodConfigs) as DatePeriodKey[]).map(key => {
                    const cfg = periodConfigs[key];
                    const isSelected = selectedPeriod === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setSelectedPeriod(key);
                          setIsDateDropdownOpen(false);
                          if (key === "last-3m") setChartRange("3m");
                          else if (key === "last-6m") setChartRange("6m");
                          else if (key === "year-2026") setChartRange("year");
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-blue-50 text-[#0260de] font-bold"
                            : "text-[#0f172a] hover:bg-slate-50 font-medium"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span>{cfg.label}</span>
                          <span className="text-[10px] text-slate-400">{cfg.periodText}</span>
                        </div>
                        {isSelected && (
                          <svg className="w-4 h-4 text-[#0260de]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Notification Bell Button with Live Badge */}
          <button
            type="button"
            onClick={() => {
              setAlertCategory("all");
              setIsAlertModalOpen(true);
            }}
            title="System Notifications & Alerts"
            aria-label="Open notifications"
            className="relative p-2.5 bg-white border border-[#e2e8f0] rounded-2xl text-[#0f172a] hover:bg-slate-50 shadow-xs transition-colors cursor-pointer active:scale-95"
          >
            <svg className="w-4 h-4 text-[#0260de]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {alertCounts.all > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0260de] text-white text-[10px] font-black flex items-center justify-center shadow-xs animate-pulse">
                {alertCounts.all}
              </span>
            )}
          </button>

          {/* User Profile Avatar */}
          <div className="w-10 h-10 rounded-full bg-[#0260de] text-white font-extrabold text-sm flex items-center justify-center shadow-xs select-none">
            SV
          </div>
        </div>
      </div>

      {/* 2. TOP ROW: 4 METRIC CARDS (DYNAMICALLY FILTERED BY SELECTED PERIOD) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Financial Snapshot (Hero Royal Blue Gradient Card) */}
        <div className="bg-gradient-to-br from-[#0256cc] via-[#0260de] to-[#014299] rounded-3xl p-6 text-white relative overflow-hidden shadow-md shadow-blue-500/15 flex flex-col justify-between min-h-[148px]">
          {/* Decorative glowing wavy line overlay in background */}
          <svg
            className="absolute right-0 bottom-0 w-44 h-24 opacity-40 pointer-events-none"
            viewBox="0 0 176 96"
            fill="none"
          >
            <path
              d="M0 80 Q 40 40, 80 65 T 160 20"
              stroke="#93c5fd"
              strokeWidth="2.5"
              fill="none"
            />
            <circle cx="160" cy="20" r="3.5" fill="#ffffff" />
            <path
              d="M0 96 L 0 80 Q 40 40, 80 65 T 160 20 L 160 96 Z"
              fill="url(#blueHeroGrad)"
              opacity="0.25"
            />
            <defs>
              <linearGradient id="blueHeroGrad" x1="80" y1="20" x2="80" y2="96" gradientUnits="userSpaceOnUse">
                <stop stopColor="#93c5fd" stopOpacity="0.8" />
                <stop offset="1" stopColor="#0256cc" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          <div className="relative z-10 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#93c5fd]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-xs font-semibold text-white/90 tracking-wide">
              Financial Snapshot ({currentPeriodConfig.label})
            </h3>
          </div>

          <div className="relative z-10 my-1">
            <p className="text-3xl lg:text-[34px] font-black text-white tracking-tight leading-none">
              ₹{currentPeriodConfig.revenue.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-[#86efac] backdrop-blur-xs">
              <svg className="w-3 h-3 text-[#86efac]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              {currentPeriodConfig.growth}
            </span>
          </div>
        </div>

        {/* Card 2: Net Profit */}
        <div className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow min-h-[148px]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center text-[#0260de]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <ellipse cx="12" cy="7" rx="7" ry="2.5" />
                <path d="M5 7v4.5C5 12.88 8.13 14 12 14s7-1.12 7-2.5V7" />
                <path d="M5 11.5V16c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5v-4.5" />
              </svg>
            </div>
            <h3 className="text-xs font-bold text-[#64748b]">Net Profit</h3>
          </div>

          <div className="my-1">
            <p className="text-2xl lg:text-3xl font-extrabold text-[#0f172a] tracking-tight">
              ₹{currentPeriodConfig.profit.toLocaleString("en-IN")}
            </p>
          </div>

          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#eaf8ea] text-[#1e822d]">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              +8% surplus
            </span>
          </div>
        </div>

        {/* Card 3: Pending Bills */}
        <div className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow min-h-[148px]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#fff2e8] flex items-center justify-center text-[#d96527]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xs font-bold text-[#64748b]">Pending Bills</h3>
          </div>

          <div className="my-1">
            <p className="text-2xl lg:text-3xl font-extrabold text-[#0f172a] tracking-tight">
              {currentPeriodConfig.pending}
            </p>
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fff2e8] text-[#d96527]">
              <span>⚠️</span> Requires attention
            </span>
          </div>
        </div>

        {/* Card 4: Total Products */}
        <div className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow min-h-[148px]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#eef2ff] flex items-center justify-center text-[#0260de]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-xs font-bold text-[#64748b]">Total Products</h3>
          </div>

          <div className="my-1">
            <p className="text-2xl lg:text-3xl font-extrabold text-[#0f172a] tracking-tight">
              {data.kpis.totalProducts}
            </p>
          </div>

          <div>
            <p className="text-xs text-[#64748b] font-medium">In inventory catalog</p>
          </div>
        </div>
      </div>

      {/* 3. MIDDLE ROW: CHARTS SECTION WITH DYNAMIC PERIOD DROPDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Financial Overview (Monthly) - 8 cols */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <svg className="w-5 h-5 text-[#0260de]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h2 className="text-base font-bold text-[#0f172a]">Financial Overview (Monthly)</h2>
            </div>

            {/* Interactive Chart Date Filter Dropdown */}
            <div className="relative" ref={chartDropdownRef}>
              <button
                type="button"
                onClick={() => setIsChartDropdownOpen(prev => !prev)}
                className="flex items-center gap-1.5 bg-blue-50/70 border border-[#e2e8f0] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#0260de] cursor-pointer hover:bg-blue-100 transition-colors active:scale-95"
              >
                <span>
                  {chartRange === "3m" ? "Last 3 Months" : chartRange === "6m" ? "Last 6 Months" : "This Year (2026)"}
                </span>
                <svg className={`w-3.5 h-3.5 text-[#0260de] transition-transform duration-200 ${isChartDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isChartDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-[#e2e8f0] p-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                  {[
                    { key: "3m" as ChartRangeKey, label: "Last 3 Months" },
                    { key: "6m" as ChartRangeKey, label: "Last 6 Months" },
                    { key: "year" as ChartRangeKey, label: "This Year (2026)" }
                  ].map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setChartRange(opt.key);
                        setIsChartDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                        chartRange === opt.key
                          ? "bg-blue-50 text-[#0260de] font-bold"
                          : "text-[#0f172a] hover:bg-slate-50 font-medium"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {chartRange === opt.key && (
                        <span className="text-[#0260de] font-bold">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={displayChartData} margin={{ top: 15, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: "#f1f5f9" }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val.toLocaleString()}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white px-3.5 py-2.5 rounded-2xl shadow-xl border border-[#e2e8f0] text-xs">
                          <p className="font-bold text-[#0f172a] mb-1">{label} 2026</p>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#0260de]" />
                            <span className="text-[#64748b]">Revenue:</span>
                            <span className="font-bold text-[#0f172a]">₹{payload[0]?.value?.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-[#c2dafe]" />
                            <span className="text-[#64748b]">Expenses:</span>
                            <span className="font-bold text-[#0f172a]">₹{payload[1]?.value?.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="Revenue" fill="#0260de" radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Expenses" fill="#c2dafe" radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Line
                  type="monotone"
                  dataKey="Revenue"
                  stroke="#0260de"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: "#ffffff", stroke: "#0260de", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "#0260de", stroke: "#ffffff", strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom Chart Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 pt-2 border-t border-[#f1f5f9] text-xs font-semibold text-[#475569]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#0260de]" />
              <span>Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#c2dafe]" />
              <span>Expenses</span>
            </div>
          </div>
        </div>

        {/* Right: Expense Distribution Donut - 4 cols */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-2">
            <svg className="w-5 h-5 text-[#0260de]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            <h2 className="text-base font-bold text-[#0f172a]">Expense Distribution</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 my-auto py-2">
            {/* Donut Chart with Centered Total */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseSlices}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={76}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expenseSlices.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Inner Donut Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-black text-[#0f172a] tracking-tight">
                  ₹{totalExpenseVal.toLocaleString("en-IN")}
                </span>
                <span className="text-[11px] font-medium text-[#64748b]">Total Expenses</span>
              </div>
            </div>

            {/* Segment Labels List */}
            <div className="flex flex-col gap-2.5 min-w-[120px]">
              {expenseSlices.map((slice) => (
                <div key={slice.name} className="flex items-center justify-between text-xs font-semibold text-[#334155] gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: slice.color }} />
                    <span className="text-[#0f172a]">{slice.name}</span>
                  </div>
                  <span className="text-[#64748b] font-bold">{slice.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM ROW: RECENT INVOICES & ACTION CENTER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Recent Invoices (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center text-[#0260de]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-[#0f172a]">Recent Invoices</h2>
            </div>

            <Link
              href="/bill-invoice"
              className="text-xs font-bold text-[#0260de] hover:underline flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <span>→</span>
            </Link>
          </div>

          {/* Invoices Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#f1f5f9] text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
                  <th className="py-2.5 px-3">INVOICE</th>
                  <th className="py-2.5 px-3">CLIENT</th>
                  <th className="py-2.5 px-3">AMOUNT</th>
                  <th className="py-2.5 px-3 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9] text-xs">
                {data.recentInvoices.map((inv) => {
                  const statusNormalized = (inv.status || "Pending").toLowerCase();
                  return (
                    <tr key={inv.id} className="hover:bg-[#f8fafc] transition-colors">
                      {/* Invoice ID / Number */}
                      <td className="py-3 px-3 font-mono font-medium text-[#64748b] truncate max-w-[130px]" title={inv.id}>
                        {inv.invoice_number || inv.id}
                      </td>

                      {/* Client Name */}
                      <td className="py-3 px-3 font-semibold text-[#0f172a] truncate max-w-[180px]">
                        {inv.client}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 font-bold text-[#0f172a] whitespace-nowrap">
                        ₹{inv.amount.toLocaleString("en-IN")}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {statusNormalized === "paid" && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#eaf8ea] text-[#1e822d] border border-[#d2f0d2]">
                            <span>✓</span> Paid
                          </span>
                        )}
                        {statusNormalized === "overdue" && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#fef1f0] text-[#cf382b] border border-[#fbd6d3]">
                            Overdue <span>ⓘ</span>
                          </span>
                        )}
                        {statusNormalized === "pending" && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#fff7ed] text-[#c2641e] border border-[#fedec2]">
                            Pending <span>ⓘ</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Action Center (5 cols) WITH INTERACTIVE CATEGORY FILTER PILLS */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#0260de]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h2 className="text-base font-bold text-[#0f172a]">Action Center</h2>
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#0260de] text-white text-[11px] font-bold flex items-center justify-center">
                  {alertCounts.all}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAlertCategory(actionCenterFilter);
                  setIsAlertModalOpen(true);
                }}
                className="text-xs font-bold text-[#0260de] hover:underline flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View All</span>
                <span>→</span>
              </button>
            </div>

            {/* Notification Filter Pills in Action Center Card */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
              {[
                { key: "all" as AlertFilterKey, label: `All (${alertCounts.all})` },
                { key: "stock" as AlertFilterKey, label: `Stock (${alertCounts.stock})` },
                { key: "overdue" as AlertFilterKey, label: `Overdue (${alertCounts.overdue})` },
                { key: "salary" as AlertFilterKey, label: `Salary (${alertCounts.salary})` }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActionCenterFilter(tab.key)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                    actionCenterFilter === tab.key
                      ? "bg-[#0260de] text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Center Items (Filtered list) */}
          <div className="space-y-2.5 my-auto">
            {actionCenterAlerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                No active {actionCenterFilter !== "all" ? actionCenterFilter : ""} alerts at this moment!
              </div>
            ) : (
              actionCenterAlerts.map((alert) => {
                const isStock = alert.type === "stock";
                const isOverdue = alert.type === "overdue";
                const isSalary = alert.type === "salary";

                return (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#f8fafc] border border-[#f1f5f9] hover:bg-blue-50/40 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Icon container */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isStock
                            ? "bg-amber-50 text-amber-600"
                            : isOverdue
                            ? "bg-rose-50 text-rose-600"
                            : "bg-blue-50 text-[#0260de]"
                        }`}
                      >
                        {isStock && (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        )}
                        {isOverdue && (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        )}
                        {isSalary && (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                      </div>

                      {/* Titles */}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0f172a] truncate">{alert.title}</p>
                        <p
                          className={`text-[11px] font-semibold truncate ${
                            isStock ? "text-amber-600" : isOverdue ? "text-rose-600" : "text-[#0260de]"
                          }`}
                        >
                          {alert.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Action & Dismiss Buttons */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Link
                        href={isStock ? "/products" : isOverdue ? "/bill-invoice" : "/labour"}
                        className="px-3 py-1.5 rounded-xl border border-[#e2e8f0] bg-white text-xs font-bold text-[#0260de] hover:bg-blue-50 shadow-2xs transition-all active:scale-95"
                      >
                        {alert.actionText}
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => handleDismissAlert(alert.id, e)}
                        title="Dismiss notification"
                        className="p-1 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 5. INTERACTIVE POPUP MODAL: ALL NOTIFICATIONS & ADVANCED FILTERING */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsAlertModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-[#e2e8f0] max-w-xl w-full p-5 sm:p-6 z-10 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#f1f5f9] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0260de] flex items-center justify-center font-bold">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#0f172a]">System Notifications</h3>
                  <p className="text-xs text-slate-400">Manage real-time alerts across your ERP</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAlertModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Notification Filter Tabs */}
            <div className="flex items-center gap-1.5 pt-4 pb-3 overflow-x-auto scrollbar-none flex-shrink-0">
              {[
                { key: "all" as AlertFilterKey, label: "All Alerts", count: alertCounts.all },
                { key: "stock" as AlertFilterKey, label: "Low Stock", count: alertCounts.stock },
                { key: "overdue" as AlertFilterKey, label: "Overdue Invoices", count: alertCounts.overdue },
                { key: "salary" as AlertFilterKey, label: "Labour Payroll", count: alertCounts.salary }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setAlertCategory(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    alertCategory === tab.key
                      ? "bg-[#0260de] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    alertCategory === tab.key ? "bg-white/25 text-white" : "bg-slate-200 text-slate-700"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Quick Search inside notifications */}
            <div className="relative mb-3 flex-shrink-0">
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search alerts by title or description..."
                value={alertSearchQuery}
                onChange={(e) => setAlertSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-[#e2e8f0] rounded-xl text-xs text-[#0f172a] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0260de]"
              />
            </div>

            {/* Notification List Scrollable Area */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1">
              {modalAlerts.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0260de] flex items-center justify-center mx-auto mb-2">
                    ✓
                  </div>
                  <p className="text-sm font-bold text-[#0f172a]">No notifications found</p>
                  <p className="text-xs text-slate-400 mt-0.5">Everything is up-to-date in this category.</p>
                </div>
              ) : (
                modalAlerts.map((alert) => {
                  const isStock = alert.type === "stock";
                  const isOverdue = alert.type === "overdue";
                  const isSalary = alert.type === "salary";

                  return (
                    <div
                      key={alert.id}
                      className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#f1f5f9] flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isStock
                              ? "bg-amber-50 text-amber-600"
                              : isOverdue
                              ? "bg-rose-50 text-rose-600"
                              : "bg-blue-50 text-[#0260de]"
                          }`}
                        >
                          {isStock && (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          )}
                          {isOverdue && (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          )}
                          {isSalary && (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#0f172a] truncate">{alert.title}</p>
                          <p className={`text-[11px] font-semibold truncate ${
                            isStock ? "text-amber-600" : isOverdue ? "text-rose-600" : "text-[#0260de]"
                          }`}>
                            {alert.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link
                          href={isStock ? "/products" : isOverdue ? "/bill-invoice" : "/labour"}
                          onClick={() => setIsAlertModalOpen(false)}
                          className="px-3 py-1.5 rounded-xl border border-[#e2e8f0] bg-white text-xs font-bold text-[#0260de] hover:bg-blue-50 shadow-2xs transition-all active:scale-95"
                        >
                          {alert.actionText}
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => handleDismissAlert(alert.id, e)}
                          title="Dismiss"
                          className="p-1 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer with Clear All */}
            {modalAlerts.length > 0 && (
              <div className="pt-3 border-t border-[#f1f5f9] flex justify-between items-center text-xs flex-shrink-0">
                <span className="text-slate-400 font-medium">
                  Showing {modalAlerts.length} notification{modalAlerts.length > 1 ? "s" : ""}
                </span>
                <button
                  type="button"
                  onClick={handleClearCategoryAlerts}
                  className="font-bold text-[#0260de] hover:underline cursor-pointer"
                >
                  Dismiss all in view
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
