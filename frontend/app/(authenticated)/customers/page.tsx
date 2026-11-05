"use client";

import { useState, useEffect, useMemo } from "react";
import { getApiUrl } from "@/lib/api";
import {
  Users,
  Search,
  Plus,
  Trash2,
  Check,
  X,
  Phone,
  Mail,
  Building,
  MapPin,
  Landmark,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  CreditCard
} from "lucide-react";

interface Customer {
  _id: string;
  name: string;
  mobile_number: string;
  email?: string;
  gst_number?: string;
  delivery_address?: string;
  billing_address?: string;
  bank_name?: string;
  account_holder_name?: string;
  account_number?: string;
  ifsc_code?: string;
  branch_name?: string;
  account_type?: string;
}

type ViewState = "empty" | "create" | "edit";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeView, setActiveView] = useState<ViewState>("empty");
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // In mobile view, ALWAYS default to "directory" so the user sees the list first
  const [mobileView, setMobileView] = useState<"directory" | "detail">("directory");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "gst">("all");
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAdditional, setShowAdditional] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    mobile_number: "",
    email: "",
    gst_number: "",
    delivery_address: "",
    billing_address: "",
    bank_name: "",
    account_holder_name: "",
    account_number: "",
    ifsc_code: "",
    branch_name: "",
    account_type: "Current Account",
  });

  const fetchCustomers = async () => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/customers/`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
        if (data.length > 0 && activeView === "empty") {
          setActiveView("edit");
          setActiveCustomerId(data[0]._id);
          populateForm(data[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const populateForm = (customer: Customer) => {
    setFormData({
      name: customer.name || "",
      mobile_number: customer.mobile_number || "",
      email: customer.email || "",
      gst_number: customer.gst_number || "",
      delivery_address: customer.delivery_address || "",
      billing_address: customer.billing_address || "",
      bank_name: customer.bank_name || "",
      account_holder_name: customer.account_holder_name || "",
      account_number: customer.account_number || "",
      ifsc_code: customer.ifsc_code || "",
      branch_name: customer.branch_name || "",
      account_type: customer.account_type || "Current Account",
    });
    setHasChanges(false);
  };

  const handleCreateNewClick = () => {
    setActiveView("create");
    setActiveCustomerId(null);
    setFormData({
      name: "",
      mobile_number: "",
      email: "",
      gst_number: "",
      delivery_address: "",
      billing_address: "",
      bank_name: "",
      account_holder_name: "",
      account_number: "",
      ifsc_code: "",
      branch_name: "",
      account_type: "Current Account",
    });
    setHasChanges(true);
    setMobileView("detail");
  };

  const handleCustomerClick = (customer: Customer) => {
    setActiveView("edit");
    setActiveCustomerId(customer._id);
    populateForm(customer);
    setMobileView("detail");
  };

  const handleDeleteCustomer = async () => {
    if (!activeCustomerId) return;
    if (confirm("Are you sure you want to delete this customer?")) {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/customers/${activeCustomerId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          const updated = customers.filter((c) => c._id !== activeCustomerId);
          setCustomers(updated);
          if (updated.length > 0) {
            setActiveCustomerId(updated[0]._id);
            populateForm(updated[0]);
          } else {
            setActiveView("empty");
            setActiveCustomerId(null);
          }
          setMobileView("directory");
        }
      } catch (error) {
        console.error("Failed to delete customer:", error);
      }
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.mobile_number.trim()) {
      alert("Name and Mobile Number are required.");
      return;
    }

    setIsSaving(true);
    try {
      const apiUrl = getApiUrl();
      if (activeView === "create") {
        const res = await fetch(`${apiUrl}/customers/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const newCust = await res.json();
          setCustomers([newCust, ...customers]);
          setActiveCustomerId(newCust._id);
          setActiveView("edit");
          populateForm(newCust);
        } else {
          alert("Failed to create customer.");
        }
      } else if (activeView === "edit" && activeCustomerId) {
        const res = await fetch(`${apiUrl}/customers/${activeCustomerId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const updated = await res.json();
          setCustomers(
            customers.map((c) => (c._id === activeCustomerId ? updated : c))
          );
          populateForm(updated);
        } else {
          alert("Failed to update customer.");
        }
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      alert("An error occurred while saving.");
    } finally {
      setIsSaving(false);
      // Automatically redirect back to the Customers Directory on mobile!
      setMobileView("directory");
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.mobile_number.includes(searchQuery) ||
        (c.gst_number && c.gst_number.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchFilter = selectedFilter === "gst" ? !!c.gst_number : true;
      return matchSearch && matchFilter;
    });
  }, [customers, searchQuery, selectedFilter]);

  const activeCustomer = customers.find((c) => c._id === activeCustomerId);

  return (
    <div className="space-y-5 sm:space-y-6 pb-12 font-sans w-full max-w-full overflow-x-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 sm:gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0260de] text-white flex items-center justify-center shadow-xs shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#0f172a] tracking-tight">Customers</h1>
          </div>
          <p className="text-xs sm:text-sm text-[#64748b] font-medium mt-1 line-clamp-1 sm:line-clamp-none">
            Manage your verified dealer network, GSTIN registrations, and delivery destinations.
          </p>
        </div>

        <div className="w-full sm:w-auto">
          <button
            onClick={handleCreateNewClick}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0260de] hover:bg-[#0252bf] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Main Split-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Left Master List: Hidden on mobile when viewing detail; always visible on desktop (5 Cols) */}
        <div
          className={`lg:col-span-5 bg-white rounded-3xl p-4 sm:p-5 border border-[#e2e8f0] shadow-xs flex-col ${
            mobileView === "detail" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Filter Pills */}
          <div className="flex items-center gap-2 mb-3.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedFilter === "all"
                  ? "bg-[#0260de] text-white shadow-xs"
                  : "bg-[#f8fafc] text-[#64748b] hover:bg-[#e2e8f0]/60"
              }`}
            >
              All Clients ({customers.length})
            </button>
            <button
              onClick={() => setSelectedFilter("gst")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedFilter === "gst"
                  ? "bg-[#0260de] text-white shadow-xs"
                  : "bg-[#f8fafc] text-[#64748b] hover:bg-[#e2e8f0]/60"
              }`}
            >
              Registered GSTIN ({customers.filter((c) => !!c.gst_number).length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative mb-3.5">
            <Search className="w-4 h-4 text-[#64748b] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search customers, mobile, GST..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-medium text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de] transition-all"
            />
          </div>

          {/* Customer Cards List */}
          <div className="space-y-2 max-h-[500px] lg:max-h-[580px] overflow-y-auto pr-0.5">
            {isLoading ? (
              <div className="py-12 text-center text-[#64748b] text-xs">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#0260de] mb-2"></div>
                <p>Loading customers...</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="py-12 text-center text-[#64748b] text-xs font-medium">
                No customer records found.
              </div>
            ) : (
              filteredCustomers.map((customer) => {
                const isSelected = activeCustomerId === customer._id && activeView === "edit";
                const initials = customer.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                return (
                  <div
                    key={customer._id}
                    onClick={() => handleCustomerClick(customer)}
                    className={`p-3 sm:p-3.5 rounded-2xl cursor-pointer transition-all flex items-center justify-between border ${
                      isSelected
                        ? "bg-[#0260de] text-white border-[#0260de] shadow-xs"
                        : "bg-[#f8fafc] hover:bg-[#eff6ff] border-[#e2e8f0] text-[#0f172a]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <div
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-[#0260de]/10 text-[#0260de]"
                        }`}
                      >
                        {initials || "SV"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4
                          className={`text-xs sm:text-sm font-bold truncate ${
                            isSelected ? "text-white" : "text-[#0f172a]"
                          }`}
                        >
                          {customer.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-[11px] font-medium truncate ${
                              isSelected ? "text-blue-100" : "text-[#64748b]"
                            }`}
                          >
                            {customer.mobile_number}
                          </span>
                          {customer.gst_number && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                isSelected
                                  ? "bg-white/20 text-white"
                                  : "bg-[#0260de]/10 text-[#0260de]"
                              }`}
                            >
                              GSTIN
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isSelected ? "text-white translate-x-0.5" : "text-[#64748b]"
                      }`}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Detail / Edit Workspace: Hidden on mobile by default; shown when a card or Add is tapped */}
        <div
          className={`lg:col-span-7 bg-white rounded-3xl p-4 sm:p-6 border border-[#e2e8f0] shadow-xs ${
            mobileView === "directory" ? "hidden lg:block" : "block"
          }`}
        >
          {/* Mobile Back Button */}
          <div className="lg:hidden pb-1">
            <button
              type="button"
              onClick={() => setMobileView("directory")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0260de] hover:text-[#0252bf] p-1 -ml-1 transition-colors cursor-pointer mb-2"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Back to Customers Directory</span>
            </button>
          </div>

          {activeView === "empty" ? (
            <div className="py-20 text-center text-[#64748b]">
              <div className="w-16 h-16 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center mx-auto mb-3 text-[#0260de]">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-[#0f172a]">No Customer Selected</h3>
              <p className="text-xs text-[#64748b] mt-1 max-w-sm mx-auto">
                Select a client from the directory on the left or add a new customer profile.
              </p>
              <button
                onClick={handleCreateNewClick}
                className="mt-4 px-4 py-2 bg-[#0260de] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#0252bf] cursor-pointer"
              >
                + Create New Customer
              </button>
            </div>
          ) : (
            <div className="space-y-5 sm:space-y-6">
              {/* Workspace Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-[#e2e8f0] gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#0f172a]">
                    {activeView === "create" ? "Add New Customer" : "Customer Profile"}
                  </h3>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    {activeView === "create"
                      ? "Enter client identity, contact information, and GST details."
                      : "Review and update client parameters, billing address, and bank accounts."}
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-1 sm:pt-0">
                  {activeView === "edit" && activeCustomerId && (
                    <button
                      type="button"
                      onClick={handleDeleteCustomer}
                      className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer shrink-0"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (activeView === "create") {
                        if (customers.length > 0) {
                          setActiveView("edit");
                          setActiveCustomerId(customers[0]._id);
                          populateForm(customers[0]);
                        } else {
                          setActiveView("empty");
                        }
                      } else {
                        if (activeCustomer) populateForm(activeCustomer);
                      }
                      setMobileView("directory");
                    }}
                    className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-bold text-[#64748b] hover:bg-[#f8fafc] border border-[#e2e8f0] rounded-xl transition-colors cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2 bg-[#0260de] hover:bg-[#0252bf] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-70 cursor-pointer whitespace-nowrap"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                  </button>
                </div>
              </div>

              {/* Form Body */}
              <div className="space-y-4 sm:space-y-5">
                {/* Primary Identifiers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                      Client / Company Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        setHasChanges(true);
                      }}
                      placeholder="e.g. Gujarat Auto Spares & Body Works"
                      className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3.5 py-2 sm:py-2.5 text-xs font-bold text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                      Mobile Number *
                    </label>
                    <input
                      type="text"
                      value={formData.mobile_number}
                      onChange={(e) => {
                        setFormData({ ...formData, mobile_number: e.target.value });
                        setHasChanges(true);
                      }}
                      placeholder="+91 98250 14829"
                      className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3.5 py-2 sm:py-2.5 text-xs font-bold text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        setHasChanges(true);
                      }}
                      placeholder="client@automotive.com"
                      className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3.5 py-2 sm:py-2.5 text-xs font-medium text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                      GSTIN Number (15 Digits)
                    </label>
                    <input
                      type="text"
                      value={formData.gst_number}
                      onChange={(e) => {
                        setFormData({ ...formData, gst_number: e.target.value.toUpperCase() });
                        setHasChanges(true);
                      }}
                      placeholder="24AAAFO1234F1Z9"
                      className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3.5 py-2 sm:py-2.5 text-xs font-mono font-bold text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de] transition-all"
                    />
                  </div>
                </div>

                {/* Addresses */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                      Delivery / Factory Address
                    </label>
                    <textarea
                      rows={3}
                      value={formData.delivery_address}
                      onChange={(e) => {
                        setFormData({ ...formData, delivery_address: e.target.value });
                        setHasChanges(true);
                      }}
                      placeholder="Plot 42, GIDC Industrial Estate, Odhav, Ahmedabad, Gujarat 382415"
                      className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3.5 py-2 text-xs font-medium text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de] transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                      Billing Address (if different)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.billing_address}
                      onChange={(e) => {
                        setFormData({ ...formData, billing_address: e.target.value });
                        setHasChanges(true);
                      }}
                      placeholder="Corporate Head Office, C.G. Road, Ahmedabad, Gujarat"
                      className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3.5 py-2 text-xs font-medium text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de] transition-all resize-none"
                    />
                  </div>
                </div>

                {/* 4 Stat Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
                  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-2.5 sm:p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Status</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eaf8ea] text-[#1e822d] border border-[#c4eec4]">
                      Active Client
                    </span>
                  </div>

                  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-2.5 sm:p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Tax Regime</p>
                    <p className="text-xs font-bold text-[#0f172a] mt-1 truncate">
                      {formData.gst_number ? "Regular GSTIN" : "Unregistered"}
                    </p>
                  </div>

                  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-2.5 sm:p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">State Code</p>
                    <p className="text-xs font-bold text-[#0f172a] mt-1">24 - Gujarat</p>
                  </div>

                  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-2.5 sm:p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Payment Term</p>
                    <p className="text-xs font-bold text-[#0f172a] mt-1">15 Days Net</p>
                  </div>
                </div>

                {/* Collapsible Bank & Remittance Section */}
                <div className="border border-[#e2e8f0] rounded-2xl overflow-hidden bg-[#f8fafc]">
                  <button
                    type="button"
                    onClick={() => setShowAdditional(!showAdditional)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left font-bold text-xs text-[#0f172a] hover:bg-[#f8fafc] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-[#0260de]" />
                      <span>Bank &amp; Remittance Details</span>
                    </div>
                    {showAdditional ? (
                      <ChevronUp className="w-4 h-4 text-[#64748b]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#64748b]" />
                    )}
                  </button>

                  {showAdditional && (
                    <div className="p-3.5 sm:p-4 pt-1 bg-white border-t border-[#e2e8f0] grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748b] mb-1">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          value={formData.bank_name}
                          onChange={(e) => {
                            setFormData({ ...formData, bank_name: e.target.value });
                            setHasChanges(true);
                          }}
                          placeholder="Bank of Baroda"
                          className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-xs font-medium text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#0260de]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748b] mb-1">
                          Account Holder Name
                        </label>
                        <input
                          type="text"
                          value={formData.account_holder_name}
                          onChange={(e) => {
                            setFormData({ ...formData, account_holder_name: e.target.value });
                            setHasChanges(true);
                          }}
                          placeholder="Gujarat Auto Spares"
                          className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-xs font-medium text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#0260de]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748b] mb-1">
                          Account Number
                        </label>
                        <input
                          type="text"
                          value={formData.account_number}
                          onChange={(e) => {
                            setFormData({ ...formData, account_number: e.target.value });
                            setHasChanges(true);
                          }}
                          placeholder="01420200001234"
                          className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-xs font-mono font-medium text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#0260de]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748b] mb-1">
                          IFSC Code
                        </label>
                        <input
                          type="text"
                          value={formData.ifsc_code}
                          onChange={(e) => {
                            setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase() });
                            setHasChanges(true);
                          }}
                          placeholder="BARB0ODHAVA"
                          className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-xs font-mono font-medium text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#0260de]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
