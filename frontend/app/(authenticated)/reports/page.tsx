"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getApiUrl, getAuthToken } from "@/lib/api";
import ReportsListView, { ReportTab, REPORT_DEFINITIONS } from "@/components/reports/ReportsListView";

type DateFilterType = "today" | "week" | "month" | "custom" | "all";

function ReportsContent() {
  const searchParams = useSearchParams();

  // Initialize activeTab from query param if available, otherwise null (show List View)
  const [activeTab, setActiveTab] = useState<ReportTab | null>(() => {
    const tabParam = searchParams.get("tab") as ReportTab;
    if (tabParam && REPORT_DEFINITIONS.some((r) => r.id === tabParam)) {
      return tabParam;
    }
    return null;
  });

  // Date Filter State
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // 1st of current month
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Payroll Filter State (Month / Year)
  const [payrollMonth, setPayrollMonth] = useState<number>(new Date().getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState<number>(new Date().getFullYear());

  // Data States
  const [salesData, setSalesData] = useState<any>(null);
  const [purchaseData, setPurchaseData] = useState<any>(null);
  const [expensesData, setExpensesData] = useState<any>(null);
  const [gstData, setGstData] = useState<any>(null);
  const [stockData, setStockData] = useState<any>(null);
  const [plData, setPlData] = useState<any>(null);
  const [payrollData, setPayrollData] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(false);

  const apiUrl = getApiUrl();

  // Current active report metadata
  const currentReportMeta = useMemo(() => {
    if (!activeTab) return null;
    return REPORT_DEFINITIONS.find((r) => r.id === activeTab) || null;
  }, [activeTab]);

  // Handle opening a report from list view
  const handleOpenReport = (tab: ReportTab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `?tab=${tab}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Handle going back to list view
  const handleBackToList = () => {
    setActiveTab(null);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", window.location.pathname);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Synchronize browser native back/forward buttons
  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab") as ReportTab | null;
      if (tab && REPORT_DEFINITIONS.some((r) => r.id === tab)) {
        setActiveTab(tab);
      } else {
        setActiveTab(null);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Fetch report data based on active tab
  useEffect(() => {
    if (!activeTab) return;
    let ignore = false;

    const getDateQuery = () => {
      let q = `filter=${dateFilter}`;
      if (dateFilter === "custom" && startDate && endDate) {
        q += `&start_date=${startDate}&end_date=${endDate}`;
      }
      return q;
    };

    const loadData = async () => {
      setIsLoading(true);
      try {
        const token = getAuthToken();
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const fetchOpts: RequestInit = { headers, credentials: "include" };

        if (activeTab === "sales-register") {
          const res = await fetch(`${apiUrl}/reports/sales-register?${getDateQuery()}`, fetchOpts);
          if (res.ok && !ignore) setSalesData(await res.json());
        } else if (activeTab === "purchase-register") {
          const res = await fetch(`${apiUrl}/reports/purchase-register?${getDateQuery()}`, fetchOpts);
          if (res.ok && !ignore) setPurchaseData(await res.json());
        } else if (activeTab === "expenses-statement") {
          const res = await fetch(`${apiUrl}/reports/expenses-statement?${getDateQuery()}`, fetchOpts);
          if (res.ok && !ignore) setExpensesData(await res.json());
        } else if (activeTab === "gst-summary") {
          const res = await fetch(`${apiUrl}/reports/gst-summary?${getDateQuery()}`, fetchOpts);
          if (res.ok && !ignore) setGstData(await res.json());
        } else if (activeTab === "stock-statement") {
          const res = await fetch(`${apiUrl}/reports/stock-statement`, fetchOpts);
          if (res.ok && !ignore) setStockData(await res.json());
        } else if (activeTab === "profit-loss") {
          const res = await fetch(`${apiUrl}/reports/profit-loss?${getDateQuery()}`, fetchOpts);
          if (res.ok && !ignore) setPlData(await res.json());
        } else if (activeTab === "labour-payroll") {
          const res = await fetch(
            `${apiUrl}/reports/labour-payroll?month=${payrollMonth}&year=${payrollYear}`,
            fetchOpts
          );
          if (res.ok && !ignore) setPayrollData(await res.json());
        }
      } catch (err) {
        console.error(`Failed to load ${activeTab} report`, err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      ignore = true;
    };
  }, [activeTab, dateFilter, startDate, endDate, payrollMonth, payrollYear, apiUrl]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 border-b border-[#e2e8f0] pb-4 sm:pb-5">
        <div className="w-full sm:w-auto">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {activeTab && (
              <button
                type="button"
                onClick={handleBackToList}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all shadow-xs active:scale-95 mr-1"
                title="Return to Reports Directory"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to List</span>
              </button>
            )}

            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-snug">
              {activeTab ? currentReportMeta?.label : "Business & Financial Reports"}
            </h1>

            <span className="bg-stone-100 text-stone-700 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full border border-[#e2e8f0] flex items-center gap-1.5 flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View-Only Module
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
            {activeTab
              ? currentReportMeta?.description
              : "Centralized read-only reporting. Real-time data compiled automatically from Sales, Purchases, Expenses, Products, and Payroll."}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {activeTab && (
            <div className="flex items-center gap-2">
              <label htmlFor="quick-switch-header" className="sr-only">Switch Report</label>
              <select
                id="quick-switch-header"
                value={activeTab}
                onChange={(e) => handleOpenReport(e.target.value as ReportTab)}
                aria-label="Switch between reports"
                className="px-3 py-2 text-xs font-bold text-gray-700 bg-white border border-[#e2e8f0] rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#0260de] shadow-xs cursor-pointer"
              >
                {REPORT_DEFINITIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleBackToList}
                className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors shadow-xs active:scale-95"
              >
                <span>List View</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-[#e2e8f0] rounded-xl hover:bg-gray-50 transition-colors shadow-xs active:scale-95 w-full sm:w-auto"
          >
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / Export
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: REPORTS DIRECTORY LIST VIEW */}
      {!activeTab && (
        <ReportsListView onSelectReport={handleOpenReport} />
      )}

      {/* VIEW MODE 2: OPENED REPORT VIEW */}
      {activeTab && (
        <>
          {/* Date Filter Bar (Shown for tabs that support date ranges) */}
          {activeTab !== "stock-statement" && activeTab !== "labour-payroll" && (
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 w-full">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full md:w-auto">
                <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">
                  Date Period:
                </span>
                {(["today", "week", "month", "all", "custom"] as DateFilterType[]).map((df) => (
                  <button
                    key={df}
                    onClick={() => setDateFilter(df)}
                    className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                      dateFilter === df
                        ? "bg-gray-900 text-white shadow-xs"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {df === "today" ? "Today" : df === "week" ? "This Week" : df === "month" ? "This Month" : df === "all" ? "All Time" : "Custom Range"}
                  </button>
                ))}
              </div>

              {dateFilter === "custom" && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-[#e2e8f0]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500 font-medium">From:</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full sm:w-auto px-2.5 py-1.5 bg-gray-50 border border-[#e2e8f0] rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500 font-medium">To:</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full sm:w-auto px-2.5 py-1.5 bg-gray-50 border border-[#e2e8f0] rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Month & Year Filter for Labour Payroll */}
          {activeTab === "labour-payroll" && (
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 w-full">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Payroll Month:</span>
                <select
                  value={payrollMonth}
                  onChange={(e) => setPayrollMonth(Number(e.target.value))}
                  aria-label="Payroll Month"
                  className="px-3 py-1.5 bg-gray-50 border border-[#e2e8f0] rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  {months.map((m, idx) => (
                    <option key={m} value={idx + 1}>{m}</option>
                  ))}
                </select>

                <select
                  value={payrollYear}
                  onChange={(e) => setPayrollYear(Number(e.target.value))}
                  aria-label="Payroll Year"
                  className="px-3 py-1.5 bg-gray-50 border border-[#e2e8f0] rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  {[2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-gray-500 font-medium">
                Active Payroll Period: <strong className="text-gray-900">{months[payrollMonth - 1]} {payrollYear}</strong>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading ? (
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-10 sm:p-16 text-center shadow-xs w-full flex flex-col items-center justify-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0260de]"></div>
              <p className="text-xs text-gray-400 mt-2 font-medium">Compiling dynamic report data...</p>
            </div>
          ) : (
            <>
          {/* ========================================================= */}
          {/* 1. SALES REGISTER REPORT */}
          {/* ========================================================= */}
          {activeTab === "sales-register" && salesData && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Sales (Base)</p>
                  <h3 className="text-2xl font-black text-gray-900 mt-1">
                    ₹{(salesData.summary?.totalSalesAmount || 0).toLocaleString("en-IN")}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1">Taxable turnover</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total GST Collected</p>
                  <h3 className="text-2xl font-black text-emerald-600 mt-1">
                    ₹{(salesData.summary?.totalGstAmount || 0).toLocaleString("en-IN")}
                  </h3>
                  <p className="text-[11px] text-emerald-600/80 mt-1">Output GST (CGST + SGST)</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Invoiced Amount</p>
                  <h3 className="text-2xl font-black text-[#0260de] mt-1">
                    ₹{(salesData.summary?.totalInvoicedAmount || 0).toLocaleString("en-IN")}
                  </h3>
                  <p className="text-[11px] text-red-600/80 mt-1">Gross sales including GST</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Sales Invoices</p>
                  <h3 className="text-2xl font-black text-gray-900 mt-1">
                    {salesData.summary?.totalCount || 0}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {salesData.summary?.paidCount} Paid · {salesData.summary?.pendingCount} Pending
                  </p>
                </div>
              </div>

              {/* Sales Register Table */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs overflow-hidden">
                <div className="p-4 px-6 border-b border-[#e2e8f0] flex justify-between items-center bg-gray-50/50">
                  <h3 className="text-sm font-black text-gray-800">Sales Transactions Register</h3>
                  <span className="text-xs text-gray-500 font-medium">View-Only</span>
                </div>

                {salesData.records?.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 text-sm">
                    No sales transactions found for this date range.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-left text-xs">
                      <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-[#e2e8f0]">
                        <tr>
                          <th className="py-3 px-6">Invoice #</th>
                          <th className="py-3 px-6">Customer Name</th>
                          <th className="py-3 px-6">Invoice Date</th>
                          <th className="py-3 px-6 text-right">Sales Amount (₹)</th>
                          <th className="py-3 px-6 text-right">GST Amount (₹)</th>
                          <th className="py-3 px-6 text-right">Total Amount (₹)</th>
                          <th className="py-3 px-6 text-center">Payment Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {salesData.records.map((r: any) => (
                          <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="py-3.5 px-6 font-mono font-bold text-gray-900">{r.invoice_number}</td>
                            <td className="py-3.5 px-6 font-semibold text-gray-800">{r.customer_name}</td>
                            <td className="py-3.5 px-6 text-gray-500">{r.invoice_date}</td>
                            <td className="py-3.5 px-6 text-right text-gray-700">₹{r.sales_amount.toLocaleString("en-IN")}</td>
                            <td className="py-3.5 px-6 text-right text-emerald-600 font-semibold">₹{r.gst_amount.toLocaleString("en-IN")}</td>
                            <td className="py-3.5 px-6 text-right font-black text-gray-900">₹{r.total_amount.toLocaleString("en-IN")}</td>
                            <td className="py-3.5 px-6 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                r.payment_status === "Paid" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                r.payment_status === "Pending" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}>
                                {r.payment_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50/80 font-black text-xs text-gray-900 border-t border-[#e2e8f0]">
                        <tr>
                          <td className="py-3 px-6" colSpan={3}>Total for Selected Period:</td>
                          <td className="py-3 px-6 text-right">₹{salesData.summary?.totalSalesAmount?.toLocaleString("en-IN")}</td>
                          <td className="py-3 px-6 text-right text-emerald-600">₹{salesData.summary?.totalGstAmount?.toLocaleString("en-IN")}</td>
                          <td className="py-3 px-6 text-right text-[#0260de]">₹{salesData.summary?.totalInvoicedAmount?.toLocaleString("en-IN")}</td>
                          <td className="py-3 px-6"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. PURCHASE REGISTER REPORT */}
          {/* ========================================================= */}
          {activeTab === "purchase-register" && purchaseData && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Purchase (Base)</p>
                  <h3 className="text-2xl font-black text-gray-900 mt-1">
                    ₹{(purchaseData.summary?.totalPurchaseAmount || 0).toLocaleString("en-IN")}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1">Taxable materials cost</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Input GST Paid</p>
                  <h3 className="text-2xl font-black text-blue-600 mt-1">
                    ₹{(purchaseData.summary?.totalGstAmount || 0).toLocaleString("en-IN")}
                  </h3>
                  <p className="text-[11px] text-blue-600/80 mt-1">Eligible Input Tax Credit (ITC)</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Purchase Invoiced</p>
                  <h3 className="text-2xl font-black text-indigo-600 mt-1">
                    ₹{(purchaseData.summary?.totalInvoicedAmount || 0).toLocaleString("en-IN")}
                  </h3>
                  <p className="text-[11px] text-indigo-600/80 mt-1">Gross purchase expenses</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Purchase Records</p>
                  <h3 className="text-2xl font-black text-gray-900 mt-1">
                    {purchaseData.summary?.totalCount || 0}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {purchaseData.summary?.paidCount} Paid · {purchaseData.summary?.pendingCount} Pending
                  </p>
                </div>
              </div>

              {/* Purchase Table */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs overflow-hidden">
                <div className="p-4 px-6 border-b border-[#e2e8f0] flex justify-between items-center bg-gray-50/50">
                  <h3 className="text-sm font-black text-gray-800">Purchase Register Statement</h3>
                  <span className="text-xs text-gray-500 font-medium">View-Only</span>
                </div>

                {purchaseData.records?.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 text-sm">
                    No purchase transactions found for this date range.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-left text-xs">
                      <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-[#e2e8f0]">
                        <tr>
                          <th className="py-3 px-6">Purchase / Bill #</th>
                          <th className="py-3 px-6">Supplier / Vendor Name</th>
                          <th className="py-3 px-6">Purchase Date</th>
                          <th className="py-3 px-6 text-right">Purchase Amount (₹)</th>
                          <th className="py-3 px-6 text-right">GST Amount (₹)</th>
                          <th className="py-3 px-6 text-right">Total Amount (₹)</th>
                          <th className="py-3 px-6 text-center">Payment Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {purchaseData.records.map((r: any) => (
                          <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="py-3.5 px-6 font-mono font-bold text-gray-900">{r.purchase_number}</td>
                            <td className="py-3.5 px-6 font-semibold text-gray-800">{r.supplier_name}</td>
                            <td className="py-3.5 px-6 text-gray-500">{r.purchase_date}</td>
                            <td className="py-3.5 px-6 text-right text-gray-700">₹{r.purchase_amount.toLocaleString("en-IN")}</td>
                            <td className="py-3.5 px-6 text-right text-blue-600 font-semibold">₹{r.gst_amount.toLocaleString("en-IN")}</td>
                            <td className="py-3.5 px-6 text-right font-black text-gray-900">₹{r.total_amount.toLocaleString("en-IN")}</td>
                            <td className="py-3.5 px-6 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                r.payment_status === "Paid" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                r.payment_status === "Pending" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}>
                                {r.payment_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50/80 font-black text-xs text-gray-900 border-t border-[#e2e8f0]">
                        <tr>
                          <td className="py-3 px-6" colSpan={3}>Total for Selected Period:</td>
                          <td className="py-3 px-6 text-right">₹{purchaseData.summary?.totalPurchaseAmount?.toLocaleString("en-IN")}</td>
                          <td className="py-3 px-6 text-right text-blue-600">₹{purchaseData.summary?.totalGstAmount?.toLocaleString("en-IN")}</td>
                          <td className="py-3 px-6 text-right text-indigo-600">₹{purchaseData.summary?.totalInvoicedAmount?.toLocaleString("en-IN")}</td>
                          <td className="py-3 px-6"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. EXPENSES STATEMENT REPORT */}
          {/* ========================================================= */}
          {activeTab === "expenses-statement" && expensesData && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Business Expenses</p>
                  <h3 className="text-2xl font-black text-gray-900 mt-1">
                    ₹{(expensesData.summary?.totalExpenses || 0).toLocaleString("en-IN")}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1">Operating expenditure</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Expense Entries</p>
                  <h3 className="text-2xl font-black text-gray-900 mt-1">
                    {expensesData.summary?.totalCount || 0}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1">Incurred transactions</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Average Expense Size</p>
                  <h3 className="text-2xl font-black text-amber-600 mt-1">
                    ₹{(expensesData.summary?.averageExpense || 0).toLocaleString("en-IN")}
                  </h3>
                  <p className="text-[11px] text-amber-600/80 mt-1">Per transaction avg</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Top Category</p>
                  <h3 className="text-lg font-black text-gray-900 mt-1 truncate">
                    {expensesData.summary?.categoryBreakdown?.[0]?.category || "General Operations"}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1">
                    ₹{(expensesData.summary?.categoryBreakdown?.[0]?.amount || 0).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Expenses Table */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs overflow-hidden">
                <div className="p-4 px-6 border-b border-[#e2e8f0] flex justify-between items-center bg-gray-50/50">
                  <h3 className="text-sm font-black text-gray-800">Business Expenses Statement</h3>
                  <span className="text-xs text-gray-500 font-medium">View-Only</span>
                </div>

                {expensesData.records?.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 text-sm">
                    No expense records found for this date range.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-left text-xs">
                      <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-[#e2e8f0]">
                        <tr>
                          <th className="py-3 px-6">Expense Date</th>
                          <th className="py-3 px-6">Category</th>
                          <th className="py-3 px-6">Description</th>
                          <th className="py-3 px-6 text-right">Amount (₹)</th>
                          <th className="py-3 px-6 text-center">Payment Mode</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {expensesData.records.map((r: any) => (
                          <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="py-3.5 px-6 text-gray-500 font-medium">{r.expense_date}</td>
                            <td className="py-3.5 px-6 font-semibold text-gray-800">
                              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px]">
                                {r.category}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-gray-700">{r.description}</td>
                            <td className="py-3.5 px-6 text-right font-black text-gray-900">
                              ₹{r.amount.toLocaleString("en-IN")}
                            </td>
                            <td className="py-3.5 px-6 text-center text-gray-600 font-medium">
                              {r.payment_mode}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50/80 font-black text-xs text-gray-900 border-t border-[#e2e8f0]">
                        <tr>
                          <td className="py-3 px-6" colSpan={3}>Total Expenses for Selected Period:</td>
                          <td className="py-3 px-6 text-right text-[#0260de]">
                            ₹{expensesData.summary?.totalExpenses?.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-6"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. GST SUMMARY REPORT */}
          {/* ========================================================= */}
          {activeTab === "gst-summary" && gstData && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Output GST (Collected)</p>
                  <h3 className="text-2xl font-black text-emerald-600 mt-1">
                    ₹{(gstData.summary?.outputGst || 0).toLocaleString("en-IN")}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1">GST collected on Sales</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Input GST (Paid / ITC)</p>
                  <h3 className="text-2xl font-black text-blue-600 mt-1">
                    ₹{(gstData.summary?.inputGst || 0).toLocaleString("en-IN")}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1">Eligible tax credit on Purchases</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Net GST Payable</p>
                  <h3 className={`text-2xl font-black mt-1 ${
                    gstData.summary?.netGstPayable >= 0 ? "text-amber-600" : "text-emerald-600"
                  }`}>
                    ₹{Math.abs(gstData.summary?.netGstPayable || 0).toLocaleString("en-IN")}
                  </h3>
                  <p className={`text-[11px] font-bold mt-1 ${
                    gstData.summary?.netGstPayable >= 0 ? "text-amber-700" : "text-emerald-700"
                  }`}>
                    {gstData.summary?.netGstPayable >= 0 ? "Payable to Govt" : "Input Tax Credit (Carried Forward)"}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Taxable Sales Turnover</p>
                  <h3 className="text-2xl font-black text-gray-900 mt-1">
                    ₹{(gstData.summary?.totalSalesTaxable || 0).toLocaleString("en-IN")}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1">Excludes GST component</p>
                </div>
              </div>

              {/* Rate-Wise Breakdown Table */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs overflow-hidden">
                <div className="p-4 px-6 border-b border-[#e2e8f0] flex justify-between items-center bg-gray-50/50">
                  <h3 className="text-sm font-black text-gray-800">GST Breakdown by Tax Rate Slabs</h3>
                  <span className="text-xs text-gray-500 font-medium">Standard CGST + SGST Split</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-xs">
                    <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-[#e2e8f0]">
                      <tr>
                        <th className="py-3 px-6">Tax Rate Slab</th>
                        <th className="py-3 px-6 text-right">Output Taxable (Sales)</th>
                        <th className="py-3 px-6 text-right">Output GST (₹)</th>
                        <th className="py-3 px-6 text-right">Input Taxable (Purchases)</th>
                        <th className="py-3 px-6 text-right">Input GST (₹)</th>
                        <th className="py-3 px-6 text-right">Net Tax Position (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {gstData.ratesBreakdown?.map((slab: any) => (
                        <tr key={slab.slab} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3.5 px-6 font-bold text-gray-900">{slab.slab}</td>
                          <td className="py-3.5 px-6 text-right text-gray-700">₹{slab.outputTaxable.toLocaleString("en-IN")}</td>
                          <td className="py-3.5 px-6 text-right font-semibold text-emerald-600">₹{slab.outputGst.toLocaleString("en-IN")}</td>
                          <td className="py-3.5 px-6 text-right text-gray-700">₹{slab.inputTaxable.toLocaleString("en-IN")}</td>
                          <td className="py-3.5 px-6 text-right font-semibold text-blue-600">₹{slab.inputGst.toLocaleString("en-IN")}</td>
                          <td className="py-3.5 px-6 text-right font-black text-gray-900">
                            ₹{slab.netGst.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50/80 font-black text-xs text-gray-900 border-t border-[#e2e8f0]">
                      <tr>
                        <td className="py-3 px-6">Total Overall GST:</td>
                        <td className="py-3 px-6 text-right">₹{gstData.summary?.totalSalesTaxable?.toLocaleString("en-IN")}</td>
                        <td className="py-3 px-6 text-right text-emerald-600">₹{gstData.summary?.outputGst?.toLocaleString("en-IN")}</td>
                        <td className="py-3 px-6 text-right">₹{gstData.summary?.totalPurchasesTaxable?.toLocaleString("en-IN")}</td>
                        <td className="py-3 px-6 text-right text-blue-600">₹{gstData.summary?.inputGst?.toLocaleString("en-IN")}</td>
                        <td className="py-3 px-6 text-right text-amber-600">
                          ₹{gstData.summary?.netGstPayable?.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 5. STOCK STATEMENT REPORT */}
          {/* ========================================================= */}
          {activeTab === "stock-statement" && stockData && (
            <div className="space-y-6">
              {/* CRITICAL LOW STOCK ALERT BANNER (TOP OF PAGE) */}
              {stockData.lowStockAlerts?.length > 0 && (
                <div className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 shadow-md animate-in fade-in duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold flex-shrink-0 animate-bounce">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-rose-900 tracking-tight">
                          CRITICAL LOW STOCK ALERT: {stockData.lowStockAlerts.length} Product(s) Below Minimum Level!
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white uppercase tracking-wider">
                          Action Required
                        </span>
                      </div>
                      <p className="text-xs text-rose-700 mt-1 font-medium">
                        The following items have dropped below the safe threshold of 10 units. Restocking purchase entries should be placed promptly:
                      </p>

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {stockData.lowStockAlerts.map((alt: any) => (
                          <div key={alt.sku} className="p-3 bg-white/90 rounded-xl border border-rose-200 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-gray-900">{alt.product_name}</p>
                              <p className="text-[11px] text-gray-500 font-mono mt-0.5">{alt.sku} · Min required: {alt.minimum_stock_level} units</p>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-black text-rose-600 bg-rose-100 px-2.5 py-1 rounded-lg">
                                {alt.current_stock} units left
                              </span>
                              <p className="text-[10px] font-bold text-rose-500 mt-1">Deficit: -{alt.deficit}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Products Tracked</p>
                  <h3 className="text-2xl font-black text-gray-900 mt-1">{stockData.summary?.totalProducts || 0}</h3>
                  <p className="text-[11px] text-gray-400 mt-1">Manufacturing items</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Stock on Hand</p>
                  <h3 className="text-2xl font-black text-blue-600 mt-1">{stockData.summary?.totalUnits || 0}</h3>
                  <p className="text-[11px] text-blue-600/80 mt-1">Total physical units in plant</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Inventory Valuation</p>
                  <h3 className="text-2xl font-black text-emerald-600 mt-1">
                    ₹{(stockData.summary?.totalValuation || 0).toLocaleString("en-IN")}
                  </h3>
                  <p className="text-[11px] text-emerald-600/80 mt-1">At current unit rates</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Critical Low Stock</p>
                  <h3 className={`text-2xl font-black mt-1 ${stockData.summary?.lowStockCount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {stockData.summary?.lowStockCount || 0}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1">Items below 10 units</p>
                </div>
              </div>

              {/* Stock Position Table */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs overflow-hidden">
                <div className="p-4 px-6 border-b border-[#e2e8f0] flex justify-between items-center bg-gray-50/50">
                  <h3 className="text-sm font-black text-gray-800">Current Stock &amp; Inventory Position</h3>
                  <span className="text-xs text-gray-500 font-medium">Auto-derived from Products &amp; Sales</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-xs">
                    <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-[#e2e8f0]">
                      <tr>
                        <th className="py-3 px-6">Product Code / SKU</th>
                        <th className="py-3 px-6">Product Name</th>
                        <th className="py-3 px-6 text-center">Opening Stock</th>
                        <th className="py-3 px-6 text-center">Stock Purchased</th>
                        <th className="py-3 px-6 text-center">Stock Sold</th>
                        <th className="py-3 px-6 text-center">Current Available</th>
                        <th className="py-3 px-6 text-center">Min Level</th>
                        <th className="py-3 px-6 text-right">Inventory Valuation</th>
                        <th className="py-3 px-6 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stockData.records?.map((prod: any) => (
                        <tr
                          key={prod.id}
                          className={`transition-colors ${
                            prod.is_low_stock ? "bg-rose-50/50 hover:bg-rose-50 font-bold" : "hover:bg-gray-50/60"
                          }`}
                        >
                          <td className="py-3.5 px-6 font-mono font-bold text-gray-700">{prod.sku}</td>
                          <td className="py-3.5 px-6 font-semibold text-gray-900">{prod.product_name}</td>
                          <td className="py-3.5 px-6 text-center text-gray-500">{prod.opening_stock}</td>
                          <td className="py-3.5 px-6 text-center text-emerald-600 font-semibold">+{prod.stock_purchased}</td>
                          <td className="py-3.5 px-6 text-center text-rose-500 font-semibold">-{prod.stock_sold}</td>
                          <td className="py-3.5 px-6 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full font-black text-xs ${
                              prod.is_low_stock ? "bg-rose-600 text-white" : "bg-gray-100 text-gray-900"
                            }`}>
                              {prod.current_stock}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-center text-gray-400 font-medium">{prod.minimum_stock_level}</td>
                          <td className="py-3.5 px-6 text-right font-black text-gray-900">
                            ₹{prod.valuation.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3.5 px-6 text-center">
                            {prod.is_low_stock ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-1 animate-ping"></span>
                                RESTOCK LOW
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                HEALTHY
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50/80 font-black text-xs text-gray-900 border-t border-[#e2e8f0]">
                      <tr>
                        <td className="py-3 px-6" colSpan={5}>Total Inventory Valuation:</td>
                        <td className="py-3 px-6 text-center text-blue-600">{stockData.summary?.totalUnits} units</td>
                        <td className="py-3 px-6"></td>
                        <td className="py-3 px-6 text-right text-emerald-600">
                          ₹{stockData.summary?.totalValuation?.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-6"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 6. PROFIT & LOSS STATEMENT REPORT */}
          {/* ========================================================= */}
          {activeTab === "profit-loss" && plData && (
            <div className="space-y-6">
              {/* Highlight Banner: Final Net Profit or Loss */}
              <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 shadow-sm ${
                plData.summary?.isProfit
                  ? "bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-300"
                  : "bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent border-rose-300"
              }`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                  <div>
                    <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 sm:px-3 py-1 rounded-full ${
                      plData.summary?.isProfit ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                    }`}>
                      {plData.summary?.isProfit ? "Business Operating in Surplus" : "Operating in Net Deficit"}
                    </span>
                    <h2 className={`text-2xl sm:text-3xl font-black mt-2 tracking-tight ${
                      plData.summary?.isProfit ? "text-emerald-700" : "text-rose-700"
                    }`}>
                      {plData.summary?.isProfit
                        ? `Net Profit: +₹${plData.summary?.netProfit?.toLocaleString("en-IN")}`
                        : `Net Loss: -₹${plData.summary?.totalLoss?.toLocaleString("en-IN")}`}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Calculated as: Gross Sales (₹{plData.summary?.totalSales?.toLocaleString("en-IN")}) - Purchases (₹{plData.summary?.totalPurchases?.toLocaleString("en-IN")}) - Operating Expenses (₹{plData.summary?.totalOperatingExpenses?.toLocaleString("en-IN")})
                    </p>
                  </div>

                  <div className="sm:text-right mt-2 sm:mt-0">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Net Margin</p>
                    <p className={`text-xl sm:text-2xl font-black mt-0.5 ${
                      plData.summary?.isProfit ? "text-emerald-700" : "text-rose-700"
                    }`}>
                      {plData.summary?.netMarginPercent}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Sales / Revenue</p>
                  <h3 className="text-2xl font-black text-gray-900 mt-1">
                    ₹{(plData.summary?.totalSales || 0).toLocaleString("en-IN")}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1">Gross sales invoices</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Purchase Cost</p>
                  <h3 className="text-2xl font-black text-blue-600 mt-1">
                    ₹{(plData.summary?.totalPurchases || 0).toLocaleString("en-IN")}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1">Raw materials &amp; assemblies</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Gross Profit</p>
                  <h3 className="text-2xl font-black text-emerald-600 mt-1">
                    ₹{(plData.summary?.grossProfit || 0).toLocaleString("en-IN")}
                  </h3>
                  <p className="text-[11px] text-emerald-600/80 mt-1">
                    Margin: {plData.summary?.grossMarginPercent}%
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Operating Expenses</p>
                  <h3 className="text-2xl font-black text-rose-600 mt-1">
                    ₹{(plData.summary?.totalOperatingExpenses || 0).toLocaleString("en-IN")}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1">
                    ₹{plData.summary?.totalExpenses?.toLocaleString("en-IN")} Exp + ₹{plData.summary?.labourExpenses?.toLocaleString("en-IN")} Payroll
                  </p>
                </div>
              </div>

              {/* P&L Statement Ledger Table */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs overflow-hidden">
                <div className="p-4 px-6 border-b border-[#e2e8f0] flex justify-between items-center bg-gray-50/50">
                  <h3 className="text-sm font-black text-gray-800">Financial Statement Breakdown</h3>
                  <span className="text-xs text-gray-500 font-medium">Standard P&amp;L Format</span>
                </div>

                <div className="p-6 space-y-4">
                  {plData.breakdown?.map((line: any, idx: number) => {
                    const isIncome = line.type === "income";
                    const isCogs = line.type === "cogs";
                    const isSubtotal = line.type === "subtotal";
                    const isExpense = line.type === "expense";
                    const isNetProfit = line.type === "net_profit";
                    const isNetLoss = line.type === "net_loss";

                    return (
                      <div
                        key={idx}
                        className={`flex justify-between items-center py-2.5 px-4 rounded-xl text-xs transition-colors ${
                          isSubtotal ? "bg-gray-100 font-black text-gray-900 border border-[#e2e8f0]" :
                          isNetProfit ? "bg-emerald-500 text-white font-black text-sm shadow-sm" :
                          isNetLoss ? "bg-rose-500 text-white font-black text-sm shadow-sm" :
                          "border-b border-[#e2e8f0] text-gray-700 font-semibold"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {isIncome && <span className="text-emerald-500 font-bold">+</span>}
                          {isCogs && <span className="text-blue-500 font-bold">-</span>}
                          {isExpense && <span className="text-rose-500 font-bold">-</span>}
                          {line.item}
                        </span>
                        <span className="font-mono text-sm">
                          {isNetProfit ? `+₹${line.amount.toLocaleString("en-IN")}` :
                           isNetLoss ? `-₹${line.amount.toLocaleString("en-IN")}` :
                           `₹${line.amount.toLocaleString("en-IN")}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 7. LABOUR PAYROLL REPORT */}
          {/* ========================================================= */}
          {activeTab === "labour-payroll" && payrollData && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Labour Force</p>
                  <h3 className="text-2xl font-black text-gray-900 mt-1">
                    {payrollData.summary?.totalLabourers || 0} Workers
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1">Active factory employees</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Salary Paid</p>
                  <h3 className="text-2xl font-black text-emerald-600 mt-1">
                    ₹{(payrollData.summary?.totalSalaryPaid || 0).toLocaleString("en-IN")}
                  </h3>
                  <p className="text-[11px] text-emerald-600/80 mt-1">
                    {payrollData.summary?.paidCount} Labourers disbursed
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pending Salary Amount</p>
                  <h3 className="text-2xl font-black text-amber-600 mt-1">
                    ₹{(payrollData.summary?.pendingSalaryAmount || 0).toLocaleString("en-IN")}
                  </h3>
                  <p className="text-[11px] text-amber-600/80 mt-1">
                    {payrollData.summary?.pendingCount} Salaries pending release
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Monthly Payroll</p>
                  <h3 className="text-2xl font-black text-gray-900 mt-1">
                    ₹{(payrollData.summary?.totalPayrollExpense || 0).toLocaleString("en-IN")}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1">
                    For {payrollData.selectedPeriod?.monthName}
                  </p>
                </div>
              </div>

              {/* Payroll Statement Table */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs overflow-hidden">
                <div className="p-4 px-6 border-b border-[#e2e8f0] flex justify-between items-center bg-gray-50/50">
                  <h3 className="text-sm font-black text-gray-800">
                    Labour Salary Payroll · {payrollData.selectedPeriod?.monthName}
                  </h3>
                  <span className="text-xs text-gray-500 font-medium">View-Only</span>
                </div>

                {payrollData.records?.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 text-sm">
                    No labour records found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-left text-xs">
                      <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-[#e2e8f0]">
                        <tr>
                          <th className="py-3 px-6">Labour ID</th>
                          <th className="py-3 px-6">Labour Name</th>
                          <th className="py-3 px-6">Contact / Mobile</th>
                          <th className="py-3 px-6 text-right">Monthly Salary (₹)</th>
                          <th className="py-3 px-6">Payment Date</th>
                          <th className="py-3 px-6">Payment Mode</th>
                          <th className="py-3 px-6 text-center">Payment Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {payrollData.records.map((r: any) => (
                          <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="py-3.5 px-6 font-mono font-bold text-gray-900">{r.labour_id}</td>
                            <td className="py-3.5 px-6 font-semibold text-gray-800">{r.labour_name}</td>
                            <td className="py-3.5 px-6 text-gray-500 font-medium">{r.mobile_number}</td>
                            <td className="py-3.5 px-6 text-right font-black text-gray-900">
                              ₹{r.salary_amount.toLocaleString("en-IN")}
                            </td>
                            <td className="py-3.5 px-6 text-gray-500">{r.payment_date}</td>
                            <td className="py-3.5 px-6 text-gray-600 font-medium">{r.payment_mode}</td>
                            <td className="py-3.5 px-6 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                r.payment_status === "Paid"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}>
                                {r.payment_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50/80 font-black text-xs text-gray-900 border-t border-[#e2e8f0]">
                        <tr>
                          <td className="py-3 px-6" colSpan={3}>Total Monthly Payroll:</td>
                          <td className="py-3 px-6 text-right text-[#0260de]">
                            ₹{payrollData.summary?.totalPayrollExpense?.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-6" colSpan={3}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom Back Button & Back to Top */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBackToList}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all shadow-xs active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Reports List</span>
            </button>

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <span>Back to Top ↑</span>
            </button>
          </div>
        </>
      )}
    </>
  )}
</div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 text-center flex flex-col items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0260de]"></div>
          <p className="text-xs text-gray-400 mt-2 font-medium">Loading reports directory...</p>
        </div>
      }
    >
      <ReportsContent />
    </Suspense>
  );
}
