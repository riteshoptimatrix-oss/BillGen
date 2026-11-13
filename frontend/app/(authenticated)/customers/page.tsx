"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { getApiUrl, getAuthToken } from "@/lib/api";
import {
  Customer,
  CustomerFilterState,
  GstStatusFilter,
  extractCity
} from "@/components/customers/types";

import CustomerHeader from "@/components/customers/CustomerHeader";
import CustomerStatistics from "@/components/customers/CustomerStatistics";
import CustomerToolbar from "@/components/customers/CustomerToolbar";
import CustomerGrid from "@/components/customers/CustomerGrid";
import CustomerQuickView from "@/components/customers/CustomerQuickView";
import CustomerFormModal from "@/components/customers/CustomerFormModal";
import CustomerImportModal from "@/components/customers/CustomerImportModal";
import CustomerEmptyState from "@/components/customers/CustomerEmptyState";
import CustomerSkeleton from "@/components/customers/CustomerSkeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Modals & Drawer State
  const [quickViewCustomer, setQuickViewCustomer] = useState<Customer | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Filter & View State
  const [filters, setFilters] = useState<CustomerFilterState>({
    searchQuery: "",
    gstFilter: "ALL",
    bankFilter: "ALL",
    cityFilter: "ALL",
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

  // Fetch customer list from backend
  const refreshCustomerList = useCallback(async () => {
    try {
      const apiUrl = getApiUrl();
      const token = getAuthToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${apiUrl}/customers/`, { headers, credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data || []);
      } else {
        showToast("Failed to fetch customer directory");
      }
    } catch (err) {
      console.error("Customers fetch error", err);
      showToast("Cannot connect to server to load customers");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const apiUrl = getApiUrl();
        const token = getAuthToken();
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${apiUrl}/customers/`, { headers, credentials: "include" });
        if (res.ok && !ignore) {
          const data = await res.json();
          setCustomers(data || []);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Customers initial fetch error", err);
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

  // Compute available cities from customer addresses
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      const city = extractCity(c.billing_address || c.delivery_address);
      if (city && city !== "Unspecified") {
        set.add(city);
      }
    });
    return Array.from(set).sort();
  }, [customers]);

  // Statistics counts for top metric cards
  const customerCounts = useMemo(() => {
    let gstRegistered = 0;
    let retail = 0;
    let bankLinked = 0;

    customers.forEach((c) => {
      if (c.gst_number && c.gst_number.trim().length >= 10) {
        gstRegistered++;
      } else {
        retail++;
      }
      if (c.bank_name && c.bank_name.trim().length > 0) {
        bankLinked++;
      }
    });

    return {
      total: customers.length,
      gstRegistered,
      retail,
      bankLinked
    };
  }, [customers]);

  // Filtering & Sorting Pipeline
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        // Search query
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          const nameMatch = c.name.toLowerCase().includes(q);
          const mobileMatch = c.mobile_number?.toLowerCase().includes(q) ?? false;
          const emailMatch = c.email?.toLowerCase().includes(q) ?? false;
          const gstMatch = c.gst_number?.toLowerCase().includes(q) ?? false;
          const addressMatch =
            (c.billing_address && c.billing_address.toLowerCase().includes(q)) ||
            (c.delivery_address && c.delivery_address.toLowerCase().includes(q));

          if (!nameMatch && !mobileMatch && !emailMatch && !gstMatch && !addressMatch) {
            return false;
          }
        }

        // GST filter
        const hasGst = Boolean(c.gst_number && c.gst_number.trim().length >= 10);
        if (filters.gstFilter === "GST_REGISTERED" && !hasGst) return false;
        if (filters.gstFilter === "UNREGISTERED" && hasGst) return false;

        // Bank filter
        const hasBank = Boolean(c.bank_name && c.bank_name.trim().length > 0);
        if (filters.bankFilter === "WITH_BANK" && !hasBank) return false;
        if (filters.bankFilter === "WITHOUT_BANK" && hasBank) return false;

        // City filter
        if (filters.cityFilter !== "ALL") {
          const city = extractCity(c.billing_address || c.delivery_address);
          if (city !== filters.cityFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case "name_asc":
            return a.name.localeCompare(b.name);
          case "name_desc":
            return b.name.localeCompare(a.name);
          case "newest":
          default:
            return 0; // Default to creation order from backend
        }
      });
  }, [customers, filters]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  const handleFilterUpdate = (updates: Partial<CustomerFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: "",
      gstFilter: "ALL",
      bankFilter: "ALL",
      cityFilter: "ALL",
      sortBy: "newest",
      viewMode: "grid"
    });
    setCurrentPage(1);
  };

  // Quick View Handlers
  const handleOpenQuickView = (customer: Customer) => {
    setQuickViewCustomer(customer);
    setIsQuickViewOpen(true);
  };

  const handleCloseQuickView = () => {
    setIsQuickViewOpen(false);
    setQuickViewCustomer(null);
  };

  // Add / Edit Handlers
  const handleAddNewCustomer = () => {
    setCustomerToEdit(null);
    setFormModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setCustomerToEdit(customer);
    setFormModalOpen(true);
  };

  const handleFormSuccess = (savedCustomer: Customer, isNew: boolean) => {
    if (isNew) {
      setCustomers((prev) => [savedCustomer, ...prev]);
      showToast(`Customer "${savedCustomer.name}" added successfully`);
    } else {
      setCustomers((prev) =>
        prev.map((c) => (c._id === savedCustomer._id ? savedCustomer : c))
      );
      if (quickViewCustomer && quickViewCustomer._id === savedCustomer._id) {
        setQuickViewCustomer(savedCustomer);
      }
      showToast(`Customer "${savedCustomer.name}" updated successfully`);
    }
  };

  // Delete Handler
  const handleDeleteCustomer = async (customer: Customer) => {
    if (!customer._id) return;
    try {
      const apiUrl = getApiUrl();
      const token = getAuthToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${apiUrl}/customers/${customer._id}`, {
        method: "DELETE",
        headers,
        credentials: "include"
      });

      if (res.ok) {
        setCustomers((prev) => prev.filter((c) => c._id !== customer._id));
        showToast(`Customer "${customer.name}" removed`);
        if (quickViewCustomer?._id === customer._id) {
          setIsQuickViewOpen(false);
        }
      } else {
        showToast("Failed to delete customer from server");
      }
    } catch (err) {
      console.error("Delete customer error", err);
      showToast("Network error deleting customer record");
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (customers.length === 0) {
      showToast("No customer records to export");
      return;
    }

    const headers = [
      "Customer ID",
      "Customer Name",
      "Mobile Number",
      "Email Address",
      "GST Number",
      "Billing Address",
      "Delivery Address",
      "Bank Name",
      "Account Number",
      "IFSC Code"
    ];

    const rows = customers.map((c) => [
      `"${(c._id || "").replace(/"/g, '""')}"`,
      `"${(c.name || "").replace(/"/g, '""')}"`,
      `"${(c.mobile_number || "").replace(/"/g, '""')}"`,
      `"${(c.email || "").replace(/"/g, '""')}"`,
      `"${(c.gst_number || "").replace(/"/g, '""')}"`,
      `"${(c.billing_address || "").replace(/"/g, '""')}"`,
      `"${(c.delivery_address || "").replace(/"/g, '""')}"`,
      `"${(c.bank_name || "").replace(/"/g, '""')}"`,
      `"${(c.account_number || "").replace(/"/g, '""')}"`,
      `"${(c.ifsc_code || "").replace(/"/g, '""')}"`
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `siddhivinayak_customers_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${customers.length} customer records to CSV`);
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
      <CustomerHeader
        onAddNew={handleAddNewCustomer}
        onImport={() => setIsImportModalOpen(true)}
        onExport={handleExportCsv}
        totalCount={customers.length}
      />

      {/* 2. COMPACT HORIZONTAL STATISTICS */}
      <CustomerStatistics
        counts={customerCounts}
        activeFilter={filters.gstFilter}
        onFilterChange={(filter: GstStatusFilter) =>
          handleFilterUpdate({ gstFilter: filter })
        }
      />

      {/* 3. FILTERING & SEARCH TOOLBAR */}
      <CustomerToolbar
        filters={filters}
        onFilterChange={handleFilterUpdate}
        onResetFilters={handleResetFilters}
        cities={availableCities}
        totalFiltered={filteredCustomers.length}
        totalCustomers={customers.length}
      />

      {/* 4. CUSTOMER CATALOG GRID / LIST OR STATES */}
      {isLoading ? (
        <CustomerSkeleton viewMode={filters.viewMode} count={8} />
      ) : customers.length === 0 ? (
        <CustomerEmptyState
          isFiltering={false}
          onResetFilters={handleResetFilters}
          onAddNew={handleAddNewCustomer}
        />
      ) : filteredCustomers.length === 0 ? (
        <CustomerEmptyState
          isFiltering={true}
          onResetFilters={handleResetFilters}
          onAddNew={handleAddNewCustomer}
        />
      ) : (
        <div className="space-y-6">
          <CustomerGrid
            customers={paginatedCustomers}
            viewMode={filters.viewMode}
            onQuickView={handleOpenQuickView}
            onEdit={handleEditCustomer}
            onDelete={handleDeleteCustomer}
          />

          {/* 5. PAGINATION BAR (When customers exceed itemsPerPage) */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200/90 text-xs text-slate-500">
              <span>
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of{" "}
                {filteredCustomers.length} customers
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
      <CustomerQuickView
        customer={quickViewCustomer}
        isOpen={isQuickViewOpen}
        onClose={handleCloseQuickView}
        onEdit={(customer) => {
          handleCloseQuickView();
          handleEditCustomer(customer);
        }}
        onDelete={(customer) => {
          handleDeleteCustomer(customer);
        }}
      />

      {/* ADD / EDIT CUSTOMER MODAL */}
      <CustomerFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        customerToEdit={customerToEdit}
      />

      {/* CSV IMPORT MODAL */}
      <CustomerImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={refreshCustomerList}
        showToast={showToast}
      />
    </div>
  );
}
