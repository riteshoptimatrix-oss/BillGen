"use client";

import { useState, useEffect } from "react";
import { getApiUrl } from "@/lib/api";
import { Customer } from "./types";
import {
  X,
  Check,
  Building,
  Phone,
  Mail,
  MapPin,
  Landmark,
  ShieldCheck,
  CreditCard,
  Copy
} from "lucide-react";

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customer: Customer, isNew: boolean) => void;
  customerToEdit?: Customer | null;
}

export default function CustomerFormModal({
  isOpen,
  onClose,
  onSuccess,
  customerToEdit
}: CustomerFormModalProps) {
  const isEditing = !!customerToEdit;

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
    account_type: "Current Account"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "addresses" | "banking">("profile");

  useEffect(() => {
    if (customerToEdit) {
      setFormData({
        name: customerToEdit.name || "",
        mobile_number: customerToEdit.mobile_number || "",
        email: customerToEdit.email || "",
        gst_number: customerToEdit.gst_number || "",
        delivery_address: customerToEdit.delivery_address || "",
        billing_address: customerToEdit.billing_address || "",
        bank_name: customerToEdit.bank_name || "",
        account_holder_name: customerToEdit.account_holder_name || "",
        account_number: customerToEdit.account_number || "",
        ifsc_code: customerToEdit.ifsc_code || "",
        branch_name: customerToEdit.branch_name || "",
        account_type: customerToEdit.account_type || "Current Account"
      });
    } else {
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
        account_type: "Current Account"
      });
    }
    setErrorMessage(null);
    setActiveTab("profile");
  }, [customerToEdit, isOpen]);

  // Close on ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyBillingToDelivery = () => {
    setFormData((prev) => ({
      ...prev,
      delivery_address: prev.billing_address
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMessage("Customer / Business name is required.");
      setActiveTab("profile");
      return;
    }
    if (!formData.mobile_number.trim()) {
      setErrorMessage("Primary contact mobile number is required.");
      setActiveTab("profile");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const apiUrl = getApiUrl();
      const payload = {
        ...formData,
        account_holder_name: formData.account_holder_name || formData.name
      };

      let res: Response;
      if (isEditing && customerToEdit?._id) {
        res = await fetch(`${apiUrl}/customers/${customerToEdit._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${apiUrl}/customers/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        const saved: Customer = await res.json();
        onSuccess(saved, !isEditing);
        onClose();
      } else {
        const errData = await res.json().catch(() => null);
        setErrorMessage(errData?.detail || "Failed to save customer profile.");
      }
    } catch (err) {
      console.error("Save error", err);
      setErrorMessage("Network error connecting to backend service.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh] z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-200/90 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0260de] flex items-center justify-center shrink-0">
              <Building className="w-5 h-5" strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {isEditing ? "Edit Customer Profile" : "Register New Customer"}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {isEditing
                  ? "Update business credentials, addresses and banking details"
                  : "Add commercial client, billing contacts and GST details"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-slate-200/90 bg-slate-50/60 px-6 shrink-0 gap-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`py-3 relative transition-colors cursor-pointer ${
              activeTab === "profile"
                ? "text-[#0260de]"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Client Profile & GST
            {activeTab === "profile" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0260de] rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("addresses")}
            className={`py-3 relative transition-colors cursor-pointer ${
              activeTab === "addresses"
                ? "text-[#0260de]"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Addresses & Logistics
            {activeTab === "addresses" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0260de] rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("banking")}
            className={`py-3 relative transition-colors cursor-pointer ${
              activeTab === "banking"
                ? "text-[#0260de]"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Bank Remittance
            {activeTab === "banking" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0260de] rounded-full" />
            )}
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* TAB 1: CLIENT PROFILE & GSTIN */}
            {activeTab === "profile" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Customer / Business Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Malwa Three-Wheeler Logistics & Spares"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0260de] focus:ring-2 focus:ring-[#0260de]/10 transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Primary Contact Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={formData.mobile_number}
                        onChange={(e) =>
                          setFormData({ ...formData, mobile_number: e.target.value })
                        }
                        placeholder="98765 43210"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 font-mono focus:outline-none focus:bg-white focus:border-[#0260de] focus:ring-2 focus:ring-[#0260de]/10 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="billing@customer.com"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#0260de] focus:ring-2 focus:ring-[#0260de]/10 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      GST Identification Number (GSTIN)
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">
                      15-character alphanumeric
                    </span>
                  </div>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      maxLength={15}
                      value={formData.gst_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gst_number: e.target.value.toUpperCase().trim()
                        })
                      }
                      placeholder="e.g. 24AAACM7412P1ZL"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 font-mono uppercase tracking-wider focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all font-semibold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ADDRESSES & LOGISTICS */}
            {activeTab === "addresses" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Billing Address (Registered Entity)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.billing_address}
                    onChange={(e) =>
                      setFormData({ ...formData, billing_address: e.target.value })
                    }
                    placeholder="Plot / Street, Industrial Estate, City, State, PIN Code"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0260de] focus:ring-2 focus:ring-[#0260de]/10 transition-all font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Delivery Address / Warehouse
                    </label>
                    <button
                      type="button"
                      onClick={handleCopyBillingToDelivery}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0260de] hover:underline cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Same as Billing</span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.delivery_address}
                    onChange={(e) =>
                      setFormData({ ...formData, delivery_address: e.target.value })
                    }
                    placeholder="Consignee warehouse address for invoice generation"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0260de] focus:ring-2 focus:ring-[#0260de]/10 transition-all font-medium"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: BANK REMITTANCE */}
            {activeTab === "banking" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={formData.bank_name}
                      onChange={(e) =>
                        setFormData({ ...formData, bank_name: e.target.value })
                      }
                      placeholder="e.g. State Bank of India"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0260de] focus:ring-2 focus:ring-[#0260de]/10 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Account Type
                    </label>
                    <select
                      value={formData.account_type}
                      onChange={(e) =>
                        setFormData({ ...formData, account_type: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#0260de] focus:ring-2 focus:ring-[#0260de]/10 transition-all font-medium"
                    >
                      <option value="Current Account">Current Account</option>
                      <option value="Savings Account">Savings Account</option>
                      <option value="Cash Credit (CC)">Cash Credit (CC)</option>
                      <option value="Overdraft (OD)">Overdraft (OD)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={formData.account_number}
                      onChange={(e) =>
                        setFormData({ ...formData, account_number: e.target.value })
                      }
                      placeholder="e.g. 39482019482"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 font-mono focus:outline-none focus:bg-white focus:border-[#0260de] focus:ring-2 focus:ring-[#0260de]/10 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={formData.ifsc_code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ifsc_code: e.target.value.toUpperCase().trim()
                        })
                      }
                      placeholder="e.g. SBIN0001042"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 font-mono uppercase focus:outline-none focus:bg-white focus:border-[#0260de] focus:ring-2 focus:ring-[#0260de]/10 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={formData.account_holder_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          account_holder_name: e.target.value
                        })
                      }
                      placeholder="Defaults to Business Name"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0260de] focus:ring-2 focus:ring-[#0260de]/10 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Branch Name / City
                    </label>
                    <input
                      type="text"
                      value={formData.branch_name}
                      onChange={(e) =>
                        setFormData({ ...formData, branch_name: e.target.value })
                      }
                      placeholder="e.g. Odhav Industrial Branch"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0260de] focus:ring-2 focus:ring-[#0260de]/10 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-slate-200/90 bg-white flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              {activeTab !== "profile" && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(activeTab === "banking" ? "addresses" : "profile")
                  }
                  className="px-3.5 py-2 rounded-xl text-slate-600 text-xs font-medium hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  ← Back
                </button>
              )}

              {activeTab !== "banking" ? (
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(activeTab === "profile" ? "addresses" : "banking")
                  }
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Next Section →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0260de] hover:bg-[#0252bf] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {isSubmitting
                      ? "Saving..."
                      : isEditing
                      ? "Update Customer"
                      : "Create Customer"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

