"use client";

import { useEffect, useState } from "react";
import { formatImageUrl } from "@/lib/api";
import {
  Labour,
  formatINR,
  getLabourStatus
} from "./types";
import LabourIllustration from "./LabourIllustration";
import {
  X,
  Pencil,
  Trash2,
  Copy,
  Check,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  IdCard,
  ShieldCheck,
  IndianRupee,
  AlertTriangle
} from "lucide-react";

interface LabourQuickViewProps {
  labour: Labour | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (labour: Labour) => void;
  onDelete: (labour: Labour) => void;
}

export default function LabourQuickView({
  labour,
  isOpen,
  onClose,
  onEdit,
  onDelete
}: LabourQuickViewProps) {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [labour?._id]);

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

  if (!isOpen || !labour) return null;

  const statusInfo = getLabourStatus(labour.status);
  const imageUrl = labour.image ? formatImageUrl(labour.image) : "";

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(labour.mobile_number);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 1500);
  };

  const handleDelete = () => {
    onDelete(labour);
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
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Staff Profile Details
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              ID: {labour.labour_id || "LBR-0001"}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyPhone}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Copy mobile number"
            >
              {copiedPhone ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Worker Photo or Technical Avatar */}
          <div className="relative w-full aspect-[4/3] rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-center overflow-hidden">
            {imageUrl && !imageError ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imageUrl}
                alt={labour.name}
                className="w-full h-full object-cover p-4 rounded-full"
                onError={() => setImageError(true)}
              />
            ) : (
              <LabourIllustration
                name={labour.name}
                workType={labour.work_type}
                labourId={labour.labour_id}
              />
            )}

            {/* Floating Status Badge */}
            <div className="absolute top-3 left-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-xs shadow-xs ${statusInfo.badgeBg}`}
              >
                <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`} />
                {statusInfo.label}
              </span>
            </div>
          </div>

          {/* Name & Basic Info Header */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                <span>{labour.work_type || "Full Time"}</span>
              </span>
              <span className="text-xs font-mono font-medium text-slate-400">
                {labour.labour_id || "LBR-0001"}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {labour.name}
            </h1>
          </div>

          {/* Wages / Salary Metric Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Compensation & Wages
            </span>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {formatINR(labour.salary)}
                </span>
                <span className="text-xs font-semibold text-slate-500">/ month</span>
              </div>
              <span className="text-xs font-medium text-slate-500">
                ≈ ₹{Math.round((labour.salary || 0) / 26).toLocaleString("en-IN")} / day (26 working days)
              </span>
            </div>
          </div>

          {/* Personal & Employment Details Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Employment Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block mb-1">Mobile Contact</span>
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{labour.mobile_number}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block mb-1">Joining Date</span>
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{labour.joining_date || "Not recorded"}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                <span className="text-slate-400 font-medium block mb-1">Residential Address</span>
                <div className="flex items-start gap-2 font-medium text-slate-900">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{labour.address || "Odhav / Ahmedabad, Gujarat"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* KYC Aadhar Document Verification Card */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Government Identity Document (KYC)
              </h3>
              {labour.aadhar_image ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified &amp; Uploaded</span>
                </span>
              ) : (
                <span className="text-[11px] font-medium text-slate-400">
                  Not Provided
                </span>
              )}
            </div>

            {labour.aadhar_image ? (
              <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-4 flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formatImageUrl(labour.aadhar_image)}
                    alt="Aadhar Document"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs mb-0.5">
                    <IdCard className="w-3.5 h-3.5 text-[#0260de]" />
                    <span>Aadhar Card Document</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    XXXX-XXXX-1234
                  </p>
                  <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                    ✓ Identity record on file
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                <IdCard className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                <p className="text-xs font-semibold text-slate-600">No KYC Document Attached</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Edit this profile to upload an Aadhar card photo.</p>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-5 border-t border-slate-200/80 bg-slate-50/70 flex items-center justify-between gap-3 shrink-0">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2 w-full animate-in fade-in">
              <span className="text-xs font-bold text-rose-600 flex-1 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Confirm permanent delete?</span>
              </span>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/80 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-xs cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                title="Delete labour profile"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(labour);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0260de] text-white text-xs font-bold hover:bg-[#0252bf] shadow-xs hover:shadow transition-all active:scale-95 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

