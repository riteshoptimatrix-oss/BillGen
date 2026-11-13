"use client";

import { useState, useRef, useEffect } from "react";
import { formatImageUrl } from "@/lib/api";
import {
  Labour,
  formatINR,
  getLabourStatus
} from "./types";
import LabourIllustration from "./LabourIllustration";
import {
  Eye,
  Pencil,
  MoreVertical,
  Copy,
  Trash2,
  Check,
  Briefcase,
  Phone,
  ArrowUpRight,
  ShieldCheck
} from "lucide-react";

interface LabourCardProps {
  labour: Labour;
  onQuickView: (labour: Labour) => void;
  onEdit: (labour: Labour) => void;
  onDelete: (labour: Labour) => void;
}

export default function LabourCard({
  labour,
  onQuickView,
  onEdit,
  onDelete
}: LabourCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const statusInfo = getLabourStatus(labour.status);
  const imageUrl = labour.image ? formatImageUrl(labour.image) : "";

  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

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
    navigator.clipboard.writeText(labour.mobile_number);
    setCopiedPhone(true);
    setTimeout(() => {
      setCopiedPhone(false);
      setIsMenuOpen(false);
    }, 1200);
  };

  return (
    <div
      onClick={() => onQuickView(labour)}
      className="group relative bg-white rounded-2xl border border-slate-200/80 hover:border-[#0260de]/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-full cursor-pointer overflow-hidden select-none"
    >
      {/* 1. PROFILE VISUAL / IMAGE CONTAINER */}
      <div className="relative w-full aspect-[4/3] bg-gradient-to-b from-slate-50/90 to-white border-b border-slate-100 flex items-center justify-center overflow-hidden">
        {/* Top-Left: Status Badge */}
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
            title="Labour actions"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {/* Clean Context Menu */}
          {isMenuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
            >
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onQuickView(labour);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-[#0260de]" />
                <span>View Full Profile</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onEdit(labour);
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
                    <span>Copy Mobile</span>
                  </>
                )}
              </button>

              <div className="h-px bg-slate-100 my-1" />

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onDelete(labour);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 font-semibold cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Delete Profile</span>
              </button>
            </div>
          )}
        </div>

        {/* Real Profile Photo OR Guaranteed Technical Technician Illustration */}
        {imageUrl && !imageError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt={labour.name}
            loading="lazy"
            className="w-full h-full object-cover p-2.5 rounded-full transition-transform duration-300 ease-out group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <LabourIllustration
            name={labour.name}
            workType={labour.work_type}
            labourId={labour.labour_id}
          />
        )}

        {/* Hover Bottom Action Pill: Quick View */}
        <div className="absolute inset-x-0 bottom-2.5 flex justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 pointer-events-none z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(labour);
            }}
            className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0f172a]/90 hover:bg-[#0260de] text-white text-[11px] font-bold rounded-full shadow-md backdrop-blur-xs transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>
        </div>
      </div>

      {/* 2. CARD CONTENT & METADATA */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          {/* Work Type & Labour ID Sub-row */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 truncate">
              <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{labour.work_type || "Full Time"}</span>
            </span>
            <span className="text-[10px] font-mono font-medium text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 shrink-0 border border-slate-200/50">
              {labour.labour_id || "LBR-0001"}
            </span>
          </div>

          {/* Labour Full Name */}
          <h3
            className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0260de] transition-colors line-clamp-1 leading-snug"
            title={labour.name}
          >
            {labour.name}
          </h3>

          {/* Contact Mobile */}
          <p className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1">
            <Phone className="w-3 h-3 text-slate-400" />
            <span>{labour.mobile_number}</span>
          </p>
        </div>

        {/* 3. WAGES & VERIFICATION FOOTER */}
        <div className="pt-2.5 border-t border-slate-100 flex items-end justify-between gap-2">
          {/* Monthly Wages / Salary */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Monthly Wages
            </span>
            <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {formatINR(labour.salary)}
            </span>
          </div>

          {/* Aadhar Verified Status */}
          <div className="text-right">
            {labour.aadhar_image ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickView(labour);
                }}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 transition-colors cursor-pointer"
                title="View Aadhaar KYC document"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Aadhaar Done</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickView(labour);
                }}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 transition-colors cursor-pointer"
                title="Click to upload Aadhaar card"
              >
                <span>+ Aadhaar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

