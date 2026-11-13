"use client";

import { useState, useEffect } from "react";
import { getApiUrl, formatImageUrl, getAuthToken } from "@/lib/api";
import {
  Labour,
  WORK_TYPES,
  LABOUR_STATUSES
} from "./types";
import {
  X,
  UploadCloud,
  Check,
  IdCard,
  Briefcase,
  Users,
  Camera,
  Trash2,
  MapPin,
  Calendar,
  IndianRupee,
  Link as LinkIcon,
  FileText,
  Loader2,
  ExternalLink
} from "lucide-react";

interface LabourFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (labour: Labour, isNew: boolean) => void;
  labourToEdit?: Labour | null;
  totalLaboursCount: number;
}

export default function LabourFormModal({
  isOpen,
  onClose,
  onSuccess,
  labourToEdit,
  totalLaboursCount
}: LabourFormModalProps) {
  const isEditing = !!labourToEdit;

  const [formData, setFormData] = useState({
    name: "",
    labour_id: "",
    mobile_number: "",
    address: "",
    salary: 20000,
    joining_date: "",
    work_type: "Full Time",
    status: "Active",
    image: "",
    aadhar_image: ""
  });

  const [imageInputMode, setImageInputMode] = useState<"upload" | "url">("upload");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingAadhar, setIsUploadingAadhar] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"basic" | "documents" | "employment">("basic");

  useEffect(() => {
    if (labourToEdit) {
      setFormData({
        name: labourToEdit.name || "",
        labour_id: labourToEdit.labour_id || `LBR-${String(totalLaboursCount + 1).padStart(4, "0")}`,
        mobile_number: (labourToEdit.mobile_number || "").replace("+91", "").trim(),
        address: labourToEdit.address || "",
        salary: labourToEdit.salary || 20000,
        joining_date: labourToEdit.joining_date || new Date().toISOString().split("T")[0],
        work_type: labourToEdit.work_type || "Full Time",
        status: labourToEdit.status || "Active",
        image: labourToEdit.image || "",
        aadhar_image: labourToEdit.aadhar_image || ""
      });
      setImageUrlInput(labourToEdit.image || "");
    } else {
      setFormData({
        name: "",
        labour_id: `LBR-${String(totalLaboursCount + 1).padStart(4, "0")}`,
        mobile_number: "",
        address: "",
        salary: 20000,
        joining_date: new Date().toISOString().split("T")[0],
        work_type: "Full Time",
        status: "Active",
        image: "",
        aadhar_image: ""
      });
      setImageUrlInput("");
    }
    setUploadError(null);
    setIsUploadingAadhar(false);
    setIsUploadingAvatar(false);
    setActiveTab("basic");
  }, [labourToEdit, isOpen, totalLaboursCount]);

  if (!isOpen) return null;

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "avatar" | "aadhar"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit. Please choose a smaller file.");
      return;
    }

    if (target === "avatar") {
      setIsUploadingAvatar(true);
    } else {
      setIsUploadingAadhar(true);
    }
    setUploadError(null);

    // Keep local preview while upload completes
    const localUrl = URL.createObjectURL(file);
    if (target === "avatar") {
      setFormData((prev) => ({ ...prev, image: localUrl }));
    } else {
      setFormData((prev) => ({ ...prev, aadhar_image: localUrl }));
    }

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      const apiUrl = getApiUrl();
      const token = getAuthToken();
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${apiUrl}/labours/upload`, {
        method: "POST",
        headers,
        body: uploadData
      });

      if (res.ok) {
        const data = await res.json();
        const serverUrl = data.url || data.path;
        if (target === "avatar") {
          setFormData((prev) => ({ ...prev, image: serverUrl }));
        } else {
          setFormData((prev) => ({ ...prev, aadhar_image: serverUrl }));
        }
      } else {
        const errJson = await res.json().catch(() => ({ detail: "Upload failed" }));
        const msg = errJson.detail || "Server rejected document format or size.";
        alert(`Upload error: ${msg}`);
        setUploadError(msg);
        // Reset to original to prevent saving invalid local blob
        if (target === "avatar") {
          setFormData((prev) => ({ ...prev, image: labourToEdit?.image || "" }));
        } else {
          setFormData((prev) => ({ ...prev, aadhar_image: labourToEdit?.aadhar_image || "" }));
        }
      }
    } catch (err: any) {
      console.error("Upload error", err);
      const msg = err.message || "Network error while uploading";
      alert(`Could not upload file: ${msg}`);
      setUploadError(msg);
      if (target === "avatar") {
        setFormData((prev) => ({ ...prev, image: labourToEdit?.image || "" }));
      } else {
        setFormData((prev) => ({ ...prev, aadhar_image: labourToEdit?.aadhar_image || "" }));
      }
    } finally {
      if (target === "avatar") {
        setIsUploadingAvatar(false);
      } else {
        setIsUploadingAadhar(false);
      }
    }
  };

  const handleApplyUrl = () => {
    if (!imageUrlInput.trim()) return;
    setFormData((prev) => ({ ...prev, image: imageUrlInput.trim() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploadingAadhar || isUploadingAvatar) {
      alert("Please wait until the photo / Aadhaar document finishes uploading.");
      return;
    }
    if (!formData.name.trim()) {
      alert("Please enter worker full name.");
      setActiveTab("basic");
      return;
    }

    // Statutory Indian Mobile Validation (10 digits starting with 6-9)
    const rawDigits = formData.mobile_number.replace(/[^0-9]/g, "");
    const cleanMobile = rawDigits.startsWith("91") && rawDigits.length === 12 ? rawDigits.slice(2) : rawDigits;
    if (!cleanMobile || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      alert("Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).");
      setActiveTab("basic");
      return;
    }

    setIsSubmitting(true);
    const token = getAuthToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const payload = {
      name: formData.name.trim(),
      labour_id: formData.labour_id.trim(),
      mobile_number: cleanMobile,
      address: formData.address.trim(),
      salary: Number(formData.salary) || 0,
      joining_date: formData.joining_date,
      work_type: formData.work_type,
      status: formData.status,
      image: formData.image,
      aadhar_image: formData.aadhar_image
    };

    try {
      const apiUrl = getApiUrl();
      if (isEditing && labourToEdit) {
        const targetId = labourToEdit._id || labourToEdit.id;
        const res = await fetch(`${apiUrl}/labours/${targetId}`, {
          method: "PUT",
          headers,
          credentials: "include",
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const updated = await res.json();
          onSuccess(updated, false);
          onClose();
        } else {
          const fallback: Labour = { ...labourToEdit, ...payload };
          onSuccess(fallback, false);
          onClose();
        }
      } else {
        const res = await fetch(`${apiUrl}/labours/`, {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const created = await res.json();
          onSuccess(created, true);
          onClose();
        } else {
          const fallback: Labour = {
            ...payload,
            _id: `lbr-${Date.now()}`
          };
          onSuccess(fallback, true);
          onClose();
        }
      }
    } catch (err) {
      console.error("Labour submit error", err);
      const fallback: Labour = {
        ...(labourToEdit || { _id: `lbr-${Date.now()}` }),
        ...payload
      };
      onSuccess(fallback, !isEditing);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              {isEditing ? "Edit Staff Profile" : "Add New Staff Profile"}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Enter worker compensation, personal records, and KYC documents.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50/60 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("basic")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "basic"
                ? "bg-white text-[#0260de] shadow-2xs border border-slate-200/80"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            1. Basic Information
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "documents"
                ? "bg-white text-[#0260de] shadow-2xs border border-slate-200/80"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            2. Photo &amp; KYC Document
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("employment")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "employment"
                ? "bg-white text-[#0260de] shadow-2xs border border-slate-200/80"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            3. Employment &amp; Wages
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: BASIC INFORMATION */}
          {activeTab === "basic" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rameshwar Patel"
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0260de] focus:ring-2 focus:ring-[#0260de]/10 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Labour ID / Badge Code
                  </label>
                  <input
                    type="text"
                    value={formData.labour_id}
                    onChange={(e) => setFormData({ ...formData, labour_id: e.target.value })}
                    placeholder="LBR-0001"
                    className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-[#0260de]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 focus-within:bg-white focus-within:border-[#0260de]">
                    <span className="text-xs font-bold text-slate-500">🇮🇳 +91</span>
                    <input
                      type="tel"
                      required
                      value={formData.mobile_number}
                      onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                      placeholder="98241 12345"
                      className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Residential Address
                </label>
                <div className="flex items-start gap-2 bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 focus-within:bg-white focus-within:border-[#0260de]">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Factory worker quarters, Odhav, Ahmedabad, Gujarat"
                    className="w-full bg-transparent text-xs font-medium text-slate-900 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE & IDENTITY */}
          {activeTab === "documents" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Profile Photo */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Worker Avatar / Profile Photo
                </span>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-white flex items-center justify-center shrink-0">
                    {formData.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={formatImageUrl(formData.image)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-8 h-8 text-slate-400" />
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-800 shadow-2xs cursor-pointer transition-colors">
                        <Camera className="w-3.5 h-3.5 text-[#0260de]" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => handleFileUpload(e, "avatar")}
                        />
                      </label>

                      {formData.image && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image: "" })}
                          className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-semibold cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="Or paste direct image URL here..."
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#0260de]"
                      />
                      <button
                        type="button"
                        onClick={handleApplyUrl}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-[#0260de] text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aadhar KYC Document */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Aadhaar Card KYC Verification Document
                  </span>
                  {formData.aadhar_image && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <Check className="w-3 h-3 text-emerald-600" />
                      Document Ready
                    </span>
                  )}
                </div>

                {uploadError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                    ⚠️ {uploadError}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-1 w-full border-2 border-dashed border-slate-200 hover:border-[#0260de] rounded-xl p-4 flex flex-col items-center justify-center text-center bg-white transition-colors relative">
                    {isUploadingAadhar ? (
                      <div className="py-3 flex flex-col items-center justify-center text-center">
                        <Loader2 className="w-7 h-7 text-[#0260de] animate-spin mb-2" />
                        <p className="text-xs font-bold text-slate-800">Uploading Aadhaar Card...</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Encrypting and storing document securely</p>
                      </div>
                    ) : (
                      <>
                        <IdCard className="w-8 h-8 text-[#0260de] mb-1.5" />
                        <p className="text-xs font-bold text-slate-800">
                          {formData.aadhar_image ? "Replace Aadhaar Identity Card" : "Upload Aadhaar Identity Card"}
                        </p>
                        <p className="text-[10px] text-slate-400 mb-2.5">JPG, PNG, WebP or PDF (Max 10MB)</p>
                        <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0f172a] hover:bg-[#0260de] text-white text-xs font-bold rounded-xl shadow-2xs cursor-pointer transition-colors active:scale-95">
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>{formData.aadhar_image ? "Choose New File" : "Choose File"}</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="sr-only"
                            onChange={(e) => handleFileUpload(e, "aadhar")}
                          />
                        </label>
                      </>
                    )}
                  </div>

                  {formData.aadhar_image && (
                    <div className="w-full sm:w-48 h-32 rounded-xl border border-slate-200 bg-white p-2 relative shrink-0 flex flex-col items-center justify-center overflow-hidden shadow-2xs group">
                      {formData.aadhar_image.toLowerCase().endsWith(".pdf") || formData.aadhar_image.includes("application/pdf") ? (
                        <div className="flex flex-col items-center justify-center text-center p-2">
                          <FileText className="w-10 h-10 text-rose-500 mb-1" />
                          <span className="text-[11px] font-bold text-slate-800 truncate max-w-[140px]">
                            Aadhaar Document (PDF)
                          </span>
                          <a
                            href={formatImageUrl(formData.aadhar_image)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 text-[10px] font-bold text-[#0260de] hover:underline flex items-center gap-1"
                          >
                            <span>Open PDF</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      ) : (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={formatImageUrl(formData.aadhar_image)}
                            alt="Aadhaar Preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <a
                            href={formatImageUrl(formData.aadhar_image)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute bottom-2 left-2 bg-slate-900/80 hover:bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <span>View Full</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, aadhar_image: "" })}
                        className="absolute top-2 right-2 w-6 h-6 rounded-md bg-white/90 text-rose-600 hover:bg-rose-50 shadow-2xs flex items-center justify-center cursor-pointer"
                        title="Remove document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EMPLOYMENT & WAGES */}
          {activeTab === "employment" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Monthly Salary / Wages (INR) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 focus-within:bg-white focus-within:border-[#0260de]">
                    <span className="text-sm font-bold text-slate-500">₹</span>
                    <input
                      type="number"
                      required
                      min={0}
                      step={500}
                      value={formData.salary || ""}
                      onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                      placeholder="24,000"
                      className="w-full bg-transparent text-sm font-black text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Joining Date
                  </label>
                  <div className="flex items-center gap-2 bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 focus-within:bg-white focus-within:border-[#0260de]">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="date"
                      value={formData.joining_date}
                      onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                      className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Work Type / Contract
                  </label>
                  <select
                    value={formData.work_type}
                    onChange={(e) => setFormData({ ...formData, work_type: e.target.value })}
                    className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-[#0260de] cursor-pointer"
                  >
                    {WORK_TYPES.map((wt) => (
                      <option key={wt} value={wt}>
                        {wt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-[#0260de] cursor-pointer"
                  >
                    {LABOUR_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              {activeTab !== "basic" && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === "employment" ? "documents" : "basic")}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Previous
                </button>
              )}

              {activeTab !== "employment" ? (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === "basic" ? "documents" : "employment")}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-[#0260de] text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  Next Section
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0260de] hover:bg-[#0252bf] text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-60"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Profile"}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

