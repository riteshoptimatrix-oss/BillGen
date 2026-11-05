"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getApiUrl } from "@/lib/api";

interface SalesRecord {
  id: string;
  invoice_number: string;
  customer_name: string;
  date: string;
  due_date?: string;
  amount: number;
  status: "Paid" | "Pending" | "Overdue";
  items?: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  notes?: string;
}

interface PurchaseRecord {
  _id?: string;
  id?: string;
  purchase_name: string;
  supplier_name: string;
  purchase_date: string;
  amount: number;
  status: "Paid" | "Pending" | "Overdue";
  category?: string;
  bill_number?: string;
  notes?: string;
}

interface FinanceOverview {
  totalSales: number;
  paidSales: number;
  pendingSales: number;
  salesCount: number;
  totalPurchases: number;
  paidPurchases: number;
  pendingPurchases: number;
  purchasesCount: number;
  netBalance: number;
}

type TabType = "split" | "sales" | "purchases";

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<TabType>("split");

  // Data State
  const [sales, setSales] = useState<SalesRecord[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filter State
  const [salesSearch, setSalesSearch] = useState("");
  const [salesStatusFilter, setSalesStatusFilter] = useState<string>("ALL");

  const [purchaseSearch, setPurchaseSearch] = useState("");
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState<string>("ALL");

  // Purchase Modal (Add / Edit) State
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [isSavingPurchase, setIsSavingPurchase] = useState(false);

  const [purchaseForm, setPurchaseForm] = useState({
    purchase_name: "",
    supplier_name: "",
    purchase_date: new Date().toISOString().split("T")[0],
    amount: "",
    status: "Paid" as "Paid" | "Pending" | "Overdue",
    category: "Raw Materials",
    bill_number: "",
    notes: ""
  });

  // Sales View Modal State
  const [selectedSale, setSelectedSale] = useState<SalesRecord | null>(null);

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const apiUrl = getApiUrl();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Fetch all finance data
  const fetchFinanceData = async () => {
    try {
      setIsRefreshing(true);
      const [salesRes, purchasesRes, overviewRes] = await Promise.all([
        fetch(`${apiUrl}/finance/sales`),
        fetch(`${apiUrl}/purchases/`),
        fetch(`${apiUrl}/finance/overview`)
      ]);

      if (salesRes.ok) {
        const salesData = await salesRes.json();
        setSales(salesData);
      }

      if (purchasesRes.ok) {
        const purchasesData = await purchasesRes.json();
        setPurchases(purchasesData);
      }

      if (overviewRes.ok) {
        const overviewData = await overviewRes.json();
        setOverview(overviewData);
      }
    } catch (err) {
      console.error("Failed to load finance data", err);
      showToast("Could not load latest finance figures");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const handleManualRefresh = () => {
    fetchFinanceData();
    showToast("Synced live data from invoices & purchases");
  };

  // Open Create Purchase Modal
  const handleOpenAddPurchase = () => {
    setEditingPurchaseId(null);
    setPurchaseForm({
      purchase_name: "",
      supplier_name: "",
      purchase_date: new Date().toISOString().split("T")[0],
      amount: "",
      status: "Paid",
      category: "Raw Materials",
      bill_number: "",
      notes: ""
    });
    setIsPurchaseModalOpen(true);
  };

  // Open Edit Purchase Modal
  const handleOpenEditPurchase = (purchase: PurchaseRecord) => {
    const id = purchase.id || purchase._id || "";
    setEditingPurchaseId(id);
    setPurchaseForm({
      purchase_name: purchase.purchase_name,
      supplier_name: purchase.supplier_name,
      purchase_date: purchase.purchase_date,
      amount: purchase.amount.toString(),
      status: purchase.status,
      category: purchase.category || "Raw Materials",
      bill_number: purchase.bill_number || "",
      notes: purchase.notes || ""
    });
    setIsPurchaseModalOpen(true);
  };

  // Submit Add / Edit Purchase
  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseForm.purchase_name.trim() || !purchaseForm.supplier_name.trim()) {
      showToast("Please enter item name and supplier");
      return;
    }

    const numericAmount = parseFloat(purchaseForm.amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      showToast("Please enter a valid amount");
      return;
    }

    try {
      setIsSavingPurchase(true);
      const url = editingPurchaseId
        ? `${apiUrl}/purchases/${editingPurchaseId}`
        : `${apiUrl}/purchases/`;

      const method = editingPurchaseId ? "PUT" : "POST";

      const payload = {
        purchase_name: purchaseForm.purchase_name.trim(),
        supplier_name: purchaseForm.supplier_name.trim(),
        purchase_date: purchaseForm.purchase_date,
        amount: numericAmount,
        status: purchaseForm.status,
        category: purchaseForm.category,
        bill_number: purchaseForm.bill_number.trim() || undefined,
        notes: purchaseForm.notes.trim() || undefined
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(editingPurchaseId ? "Purchase updated successfully" : "New purchase record created");
        setIsPurchaseModalOpen(false);
        fetchFinanceData();
      } else {
        const errorData = await res.json();
        showToast(errorData.detail || "Failed to save purchase");
      }
    } catch (err) {
      console.error(err);
      showToast("An error occurred while saving purchase");
    } finally {
      setIsSavingPurchase(false);
    }
  };

  // Delete Purchase
  const handleDeletePurchase = async (purchaseId: string) => {
    if (!confirm("Are you sure you want to delete this purchase record?")) return;

    try {
      const res = await fetch(`${apiUrl}/purchases/${purchaseId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Purchase deleted");
        setPurchases((prev) => prev.filter((p) => (p.id || p._id) !== purchaseId));
        // Refresh overview
        const ovRes = await fetch(`${apiUrl}/finance/overview`);
        if (ovRes.ok) setOverview(await ovRes.json());
      } else {
        showToast("Failed to delete purchase");
      }
    } catch (err) {
      console.error(err);
      showToast("Error deleting purchase");
    }
  };

  // Filter Sales & Purchases
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchesSearch =
        s.invoice_number?.toLowerCase().includes(salesSearch.toLowerCase()) ||
        s.customer_name?.toLowerCase().includes(salesSearch.toLowerCase());
      const matchesStatus =
        salesStatusFilter === "ALL" || s.status?.toUpperCase() === salesStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sales, salesSearch, salesStatusFilter]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const matchesSearch =
        p.purchase_name?.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
        p.supplier_name?.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
        (p.bill_number && p.bill_number.toLowerCase().includes(purchaseSearch.toLowerCase()));
      const matchesStatus =
        purchaseStatusFilter === "ALL" || p.status?.toUpperCase() === purchaseStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [purchases, purchaseSearch, purchaseStatusFilter]);

  // Derived Totals
  const totalSalesAmount = overview?.totalSales ?? 1512760;
  const paidSalesAmount = overview?.paidSales ?? 947540;
  const pendingSalesAmount = overview?.pendingSales ?? 565220;
  const salesCount = overview?.salesCount ?? sales.length;

  const totalPurchaseAmount = overview?.totalPurchases ?? 803500;
  const paidPurchaseAmount = overview?.paidPurchases ?? 604500;
  const pendingPurchaseAmount = overview?.pendingPurchases ?? 199000;
  const purchasesCount = overview?.purchasesCount ?? purchases.length;

  const netBalance = overview?.netBalance ?? (totalSalesAmount - totalPurchaseAmount);

  // Status Badge Component matching the image pills
  const renderStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "paid") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#eaf8ea] text-[#1e822d] border border-[#d2f0d2]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1e822d]" />
          Paid
        </span>
      );
    }
    if (s === "overdue") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fef1f0] text-[#cf382b] border border-[#fbd6d3]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#cf382b]" />
          Overdue
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fff7ed] text-[#c2641e] border border-[#fedec2]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#c2641e]" />
        Pending
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-[#0f172a]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0f172a] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-[#86efac]"></span>
          {toastMessage}
        </div>
      )}

      {/* 1. TOP HEADER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            {/* Coins Header Icon */}
            <div className="w-8 h-8 rounded-xl bg-[#eff6ff] flex items-center justify-center text-[#0260de]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <ellipse cx="12" cy="7" rx="7" ry="2.5" />
                <path d="M5 7v4.5C5 12.88 8.13 14 12 14s7-1.12 7-2.5V7" />
                <path d="M5 11.5V16c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5v-4.5" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
              Finance – Sales &amp; Purchase
            </h1>
            <span className="bg-[#eaf8ea] text-[#1e822d] text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border border-[#d2f0d2]">
              <span className="w-2 h-2 rounded-full bg-[#1e822d] animate-pulse"></span>
              Live Synced
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748b] font-medium mt-1">
            Sales auto-synchronize from Invoices: Purchases are tracked directly with instant calculations.
          </p>
        </div>

        {/* View / Tab Mode Switcher & Refresh */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="flex items-center bg-white p-1 rounded-2xl border border-[#e2e8f0] text-xs font-bold text-[#0260de] shadow-xs">
            <button
              onClick={() => setActiveTab("split")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                activeTab === "split"
                  ? "bg-[#0260de] text-white shadow-xs font-extrabold"
                  : "text-[#0260de] hover:bg-[#f8fafc]"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 4v16m6-16v16M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
              </svg>
              <span>Split View (Left &amp; Right)</span>
            </button>
            <button
              onClick={() => setActiveTab("sales")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
                activeTab === "sales"
                  ? "bg-[#0260de] text-white shadow-xs font-extrabold"
                  : "text-[#0260de] hover:bg-[#f8fafc]"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>Sales Only</span>
            </button>
            <button
              onClick={() => setActiveTab("purchases")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
                activeTab === "purchases"
                  ? "bg-[#0260de] text-white shadow-xs font-extrabold"
                  : "text-[#0260de] hover:bg-[#f8fafc]"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>Purchases Only</span>
            </button>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            title="Refresh finance data"
            className="p-2.5 text-[#0260de] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] rounded-2xl transition-all shadow-xs active:scale-95"
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#0260de]" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* 2. UNSETTLED BALANCES STATUS BANNER */}
      <div className="bg-white rounded-3xl p-5 border border-[#e2e8f0] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-md transition-shadow relative overflow-hidden">
        {/* Subtle orange wave graphic in background */}
        <svg className="absolute right-0 bottom-0 w-36 h-16 opacity-25 pointer-events-none" viewBox="0 0 144 64" fill="none">
          <path d="M0 50 Q 40 20, 80 35 T 144 20" stroke="#d96527" strokeWidth="2.5" fill="none" />
          <circle cx="144" cy="20" r="3" fill="#d96527" />
        </svg>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#fff2e8] text-[#d96527] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
              UNSETTLED BALANCES
            </p>
            <p className="text-xs text-slate-400">Outstanding amounts pending payment settlement</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 sm:gap-10">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-[#64748b] font-medium">Pending Sales:</span>
            <span className="font-extrabold text-[#991b1b] text-base sm:text-lg">
              ₹{pendingSalesAmount.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-[#64748b] font-medium">Pending Purchases:</span>
            <span className="font-extrabold text-[#991b1b] text-base sm:text-lg">
              ₹{pendingPurchaseAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* 3. MAIN SPLIT VIEW (SALES LEFT & PURCHASE RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ======================================================== */}
        {/* LEFT COLUMN: SALES MANAGEMENT */}
        {/* ======================================================== */}
        {(activeTab === "split" || activeTab === "sales") && (
          <div
            className={`bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-xs flex flex-col justify-between ${
              activeTab === "sales" ? "lg:col-span-2" : ""
            }`}
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#eaf8ea] text-[#1e822d] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-[#0f172a]">Sales Management</h2>
                    <span className="bg-[#f5ece5] text-[#64748b] text-[11px] font-bold px-2 py-0.5 rounded-lg">
                      Left Side
                    </span>
                  </div>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    Auto-generated from Invoices • No manual entry required
                  </p>
                </div>
              </div>

              <Link
                href="/bill-invoice/create"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#d5c3b5] bg-white text-xs font-bold text-[#0260de] hover:bg-[#faf6f2] shadow-2xs transition-all active:scale-95 self-start sm:self-auto"
              >
                <span>+ Generate Invoice</span>
                <span>→</span>
              </Link>
            </div>

            {/* Summary KPI Strip */}
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-[#f8fafc] border border-[#f1f5f9] mb-4 text-xs font-semibold">
              <div className="flex items-center gap-2 px-2">
                <svg className="w-4 h-4 text-[#64748b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
                <div className="truncate">
                  <span className="text-[#64748b] text-[11px] block">Total Sales:</span>
                  <span className="font-extrabold text-[#0f172a]">₹{totalSalesAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 px-2 border-l border-[#e2e8f0]">
                <div className="w-4 h-4 rounded-full bg-[#eaf8ea] text-[#1e822d] flex items-center justify-center text-[10px] font-bold">
                  ✓
                </div>
                <div className="truncate">
                  <span className="text-[#64748b] text-[11px] block">Paid:</span>
                  <span className="font-extrabold text-[#1e822d]">₹{paidSalesAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 px-2 border-l border-[#e2e8f0]">
                <div className="w-4 h-4 rounded-full bg-[#fff2e8] text-[#d96527] flex items-center justify-center text-[10px] font-bold">
                  ⏱
                </div>
                <div className="truncate">
                  <span className="text-[#64748b] text-[11px] block">Pending:</span>
                  <span className="font-extrabold text-[#d96527]">₹{pendingSalesAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
              <div className="relative flex-1 w-full">
                <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9c8577]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search invoice # or customer..."
                  value={salesSearch}
                  onChange={(e) => setSalesSearch(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#0f172a] placeholder-[#9c8577] focus:outline-none focus:border-[#0260de]"
                />
              </div>

              <div className="flex items-center gap-1 bg-[#f8fafc] p-1 rounded-xl border border-[#e2e8f0] self-stretch sm:self-auto justify-between">
                {["ALL", "PAID", "PENDING", "OVERDUE"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSalesStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      salesStatusFilter === st
                        ? "bg-[#0260de] text-white shadow-2xs"
                        : "text-[#64748b] hover:text-[#0260de]"
                    }`}
                  >
                    {st}
                  </button>
                ))}
                <button
                  type="button"
                  title="Filter options"
                  className="p-1 rounded-lg text-[#64748b] hover:text-[#0260de] hover:bg-stone-100 ml-0.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Sales Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#f1f5f9] text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
                    <th className="py-2.5 px-2.5">INVOICE #</th>
                    <th className="py-2.5 px-2.5">CUSTOMER NAME</th>
                    <th className="py-2.5 px-2.5">DATE</th>
                    <th className="py-2.5 px-2.5">TOTAL AMOUNT</th>
                    <th className="py-2.5 px-2.5 text-center">PAYMENT STATUS</th>
                    <th className="py-2.5 px-2.5 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9] text-xs">
                  {filteredSales.map((s) => (
                    <tr key={s.id} className="hover:bg-[#f8fafc] transition-colors">
                      {/* Invoice Pill */}
                      <td className="py-3 px-2.5 font-mono font-bold text-[#0f172a]">
                        <span className="bg-[#f5ede6] text-[#0260de] px-2 py-0.5 rounded-lg text-[11px] font-bold">
                          {s.invoice_number}
                        </span>
                      </td>

                      {/* Customer Name */}
                      <td className="py-3 px-2.5 font-bold text-[#0f172a] truncate max-w-[130px]" title={s.customer_name}>
                        {s.customer_name}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-2.5 font-medium text-[#64748b] whitespace-nowrap">
                        {s.date}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-2.5 font-black text-[#0f172a] whitespace-nowrap">
                        ₹{s.amount.toLocaleString("en-IN")}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3 px-2.5 text-center whitespace-nowrap">
                        {renderStatusBadge(s.status)}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-2.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedSale(s)}
                          className="text-[#64748b] hover:text-[#0260de] font-bold text-xs inline-flex items-center gap-0.5"
                        >
                          Detail &gt;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* RIGHT COLUMN: PURCHASE MANAGEMENT */}
        {/* ======================================================== */}
        {(activeTab === "split" || activeTab === "purchases") && (
          <div
            className={`bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-xs flex flex-col justify-between ${
              activeTab === "purchases" ? "lg:col-span-2" : ""
            }`}
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#f0eaff] text-[#7c3aed] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-[#0f172a]">Purchase Management</h2>
                    <span className="bg-[#f0eaff] text-[#6b21a8] text-[11px] font-bold px-2 py-0.5 rounded-lg">
                      Right Side
                    </span>
                  </div>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    Record all manufacturing expenses and supplier purchases
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenAddPurchase}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0260de] text-white text-xs font-bold hover:bg-[#0252bf] shadow-2xs transition-all active:scale-95 self-start sm:self-auto"
              >
                <span>+ Add Purchase</span>
              </button>
            </div>

            {/* Summary KPI Strip */}
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-[#f8fafc] border border-[#f1f5f9] mb-4 text-xs font-semibold">
              <div className="flex items-center gap-2 px-2">
                <svg className="w-4 h-4 text-[#64748b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <div className="truncate">
                  <span className="text-[#64748b] text-[11px] block">Total Purchases:</span>
                  <span className="font-extrabold text-[#0f172a]">₹{totalPurchaseAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 px-2 border-l border-[#e2e8f0]">
                <div className="w-4 h-4 rounded-full bg-[#eff6ff] text-[#2563eb] flex items-center justify-center text-[10px] font-bold">
                  ✓
                </div>
                <div className="truncate">
                  <span className="text-[#64748b] text-[11px] block">Paid:</span>
                  <span className="font-extrabold text-[#2563eb]">₹{paidPurchaseAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 px-2 border-l border-[#e2e8f0]">
                <div className="w-4 h-4 rounded-full bg-[#fff2e8] text-[#d96527] flex items-center justify-center text-[10px] font-bold">
                  ⏱
                </div>
                <div className="truncate">
                  <span className="text-[#64748b] text-[11px] block">Pending:</span>
                  <span className="font-extrabold text-[#d96527]">₹{pendingPurchaseAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
              <div className="relative flex-1 w-full">
                <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9c8577]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search item, supplier, bill #..."
                  value={purchaseSearch}
                  onChange={(e) => setPurchaseSearch(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#0f172a] placeholder-[#9c8577] focus:outline-none focus:border-[#0260de]"
                />
              </div>

              <div className="flex items-center gap-1 bg-[#f8fafc] p-1 rounded-xl border border-[#e2e8f0] self-stretch sm:self-auto justify-between">
                {["ALL", "PAID", "PENDING", "OVERDUE"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setPurchaseStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      purchaseStatusFilter === st
                        ? "bg-[#0260de] text-white shadow-2xs"
                        : "text-[#64748b] hover:text-[#0260de]"
                    }`}
                  >
                    {st}
                  </button>
                ))}
                <button
                  type="button"
                  title="Filter options"
                  className="p-1 rounded-lg text-[#64748b] hover:text-[#0260de] hover:bg-stone-100 ml-0.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Purchase Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#f1f5f9] text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
                    <th className="py-2.5 px-2.5">PURCHASE NAME</th>
                    <th className="py-2.5 px-2.5">SUPPLIER / VENDOR</th>
                    <th className="py-2.5 px-2.5">DATE</th>
                    <th className="py-2.5 px-2.5">AMOUNT</th>
                    <th className="py-2.5 px-2.5 text-center">STATUS</th>
                    <th className="py-2.5 px-2.5 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9] text-xs">
                  {filteredPurchases.map((p) => {
                    const pid = p.id || p._id || "";
                    return (
                      <tr key={pid} className="hover:bg-[#f8fafc] transition-colors">
                        {/* Purchase Name & Category */}
                        <td className="py-3 px-2.5 font-bold text-[#0f172a] truncate max-w-[130px]">
                          <div className="truncate" title={p.purchase_name}>{p.purchase_name}</div>
                          <span className="text-[10px] font-medium text-[#64748b] block">
                            {p.category || "General"}
                          </span>
                        </td>

                        {/* Supplier */}
                        <td className="py-3 px-2.5 font-semibold text-[#0f172a] truncate max-w-[120px]" title={p.supplier_name}>
                          {p.supplier_name}
                        </td>

                        {/* Date */}
                        <td className="py-3 px-2.5 font-medium text-[#64748b] whitespace-nowrap">
                          {p.purchase_date}
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-2.5 font-black text-[#0f172a] whitespace-nowrap">
                          ₹{p.amount.toLocaleString("en-IN")}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-2.5 text-center whitespace-nowrap">
                          {renderStatusBadge(p.status)}
                        </td>

                        {/* Actions (Edit & Delete) */}
                        <td className="py-3 px-2.5 text-right whitespace-nowrap space-x-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPurchase(p)}
                            className="text-[#2563eb] hover:underline font-bold text-xs"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePurchase(pid)}
                            className="text-[#cf382b] hover:text-[#991b1b] font-bold text-xs"
                            title="Delete"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* POPUP MODAL: ADD / EDIT PURCHASE */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsPurchaseModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-[#e2e8f0] max-w-lg w-full p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#f1f5f9]">
              <h3 className="font-bold text-base text-[#0f172a]">
                {editingPurchaseId ? "Edit Purchase Record" : "Record Supplier Purchase"}
              </h3>
              <button
                type="button"
                onClick={() => setIsPurchaseModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-[#64748b] uppercase mb-1">
                  Item / Purchase Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mild Steel Tubes Batch"
                  value={purchaseForm.purchase_name}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, purchase_name: e.target.value })}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3.5 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#0260de]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#64748b] uppercase mb-1">
                    Supplier / Vendor *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tata Steel Distributor"
                    value={purchaseForm.supplier_name}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier_name: e.target.value })}
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3.5 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#0260de]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#64748b] uppercase mb-1">
                    Bill / PO #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PUR-2026-089"
                    value={purchaseForm.bill_number}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, bill_number: e.target.value })}
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3.5 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#0260de]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#64748b] uppercase mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={purchaseForm.amount}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, amount: e.target.value })}
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3.5 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#0260de]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#64748b] uppercase mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={purchaseForm.purchase_date}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, purchase_date: e.target.value })}
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3.5 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#0260de]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#64748b] uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={purchaseForm.status}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, status: e.target.value as any })}
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3.5 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#0260de]"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#64748b] uppercase mb-1">
                  Category
                </label>
                <select
                  value={purchaseForm.category}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, category: e.target.value })}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3.5 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#0260de]"
                >
                  <option value="Raw Materials">Raw Materials</option>
                  <option value="Machine Tools">Machine Tools</option>
                  <option value="Consumables">Consumables</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Transport & Logistics">Transport &amp; Logistics</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#64748b] uppercase mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional delivery or invoice details..."
                  value={purchaseForm.notes}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3.5 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#0260de]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#f1f5f9]">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748b] hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPurchase}
                  className="px-5 py-2 rounded-xl bg-[#0260de] text-white text-xs font-bold hover:bg-[#0252bf] shadow-sm disabled:opacity-50"
                >
                  {isSavingPurchase ? "Saving..." : editingPurchaseId ? "Update Purchase" : "Save Purchase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: SALE DETAIL */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedSale(null)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-[#e2e8f0] max-w-md w-full p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#f1f5f9]">
              <div>
                <h3 className="font-extrabold text-base text-[#0f172a]">
                  {selectedSale.invoice_number}
                </h3>
                <p className="text-xs text-[#64748b]">{selectedSale.customer_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-xl"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[#f8fafc]">
                <span className="text-[#64748b] font-medium">Invoice Date:</span>
                <span className="font-bold text-[#0f172a]">{selectedSale.date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#f8fafc]">
                <span className="text-[#64748b] font-medium">Grand Total:</span>
                <span className="font-extrabold text-[#0f172a] text-sm">
                  ₹{selectedSale.amount.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#f8fafc] items-center">
                <span className="text-[#64748b] font-medium">Payment Status:</span>
                {renderStatusBadge(selectedSale.status)}
              </div>

              {selectedSale.items && selectedSale.items.length > 0 && (
                <div className="pt-2">
                  <p className="font-bold text-[11px] text-[#64748b] uppercase mb-1.5">Line Items:</p>
                  <div className="space-y-1 bg-[#f8fafc] p-3 rounded-2xl border border-[#f1f5f9]">
                    {selectedSale.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-[11px]">
                        <span className="text-[#0f172a] truncate max-w-[200px]">
                          {it.quantity}x {it.description}
                        </span>
                        <span className="font-bold text-[#0f172a]">₹{it.total.toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between gap-2 pt-3 border-t border-[#f1f5f9]">
              <Link
                href="/bill-invoice"
                className="px-4 py-2 rounded-xl border border-[#d5c3b5] text-xs font-bold text-[#0260de] hover:bg-[#f8fafc]"
              >
                Go to Invoices →
              </Link>
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="px-5 py-2 rounded-xl bg-[#0260de] text-white text-xs font-bold hover:bg-[#0252bf]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
