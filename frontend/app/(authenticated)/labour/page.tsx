"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { getApiUrl } from "@/lib/api";
import {
  Labour,
  LabourFilterState,
  LabourStatusFilter
} from "@/components/labour/types";

import LabourHeader from "@/components/labour/LabourHeader";
import LabourStatistics from "@/components/labour/LabourStatistics";
import LabourToolbar from "@/components/labour/LabourToolbar";
import LabourGrid from "@/components/labour/LabourGrid";
import LabourQuickView from "@/components/labour/LabourQuickView";
import LabourFormModal from "@/components/labour/LabourFormModal";
import LabourImportModal from "@/components/labour/LabourImportModal";
import LabourEmptyState from "@/components/labour/LabourEmptyState";
import LabourSkeleton from "@/components/labour/LabourSkeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function LabourManagementPage() {
  const [labours, setLabours] = useState<Labour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Modals & Drawer State
  const [quickViewLabour, setQuickViewLabour] = useState<Labour | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [labourToEdit, setLabourToEdit] = useState<Labour | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Filter & View State
  const [filters, setFilters] = useState<LabourFilterState>({
    searchQuery: "",
    workTypeFilter: "ALL",
    statusFilter: "ALL",
    salaryRange: "ALL",
    sortBy: "newest",
    viewMode: "grid"
  });

  // Pagination State (16 items per page = 4 rows of 4 on desktop)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16;

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Fetch staff list from backend
  const refreshLabourList = useCallback(async () => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/labours/`);
      if (res.ok) {
        const data = await res.json();
        const formatted: Labour[] = (data || []).map((l: any, idx: number) => ({
          ...l,
          labour_id: l.labour_id || `LBR-${String(idx + 1).padStart(4, "0")}`,
          status: l.status || "Active",
          work_type: l.work_type || "Full Time",
          joining_date: l.joining_date || "",
          image: l.image || "",
          aadhar_image: l.aadhar_image || ""
        }));
        setLabours(formatted);
      } else {
        showToast("Failed to fetch labour workforce");
      }
    } catch (err) {
      console.error("Labour fetch error", err);
      showToast("Cannot connect to server to load labour roster");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/labours/`);
        if (res.ok && !ignore) {
          const data = await res.json();
          const formatted: Labour[] = (data || []).map((l: any, idx: number) => ({
            ...l,
            labour_id: l.labour_id || `LBR-${String(idx + 1).padStart(4, "0")}`,
            status: l.status || "Active",
            work_type: l.work_type || "Full Time",
            joining_date: l.joining_date || "",
            image: l.image || "",
            aadhar_image: l.aadhar_image || ""
          }));
          setLabours(formatted);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Labour initial fetch error", err);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  // Statistics counts for top metric cards
  const staffCounts = useMemo(() => {
    let active = 0;
    let leave = 0;
    let inactive = 0;

    labours.forEach((l) => {
      const s = (l.status || "Active").toLowerCase();
      if (s === "active") active++;
      else if (s === "leave" || s === "on leave") leave++;
      else inactive++;
    });

    return {
      total: labours.length,
      active,
      leave,
      inactive
    };
  }, [labours]);

  // Filtering & Sorting Pipeline
  const filteredLabours = useMemo(() => {
    return labours
      .filter((l) => {
        // Search query
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          const nameMatch = l.name.toLowerCase().includes(q);
          const mobileMatch = l.mobile_number?.toLowerCase().includes(q) ?? false;
          const roleMatch = l.work_type?.toLowerCase().includes(q) ?? false;
          const idMatch =
            (l.labour_id && l.labour_id.toLowerCase().includes(q)) ||
            (l._id && l._id.toLowerCase().includes(q));
          const addressMatch = l.address?.toLowerCase().includes(q) ?? false;

          if (!nameMatch && !mobileMatch && !roleMatch && !idMatch && !addressMatch) {
            return false;
          }
        }

        // Work type filter
        if (filters.workTypeFilter !== "ALL" && l.work_type !== filters.workTypeFilter) {
          return false;
        }

        // Status filter
        if (filters.statusFilter !== "ALL") {
          const s = (l.status || "Active").toLowerCase();
          if (filters.statusFilter === "Active" && s !== "active") return false;
          if (filters.statusFilter === "On Leave" && s !== "leave" && s !== "on leave") return false;
          if (filters.statusFilter === "Inactive" && s !== "inactive") return false;
        }

        // Salary range filter
        const wage = l.salary || 0;
        if (filters.salaryRange === "UNDER_15K" && wage >= 15000) return false;
        if (filters.salaryRange === "15K_25K" && (wage < 15000 || wage > 25000)) return false;
        if (filters.salaryRange === "ABOVE_25K" && wage <= 25000) return false;

        return true;
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case "name_asc":
            return a.name.localeCompare(b.name);
          case "name_desc":
            return b.name.localeCompare(a.name);
          case "salary_asc":
            return (a.salary || 0) - (b.salary || 0);
          case "salary_desc":
            return (b.salary || 0) - (a.salary || 0);
          case "newest":
          default:
            return 0; // Default to backend list / creation order
        }
      });
  }, [labours, filters]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredLabours.length / itemsPerPage) || 1;
  const paginatedLabours = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLabours.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLabours, currentPage, itemsPerPage]);

  const handleFilterUpdate = (updates: Partial<LabourFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: "",
      workTypeFilter: "ALL",
      statusFilter: "ALL",
      salaryRange: "ALL",
      sortBy: "newest",
      viewMode: "grid"
    });
    setCurrentPage(1);
  };

  // Quick View Handlers
  const handleOpenQuickView = (labour: Labour) => {
    setQuickViewLabour(labour);
    setIsQuickViewOpen(true);
  };

  const handleCloseQuickView = () => {
    setIsQuickViewOpen(false);
    setQuickViewLabour(null);
  };

  // Add / Edit Handlers
  const handleAddNewLabour = () => {
    setLabourToEdit(null);
    setFormModalOpen(true);
  };

  const handleEditLabour = (labour: Labour) => {
    setLabourToEdit(labour);
    setFormModalOpen(true);
  };

  const handleFormSuccess = (savedLabour: Labour, isNew: boolean) => {
    if (isNew) {
      setLabours((prev) => [savedLabour, ...prev]);
      showToast(`Staff member "${savedLabour.name}" added successfully`);
    } else {
      setLabours((prev) =>
        prev.map((l) => (l._id === savedLabour._id ? savedLabour : l))
      );
      if (quickViewLabour && quickViewLabour._id === savedLabour._id) {
        setQuickViewLabour(savedLabour);
      }
      showToast(`Staff member "${savedLabour.name}" updated successfully`);
    }
  };

  // Delete Handler
  const handleDeleteLabour = async (labour: Labour) => {
    if (!labour._id) return;
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/labours/${labour._id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setLabours((prev) => prev.filter((l) => l._id !== labour._id));
        showToast(`Staff member "${labour.name}" removed`);
        if (quickViewLabour?._id === labour._id) {
          setIsQuickViewOpen(false);
        }
      } else {
        showToast("Failed to delete staff record from server");
      }
    } catch (err) {
      console.error("Delete labour error", err);
      showToast("Network error deleting staff record");
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (labours.length === 0) {
      showToast("No labour records to export");
      return;
    }

    const headers = [
      "Labour ID",
      "Name",
      "Work Type",
      "Mobile Number",
      "Monthly Salary (INR)",
      "Status",
      "Address",
      "Joining Date"
    ];

    const rows = labours.map((l) => [
      `"${(l.labour_id || "").replace(/"/g, '""')}"`,
      `"${(l.name || "").replace(/"/g, '""')}"`,
      `"${(l.work_type || "Full Time").replace(/"/g, '""')}"`,
      `"${(l.mobile_number || "").replace(/"/g, '""')}"`,
      l.salary || 0,
      `"${(l.status || "Active").replace(/"/g, '""')}"`,
      `"${(l.address || "").replace(/"/g, '""')}"`,
      `"${(l.joining_date || "").replace(/"/g, '""')}"`
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `siddhivinayak_labour_roster_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${labours.length} labour records to CSV`);
  };

  return (
    <div className="space-y-5 sm:space-y-6 pb-12 font-sans text-slate-900 w-full max-w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 text-xs sm:text-sm font-semibold border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. PAGE HEADER */}
      <LabourHeader
        onAddNew={handleAddNewLabour}
        onImport={() => setIsImportModalOpen(true)}
        onExport={handleExportCsv}
        totalCount={labours.length}
      />

      {/* 2. COMPACT HORIZONTAL STATISTICS */}
      <LabourStatistics
        counts={staffCounts}
        activeFilter={filters.statusFilter}
        onFilterChange={(filter: LabourStatusFilter) =>
          handleFilterUpdate({ statusFilter: filter })
        }
      />

      {/* 3. FILTERING & SEARCH TOOLBAR */}
      <LabourToolbar
        filters={filters}
        onFilterChange={handleFilterUpdate}
        onResetFilters={handleResetFilters}
        totalFiltered={filteredLabours.length}
        totalLabours={labours.length}
      />

      {/* 4. LABOUR CATALOG GRID / LIST OR STATES */}
      {isLoading ? (
        <LabourSkeleton viewMode={filters.viewMode} count={8} />
      ) : labours.length === 0 ? (
        <LabourEmptyState
          isFiltering={false}
          onResetFilters={handleResetFilters}
          onAddNew={handleAddNewLabour}
        />
      ) : filteredLabours.length === 0 ? (
        <LabourEmptyState
          isFiltering={true}
          onResetFilters={handleResetFilters}
          onAddNew={handleAddNewLabour}
        />
      ) : (
        <div className="space-y-6">
          <LabourGrid
            labours={paginatedLabours}
            viewMode={filters.viewMode}
            onQuickView={handleOpenQuickView}
            onEdit={handleEditLabour}
            onDelete={handleDeleteLabour}
          />

          {/* 5. PAGINATION BAR (When staff exceed itemsPerPage) */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200/90 text-xs text-slate-500">
              <span>
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredLabours.length)} of{" "}
                {filteredLabours.length} staff members
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-7 h-7 rounded-lg font-semibold text-xs transition-colors ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white shadow-xs"
                              : "text-slate-600 hover:bg-slate-100 border border-transparent"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (
                      (pageNum === 2 && currentPage > 3) ||
                      (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                    ) {
                      return (
                        <span key={pageNum} className="px-1 text-slate-400">
                          …
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* QUICK VIEW DRAWER */}
      <LabourQuickView
        labour={quickViewLabour}
        isOpen={isQuickViewOpen}
        onClose={handleCloseQuickView}
        onEdit={(labour) => {
          handleCloseQuickView();
          handleEditLabour(labour);
        }}
        onDelete={(labour) => {
          handleDeleteLabour(labour);
        }}
      />

      {/* ADD / EDIT LABOUR MODAL */}
      <LabourFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        labourToEdit={labourToEdit}
        totalLaboursCount={labours.length}
      />

      {/* CSV IMPORT MODAL */}
      <LabourImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={refreshLabourList}
        showToast={showToast}
      />
    </div>
  );
}
