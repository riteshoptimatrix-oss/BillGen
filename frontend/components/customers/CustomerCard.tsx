"use client";

import { useState, useRef, useEffect } from "react";
import {
  Customer,
  getCustomerStatus,
  extractCity
} from "./types";
import CustomerIllustration from "./CustomerIllustration";
import {
  Eye,
  Pencil,
  MoreVertical,
  Copy,
  Trash2,
  Check,
  Phone,
  Mail,
  MapPin,
  Landmark,
  ShieldCheck
} from "lucide-react";

interface CustomerCardProps {
  customer: Customer;
  onQuickView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export default function CustomerCard({
  customer,
  onQuickView,
  onEdit,
  onDelete
}: CustomerCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const statusInfo = getCustomerStatus(customer);
  const city = extractCity(customer.billing_address || customer.delivery_address);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(customer.mobile_number);
    setCopiedPhone(true);
    setTimeout(() => {
      setCopiedPhone(false);
      setIsMenuOpen(false);
    }, 1200);
  };

  return (
    <div
      onClick={() => onQuickView(customer)}
      className="group relative bg-white rounded-2xl border border-slate-200/80 hover:border-[#0260de]/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-full cursor-pointer overflow-hidden select-none"
    >
      {/* 1. VISUAL / AVATAR CONTAINER */}
      <div className="relative w-full aspect-[4/3] bg-gradient-to-b from-slate-50/90 to-white border-b border-slate-100 flex items-center justify-center overflow-hidden">
        {/* Top-Left: GST Status Badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-xs shadow-2xs ${statusInfo.badgeBg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
            {statusInfo.label}
          </span>
        </div>

        {/* Top-Right: Three-Dot Actions Menu */}
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2.5 right-2.5 z-20"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white text-slate-500 hover:text-slate-900 border border-slate-200/80 shadow-2xs flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs"
            title="Customer actions"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {/* Context Menu */}
          {isMenuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
            >
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onQuickView(customer);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-[#0260de]" />
                <span>Quick View</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onEdit(customer);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-400" />
                <span>Edit Profile</span>
              </button>

              <button
                type="button"
                onClick={handleCopyPhone}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
              >
                {copiedPhone ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-semibold">Copied Mobile</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Phone</span>
                  </>
                )}
              </button>

              <div className="h-px bg-slate-100 my-1" />

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onDelete(customer);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 font-semibold cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Delete Customer</span>
              </button>
            </div>
          )}
        </div>

        {/* Corporate Client Illustration Emblem */}
        <CustomerIllustration
          name={customer.name}
          isGstRegistered={statusInfo.isGst}
        />

        {/* Hover Quick View Pill Button */}
        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 text-slate-800 text-xs font-bold shadow-md transform translate-y-1 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5 text-[#0260de]" />
            <span>Quick View</span>
          </span>
        </div>
      </div>

      {/* 2. CARD CONTENT & METADATA */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Top Info Tags: City & GSTIN */}
          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 font-medium mb-1">
            <span className="truncate flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{city}</span>
            </span>

            {customer.gst_number ? (
              <span className="font-mono text-[10px] text-slate-600 font-semibold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200/80 shrink-0">
                {customer.gst_number.slice(0, 8)}...
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">Retail Party</span>
            )}
          </div>

          {/* Customer / Business Name */}
          <h3
            className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0260de] transition-colors line-clamp-2 leading-snug"
            title={customer.name}
          >
            {customer.name}
          </h3>

          {/* Contact Details: Mobile & Email */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="font-mono text-[11px] tracking-tight">{customer.mobile_number}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate text-[11px]">{customer.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. CARD FOOTER: BANK ACCOUNT BADGE */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
          {customer.bank_name ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Landmark className="w-3 h-3" />
              </div>
              <span className="text-[11px] font-semibold text-slate-700 truncate">
                {customer.bank_name}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-400 italic">No bank attached</span>
          )}

          <span className="text-[11px] font-semibold text-[#0260de] group-hover:underline shrink-0">
            View Ledger →
          </span>
        </div>
      </div>
    </div>
  );
}

