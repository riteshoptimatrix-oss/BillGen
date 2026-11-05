"use client";

import { useState, useEffect, useMemo } from "react";
import { getApiUrl } from "@/lib/api";
import {
  Users,
  Search,
  Plus,
  Trash2,
  Save,
  X,
  Phone,
  Mail,
  Building,
  MapPin,
  Landmark,
  ShieldCheck,
  ChevronRight,
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
          // Select the first customer automatically on desktop
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
  };

  const handleCustomerClick = (customer: Customer) => {
    setActiveView("edit");
    setActiveCustomerId(customer._id);
    populateForm(customer);
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
            setActiveView("edit");
          } else {
            setActiveView("empty");
            setActiveCustomerId(null);
          }
        } else {
          alert("Failed to delete customer.");
        }
      } catch (err) {
        console.error("Delete customer error:", err);
      }
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.mobile_number.trim()) {
      alert("Customer Name and Mobile Number are required!");
      return;
    }

    setIsSaving(true);
    try {
      const apiUrl = getApiUrl();
      const endpoint =
        activeView === "create"
          ? `${apiUrl}/customers/`
          : `${apiUrl}/customers/${activeCustomerId}`;
      const method = activeView === "create" ? "POST" : "PUT";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const savedCustomer = await res.json();
        setHasChanges(false);
        await fetchCustomers();
        setActiveView("edit");
        setActiveCustomerId(savedCustomer._id || savedCustomer.id || activeCustomerId);
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to save customer");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("An error occurred while saving.");
    } finally {
      setIsSaving(false);
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
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5c341f] text-white flex items-center justify-center shadow-xs">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black text-[#23160e] tracking-tight">Customers</h1>
          </div>
          <p className="text-xs text-[#8a7566] mt-1">
            Manage your verified dealer network, GSTIN registrations, and delivery destinations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateNewClick}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#5c341f] hover:bg-[#472716] text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Main Split-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Master List (4 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-[#ede5dd] shadow-xs flex flex-col">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedFilter === "all"
                  ? "bg-[#5c341f] text-white shadow-xs"
                  : "bg-[#faf7f4] text-[#8a7566] hover:bg-[#ede5dd]/60"
              }`}
            >
              All Clients ({customers.length})
            </button>
            <button
              onClick={() => setSelectedFilter("gst")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedFilter === "gst"
                  ? "bg-[#5c341f] text-white shadow-xs"
                  : "bg-[#faf7f4] text-[#8a7566] hover:bg-[#ede5dd]/60"
              }`}
            >
              Registered GSTIN ({customers.filter((c) => !!c.gst_number).length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 text-[#8a7566] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search customers, mobile, GST..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#faf7f4] border border-[#ede5dd] rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium text-[#23160e] placeholder-[#8a7566] focus:outline-none focus:ring-2 focus:ring-[#5c341f]/20 focus:border-[#5c341f] transition-all"
            />
          </div>

          {/* Customer Cards List */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-12 text-center text-[#8a7566] text-xs">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#5c341f] mb-2"></div>
                <p>Loading customers...</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="py-12 text-center text-[#8a7566] text-xs font-medium">
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
                    className={`p-3.5 rounded-2xl cursor-pointer transition-all flex items-center justify-between border ${
                      isSelected
                        ? "bg-[#5c341f] text-white border-[#5c341f] shadow-xs"
                        : "bg-[#faf7f4] hover:bg-[#f4ede6] border-[#ede5dd] text-[#23160e]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-[#5c341f]/10 text-[#5c341f]"
                        }`}
                      >
                        {initials || "SV"}
                      </div>
                      <div className="min-w-0">
                        <h4
                          className={`text-xs font-bold truncate ${
                            isSelected ? "text-white" : "text-[#23160e]"
                          }`}
                        >
                          {customer.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-[11px] font-medium truncate ${
                              isSelected ? "text-white/80" : "text-[#8a7566]"
                            }`}
                          >
                            {customer.mobile_number}
                          </span>
                          {customer.gst_number && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                isSelected
                                  ? "bg-white/20 text-white"
                                  : "bg-[#5c341f]/10 text-[#5c341f]"
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
                        isSelected ? "text-white translate-x-0.5" : "text-[#8a7566]"
                      }`}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Detail / Edit Workspace (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#ede5dd] shadow-xs">
          {activeView === "empty" ? (
            <div className="py-24 text-center text-[#8a7566]">
              <div className="w-16 h-16 rounded-2xl bg-[#faf7f4] border border-[#ede5dd] flex items-center justify-center mx-auto mb-3 text-[#5c341f]">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-[#23160e]">No Customer Selected</h3>
              <p className="text-xs text-[#8a7566] mt-1 max-w-sm mx-auto">
                Select a client from the directory on the left or add a new customer profile.
              </p>
              <button
                onClick={handleCreateNewClick}
                className="mt-4 px-4 py-2 bg-[#5c341f] text-white text-xs font-semibold rounded-xl shadow-xs hover:bg-[#472716]"
              >
                + Create New Customer
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Workspace Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#ede5dd]">
                <div>
                  <h3 className="text-base font-black text-[#23160e]">
                    {activeView === "create" ? "Add New Customer" : "Customer Profile"}
                  </h3>
                  <p className="text-xs text-[#8a7566] mt-0.5">
                    {activeView === "create"
                      ? "Enter client identity, contact information, and GST details."
                      : "Review and update client parameters, billing address, and bank accounts."}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {activeView === "edit" && activeCustomerId && (
                    <button
                      type="button"
                      onClick={handleDeleteCustomer}
                      className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
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
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-[#8a7566] hover:bg-[#faf7f4] border border-[#ede5dd] rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-5 py-2 bg-[#5c341f] hover:bg-[#472716] text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-70 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                  </button>
                </div>
              </div>

              {/* Form Body */}
              <div className="space-y-5">
                {/* Primary Identifiers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8a7566] mb-1.5">
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
                      className="w-full bg-[#faf7f4] border border-[#ede5dd] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#23160e] placeholder-[#8a7566] focus:outline-none focus:ring-2 focus:ring-[#5c341f]/20 focus:border-[#5c341f] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8a7566] mb-1.5">
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
                      className="w-full bg-[#faf7f4] border border-[#ede5dd] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#23160e] placeholder-[#8a7566] focus:outline-none focus:ring-2 focus:ring-[#5c341f]/20 focus:border-[#5c341f] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8a7566] mb-1.5">
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
                      className="w-full bg-[#faf7f4] border border-[#ede5dd] rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#23160e] placeholder-[#8a7566] focus:outline-none focus:ring-2 focus:ring-[#5c341f]/20 focus:border-[#5c341f] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8a7566] mb-1.5">
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
                      className="w-full bg-[#faf7f4] border border-[#ede5dd] rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-[#23160e] placeholder-[#8a7566] focus:outline-none focus:ring-2 focus:ring-[#5c341f]/20 focus:border-[#5c341f] transition-all"
                    />
                  </div>
                </div>

                {/* Addresses */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8a7566] mb-1.5">
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
                      className="w-full bg-[#faf7f4] border border-[#ede5dd] rounded-xl px-3.5 py-2 text-xs font-medium text-[#23160e] placeholder-[#8a7566] focus:outline-none focus:ring-2 focus:ring-[#5c341f]/20 focus:border-[#5c341f] transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8a7566] mb-1.5">
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
                      className="w-full bg-[#faf7f4] border border-[#ede5dd] rounded-xl px-3.5 py-2 text-xs font-medium text-[#23160e] placeholder-[#8a7566] focus:outline-none focus:ring-2 focus:ring-[#5c341f]/20 focus:border-[#5c341f] transition-all resize-none"
                    />
                  </div>
                </div>

                {/* 4 Stat Badges matching the Product page design */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="bg-[#faf7f4] border border-[#ede5dd] rounded-2xl p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a7566]">Status</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eaf8ea] text-[#1e822d] border border-[#c4eec4]">
                      Active Client
                    </span>
                  </div>

                  <div className="bg-[#faf7f4] border border-[#ede5dd] rounded-2xl p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a7566]">Tax Regime</p>
                    <p className="text-xs font-bold text-[#23160e] mt-1">
                      {formData.gst_number ? "Regular GSTIN" : "Unregistered"}
                    </p>
                  </div>

                  <div className="bg-[#faf7f4] border border-[#ede5dd] rounded-2xl p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a7566]">State Code</p>
                    <p className="text-xs font-bold text-[#23160e] mt-1">24 - Gujarat</p>
                  </div>

                  <div className="bg-[#faf7f4] border border-[#ede5dd] rounded-2xl p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a7566]">Payment Term</p>
                    <p className="text-xs font-bold text-[#23160e] mt-1">15 Days Net</p>
                  </div>
                </div>

                {/* Collapsible Bank & Remittance Section */}
                <div className="border border-[#ede5dd] rounded-2xl overflow-hidden bg-[#faf7f4]">
                  <button
                    type="button"
                    onClick={() => setShowAdditional(!showAdditional)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left font-bold text-xs text-[#23160e] hover:bg-[#f4ede6] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-[#5c341f]" />
                      <span>Bank &amp; Remittance Details</span>
                    </div>
                    {showAdditional ? (
                      <ChevronUp className="w-4 h-4 text-[#8a7566]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#8a7566]" />
                    )}
                  </button>

                  {showAdditional && (
                    <div className="p-4 pt-1 bg-white border-t border-[#ede5dd] grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8a7566] mb-1">
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
                          className="w-full bg-[#faf7f4] border border-[#ede5dd] rounded-xl px-3 py-2 text-xs font-medium text-[#23160e] focus:outline-none focus:ring-1 focus:ring-[#5c341f]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8a7566] mb-1">
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
                          className="w-full bg-[#faf7f4] border border-[#ede5dd] rounded-xl px-3 py-2 text-xs font-medium text-[#23160e] focus:outline-none focus:ring-1 focus:ring-[#5c341f]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8a7566] mb-1">
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
                          className="w-full bg-[#faf7f4] border border-[#ede5dd] rounded-xl px-3 py-2 text-xs font-mono font-medium text-[#23160e] focus:outline-none focus:ring-1 focus:ring-[#5c341f]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8a7566] mb-1">
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
                          className="w-full bg-[#faf7f4] border border-[#ede5dd] rounded-xl px-3 py-2 text-xs font-mono font-medium text-[#23160e] focus:outline-none focus:ring-1 focus:ring-[#5c341f]"
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
