"use client";

import { useState, useEffect } from "react";
import { getApiUrl, formatImageUrl } from "@/lib/api";
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
  Link as LinkIcon
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
    setActiveTab("basic");
  }, [labourToEdit, isOpen, totalLaboursCount]);

  if (!isOpen) return null;

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "avatar" | "aadhar"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      const res = await fetch(`${apiUrl}/labours/upload`, {
        method: "POST",
        body: uploadData
      });
      if (res.ok) {
        const data = await res.json();
        if (target === "avatar") {
          setFormData((prev) => ({ ...prev, image: data.url }));
        } else {
          setFormData((prev) => ({ ...prev, aadhar_image: data.url }));
        }
      }
    } catch (err) {
      console.warn("Upload maintained local object url", err);
    }
  };

  const handleApplyUrl = () => {
    if (!imageUrlInput.trim()) return;
    setFormData((prev) => ({ ...prev, image: imageUrlInput.trim() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Please enter worker full name.");
      return;
    }

    setIsSubmitting(true);
    const rawDigits = formData.mobile_number.replace(/[^0-9]/g, "");
    const formattedPhone = rawDigits ? `+91 ${rawDigits}` : "+91 98250 14829";

    const payload = {
      name: formData.name.trim(),
      labour_id: formData.labour_id.trim(),
      mobile_number: formattedPhone,
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
          headers: { "Content-Type": "application/json" },
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
          headers: { "Content-Type": "application/json" },
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
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Aadhar Card KYC Verification Document
                </span>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-1 w-full border-2 border-dashed border-slate-200 hover:border-[#0260de] rounded-xl p-4 flex flex-col items-center justify-center text-center bg-white transition-colors">
                    <IdCard className="w-8 h-8 text-[#0260de] mb-1.5" />
                    <p className="text-xs font-bold text-slate-800">Upload Aadhar Identity Card</p>
                    <p className="text-[10px] text-slate-400 mb-2.5">JPG, PNG or PDF (Max 5MB)</p>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0f172a] hover:bg-[#0260de] text-white text-xs font-bold rounded-xl shadow-2xs cursor-pointer transition-colors">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Choose File</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="sr-only"
                        onChange={(e) => handleFileUpload(e, "aadhar")}
                      />
                    </label>
                  </div>

                  {formData.aadhar_image && (
                    <div className="w-full sm:w-44 h-32 rounded-xl border border-slate-200 bg-white p-2 relative shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={formatImageUrl(formData.aadhar_image)}
                        alt="Aadhar Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
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

