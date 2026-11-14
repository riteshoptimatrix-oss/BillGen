"use client";

import React, { useState, useMemo } from "react";

export type ReportTab =
  | "sales-register"
  | "purchase-register"
  | "gst-summary"
  | "stock-statement"
  | "profit-loss"
  | "labour-payroll";

export interface ReportItemMeta {
  id: ReportTab;
  index: string;
  label: string;
  category: string;
  categoryColor: string;
  description: string;
  tags: string[];
  iconBg: string;
  iconColor: string;
  iconPath: string;
  updateFrequency: string;
}

export const REPORT_DEFINITIONS: ReportItemMeta[] = [
  {
    id: "sales-register",
    index: "01",
    label: "1. Sales Register",
    category: "Revenue & Billing",
    categoryColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description:
      "Comprehensive chronological ledger of customer invoices, base taxable turnover, CGST, SGST, IGST tax collection, and real-time paid vs pending status.",
    tags: ["Invoices", "Taxable Turnover", "Output GST", "Paid vs Pending", "B2B / B2C"],
    iconBg: "bg-emerald-100/80 text-emerald-700 border-emerald-200",
    iconColor: "text-emerald-600",
    iconPath:
      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    updateFrequency: "Real-time"
  },
  {
    id: "purchase-register",
    index: "02",
    label: "2. Purchase Register",
    category: "Procurement & Inward",
    categoryColor: "bg-blue-50 text-blue-700 border-blue-200",
    description:
      "Itemized inward ledger of raw materials procurement, chassis assemblies, supplier bills, and eligible Input Tax Credit (ITC) for GST reconciliation.",
    tags: ["Vendor Invoices", "Material Costs", "Input GST (ITC)", "Supplier Balances"],
    iconBg: "bg-blue-100/80 text-blue-700 border-blue-200",
    iconColor: "text-blue-600",
    iconPath: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
    updateFrequency: "Real-time"
  },
  {
    id: "gst-summary",
    index: "03",
    label: "3. GST Summary",
    category: "Taxation & Compliance",
    categoryColor: "bg-purple-50 text-purple-700 border-purple-200",
    description:
      "Automated GST computation displaying Output GST on sales minus Input Tax Credit (ITC) on inward purchases, with net payable tax and slab-wise rate distribution.",
    tags: ["Output GST", "Input Tax Credit (ITC)", "Net Tax Payable", "Tax Slabs (5%/12%/18%/28%)"],
    iconBg: "bg-purple-100/80 text-purple-700 border-purple-200",
    iconColor: "text-purple-600",
    iconPath:
      "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
    updateFrequency: "Date-Filtered"
  },
  {
    id: "stock-statement",
    index: "04",
    label: "4. Stock Statement",
    category: "Inventory & Plant",
    categoryColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
    description:
      "Real-time physical stock position, inventory valuations at current rates, opening units, purchases, units dispatched, and automated critical low-stock deficit alerts.",
    tags: ["Physical Units", "Inventory Valuation", "Low Stock Deficit", "Reorder Thresholds"],
    iconBg: "bg-cyan-100/80 text-cyan-700 border-cyan-200",
    iconColor: "text-cyan-600",
    iconPath:
      "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    updateFrequency: "Live Warehouse"
  },
  {
    id: "profit-loss",
    index: "05",
    label: "5. Profit & Loss",
    category: "Financial Performance",
    categoryColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    description:
      "Enterprise Profit & Loss statement calculating Gross Margins, Net Profit/Loss surplus or deficit after deducting materials COGS, workforce wages, and workshop overheads.",
    tags: ["Gross Profit", "Net Profit / Loss", "Margin %", "Operating Surplus", "Balance Ledger"],
    iconBg: "bg-indigo-100/80 text-indigo-700 border-indigo-200",
    iconColor: "text-indigo-600",
    iconPath:
      "M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z",
    updateFrequency: "Dynamic Range"
  },
  {
    id: "labour-payroll",
    index: "06",
    label: "6. Labour Payroll",
    category: "Human Resources",
    categoryColor: "bg-rose-50 text-rose-700 border-rose-200",
    description:
      "Monthly workforce wage ledger recording factory labourers, active headcounts, disbursed salaries, pending wage settlements, and payout methods.",
    tags: ["Factory Labourers", "Disbursed Wages", "Pending Salaries", "Payment Mode Tracking"],
    iconBg: "bg-rose-100/80 text-rose-700 border-rose-200",
    iconColor: "text-rose-600",
    iconPath:
      "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    updateFrequency: "Monthly Period"
  }
];

interface ReportsListViewProps {
  onSelectReport: (tab: ReportTab) => void;
}

export default function ReportsListView({ onSelectReport }: ReportsListViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "All Statements (6)" },
    { id: "revenue", label: "Sales & Purchases" },
    { id: "tax", label: "Taxes & Financials" },
    { id: "operations", label: "Inventory & Labour" }
  ];

  const filteredReports = useMemo(() => {
    return REPORT_DEFINITIONS.filter((report) => {
      // Category filter
      if (selectedCategory === "revenue") {
        if (report.id !== "sales-register" && report.id !== "purchase-register") return false;
      } else if (selectedCategory === "tax") {
        if (report.id !== "gst-summary" && report.id !== "profit-loss")
          return false;
      } else if (selectedCategory === "operations") {
        if (report.id !== "stock-statement" && report.id !== "labour-payroll") return false;
      }

      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTitle = report.label.toLowerCase().includes(query);
        const matchCat = report.category.toLowerCase().includes(query);
        const matchDesc = report.description.toLowerCase().includes(query);
        const matchTags = report.tags.some((t) => t.toLowerCase().includes(query));
        return matchTitle || matchCat || matchDesc || matchTags;
      }

      return true;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Directory Hero Banner */}
      <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50/40 p-5 sm:p-7 rounded-3xl border border-[#e2e8f0] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider bg-blue-600 text-white px-3 py-1 rounded-full shadow-xs">
                Financial Reports Directory
              </span>
              <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                6 Statements Available
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
              Select a Financial Statement or Ledger
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Browse through your business reports in list view. Click on any report to open detailed records,
              date-range filters, and downloadable PDF/Excel statements.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-white/80 backdrop-blur-xs p-2 rounded-2xl border border-slate-200 shrink-0">
            <div className="text-center px-3 border-r border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Audit</p>
              <p className="text-sm font-black text-emerald-600">GST Ready</p>
            </div>
            <div className="text-center px-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Updates</p>
              <p className="text-sm font-black text-blue-600">Real-Time</p>
            </div>
          </div>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="mt-5 pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reports by title, category, or keyword..."
              className="w-full pl-10 pr-4 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de] transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  selectedCategory === cat.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reports Vertical List View */}
      <div className="space-y-3.5">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-sm font-bold text-slate-800">No reports matched your search</h4>
            <p className="text-xs text-slate-400 mt-1">Try clearing your search query or choosing another category.</p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
              className="mt-3 px-3.5 py-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              onClick={() => onSelectReport(report.id)}
              className="group bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-5 hover:border-[#0260de] hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              {/* Left Column: Number, Icon, Title, Description, Tags */}
              <div className="flex items-start gap-3.5 sm:gap-4 flex-1 min-w-0">
                {/* Index Pill */}
                <div className="shrink-0 mt-0.5">
                  <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg block text-center">
                    {report.index}
                  </span>
                </div>

                {/* Color-Coded Icon Box */}
                <div
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-200 ${report.iconBg}`}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={report.iconPath} />
                  </svg>
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-[#0260de] transition-colors">
                      {report.label}
                    </h3>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${report.categoryColor}`}>
                      {report.category}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 hidden sm:inline-block">
                      • {report.updateFrequency}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {report.description}
                  </p>

                  {/* Highlights Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    {report.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-medium text-slate-600 bg-slate-100/90 border border-slate-200/60 px-2 py-0.5 rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: View Report Action Button */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectReport(report.id);
                  }}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#0260de] hover:bg-[#024ebd] active:scale-95 rounded-xl shadow-xs transition-all whitespace-nowrap group-hover:shadow-md"
                >
                  <span>View Report</span>
                  <svg
                    className="w-4 h-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

