"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Fetch all finance data
  const fetchFinanceData = async () => {
    try {
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
      console.error("Failed to load finance data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchFinanceData();
  };

  // -------------------------
  // Purchase Modal Handlers
  // -------------------------
  const openAddPurchaseModal = () => {
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

  const openEditPurchaseModal = (item: PurchaseRecord) => {
    const id = (item._id || item.id) as string;
    setEditingPurchaseId(id);
    setPurchaseForm({
      purchase_name: item.purchase_name,
      supplier_name: item.supplier_name,
      purchase_date: item.purchase_date,
      amount: String(item.amount),
      status: item.status,
      category: item.category || "Raw Materials",
      bill_number: item.bill_number || "",
      notes: item.notes || ""
    });
    setIsPurchaseModalOpen(true);
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseForm.purchase_name.trim() || !purchaseForm.supplier_name.trim()) {
      alert("Please provide the Purchase Item Name and Supplier Name.");
      return;
    }
    const numAmount = parseFloat(purchaseForm.amount);
    if (isNaN(numAmount) || numAmount < 0) {
      alert("Please enter a valid purchase amount.");
      return;
    }

    setIsSavingPurchase(true);
    try {
      const payload = {
        purchase_name: purchaseForm.purchase_name.trim(),
        supplier_name: purchaseForm.supplier_name.trim(),
        purchase_date: purchaseForm.purchase_date,
        amount: numAmount,
        status: purchaseForm.status,
        category: purchaseForm.category,
        bill_number: purchaseForm.bill_number.trim() || undefined,
        notes: purchaseForm.notes.trim() || undefined
      };

      const url = editingPurchaseId
        ? `${apiUrl}/purchases/${editingPurchaseId}`
        : `${apiUrl}/purchases/`;
      const method = editingPurchaseId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsPurchaseModalOpen(false);
        showToast(
          editingPurchaseId
            ? "Purchase entry updated successfully!"
            : "New purchase entry recorded successfully!"
        );
        await fetchFinanceData();
      } else {
        const error = await res.json();
        alert(error.detail || "Failed to save purchase entry.");
      }
    } catch (err) {
      console.error("Error saving purchase entry:", err);
      alert("Could not connect to server to save purchase.");
    } finally {
      setIsSavingPurchase(false);
    }
  };

  const handleDeletePurchase = async (purchaseId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete purchase record "${name}"?`)) return;
    try {
      const res = await fetch(`${apiUrl}/purchases/${purchaseId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Purchase record deleted.");
        fetchFinanceData();
      } else {
        alert("Failed to delete purchase record.");
      }
    } catch (err) {
      console.error("Delete purchase error:", err);
    }
  };

  // -------------------------
  // Status Update Handlers
  // -------------------------
  const handleUpdateSalesStatus = async (saleId: string, newStatus: string) => {
    try {
      const res = await fetch(`${apiUrl}/finance/sales/${saleId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`Sales payment status updated to ${newStatus}.`);
        // Update local sales list
        setSales((prev) =>
          prev.map((s) => (s.id === saleId ? { ...s, status: newStatus as any } : s))
        );
        if (selectedSale && selectedSale.id === saleId) {
          setSelectedSale({ ...selectedSale, status: newStatus as any });
        }
        // Refresh overview
        fetch(`${apiUrl}/finance/overview`)
          .then((r) => r.json())
          .then((d) => setOverview(d))
          .catch(() => {});
      }
    } catch (err) {
      console.error("Failed to update sale status:", err);
    }
  };

  const handleUpdatePurchaseStatus = async (purchaseId: string, newStatus: string) => {
    try {
      const res = await fetch(`${apiUrl}/purchases/${purchaseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`Purchase status updated to ${newStatus}.`);
        setPurchases((prev) =>
          prev.map((p) =>
            (p._id || p.id) === purchaseId ? { ...p, status: newStatus as any } : p
          )
        );
        // Refresh overview
        fetch(`${apiUrl}/finance/overview`)
          .then((r) => r.json())
          .then((d) => setOverview(d))
          .catch(() => {});
      }
    } catch (err) {
      console.error("Failed to update purchase status:", err);
    }
  };

  // -------------------------
  // Filtering & Totals
  // -------------------------
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

  // Dynamic calculated totals
  const totalSalesAmount = useMemo(() => {
    return sales.reduce((sum, s) => sum + (s.amount || 0), 0);
  }, [sales]);

  const totalPurchaseAmount = useMemo(() => {
    return purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [purchases]);

  const filteredSalesTotal = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + (s.amount || 0), 0);
  }, [filteredSales]);

  const filteredPurchaseTotal = useMemo(() => {
    return filteredPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [filteredPurchases]);

  const netBalance = totalSalesAmount - totalPurchaseAmount;

  // Status Badge Component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
            Paid
          </span>
        );
      case "Pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
            Pending
          </span>
        );
      case "Overdue":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
            Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          {toastMessage}
        </div>
      )}

      {/* Main Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Finance – Sales &amp; Purchase
            </h1>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Synced
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Sales auto-synchronize from Invoices; Purchases are tracked directly with instant calculations.
          </p>
        </div>

        {/* View / Tab Mode Switcher & Refresh */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold text-gray-600">
            <button
              onClick={() => setActiveTab("split")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "split"
                  ? "bg-white text-gray-900 shadow-sm font-extrabold"
                  : "hover:text-gray-900"
              }`}
            >
              Split View (Left &amp; Right)
            </button>
            <button
              onClick={() => setActiveTab("sales")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "sales"
                  ? "bg-white text-gray-900 shadow-sm font-extrabold"
                  : "hover:text-gray-900"
              }`}
            >
              Sales Only
            </button>
            <button
              onClick={() => setActiveTab("purchases")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "purchases"
                  ? "bg-white text-gray-900 shadow-sm font-extrabold"
                  : "hover:text-gray-900"
              }`}
            >
              Purchases Only
            </button>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            title="Refresh finance data"
            className="p-2.5 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all shadow-sm active:scale-95"
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#c51f2a]" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Prominent KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Sales Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Total Sales Amount
              </p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">
                ₹{totalSalesAmount.toLocaleString("en-IN")}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {sales.length} Invoices
            </span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-500 font-medium">Auto-generated from Invoices</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
        </div>

        {/* Total Purchases Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Total Purchase Amount
              </p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">
                ₹{totalPurchaseAmount.toLocaleString("en-IN")}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              {purchases.length} Purchases
            </span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-500 font-medium">Recorded manually via popup</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
        </div>

        {/* Net Cashflow / Margin Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Net Balance (Sales - Purchase)
              </p>
              <h3
                className={`text-2xl font-black mt-1 ${
                  netBalance >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                ₹{netBalance.toLocaleString("en-IN")}
              </h3>
            </div>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                netBalance >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span
              className={`font-bold px-2 py-0.5 rounded ${
                netBalance >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              }`}
            >
              {netBalance >= 0 ? "Positive Surplus" : "Deficit"}
            </span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-500 font-medium">Real-time margin</span>
          </div>
          <div
            className={`absolute bottom-0 left-0 right-0 h-1 ${
              netBalance >= 0
                ? "bg-gradient-to-r from-emerald-500 to-green-600"
                : "bg-gradient-to-r from-rose-500 to-red-600"
            }`}
          ></div>
        </div>

        {/* Pending Receivables & Payables */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Unsettled Balances
              </p>
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-xs w-48">
                  <span className="text-gray-500">Pending Sales:</span>
                  <span className="font-extrabold text-amber-600">
                    ₹{(overview?.pendingSales ?? 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs w-48">
                  <span className="text-gray-500">Pending Purchases:</span>
                  <span className="font-extrabold text-rose-600">
                    ₹{(overview?.pendingPurchases ?? 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>
        </div>
      </div>

      {/* Main Two-Section Layout: Sales (Left) & Purchase (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ======================================================== */}
        {/* 1. SALES (LEFT SIDE) */}
        {/* ======================================================== */}
        {(activeTab === "split" || activeTab === "sales") && (
          <div
            className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col ${
              activeTab === "sales" ? "lg:col-span-2" : ""
            }`}
          >
            {/* Sales Header */}
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50/40 to-transparent">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-gray-900 tracking-tight">
                        Sales Management
                      </h2>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Left Side
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Auto-generated from Invoices · No manual entry required
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/bill-invoice/create"
                    className="text-xs font-bold text-gray-700 hover:text-[#c51f2a] bg-white border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <span>+ Generate Invoice</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Sub-KPI bar */}
              <div className="mt-4 pt-3 border-t border-emerald-100/60 flex items-center justify-between text-xs">
                <div className="text-gray-500 font-medium">
                  Total Sales:{" "}
                  <span className="font-extrabold text-gray-900">
                    ₹{totalSalesAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    Paid: ₹{(overview?.paidSales ?? 0).toLocaleString("en-IN")}
                  </span>
                  <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">
                    Pending: ₹{(overview?.pendingSales ?? 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Sales Search & Filter Bar */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={salesSearch}
                  onChange={(e) => setSalesSearch(e.target.value)}
                  placeholder="Search invoice # or customer..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                {["ALL", "PAID", "PENDING", "OVERDUE"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSalesStatusFilter(st)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                      salesStatusFilter === st
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Sales Table */}
            {isLoading ? (
              <div className="p-10 text-center">
                <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-emerald-600"></div>
                <p className="text-xs text-gray-400 mt-2 font-medium">Loading sales records...</p>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400 mb-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-700 font-bold text-sm">No sales records match</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Invoices generated in Bill &amp; Invoice automatically appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Customer Name</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Total Amount</th>
                      <th className="py-3 px-4 text-center">Payment Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-900 whitespace-nowrap">
                          <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-[11px] border border-gray-200">
                            {sale.invoice_number}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-gray-800 max-w-[140px] truncate">
                          {sale.customer_name}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                          {sale.date}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-gray-900 whitespace-nowrap">
                          ₹{(sale.amount || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="inline-block relative group">
                            {getStatusBadge(sale.status)}
                            <select
                              value={sale.status}
                              onChange={(e) => handleUpdateSalesStatus(sale.id, e.target.value)}
                              aria-label={`Change status for ${sale.invoice_number}`}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            >
                              <option value="Paid">Paid</option>
                              <option value="Pending">Pending</option>
                              <option value="Overdue">Overdue</option>
                            </select>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedSale(sale)}
                            className="px-2.5 py-1 text-[11px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Sales Footer */}
            <div className="p-3.5 px-5 bg-gray-50/80 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
              <span>
                Showing <strong className="text-gray-900">{filteredSales.length}</strong> sales entries
              </span>
              <span>
                Filtered Total:{" "}
                <strong className="text-emerald-700">₹{filteredSalesTotal.toLocaleString("en-IN")}</strong>
              </span>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. PURCHASE (RIGHT SIDE) */}
        {/* ======================================================== */}
        {(activeTab === "split" || activeTab === "purchases") && (
          <div
            className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col ${
              activeTab === "purchases" ? "lg:col-span-2" : ""
            }`}
          >
            {/* Purchase Header */}
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/40 to-transparent">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-gray-900 tracking-tight">
                        Purchase Management
                      </h2>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        Right Side
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Record all manufacturing expenses and supplier purchases
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={openAddPurchaseModal}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#c51f2a] hover:bg-[#a81922] text-white text-xs font-bold rounded-xl shadow-md shadow-red-500/20 active:scale-95 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    + Add Purchase
                  </button>
                </div>
              </div>

              {/* Sub-KPI bar */}
              <div className="mt-4 pt-3 border-t border-blue-100/60 flex items-center justify-between text-xs">
                <div className="text-gray-500 font-medium">
                  Total Purchases:{" "}
                  <span className="font-extrabold text-gray-900">
                    ₹{totalPurchaseAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded">
                    Paid: ₹{(overview?.paidPurchases ?? 0).toLocaleString("en-IN")}
                  </span>
                  <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">
                    Pending: ₹{(overview?.pendingPurchases ?? 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Purchase Search & Filter Bar */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={purchaseSearch}
                  onChange={(e) => setPurchaseSearch(e.target.value)}
                  placeholder="Search item, supplier, bill #..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                {["ALL", "PAID", "PENDING", "OVERDUE"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setPurchaseStatusFilter(st)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                      purchaseStatusFilter === st
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Purchase Table */}
            {isLoading ? (
              <div className="p-10 text-center">
                <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600"></div>
                <p className="text-xs text-gray-400 mt-2 font-medium">Loading purchases...</p>
              </div>
            ) : filteredPurchases.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400 mb-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <p className="text-gray-700 font-bold text-sm">No purchase entries found</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Click &apos;+ Add Purchase&apos; above to record a new supplier purchase.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-4">Purchase Name</th>
                      <th className="py-3 px-4">Supplier / Vendor</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPurchases.map((p) => {
                      const id = (p._id || p.id) as string;
                      return (
                        <tr key={id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-gray-900 max-w-[140px] truncate">
                            <span title={p.purchase_name}>{p.purchase_name}</span>
                            {p.category && (
                              <span className="block text-[10px] text-gray-400 font-normal">
                                {p.category}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-gray-700 max-w-[120px] truncate" title={p.supplier_name}>
                            {p.supplier_name}
                          </td>
                          <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                            {p.purchase_date}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-gray-900 whitespace-nowrap">
                            ₹{(p.amount || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="inline-block relative group">
                              {getStatusBadge(p.status)}
                              <select
                                value={p.status}
                                onChange={(e) => handleUpdatePurchaseStatus(id, e.target.value)}
                                aria-label={`Change status for purchase ${p.purchase_name}`}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              >
                                <option value="Paid">Paid</option>
                                <option value="Pending">Pending</option>
                                <option value="Overdue">Overdue</option>
                              </select>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                            <button
                              onClick={() => openEditPurchaseModal(p)}
                              className="px-2 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Edit purchase"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeletePurchase(id, p.purchase_name)}
                              className="px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Delete purchase"
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
            )}

            {/* Purchase Footer */}
            <div className="p-3.5 px-5 bg-gray-50/80 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
              <span>
                Showing <strong className="text-gray-900">{filteredPurchases.length}</strong> purchase entries
              </span>
              <span>
                Filtered Total:{" "}
                <strong className="text-blue-700">₹{filteredPurchaseTotal.toLocaleString("en-IN")}</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. POPUP MODAL: ADD / EDIT PURCHASE ENTRY */}
      {/* ======================================================== */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 relative my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-5">
              <div>
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Purchase Entry Form
                </span>
                <h3 className="text-xl font-black text-gray-900 mt-1.5">
                  {editingPurchaseId ? "Edit Purchase Entry" : "Record New Purchase"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enter details of materials, components, or services purchased.
                </p>
              </div>
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePurchase} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Purchase Name / Item Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mild Steel Tubes Batch #204, Hydraulic Brakes"
                  value={purchaseForm.purchase_name}
                  onChange={(e) =>
                    setPurchaseForm({ ...purchaseForm, purchase_name: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c51f2a]/20 focus:border-[#c51f2a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Supplier / Vendor Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tata Steel Distributor, National Gas Co."
                  value={purchaseForm.supplier_name}
                  onChange={(e) =>
                    setPurchaseForm({ ...purchaseForm, supplier_name: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c51f2a]/20 focus:border-[#c51f2a]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Purchase Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={purchaseForm.purchase_date}
                    onChange={(e) =>
                      setPurchaseForm({ ...purchaseForm, purchase_date: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c51f2a]/20 focus:border-[#c51f2a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={purchaseForm.amount}
                    onChange={(e) =>
                      setPurchaseForm({ ...purchaseForm, amount: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#c51f2a]/20 focus:border-[#c51f2a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={purchaseForm.status}
                    onChange={(e) =>
                      setPurchaseForm({
                        ...purchaseForm,
                        status: e.target.value as "Paid" | "Pending" | "Overdue"
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c51f2a]/20 focus:border-[#c51f2a]"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={purchaseForm.category}
                    onChange={(e) =>
                      setPurchaseForm({ ...purchaseForm, category: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c51f2a]/20 focus:border-[#c51f2a]"
                  >
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Machinery &amp; Components">Machinery &amp; Components</option>
                    <option value="Consumables">Consumables</option>
                    <option value="Paints &amp; Chemicals">Paints &amp; Chemicals</option>
                    <option value="Logistics &amp; Utilities">Logistics &amp; Utilities</option>
                    <option value="Services">Services</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Bill / PO Reference # (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. PO-TAT-8921, BILL-5541"
                  value={purchaseForm.bill_number}
                  onChange={(e) =>
                    setPurchaseForm({ ...purchaseForm, bill_number: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c51f2a]/20 focus:border-[#c51f2a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Notes / Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional details regarding delivery, batches, or warranty..."
                  value={purchaseForm.notes}
                  onChange={(e) =>
                    setPurchaseForm({ ...purchaseForm, notes: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c51f2a]/20 focus:border-[#c51f2a]"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPurchase}
                  className="px-6 py-2 bg-[#c51f2a] hover:bg-[#a81922] text-white text-sm font-bold rounded-xl shadow-lg shadow-red-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isSavingPurchase ? "Saving..." : editingPurchaseId ? "Update Purchase" : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. POPUP MODAL: SALES DETAILS BREAKDOWN */}
      {/* ======================================================== */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 relative my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-4">
              <div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Sales Invoice Record
                </span>
                <h3 className="text-lg font-black text-gray-900 mt-1">
                  {selectedSale.invoice_number}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Customer</p>
                <h4 className="text-sm font-bold text-gray-900 mt-0.5">{selectedSale.customer_name}</h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Invoice Date</p>
                  <p className="font-semibold text-gray-800 mt-0.5">{selectedSale.date}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Sales Amount</p>
                  <p className="font-extrabold text-emerald-600 text-sm mt-0.5">
                    ₹{(selectedSale.amount || 0).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Update Payment Status:
                </label>
                <div className="flex items-center gap-2">
                  {["Paid", "Pending", "Overdue"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateSalesStatus(selectedSale.id, st)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        selectedSale.status === st
                          ? st === "Paid"
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                            : st === "Pending"
                            ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                            : "bg-rose-500 text-white border-rose-500 shadow-xs"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {selectedSale.items && selectedSale.items.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Line Items
                  </p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {selectedSale.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between py-1 border-b border-gray-50 text-[11px]">
                        <span className="font-medium text-gray-800">
                          {it.description} <span className="text-gray-400">× {it.quantity}</span>
                        </span>
                        <span className="font-bold text-gray-900">
                          ₹{(it.total || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedSale.notes && (
                <div className="p-2.5 bg-gray-50 rounded-lg text-gray-600 italic">
                  Note: {selectedSale.notes}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-gray-100">
              <Link
                href="/bill-invoice"
                className="px-4 py-2 text-xs font-bold text-[#c51f2a] hover:bg-red-50 rounded-xl transition-colors"
              >
                Go to Bill &amp; Invoice &rarr;
              </Link>
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
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
