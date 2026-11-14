"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getApiUrl, getAuthToken } from "@/lib/api";
import { Labour } from "./types";
import {
  Calendar,
  IndianRupee,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  History,
  Check,
  Edit3,
  X,
  Sparkles,
  ArrowRight,
  CreditCard,
  Building2,
  Banknote
} from "lucide-react";

export interface SalaryRecord {
  id: string;
  labour_id: string;
  labour_custom_id?: string;
  labour_name: string;
  work_type?: string;
  month: number;
  year: number;
  salary_amount: number;
  status: "Paid" | "Pending";
  payment_date?: string | null;
  payment_mode?: string;
  notes?: string;
}

export interface SalarySummary {
  totalLabourers: number;
  totalSalary: number;
  totalPaid: number;
  totalPending: number;
  paidCount: number;
  pendingCount: number;
}

export interface SalaryReminder {
  isActive: boolean;
  message: string;
  pendingLabourers: { id: string; labour_name: string; salary_amount: number }[];
}

export interface SalaryHistoryItem {
  id: string;
  month: number;
  year: number;
  periodLabel: string;
  salary_amount: number;
  status: "Paid" | "Pending";
  payment_date?: string | null;
  payment_mode?: string;
  notes?: string;
}

export default function SalaryModule({ initialLabours = [] }: { initialLabours?: Labour[] }) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [summary, setSummary] = useState<SalarySummary>({
    totalLabourers: 0,
    totalSalary: 0,
    totalPaid: 0,
    totalPending: 0,
    paidCount: 0,
    pendingCount: 0,
  });
  const [reminder, setReminder] = useState<SalaryReminder>({
    isActive: false,
    message: "",
    pendingLabourers: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAID" | "PENDING">("ALL");

  // Edit / Payment Modal State
  const [editingRecord, setEditingRecord] = useState<SalaryRecord | null>(null);
  const [editSalaryAmt, setEditSalaryAmt] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<"Paid" | "Pending">("Pending");
  const [editPaymentDate, setEditPaymentDate] = useState<string>("");
  const [editPaymentMode, setEditPaymentMode] = useState<string>("Bank Transfer (NEFT)");
  const [isUpdating, setIsUpdating] = useState(false);

  // History Drawer State
  const [historyLabourName, setHistoryLabourName] = useState<string>("");
  const [historyItems, setHistoryItems] = useState<SalaryHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const months = [
    { value: 1, name: "January" },
    { value: 2, name: "February" },
    { value: 3, name: "March" },
    { value: 4, name: "April" },
    { value: 5, name: "May" },
    { value: 6, name: "June" },
    { value: 7, name: "July" },
    { value: 8, name: "August" },
    { value: 9, name: "September" },
    { value: 10, name: "October" },
    { value: 11, name: "November" },
    { value: 12, name: "December" },
  ];

  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  // Robust fallback: Generates active staff salary entries if server ledger is empty or syncing
  const populateFromLabourList = useCallback((labourList: any[]) => {
    if (!labourList || labourList.length === 0) return;
    const activeStaff = labourList.filter((l: any) => {
      const st = (l.status || "Active").toLowerCase();
      return st !== "inactive" && st !== "terminated";
    });
    const staffToUse = activeStaff.length > 0 ? activeStaff : labourList;
    if (staffToUse.length === 0) return;

    let totSalary = 0;
    const genRecords: SalaryRecord[] = staffToUse.map((l: any, idx: number) => {
      const sal = Number(l.salary || 0);
      totSalary += sal;
      const lid = l._id || l.id || `lab_${idx}`;
      return {
        id: lid,
        labour_id: lid,
        labour_custom_id: l.labour_id || `LAB-${String(idx + 1).padStart(3, "0")}`,
        labour_name: l.name || "Staff Member",
        work_type: l.work_type || "Full Time",
        month: selectedMonth,
        year: selectedYear,
        salary_amount: sal,
        status: "Pending",
        payment_date: null,
        payment_mode: "Bank Transfer (NEFT)",
        notes: ""
      };
    });

    setRecords(genRecords);
    setSummary({
      totalLabourers: genRecords.length,
      totalSalary: totSalary,
      totalPaid: 0,
      totalPending: totSalary,
      paidCount: 0,
      pendingCount: genRecords.length
    });
  }, [selectedMonth, selectedYear]);

  // Fetch month salary records
  const fetchSalaries = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiUrl = getApiUrl();
      const token = getAuthToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(
        `${apiUrl}/labours/salaries?month=${selectedMonth}&year=${selectedYear}`,
        { headers, credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        const recs = data.records || [];
        if (recs.length > 0) {
          setRecords(recs);
          setSummary(
            data.summary || {
              totalLabourers: recs.length,
              totalSalary: 0,
              totalPaid: 0,
              totalPending: 0,
              paidCount: 0,
              pendingCount: recs.length,
            }
          );
          setReminder(
            data.reminder || {
              isActive: false,
              message: "",
              pendingLabourers: [],
            }
          );
          return;
        }
      }

      // Resilient fallback: If /salaries returned an error or empty records, fetch from /labours/ directly
      const fallbackRes = await fetch(`${apiUrl}/labours/`, { headers, credentials: "include" });
      if (fallbackRes.ok) {
        const staffList = await fallbackRes.json();
        if (Array.isArray(staffList) && staffList.length > 0) {
          populateFromLabourList(staffList);
          return;
        }
      }
      if (initialLabours && initialLabours.length > 0) {
        populateFromLabourList(initialLabours);
      } else {
        setRecords([]);
        setSummary({
          totalLabourers: 0,
          totalSalary: 0,
          totalPaid: 0,
          totalPending: 0,
          paidCount: 0,
          pendingCount: 0,
        });
        setReminder({
          isActive: false,
          message: "",
          pendingLabourers: [],
        });
      }
    } catch (err) {
      console.error("Failed to load salary ledger", err);
      if (initialLabours && initialLabours.length > 0) {
        populateFromLabourList(initialLabours);
      } else {
        showToast("Could not connect to server to load salary records");
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear, initialLabours, populateFromLabourList]);

  useEffect(() => {
    fetchSalaries();
  }, [fetchSalaries]);

  // Reactive sync when parent loads workforce directory
  useEffect(() => {
    if (records.length === 0 && initialLabours && initialLabours.length > 0) {
      populateFromLabourList(initialLabours);
    }
  }, [initialLabours, records.length, populateFromLabourList]);

  // Quick Toggle Paid / Pending directly from table
  const handleQuickToggleStatus = async (record: SalaryRecord) => {
    const nextStatus = record.status === "Paid" ? "Pending" : "Paid";
    const todayStr = new Date().toISOString().split("T")[0];

    // Optimistic UI update
    setRecords((prev) =>
      prev.map((r) =>
        r.id === record.id || (record.labour_id && r.labour_id === record.labour_id)
          ? {
              ...r,
              status: nextStatus,
              payment_date: nextStatus === "Paid" ? todayStr : null,
            }
          : r
      )
    );
    setSummary((prev) => {
      const amt = record.salary_amount;
      if (nextStatus === "Paid") {
        return {
          ...prev,
          totalPaid: prev.totalPaid + amt,
          totalPending: Math.max(0, prev.totalPending - amt),
          paidCount: prev.paidCount + 1,
          pendingCount: Math.max(0, prev.pendingCount - 1),
        };
      } else {
        return {
          ...prev,
          totalPaid: Math.max(0, prev.totalPaid - amt),
          totalPending: prev.totalPending + amt,
          paidCount: Math.max(0, prev.paidCount - 1),
          pendingCount: prev.pendingCount + 1,
        };
      }
    });

    try {
      const apiUrl = getApiUrl();
      const token = getAuthToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const targetId = record.id || record.labour_id;
      const res = await fetch(`${apiUrl}/labours/salaries/${targetId}`, {
        method: "PUT",
        headers,
        credentials: "include",
        body: JSON.stringify({
          labour_id: record.labour_id || record.id,
          month: selectedMonth,
          year: selectedYear,
          status: nextStatus,
          payment_date: nextStatus === "Paid" ? todayStr : null,
          salary_amount: record.salary_amount,
          payment_mode: record.payment_mode || "Bank Transfer (NEFT)",
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.record) {
          setRecords((prev) =>
            prev.map((r) =>
              r.id === record.id || (record.labour_id && r.labour_id === record.labour_id)
                ? { ...r, ...data.record, id: data.record.id }
                : r
            )
          );
        }
        showToast(
          nextStatus === "Paid"
            ? `✓ Salary of ₹${record.salary_amount.toLocaleString("en-IN")} marked as Paid for ${record.labour_name}`
            : `Salary marked as Pending for ${record.labour_name}`
        );
        fetchSalaries();
      } else {
        showToast("Failed to update salary status");
        fetchSalaries();
      }
    } catch (err) {
      console.error("Quick toggle error", err);
      showToast("Network error while updating salary");
      fetchSalaries();
    }
  };

  // Open Edit / Payment Modal
  const handleOpenEditModal = (rec: SalaryRecord) => {
    setEditingRecord(rec);
    setEditSalaryAmt(rec.salary_amount);
    setEditStatus(rec.status);
    setEditPaymentDate(rec.payment_date || new Date().toISOString().split("T")[0]);
    setEditPaymentMode(rec.payment_mode || "Bank Transfer (NEFT)");
  };

  // Save Modal Edit
  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    setIsUpdating(true);

    const updatedAmt = Number(editSalaryAmt) || 0;
    const updatedStatus = editStatus;
    const updatedDate = updatedStatus === "Paid" ? editPaymentDate : null;
    const updatedMode = editPaymentMode;

    // Optimistic UI update
    setRecords((prev) =>
      prev.map((r) =>
        r.id === editingRecord.id || (editingRecord.labour_id && r.labour_id === editingRecord.labour_id)
          ? {
              ...r,
              salary_amount: updatedAmt,
              status: updatedStatus,
              payment_date: updatedDate,
              payment_mode: updatedMode,
            }
          : r
      )
    );

    try {
      const apiUrl = getApiUrl();
      const token = getAuthToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const targetId = editingRecord.id || editingRecord.labour_id;
      const res = await fetch(`${apiUrl}/labours/salaries/${targetId}`, {
        method: "PUT",
        headers,
        credentials: "include",
        body: JSON.stringify({
          labour_id: editingRecord.labour_id || editingRecord.id,
          month: selectedMonth,
          year: selectedYear,
          salary_amount: updatedAmt,
          status: updatedStatus,
          payment_date: updatedDate,
          payment_mode: updatedMode,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.record) {
          setRecords((prev) =>
            prev.map((r) =>
              r.id === editingRecord.id || (editingRecord.labour_id && r.labour_id === editingRecord.labour_id)
                ? { ...r, ...data.record, id: data.record.id }
                : r
            )
          );
        }
        showToast(`✓ Salary details updated for ${editingRecord.labour_name}`);
        setEditingRecord(null);
        fetchSalaries();
      } else {
        const errData = await res.json().catch(() => null);
        showToast(errData?.detail || "Failed to update salary details");
        fetchSalaries();
      }
    } catch (err) {
      console.error("Save edit error", err);
      showToast("Error updating salary details");
      fetchSalaries();
    } finally {
      setIsUpdating(false);
    }
  };

  // Open Payment History Drawer
  const handleOpenHistory = async (rec: SalaryRecord) => {
    setHistoryLabourName(rec.labour_name);
    setIsHistoryOpen(true);
    setIsLoadingHistory(true);

    try {
      const apiUrl = getApiUrl();
      const token = getAuthToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${apiUrl}/labours/salaries/history/${rec.labour_id}`, {
        headers,
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryItems(data.history || []);
      }
    } catch (err) {
      console.error("Failed to load history", err);
      showToast("Could not load worker payment history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (statusFilter === "PAID" && r.status !== "Paid") return false;
      if (statusFilter === "PENDING" && r.status !== "Pending") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.labour_name.toLowerCase().includes(q);
        const matchId = (r.labour_custom_id || "").toLowerCase().includes(q);
        const matchRole = (r.work_type || "").toLowerCase().includes(q);
        if (!matchName && !matchId && !matchRole) return false;
      }

      return true;
    });
  }, [records, statusFilter, searchQuery]);

  const selectedMonthName = months.find((m) => m.value === selectedMonth)?.name || "Month";

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0f172a] text-white px-5 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP HEADER & MONTH SELECTOR BAR */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0260de] animate-pulse" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Labour Salary &amp; Payroll Ledger
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Tracking monthly wage commitments, payment dates, and statutory disbursement records.
          </p>
        </div>

        {/* Month & Year Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 shadow-2xs">
            <Calendar className="w-4 h-4 text-[#0260de] mr-2 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 shadow-2xs">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Jump to current month button */}
          {(selectedMonth !== currentMonth || selectedYear !== currentYear) && (
            <button
              type="button"
              onClick={() => {
                setSelectedMonth(currentMonth);
                setSelectedYear(currentYear);
              }}
              className="px-3 py-1.5 bg-blue-50 text-[#0260de] hover:bg-blue-100 rounded-2xl text-xs font-bold transition-all cursor-pointer"
            >
              Current Month
            </button>
          )}
        </div>
      </div>

      {/* 2. AUTOMATIC MONTHLY REMINDER BANNER (10th of every month) */}
      {reminder.isActive && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 bg-white rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-extrabold uppercase tracking-wider">
                  Automated Reminder (10th of Month)
                </span>
                <span className="text-xs text-amber-800/80 font-medium">Monthly Payroll Due</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                {reminder.message}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Ensure timely wage transfer to staff members. Once marked as Paid, workers are automatically cleared from this reminder list.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStatusFilter("PENDING")}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <span>View {reminder.pendingLabourers.length} Pending Workers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. DASHBOARD / SUMMARY KPI CARDS (4 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Labourers */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Labourers</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0260de] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              {summary.totalLabourers}
            </p>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
              Enrolled workforce for {selectedMonthName}
            </p>
          </div>
        </div>

        {/* Card 2: Total Salary Amount */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Salary Amount</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              ₹{summary.totalSalary.toLocaleString("en-IN")}
            </p>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
              Total monthly wage liability
            </p>
          </div>
        </div>

        {/* Card 3: Total Paid Salary */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Paid Salary</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl lg:text-3xl font-extrabold text-emerald-600 tracking-tight">
              ₹{summary.totalPaid.toLocaleString("en-IN")}
            </p>
            <span className="inline-flex items-center gap-1 mt-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              ✓ {summary.paidCount} Labourers Disbursed
            </span>
          </div>
        </div>

        {/* Card 4: Total Pending Salary */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Pending Salary</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl lg:text-3xl font-extrabold text-amber-600 tracking-tight">
              ₹{summary.totalPending.toLocaleString("en-IN")}
            </p>
            <span className="inline-flex items-center gap-1 mt-0.5 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              ⚠ {summary.pendingCount} Labourers Pending
            </span>
          </div>
        </div>
      </div>

      {/* 4. TOOLBAR: SEARCH & STATUS FILTER */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search worker by name, ID or role..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0260de] focus:ring-2 focus:ring-[#0260de]/10 transition-all font-medium"
          />
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All ({records.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("PAID")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "PAID"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Paid ({summary.paidCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("PENDING")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "PENDING"
                ? "bg-amber-600 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Pending ({summary.pendingCount})
          </button>
        </div>
      </div>

      {/* 5. LABOUR-WISE SALARY LEDGER TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#0260de] border-t-transparent animate-spin" />
            <p className="text-xs font-bold text-slate-500">Loading monthly salary records...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No salary records found</h3>
            <p className="text-xs text-slate-400 mt-1">
              {records.length === 0
                ? "No active labourers found in the workforce directory. Add labourers in the Workforce Directory tab first."
                : "No labourers match the selected filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">LABOURER &amp; ID</th>
                  <th className="py-3.5 px-4">ROLE / WORK TYPE</th>
                  <th className="py-3.5 px-4">MONTHLY SALARY</th>
                  <th className="py-3.5 px-4 text-center">STATUS</th>
                  <th className="py-3.5 px-4">PAYMENT DATE</th>
                  <th className="py-3.5 px-4">PAYMENT MODE</th>
                  <th className="py-3.5 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-medium">
                {filteredRecords.map((rec) => {
                  const isPaid = rec.status === "Paid";
                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Labourer Name & ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-[#0260de]/10 text-[#0260de] font-black text-xs flex items-center justify-center shrink-0">
                            {rec.labour_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{rec.labour_name}</p>
                            <span className="font-mono text-[10px] font-bold text-slate-400">
                              {rec.labour_custom_id || `LAB-${rec.id.slice(-4).toUpperCase()}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Work Type */}
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          {rec.work_type || "Full Time"}
                        </span>
                      </td>

                      {/* Salary Amount */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-900">
                            ₹{rec.salary_amount.toLocaleString("en-IN")}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(rec)}
                            title="Edit salary amount"
                            className="text-slate-400 hover:text-[#0260de] p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Status Button (Toggle Paid / Pending) */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleQuickToggleStatus(rec)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs ${
                            isPaid
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 animate-pulse"
                          }`}
                          title={`Click to mark as ${isPaid ? "Pending" : "Paid"}`}
                        >
                          {isPaid ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Paid</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Pending</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Payment Date */}
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                        {rec.payment_date ? (
                          <span>{rec.payment_date}</span>
                        ) : (
                          <span className="text-slate-400 italic">Not Disbursed</span>
                        )}
                      </td>

                      {/* Payment Mode */}
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {rec.payment_mode || "Bank Transfer"}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Payment Details / Edit Modal */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(rec)}
                            className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                            title="Edit payment mode or salary"
                          >
                            Update
                          </button>

                          {/* View Payment History */}
                          <button
                            type="button"
                            onClick={() => handleOpenHistory(rec)}
                            className="p-1.5 text-slate-400 hover:text-[#0260de] hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                            title="View Month-by-Month Salary History"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. EDIT / PAYMENT MODAL */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Manage Monthly Salary
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {editingRecord.labour_name} ({selectedMonthName} {selectedYear})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Salary Amount */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Salary Amount (₹)
                </label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    value={editSalaryAmt}
                    onChange={(e) => setEditSalaryAmt(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm font-extrabold text-slate-900 focus:outline-none focus:bg-white focus:border-[#0260de]"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Updating this amount will adjust this month and update worker&apos;s base salary.
                </p>
              </div>

              {/* Status Radio */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Payment Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditStatus("Paid")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      editStatus === "Paid"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-extrabold shadow-2xs"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Paid</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditStatus("Pending")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      editStatus === "Pending"
                        ? "bg-amber-50 text-amber-700 border-amber-300 font-extrabold shadow-2xs"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Pending</span>
                  </button>
                </div>
              </div>

              {/* Payment Date (if Paid) */}
              {editStatus === "Paid" && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Disbursement / Payment Date
                  </label>
                  <input
                    type="date"
                    value={editPaymentDate}
                    onChange={(e) => setEditPaymentDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-[#0260de]"
                  />
                </div>
              )}

              {/* Payment Mode */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Payment Mode
                </label>
                <select
                  value={editPaymentMode}
                  onChange={(e) => setEditPaymentMode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-[#0260de]"
                >
                  <option value="Bank Transfer (NEFT)">Bank Transfer (NEFT / RTGS)</option>
                  <option value="UPI">UPI / Digital Wallet</option>
                  <option value="Cash">Cash in Hand</option>
                  <option value="Cheque">Company Cheque</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleSaveEdit}
                className="px-5 py-2 bg-[#0260de] hover:bg-[#0256cc] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. PAYMENT HISTORY DRAWER / MODAL */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0260de] flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Salary Payment History
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Labourer: <strong className="text-slate-800">{historyLabourName}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {isLoadingHistory ? (
                <div className="p-12 text-center text-xs font-bold text-slate-400">
                  Loading payment history...
                </div>
              ) : historyItems.length === 0 ? (
                <div className="p-12 text-center text-xs font-semibold text-slate-400">
                  No past payment history records found for this worker.
                </div>
              ) : (
                historyItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.periodLabel}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>Mode: {item.payment_mode || "Bank Transfer"}</span>
                        {item.payment_date && <span>• Paid on {item.payment_date}</span>}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-extrabold text-slate-900">
                        ₹{item.salary_amount.toLocaleString("en-IN")}
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          item.status === "Paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
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

