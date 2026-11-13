"use client";

import { useEffect, useState } from "react";
import {
  Customer,
  getCustomerStatus,
  extractCity
} from "./types";
import CustomerIllustration from "./CustomerIllustration";
import {
  X,
  Pencil,
  Trash2,
  Copy,
  Check,
  Phone,
  Mail,
  MapPin,
  Landmark,
  ShieldCheck,
  Building,
  CreditCard,
  FileText
} from "lucide-react";

interface CustomerQuickViewProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export default function CustomerQuickView({
  customer,
  isOpen,
  onClose,
  onEdit,
  onDelete
}: CustomerQuickViewProps) {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedGst, setCopiedGst] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Close on ESC key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
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

  if (!isOpen || !customer) return null;

  const statusInfo = getCustomerStatus(customer);
  const city = extractCity(customer.billing_address || customer.delivery_address);

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(customer.mobile_number);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 1500);
  };

  const handleCopyGst = () => {
    if (!customer.gst_number) return;
    navigator.clipboard.writeText(customer.gst_number);
    setCopiedGst(true);
    setTimeout(() => setCopiedGst(false), 1500);
  };

  const handleDelete = () => {
    onDelete(customer);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-over Drawer */}
      <div className="relative w-full max-w-xl bg-white shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-300 overflow-hidden">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200/90 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Customer Profile
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badgeBg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
              {statusInfo.label}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Banner & Visual Card */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 aspect-[16/9] shadow-xs flex items-center justify-center">
            <CustomerIllustration
              name={customer.name}
              isGstRegistered={statusInfo.isGst}
            />
          </div>

          {/* Primary Business Identity */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/70">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {city}
              </span>
              {customer.gst_number ? (
                <button
                  type="button"
                  onClick={handleCopyGst}
                  className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-emerald-700 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/80 hover:bg-emerald-100/60 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>GST: {customer.gst_number}</span>
                  {copiedGst ? (
                    <Check className="w-3 h-3 text-emerald-600 ml-1" />
                  ) : (
                    <Copy className="w-3 h-3 text-emerald-500 ml-1 opacity-70" />
                  )}
                </button>
              ) : (
                <span className="text-xs font-medium text-slate-400 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/40">
                  Unregistered Party
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {customer.name}
            </h2>
          </div>

          {/* Contact Information Card */}
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>Contact Coordinates</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200/60">
                <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                  Mobile Number
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {customer.mobile_number}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                    title="Copy phone"
                  >
                    {copiedPhone ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/60">
                <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                  Email Address
                </span>
                <span className="font-medium text-slate-700 truncate block">
                  {customer.email || "Not Provided"}
                </span>
              </div>
            </div>
          </div>

          {/* Addresses Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-blue-600" />
              <span>Registered Addresses</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200/70">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Billing Address
                </span>
                <p className="text-slate-700 whitespace-pre-line leading-relaxed font-medium">
                  {customer.billing_address || "Same as delivery address"}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/70">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Delivery Address / Warehouse
                </span>
                <p className="text-slate-700 whitespace-pre-line leading-relaxed font-medium">
                  {customer.delivery_address || "Not specified"}
                </p>
              </div>
            </div>
          </div>

          {/* Banking Remittance Details */}
          <div className="bg-gradient-to-br from-indigo-50/50 to-slate-50/70 rounded-2xl p-4 border border-indigo-100/80 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-indigo-600" />
                <span>Customer Remittance Bank Details</span>
              </h3>
              <span className="text-[10px] font-bold text-indigo-700 px-2 py-0.5 rounded-full bg-indigo-100/60">
                {customer.account_type || "Current Account"}
              </span>
            </div>

            {customer.bank_name || customer.account_number ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100/60">
                  <span className="text-[10px] font-semibold text-slate-400 block">Bank Name</span>
                  <span className="font-bold text-slate-900">{customer.bank_name || "—"}</span>
                </div>

                <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100/60">
                  <span className="text-[10px] font-semibold text-slate-400 block">Account Holder</span>
                  <span className="font-bold text-slate-900">{customer.account_holder_name || customer.name}</span>
                </div>

                <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100/60">
                  <span className="text-[10px] font-semibold text-slate-400 block">Account Number</span>
                  <span className="font-mono font-bold text-slate-900">{customer.account_number || "—"}</span>
                </div>

                <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100/60">
                  <span className="text-[10px] font-semibold text-slate-400 block">IFSC Code / Branch</span>
                  <span className="font-mono font-bold text-slate-900">
                    {customer.ifsc_code || "—"} {customer.branch_name ? `(${customer.branch_name})` : ""}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-white/70 rounded-xl border border-dashed border-indigo-200 text-center text-xs text-slate-500">
                No bank remittance details have been linked to this customer profile yet.
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-200/90 bg-white flex items-center justify-between gap-3 shrink-0">
          <div>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2.5 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Delete</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(customer);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0260de] hover:bg-[#0252bf] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

