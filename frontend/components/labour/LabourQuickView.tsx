"use client";

import { useEffect, useState } from "react";
import { formatImageUrl, getApiUrl, getAuthToken } from "@/lib/api";
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
  AlertTriangle,
  FileText,
  Download,
  ExternalLink,
  Eye,
  UploadCloud,
  Loader2
} from "lucide-react";

interface LabourQuickViewProps {
  labour: Labour | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (labour: Labour) => void;
  onDelete: (labour: Labour) => void;
  onLabourUpdated?: (updated: Labour) => void;
}

export default function LabourQuickView({
  labour,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onLabourUpdated
}: LabourQuickViewProps) {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isUploadingAadhar, setIsUploadingAadhar] = useState(false);

  useEffect(() => {
    setImageError(false);
    setIsPreviewModalOpen(false);
    setIsUploadingAadhar(false);
  }, [labour?._id]);

  // Close on ESC key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (isPreviewModalOpen) {
          setIsPreviewModalOpen(false);
        } else {
          onClose();
        }
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
  }, [isOpen, onClose, isPreviewModalOpen]);

  if (!isOpen || !labour) return null;

  const statusInfo = getLabourStatus(labour.status);
  const imageUrl = labour.image ? formatImageUrl(labour.image) : "";
  const aadharUrl = labour.aadhar_image ? formatImageUrl(labour.aadhar_image) : "";
  const isPdf = Boolean(
    labour.aadhar_image &&
      (labour.aadhar_image.toLowerCase().endsWith(".pdf") ||
        labour.aadhar_image.includes("application/pdf"))
  );

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(labour.mobile_number);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 1500);
  };

  const handleDelete = () => {
    onDelete(labour);
    setShowDeleteConfirm(false);
  };

  const handleQuickAadharUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !labour) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit. Please choose a smaller file.");
      return;
    }

    try {
      setIsUploadingAadhar(true);
      const uploadData = new FormData();
      uploadData.append("file", file);
      const apiUrl = getApiUrl();
      const token = getAuthToken();
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const uploadRes = await fetch(`${apiUrl}/labours/upload`, {
        method: "POST",
        headers,
        body: uploadData
      });

      if (!uploadRes.ok) {
        const errJson = await uploadRes.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(errJson.detail || "Server rejected document format or size");
      }

      const data = await uploadRes.json();
      const finalAadharUrl = data.url || data.path;

      // Update labour in database
      const updateRes = await fetch(`${apiUrl}/labours/${labour._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: "include",
        body: JSON.stringify({ aadhar_image: finalAadharUrl })
      });

      if (updateRes.ok) {
        const updatedLabour = await updateRes.json();
        if (onLabourUpdated) {
          onLabourUpdated(updatedLabour);
        }
      } else {
        throw new Error("Failed to save Aadhaar document to staff record");
      }
    } catch (err: any) {
      alert(`Could not upload Aadhaar card: ${err.message || "Network error"}`);
    } finally {
      setIsUploadingAadhar(false);
    }
  };

  return (
    <>
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
                  <span>Aadhaar Verified</span>
                </span>
              ) : (
                <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Pending Upload
                </span>
              )}
            </div>

            {labour.aadhar_image ? (
              <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => setIsPreviewModalOpen(true)}
                    className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs cursor-pointer hover:ring-2 hover:ring-[#0260de] transition-all relative group"
                    title="Click to view full Aadhaar card"
                  >
                    {isPdf ? (
                      <div className="flex flex-col items-center justify-center p-1 text-center">
                        <FileText className="w-7 h-7 text-rose-500" />
                        <span className="text-[8px] font-black text-rose-700 mt-0.5">PDF</span>
                      </div>
                    ) : (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={aadharUrl}
                          alt="Aadhaar Document"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <Eye className="w-4 h-4" />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs mb-0.5">
                      <IdCard className="w-3.5 h-3.5 text-[#0260de]" />
                      <span>{isPdf ? "Aadhaar Card (PDF File)" : "Aadhaar Identity Card"}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium truncate">
                      Government KYC document on file
                    </p>
                    <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                      ✓ Ready for inspection &amp; verification
                    </p>
                  </div>
                </div>

                {/* Document Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setIsPreviewModalOpen(true)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-[#0260de] text-white text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Document</span>
                  </button>

                  <a
                    href={aadharUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                    title="Download or open in new tab"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Download</span>
                  </a>

                  <label className="inline-flex items-center justify-center p-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-[#0260de] transition-colors cursor-pointer" title="Replace with new file">
                    <UploadCloud className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="sr-only"
                      onChange={handleQuickAadharUpload}
                      disabled={isUploadingAadhar}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center hover:border-[#0260de] transition-colors">
                {isUploadingAadhar ? (
                  <div className="py-2 flex flex-col items-center justify-center">
                    <Loader2 className="w-7 h-7 text-[#0260de] animate-spin mb-2" />
                    <p className="text-xs font-bold text-slate-800">Uploading Aadhaar Card...</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Please wait while document is saved</p>
                  </div>
                ) : (
                  <>
                    <IdCard className="w-8 h-8 text-[#0260de] mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-slate-800">No Aadhaar Document Uploaded</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 mb-3">
                      Upload worker Aadhaar card (JPG, PNG, WebP or PDF, Max 10MB)
                    </p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#0260de] hover:bg-[#0252bf] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95">
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload Aadhaar Card</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="sr-only"
                        onChange={handleQuickAadharUpload}
                      />
                    </label>
                  </>
                )}
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

      {/* ========================================================= */}
      {/* FULL SCREEN AADHAAR CARD PREVIEW MODAL (LIGHTBOX) */}
      {/* ========================================================= */}
      {isPreviewModalOpen && labour.aadhar_image && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0260de] flex items-center justify-center">
                  <IdCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Aadhaar Identity Document • {labour.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Labour ID: <span className="font-mono font-bold text-slate-700">{labour.labour_id}</span> • {isPdf ? "PDF Document" : "Image File"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={aadharUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download</span>
                </a>
                <a
                  href={aadharUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors"
                  title="Open in new window"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Open in Tab</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100/60 flex items-center justify-center min-h-[300px]">
              {isPdf ? (
                <iframe
                  src={aadharUrl}
                  className="w-full h-[65vh] rounded-2xl border border-slate-200 shadow-xs bg-white"
                  title="Aadhaar PDF Viewer"
                />
              ) : (
                <div className="relative max-w-full max-h-[70vh] flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={aadharUrl}
                    alt={`Aadhaar Card for ${labour.name}`}
                    className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-md border border-slate-200 bg-white"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span className="font-medium">
                Official employee government verification document
              </span>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

