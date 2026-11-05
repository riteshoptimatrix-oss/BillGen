"use client";

import { useState, useEffect } from "react";
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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

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

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-[#5c341f]"></div>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-[#5c341f]">Failed to load dashboard</div>;

  const expenseSlices: ExpenseSlice[] = data.expenseDistribution || [
    { name: "Material", value: 45, color: "#5c341f" },
    { name: "Labour", value: 25, color: "#c4733d" },
    { name: "Operations", value: 15, color: "#f3ceb2" },
    { name: "Others", value: 15, color: "#e8be9d" }
  ];

  const totalExpenseVal = data.kpis.totalExpensesMonth || 26500;

  // Realistic monthly trendline matching mockup
  const displayChartData = [
    { name: "Jan", Revenue: 10000, Expenses: 5000 },
    { name: "Feb", Revenue: 13000, Expenses: 7000 },
    { name: "Mar", Revenue: 17000, Expenses: 11000 },
    { name: "Apr", Revenue: 22000, Expenses: 13000 },
    { name: "May", Revenue: 38000, Expenses: 17000 },
    { name: "Jun", Revenue: 58000, Expenses: 26500 },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans text-[#23160e]">
      {/* 1. TOP HEADER & PROFILE BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#23160e] tracking-tight flex items-center gap-2">
            Good Morning! <span>👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#7a6557] font-medium mt-0.5">
            Here&apos;s your business performance at a glance.
          </p>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-3">
          {/* Date Selector Pill */}
          <div className="flex items-center gap-2 bg-white border border-[#e8dfd8] rounded-2xl px-4 py-2 shadow-xs text-xs sm:text-sm font-semibold text-[#3b2416] hover:bg-stone-50 cursor-pointer transition-colors">
            <svg className="w-4 h-4 text-[#8c6b57]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Jun 2026</span>
            <svg className="w-3.5 h-3.5 text-[#8c6b57] ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Notification Bell */}
          <button
            type="button"
            onClick={() => setIsAlertModalOpen(true)}
            title="Notifications"
            className="relative p-2.5 bg-white border border-[#e8dfd8] rounded-2xl text-[#3b2416] hover:bg-stone-50 shadow-xs transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ef4444]" />
          </button>

          {/* User Profile Avatar */}
          <div className="w-10 h-10 rounded-full bg-[#5c341f] text-white font-extrabold text-sm flex items-center justify-center shadow-xs select-none">
            SV
          </div>
        </div>
      </div>

      {/* 2. TOP ROW: 4 METRIC CARDS (HERO ACCENT + 3 WHITE CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Financial Snapshot (Hero Bronze Accent Card) */}
        <div className="bg-gradient-to-br from-[#5a341e] via-[#4d2917] to-[#361a0d] rounded-3xl p-6 text-white relative overflow-hidden shadow-md flex flex-col justify-between min-h-[148px]">
          {/* Decorative glowing wavy line overlay in background */}
          <svg
            className="absolute right-0 bottom-0 w-44 h-24 opacity-35 pointer-events-none"
            viewBox="0 0 176 96"
            fill="none"
          >
            <path
              d="M0 80 Q 40 40, 80 65 T 160 20"
              stroke="#f5d0b0"
              strokeWidth="2.5"
              fill="none"
            />
            <circle cx="160" cy="20" r="3.5" fill="#f5d0b0" />
            <path
              d="M0 96 L 0 80 Q 40 40, 80 65 T 160 20 L 160 96 Z"
              fill="url(#goldGradient)"
              opacity="0.3"
            />
            <defs>
              <linearGradient id="goldGradient" x1="80" y1="20" x2="80" y2="96" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f5d0b0" stopOpacity="0.8" />
                <stop offset="1" stopColor="#5a341e" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          <div className="relative z-10 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#f5d0b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-xs font-semibold text-white/90 tracking-wide">Financial Snapshot</h3>
          </div>

          <div className="relative z-10 my-1">
            <p className="text-3xl lg:text-[34px] font-black text-white tracking-tight leading-none">
              ₹{data.kpis.totalRevenue.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-[#86efac] backdrop-blur-xs">
              <svg className="w-3 h-3 text-[#86efac]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              +14% from last month
            </span>
          </div>
        </div>

        {/* Card 2: Net Profit */}
        <div className="bg-white rounded-3xl p-6 border border-[#ede5dd] shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow min-h-[148px]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#faf3ed] flex items-center justify-center text-[#5c341f]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <ellipse cx="12" cy="7" rx="7" ry="2.5" />
                <path d="M5 7v4.5C5 12.88 8.13 14 12 14s7-1.12 7-2.5V7" />
                <path d="M5 11.5V16c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5v-4.5" />
              </svg>
            </div>
            <h3 className="text-xs font-bold text-[#7a6557]">Net Profit</h3>
          </div>

          <div className="my-1">
            <p className="text-2xl lg:text-3xl font-extrabold text-[#1f140e] tracking-tight">
              ₹{data.kpis.netProfit.toLocaleString("en-IN")}
            </p>
          </div>

          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#eaf8ea] text-[#1e822d]">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              +8%
            </span>
          </div>
        </div>

        {/* Card 3: Pending Bills */}
        <div className="bg-white rounded-3xl p-6 border border-[#ede5dd] shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow min-h-[148px]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#fff2e8] flex items-center justify-center text-[#d96527]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xs font-bold text-[#7a6557]">Pending Bills</h3>
          </div>

          <div className="my-1">
            <p className="text-2xl lg:text-3xl font-extrabold text-[#1f140e] tracking-tight">
              {data.kpis.pendingBills}
            </p>
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fff2e8] text-[#d96527]">
              <span>⚠️</span> Requires attention
            </span>
          </div>
        </div>

        {/* Card 4: Total Products */}
        <div className="bg-white rounded-3xl p-6 border border-[#ede5dd] shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow min-h-[148px]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#eef2ff] flex items-center justify-center text-[#4338ca]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-xs font-bold text-[#7a6557]">Total Products</h3>
          </div>

          <div className="my-1">
            <p className="text-2xl lg:text-3xl font-extrabold text-[#1f140e] tracking-tight">
              {data.kpis.totalProducts}
            </p>
          </div>

          <div>
            <p className="text-xs text-[#8a7566] font-medium">In inventory catalog</p>
          </div>
        </div>
      </div>

      {/* 3. MIDDLE ROW: CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Financial Overview (Monthly) - 7 cols */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-[#ede5dd] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <svg className="w-5 h-5 text-[#5c341f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h2 className="text-base font-bold text-[#23160e]">Financial Overview (Monthly)</h2>
            </div>

            <div className="flex items-center gap-1.5 bg-[#f7f2ed] border border-[#e8dfd8] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#5a4233] cursor-pointer hover:bg-[#ede5dd] transition-colors">
              <span>Last 6 Months</span>
              <svg className="w-3 h-3 text-[#5a4233]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={displayChartData} margin={{ top: 15, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0ebe6" />
                <XAxis
                  dataKey="name"
                  stroke="#9a8577"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: "#f0ebe6" }}
                />
                <YAxis
                  stroke="#9a8577"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val.toLocaleString()}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white px-3.5 py-2.5 rounded-2xl shadow-xl border border-[#ede5dd] text-xs">
                          <p className="font-bold text-[#23160e] mb-1">{label} 2026</p>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#5c341f]" />
                            <span className="text-[#8a7566]">Revenue:</span>
                            <span className="font-bold text-[#23160e]">₹{payload[0]?.value?.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-[#f3ceb2]" />
                            <span className="text-[#8a7566]">Expenses:</span>
                            <span className="font-bold text-[#23160e]">₹{payload[1]?.value?.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="Revenue" fill="#5c341f" radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Expenses" fill="#f3ceb2" radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Line
                  type="monotone"
                  dataKey="Revenue"
                  stroke="#d98236"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: "#5c341f", stroke: "#d98236", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "#5c341f", stroke: "#ffffff", strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom Chart Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 pt-2 border-t border-[#f7f2ed] text-xs font-semibold text-[#665042]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#5c341f]" />
              <span>Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#f3ceb2]" />
              <span>Expenses</span>
            </div>
          </div>
        </div>

        {/* Right: Expense Distribution Donut - 4 cols */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-[#ede5dd] shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-2">
            <svg className="w-5 h-5 text-[#5c341f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            <h2 className="text-base font-bold text-[#23160e]">Expense Distribution</h2>
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
                <span className="text-lg font-black text-[#23160e] tracking-tight">
                  ₹{totalExpenseVal.toLocaleString("en-IN")}
                </span>
                <span className="text-[11px] font-medium text-[#8a7566]">Total Expenses</span>
              </div>
            </div>

            {/* Segment Labels List */}
            <div className="flex flex-col gap-2.5 min-w-[120px]">
              {expenseSlices.map((slice) => (
                <div key={slice.name} className="flex items-center justify-between text-xs font-semibold text-[#4f382a] gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: slice.color }} />
                    <span className="text-[#3b2518]">{slice.name}</span>
                  </div>
                  <span className="text-[#8a7566] font-bold">{slice.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM ROW: RECENT INVOICES & ACTION CENTER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Recent Invoices (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#ede5dd] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-[#faf3ed] flex items-center justify-center text-[#5c341f]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-[#23160e]">Recent Invoices</h2>
            </div>

            <Link
              href="/bill-invoice"
              className="text-xs font-bold text-[#8c6b57] hover:text-[#5c341f] flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <span>→</span>
            </Link>
          </div>

          {/* Invoices Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#f3eee9] text-[10px] font-bold text-[#8a7566] uppercase tracking-wider">
                  <th className="py-2.5 px-3">INVOICE</th>
                  <th className="py-2.5 px-3">CLIENT</th>
                  <th className="py-2.5 px-3">AMOUNT</th>
                  <th className="py-2.5 px-3 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f7f3ef] text-xs">
                {data.recentInvoices.map((inv) => {
                  const statusNormalized = (inv.status || "Pending").toLowerCase();
                  return (
                    <tr key={inv.id} className="hover:bg-[#faf7f4] transition-colors">
                      {/* Invoice ID / Number */}
                      <td className="py-3 px-3 font-mono font-medium text-[#7a6557] truncate max-w-[130px]" title={inv.id}>
                        {inv.id}
                      </td>

                      {/* Client Name */}
                      <td className="py-3 px-3 font-semibold text-[#2c1a11] truncate max-w-[180px]">
                        {inv.client}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 font-bold text-[#1f140e] whitespace-nowrap">
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

        {/* Right: Action Center (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#ede5dd] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#d96527]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h2 className="text-base font-bold text-[#23160e]">Action Center</h2>
              <span className="w-5 h-5 rounded-full bg-[#ef4444] text-white text-[11px] font-black flex items-center justify-center">
                {data.systemAlerts.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsAlertModalOpen(true)}
              className="text-xs font-bold text-[#8c6b57] hover:text-[#5c341f] flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <span>→</span>
            </button>
          </div>

          {/* Action Center Items (First 4 items) */}
          <div className="space-y-3 my-auto">
            {data.systemAlerts.slice(0, 4).map((alert) => {
              const isStock = alert.type === "stock";
              const isOverdue = alert.type === "overdue";
              const isSalary = alert.type === "salary";

              return (
                <div
                  key={alert.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#fbf9f6] border border-[#f0ebe5] hover:bg-[#f6f0ea] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Icon container */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isStock
                          ? "bg-[#fff2e8] text-[#d96527]"
                          : isOverdue
                          ? "bg-[#fef1f0] text-[#cf382b]"
                          : "bg-[#eef2ff] text-[#4338ca]"
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
                      <p className="text-xs font-bold text-[#23160e] truncate">{alert.title}</p>
                      <p
                        className={`text-[11px] font-semibold truncate ${
                          isStock ? "text-[#d96527]" : isOverdue ? "text-[#cf382b]" : "text-[#4338ca]"
                        }`}
                      >
                        {alert.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link
                    href={isStock ? "/products" : isOverdue ? "/bill-invoice" : "/labour"}
                    className="flex-shrink-0 px-3 py-1.5 rounded-xl border border-[#e8dfd8] bg-white text-xs font-bold text-[#3d2417] hover:bg-stone-50 shadow-2xs transition-all active:scale-95"
                  >
                    {alert.actionText}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* POPUP MODAL: ALL ALERTS */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsAlertModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-[#ede5dd] max-w-lg w-full p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#f3eee9]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                <h3 className="font-bold text-base text-[#23160e]">All System Alerts ({data.systemAlerts.length})</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAlertModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-xl"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto py-3 space-y-2.5">
              {data.systemAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-2xl bg-[#faf7f4] border border-[#f0ebe5] flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-xs font-bold text-[#23160e]">{alert.title}</p>
                    <p className="text-[11px] font-semibold text-[#8c6b57]">{alert.subtitle}</p>
                  </div>
                  <Link
                    href={alert.type === "stock" ? "/products" : alert.type === "overdue" ? "/bill-invoice" : "/labour"}
                    onClick={() => setIsAlertModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl border border-[#e8dfd8] bg-white text-xs font-bold text-[#3d2417] hover:bg-stone-50"
                  >
                    {alert.actionText}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
