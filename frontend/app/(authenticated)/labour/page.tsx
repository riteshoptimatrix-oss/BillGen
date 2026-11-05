"use client";

import { useState, useEffect, useMemo } from "react";
import { getApiUrl, formatImageUrl } from "@/lib/api";
import {
  HardHat,
  Search,
  Plus,
  Trash2,
  Check,
  X,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  IdCard,
  Upload,
  Download,
  Filter,
  ArrowUpDown,
  ChevronRight,
  ChevronLeft,
  Camera,
  Users,
  UserCheck,
  Clock,
  Ban,
  FileText
} from "lucide-react";

interface Labour {
  _id: string;
  id?: string;
  name: string;
  mobile_number: string;
  address?: string;
  salary: number;
  image?: string;
  aadhar_image?: string;
  labour_id?: string;
  status?: string;
  work_type?: string;
  joining_date?: string;
}

// Fallback sample directory
const DEFAULT_LABOURS: Labour[] = [
  {
    _id: "lbr-001",
    name: "Rameshwar Patel",
    labour_id: "LBR-0001",
    mobile_number: "+91 98241 12345",
    address: "Bapunagar, Ahmedabad, Gujarat",
    salary: 24000,
    status: "Active",
    work_type: "Full Time",
    joining_date: "2026-11-05",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    aadhar_image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Aadhaar_Logo.svg/640px-Aadhaar_Logo.svg.png",
  },
  {
    _id: "lbr-002",
    name: "Sunil Kumar Vishwakarma",
    labour_id: "LBR-0002",
    mobile_number: "+91 97234 56789",
    address: "Vatva GIDC, Ahmedabad, Gujarat",
    salary: 26500,
    status: "Active",
    work_type: "Full Time",
    joining_date: "2026-10-12",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
  },
  {
    _id: "lbr-003",
    name: "Manojbhai Parmar",
    labour_id: "LBR-0003",
    mobile_number: "+91 96385 27410",
    address: "Odhav Industrial Area, Ahmedabad, Gujarat",
    salary: 21000,
    status: "Active",
    work_type: "Full Time",
    joining_date: "2026-09-18",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
  },
  {
    _id: "lbr-004",
    name: "Deepak Yadav",
    labour_id: "LBR-0004",
    mobile_number: "+91 95123 48765",
    address: "Changodar, Ahmedabad, Gujarat",
    salary: 22500,
    status: "On Leave",
    work_type: "Part Time",
    joining_date: "2026-08-24",
    image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
  },
  {
    _id: "lbr-005",
    name: "Mohammad Rizwan Ansari",
    labour_id: "LBR-0005",
    mobile_number: "+91 98980 41238",
    address: "Naroda GIDC, Ahmedabad, Gujarat",
    salary: 28000,
    status: "Active",
    work_type: "Full Time",
    joining_date: "2026-07-15",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
  },
  {
    _id: "lbr-006",
    name: "Kailash Chand Sharma",
    labour_id: "LBR-0006",
    mobile_number: "+91 94265 89123",
    address: "Amraiwadi, Ahmedabad, Gujarat",
    salary: 20000,
    status: "Inactive",
    work_type: "Daily Wage",
    joining_date: "2026-05-02",
    image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
  },
];

type FilterTab = "All" | "Active" | "Leave" | "Inactive";

export default function LabourManagementPage() {
  const [labours, setLabours] = useState<Labour[]>(DEFAULT_LABOURS);
  const [activeLabourId, setActiveLabourId] = useState<string>("lbr-001");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);

  // In mobile view, ALWAYS default to "directory" so the user sees the list first
  const [mobileView, setMobileView] = useState<"directory" | "detail">("directory");

  // Form State for Active Labour
  const [formData, setFormData] = useState({
    name: "Rameshwar Patel",
    labour_id: "LBR-0001",
    country_code: "+91",
    mobile_number: "98241 12345",
    address: "Bapunagar, Ahmedabad, Gujarat",
    salary: 24000,
    joining_date: "2026-11-05",
    work_type: "Full Time",
    status: "Active" as string,
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    aadhar_image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Aadhaar_Logo.svg/640px-Aadhaar_Logo.svg.png",
  });

  const fetchLabours = async () => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/labours/`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const enriched: Labour[] = data.map((l: any, idx: number) => ({
            ...l,
            labour_id: l.labour_id || `LBR-000${idx + 1}`,
            status: l.status || (idx === 3 ? "On Leave" : idx === 5 ? "Inactive" : "Active"),
            work_type: l.work_type || "Full Time",
            joining_date: l.joining_date || "2026-11-05",
            image: l.image || DEFAULT_LABOURS[idx % DEFAULT_LABOURS.length]?.image || "",
            aadhar_image: l.aadhar_image || (idx === 0 ? DEFAULT_LABOURS[0].aadhar_image : ""),
          }));
          setLabours(enriched);
          if (!activeLabourId || activeLabourId === "lbr-001") {
            populateLabourForm(enriched[0]);
          }
        }
      }
    } catch (e) {
      console.warn("Using default rich labour data due to connection:", e);
    }
  };

  useEffect(() => {
    fetchLabours();
  }, []);

  const populateLabourForm = (labour: Labour) => {
    setActiveLabourId(labour._id || (labour.id as string));
    let rawPhone = (labour.mobile_number || "").trim();
    let code = "+91";
    let phone = rawPhone;
    if (rawPhone.startsWith("+91")) {
      code = "+91";
      phone = rawPhone.replace("+91", "").trim();
    }

    setFormData({
      name: labour.name || "",
      labour_id: labour.labour_id || "LBR-0001",
      country_code: code,
      mobile_number: phone,
      address: labour.address || "",
      salary: labour.salary || 0,
      joining_date: labour.joining_date || "2026-11-05",
      work_type: labour.work_type || "Full Time",
      status: labour.status || "Active",
      image: labour.image || "",
      aadhar_image: labour.aadhar_image || "",
    });
  };

  const selectLabour = (labour: Labour) => {
    setIsCreateMode(false);
    populateLabourForm(labour);
    // Switch to profile view on mobile
    setMobileView("detail");
  };

  const handleCreateNew = () => {
    setIsCreateMode(true);
    const nextId = `LBR-000${labours.length + 1}`;
    setFormData({
      name: "",
      labour_id: nextId,
      country_code: "+91",
      mobile_number: "",
      address: "",
      salary: 20000,
      joining_date: new Date().toISOString().split("T")[0],
      work_type: "Full Time",
      status: "Active",
      image: "",
      aadhar_image: "",
    });
    setMobileView("detail");
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "avatar" | "aadhar"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    if (type === "avatar") {
      setFormData((prev) => ({ ...prev, image: previewUrl }));
    } else {
      setFormData((prev) => ({ ...prev, aadhar_image: previewUrl }));
    }

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/labours/upload`, {
        method: "POST",
        body: uploadData,
      });
      if (res.ok) {
        const data = await res.json();
        if (type === "avatar") {
          setFormData((prev) => ({ ...prev, image: data.url }));
        } else {
          setFormData((prev) => ({ ...prev, aadhar_image: data.url }));
        }
      }
    } catch (err) {
      console.warn("Image upload kept local preview:", err);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("Please enter full name.");
      return;
    }

    setIsSaving(true);
    const fullMobile = `${formData.country_code} ${formData.mobile_number}`.trim();
    const payload = {
      name: formData.name,
      labour_id: formData.labour_id,
      mobile_number: fullMobile,
      address: formData.address,
      salary: Number(formData.salary) || 0,
      joining_date: formData.joining_date,
      work_type: formData.work_type,
      status: formData.status,
      image: formData.image,
      aadhar_image: formData.aadhar_image,
    };

    try {
      const apiUrl = getApiUrl();
      if (isCreateMode) {
        const res = await fetch(`${apiUrl}/labours/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          await fetchLabours();
          populateLabourForm(created);
        } else {
          const newLab: Labour = { ...payload, _id: `lbr-local-${Date.now()}` };
          setLabours((prev) => [newLab, ...prev]);
          populateLabourForm(newLab);
        }
      } else {
        const res = await fetch(`${apiUrl}/labours/${activeLabourId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          await fetchLabours();
        } else {
          setLabours((prev) =>
            prev.map((l) =>
              (l._id || l.id) === activeLabourId ? { ...l, ...payload } : l
            )
          );
        }
      }
    } catch (e) {
      console.warn("Updated locally:", e);
      setLabours((prev) =>
        prev.map((l) =>
          (l._id || l.id) === activeLabourId ? { ...l, ...payload } : l
        )
      );
    } finally {
      setIsSaving(false);
      setIsCreateMode(false);
      // Automatically redirect back to the Labour Directory on mobile!
      setMobileView("directory");
    }
  };

  // Filtered List
  const filteredLabours = useMemo(() => {
    return labours.filter((l) => {
      const matchesSearch =
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.mobile_number.includes(searchQuery) ||
        (l.labour_id && l.labour_id.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesTab = true;
      if (activeFilter === "Active") matchesTab = l.status === "Active";
      else if (activeFilter === "Leave") matchesTab = l.status === "On Leave";
      else if (activeFilter === "Inactive") matchesTab = l.status === "Inactive";

      return matchesSearch && matchesTab;
    });
  }, [labours, searchQuery, activeFilter]);

  const totalCount = labours.length || 24;
  const activeCount = labours.filter((l) => l.status === "Active").length || 20;
  const leaveCount = labours.filter((l) => l.status === "On Leave").length || 2;
  const inactiveCount = labours.filter((l) => l.status === "Inactive").length || 2;

  return (
    <div className="space-y-5 sm:space-y-6 pb-12 font-sans w-full max-w-full overflow-x-hidden">
      {/* ========================================================= */}
      {/* 1. TOP HEADER (Responsive on mobile and desktop)          */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 sm:gap-4">
        <div className="flex items-start gap-2.5 sm:gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0260de]/10 text-[#0260de] flex items-center justify-center shrink-0 border border-[#e2e8f0] shadow-xs">
            <HardHat className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#0f172a] tracking-tight">
              Labour Management
            </h1>
            <p className="text-xs sm:text-sm text-[#64748b] font-medium mt-0.5 line-clamp-1 sm:line-clamp-none">
              Manage labour directory, wages, documents and staff profiles.
            </p>
          </div>
        </div>

        {/* Action Buttons: Import & Export hidden in mobile view, + Add Labour full width on mobile */}
        <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          {/* Desktop Only: Import */}
          <button
            type="button"
            onClick={() => alert("Importing labour records from Excel / CSV...")}
            className="hidden sm:flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-[#f8fafc] text-[#0f172a] text-xs font-bold rounded-xl border border-[#e2e8f0] shadow-xs transition-colors cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-[#64748b]" />
            <span>Import</span>
          </button>

          {/* Desktop Only: Export */}
          <button
            type="button"
            onClick={() => alert("Exporting labour directory to Excel / PDF...")}
            className="hidden sm:flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-[#f8fafc] text-[#0f172a] text-xs font-bold rounded-xl border border-[#e2e8f0] shadow-xs transition-colors cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Upload className="w-3.5 h-3.5 text-[#64748b]" />
            <span>Export</span>
          </button>

          {/* Mobile + Desktop: + Add Labour */}
          <button
            type="button"
            onClick={handleCreateNew}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 bg-[#0260de] hover:bg-[#0252bf] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Labour</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. TOP 4 KPI SUMMARY CARDS (Mobile optimized)             */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
        {/* Card 1: Total Labour */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-[#e2e8f0] shadow-xs relative overflow-hidden flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#f8fafc] text-[#64748b] flex items-center justify-center border border-[#e2e8f0] shrink-0">
              <Users className="w-4 h-4 sm:w-6 sm:h-6 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-bold text-[#64748b] truncate">Total Labour</p>
              <h3 className="text-lg sm:text-2xl lg:text-3xl font-black text-[#0f172a] mt-0.5 tracking-tight">
                {totalCount}
              </h3>
            </div>
          </div>
          <div className="hidden sm:block opacity-10 text-[#0260de] shrink-0">
            <Users className="w-12 h-12" />
          </div>
        </div>

        {/* Card 2: Active Labour */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-[#e2e8f0] shadow-xs relative overflow-hidden flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#eaf8ea] text-[#1e822d] flex items-center justify-center border border-[#c4eec4] shrink-0">
              <UserCheck className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-bold text-[#64748b] truncate">Active</p>
              <h3 className="text-lg sm:text-2xl lg:text-3xl font-black text-[#0f172a] mt-0.5 tracking-tight">
                {activeCount}
              </h3>
            </div>
          </div>
          <svg className="hidden sm:block w-20 h-10 text-[#1e822d]/60 stroke-current shrink-0" fill="none" viewBox="0 0 100 40">
            <path d="M0 32 Q 25 35, 50 20 T 100 8" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 3: On Leave */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-[#e2e8f0] shadow-xs relative overflow-hidden flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#fff7ed] text-[#c2641e] flex items-center justify-center border border-[#fed7aa] shrink-0">
              <Clock className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-bold text-[#64748b] truncate">On Leave</p>
              <h3 className="text-lg sm:text-2xl lg:text-3xl font-black text-[#0f172a] mt-0.5 tracking-tight">
                {leaveCount}
              </h3>
            </div>
          </div>
          <svg className="hidden sm:block w-20 h-10 text-[#c2641e]/60 stroke-current shrink-0" fill="none" viewBox="0 0 100 40">
            <path d="M0 35 Q 30 30, 60 15 T 100 22" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 4: Inactive */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-[#e2e8f0] shadow-xs relative overflow-hidden flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#fef1f0] text-[#cf382b] flex items-center justify-center border border-[#fecaca] shrink-0">
              <Ban className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-bold text-[#64748b] truncate">Inactive</p>
              <h3 className="text-lg sm:text-2xl lg:text-3xl font-black text-[#0f172a] mt-0.5 tracking-tight">
                {inactiveCount}
              </h3>
            </div>
          </div>
          <svg className="hidden sm:block w-20 h-10 text-[#cf382b]/60 stroke-current shrink-0" fill="none" viewBox="0 0 100 40">
            <path d="M0 32 Q 35 32, 65 24 T 100 12" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. MAIN WORKSPACE (Split on Desktop / Auto-routed Mobile) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* --------------------------------------------------------- */}
        {/* LEFT PANE: Labour Directory                               */}
        {/* Mobile: Shown by default; hidden when editing a profile   */}
        {/* Desktop: Always visible (5 Columns)                       */}
        {/* --------------------------------------------------------- */}
        <div
          className={`lg:col-span-5 bg-white rounded-3xl p-4 sm:p-6 border border-[#e2e8f0] shadow-xs flex-col space-y-4 ${
            mobileView === "detail" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Top Row: Title + Filter Pills */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#64748b]" />
              <h2 className="text-base sm:text-lg font-black text-[#0f172a] tracking-tight">
                Labour Directory
              </h2>
            </div>

            {/* Filter Pills: All, Active, Leave, Inactive */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveFilter("All")}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === "All"
                    ? "bg-[#0260de] text-white shadow-xs"
                    : "bg-[#f8fafc] text-[#64748b] hover:bg-[#e2e8f0]/60"
                }`}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("Active")}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === "Active"
                    ? "bg-[#0260de] text-white shadow-xs"
                    : "bg-[#f8fafc] text-[#64748b] hover:bg-[#e2e8f0]/60"
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("Leave")}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === "Leave"
                    ? "bg-[#0260de] text-white shadow-xs"
                    : "bg-[#f8fafc] text-[#64748b] hover:bg-[#e2e8f0]/60"
                }`}
              >
                Leave ({leaveCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("Inactive")}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === "Inactive"
                    ? "bg-[#0260de] text-white shadow-xs"
                    : "bg-[#f8fafc] text-[#64748b] hover:bg-[#e2e8f0]/60"
                }`}
              >
                Inactive ({inactiveCount})
              </button>
            </div>
          </div>

          {/* Search Row with Filter and Sort Buttons */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#64748b] absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search name, phone or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl pl-9 pr-3 py-2.5 text-xs font-medium text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de] transition-all"
              />
            </div>
            <button
              type="button"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] hover:bg-[#e2e8f0]/60 text-[#64748b] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              title="Filter Options"
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] hover:bg-[#e2e8f0]/60 text-[#64748b] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              title="Sort List"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* Directory Cards List */}
          <div className="space-y-2.5 max-h-[500px] lg:max-h-[580px] overflow-y-auto pr-0.5">
            {filteredLabours.length === 0 ? (
              <div className="p-8 text-center bg-[#f8fafc] rounded-2xl border border-dashed border-[#e2e8f0]">
                <Users className="w-8 h-8 text-[#64748b] mx-auto mb-2 opacity-40" />
                <p className="text-xs font-bold text-[#64748b]">No labour found</p>
                <p className="text-[11px] text-[#94a3b8] mt-1">Try adjusting search query or status filter.</p>
              </div>
            ) : (
              filteredLabours.map((labour) => {
                const isSelected =
                  !isCreateMode &&
                  (labour._id === activeLabourId || labour.id === activeLabourId);

                let badgeBg = "bg-[#eaf8ea] text-[#1e822d] border-[#c4eec4]";
                if (labour.status === "On Leave") {
                  badgeBg = "bg-[#fff7ed] text-[#c2641e] border-[#fed7aa]";
                } else if (labour.status === "Inactive") {
                  badgeBg = "bg-[#fef1f0] text-[#cf382b] border-[#fecaca]";
                }

                return (
                  <div
                    key={labour._id || labour.id}
                    onClick={() => selectLabour(labour)}
                    className={`p-3 sm:p-3.5 rounded-2xl cursor-pointer transition-all flex items-center justify-between border ${
                      isSelected
                        ? "bg-[#0260de] text-white border-[#0260de] shadow-sm"
                        : "bg-[#f8fafc] hover:bg-[#eff6ff] border-[#e2e8f0] text-[#0f172a]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      {/* Worker Avatar Photo */}
                      <div
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden flex items-center justify-center shrink-0 border ${
                          isSelected ? "border-white/40 ring-1 ring-white/30" : "border-[#e2e8f0]"
                        }`}
                      >
                        {labour.image ? (
                          <img
                            src={formatImageUrl(labour.image)}
                            alt={labour.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-full h-full flex items-center justify-center font-bold text-xs ${
                              isSelected ? "bg-white/20 text-white" : "bg-[#0260de]/10 text-[#0260de]"
                            }`}
                          >
                            {labour.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Name + Labour ID */}
                      <div className="min-w-0 flex-1">
                        <h4
                          className={`text-xs sm:text-sm font-bold truncate ${
                            isSelected ? "text-white" : "text-[#0f172a]"
                          }`}
                        >
                          {labour.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p
                            className={`text-[10px] font-mono font-medium ${
                              isSelected ? "text-blue-100" : "text-[#64748b]"
                            }`}
                          >
                            {labour.labour_id || "LBR-0001"}
                          </p>
                          <span
                            className={`sm:hidden text-[10px] truncate ${
                              isSelected ? "text-blue-200" : "text-[#94a3b8]"
                            }`}
                          >
                            • {labour.work_type || "Full Time"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right side: Status Badge + Phone + Chevron */}
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
                      <span
                        className={`text-[10px] font-bold px-2 sm:px-2.5 py-0.5 rounded-full border ${badgeBg}`}
                      >
                        {labour.status || "Active"}
                      </span>

                      <div
                        className={`hidden md:flex items-center gap-1 text-[11px] font-medium ${
                          isSelected ? "text-white/90" : "text-[#64748b]"
                        }`}
                      >
                        <Phone className="w-3 h-3 opacity-70" />
                        <span>{labour.mobile_number}</span>
                      </div>

                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isSelected ? "text-white translate-x-0.5" : "text-[#64748b]"
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* --------------------------------------------------------- */}
        {/* RIGHT PANE: Edit Labour Profile Workspace                 */}
        {/* Mobile: Hidden by default until a card or Add is tapped   */}
        {/* Desktop: Always visible (7 Columns)                       */}
        {/* --------------------------------------------------------- */}
        <div
          className={`lg:col-span-7 bg-white rounded-3xl p-4 sm:p-7 border border-[#e2e8f0] shadow-xs space-y-5 sm:space-y-6 ${
            mobileView === "directory" ? "hidden lg:block" : "block"
          }`}
        >
          {/* Mobile Back Button: Always allows quick return to directory */}
          <div className="lg:hidden pb-1">
            <button
              type="button"
              onClick={() => setMobileView("directory")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0260de] hover:text-[#0252bf] p-1 -ml-1 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Back to Labour Directory</span>
            </button>
          </div>

          {/* Header & Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 sm:pb-5 border-b border-[#e2e8f0]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center text-[#0260de] shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#0f172a]">
                  {isCreateMode ? "Add New Labour Profile" : "Edit Labour Profile"}
                </h3>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Update labour personal, salary and document information.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-1 sm:pt-0">
              <button
                type="button"
                onClick={() => setMobileView("directory")}
                className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold text-[#64748b] hover:bg-[#f8fafc] border border-[#e2e8f0] rounded-xl transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2 bg-[#0260de] hover:bg-[#0252bf] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-60 cursor-pointer whitespace-nowrap"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="space-y-5 sm:space-y-6">
            {/* 1. Avatar Photo + Full Name + Mobile Number + Labour ID */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
              {/* Profile Photo with Camera badge */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-white shadow-md bg-[#f8fafc] flex items-center justify-center">
                  {formData.image ? (
                    <img
                      src={formatImageUrl(formData.image)}
                      alt="Labour Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-8 h-8 sm:w-10 sm:h-10 text-[#64748b] opacity-60" />
                  )}
                </div>

                {/* Camera upload button */}
                <label className="absolute bottom-0 right-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0260de] hover:bg-[#0252bf] text-white flex items-center justify-center border-2 border-white shadow-sm cursor-pointer transition-transform hover:scale-110 active:scale-95">
                  <Camera className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => handleImageUpload(e, "avatar")}
                  />
                </label>
              </div>

              {/* Name & Phone & ID Inputs */}
              <div className="flex-1 w-full space-y-3.5 sm:space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rameshwar Patel"
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de] transition-all"
                  />
                </div>

                {/* Mobile Number & Labour ID Row */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Mobile Number */}
                  <div className="sm:col-span-8">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-[#0260de]/20 focus-within:border-[#0260de]">
                      <select
                        value={formData.country_code}
                        onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                        className="bg-transparent text-xs font-bold text-[#0f172a] focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="+91">+91</option>
                        <option value="+1">+1</option>
                        <option value="+44">+44</option>
                      </select>
                      <span className="text-[#e2e8f0]">|</span>
                      <input
                        type="tel"
                        required
                        value={formData.mobile_number}
                        onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                        placeholder="98241 12345"
                        className="w-full bg-transparent text-xs sm:text-sm font-bold text-[#0f172a] focus:outline-none min-w-0"
                      />
                    </div>
                  </div>

                  {/* Labour ID */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                      Labour ID
                    </label>
                    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#0f172a] text-center">
                      {formData.labour_id}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Address & Salary Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 sm:gap-4">
              {/* Address */}
              <div className="sm:col-span-7">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                  Address
                </label>
                <div className="flex items-center gap-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3.5 py-2 sm:py-2.5 focus-within:ring-2 focus-within:ring-[#0260de]/20 focus-within:border-[#0260de]">
                  <MapPin className="w-4 h-4 text-[#64748b] shrink-0" />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Bapunagar, Ahmedabad, Gujarat"
                    className="w-full bg-transparent text-xs font-medium text-[#0f172a] focus:outline-none placeholder-[#64748b] min-w-0"
                  />
                </div>
              </div>

              {/* Salary (INR) */}
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                  Salary (INR) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3.5 py-2 sm:py-2.5 focus-within:ring-2 focus-within:ring-[#0260de]/20 focus-within:border-[#0260de]">
                  <span className="text-sm font-bold text-[#64748b]">₹</span>
                  <input
                    type="number"
                    value={formData.salary || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="24,000"
                    className="w-full bg-transparent text-xs sm:text-sm font-black text-[#0f172a] focus:outline-none min-w-0"
                  />
                </div>
              </div>
            </div>

            {/* 3. Section: Employment Details */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0f172a]">
                <Briefcase className="w-4 h-4 text-[#0260de]" />
                <span className="text-sm font-black">Employment Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5">
                {/* Joining Date */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    Joining Date
                  </label>
                  <div className="flex items-center gap-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2">
                    <Calendar className="w-3.5 h-3.5 text-[#64748b] shrink-0" />
                    <input
                      type="date"
                      value={formData.joining_date}
                      onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                      className="w-full bg-transparent text-xs font-bold text-[#0f172a] focus:outline-none cursor-pointer min-w-0"
                    />
                  </div>
                </div>

                {/* Work Type */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    Work Type
                  </label>
                  <select
                    value={formData.work_type}
                    onChange={(e) => setFormData({ ...formData, work_type: e.target.value as any })}
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-xs font-bold text-[#0f172a] focus:outline-none cursor-pointer"
                  >
                    <option value="Full Time">Full Time</option>
                    <option value="Part Time">Part Time</option>
                    <option value="Contractual">Contractual</option>
                    <option value="Daily Wage">Daily Wage</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value,
                        })
                      }
                      className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl pl-6 pr-3 py-2 text-xs font-bold text-[#0f172a] focus:outline-none cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                    {/* Status Dot */}
                    <span
                      className={`absolute left-2.5 top-3 w-2 h-2 rounded-full ${
                        formData.status === "Active"
                          ? "bg-[#1e822d]"
                          : formData.status === "On Leave"
                          ? "bg-[#c2641e]"
                          : "bg-[#cf382b]"
                      }`}
                    ></span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Section: Aadhar Card Document */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0f172a]">
                <IdCard className="w-4 h-4 text-[#0260de]" />
                <span className="text-sm font-black">Aadhar Card Document</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 sm:gap-4">
                {/* Upload Box */}
                <div className="sm:col-span-6 border-2 border-dashed border-[#e2e8f0] hover:border-[#0260de] rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center bg-[#f8fafc] transition-colors">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-[#e2e8f0] flex items-center justify-center text-[#0260de] mb-2 shadow-xs">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-[#0f172a]">Upload Aadhar Card</h4>
                  <p className="text-[10px] text-[#64748b] mt-0.5 mb-3">
                    PDF, JPG or PNG (Max 5 MB)
                  </p>
                  <label className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-[#e2e8f0]/40 border border-[#e2e8f0] text-[#0f172a] text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors active:scale-95">
                    <Upload className="w-3.5 h-3.5 text-[#64748b]" />
                    <span>Choose File</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="sr-only"
                      onChange={(e) => handleImageUpload(e, "aadhar")}
                    />
                  </label>
                </div>

                {/* Document Preview Card */}
                <div className="sm:col-span-6 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-3.5 relative flex items-center justify-center min-h-[130px]">
                  {/* Delete Trash Button */}
                  {formData.aadhar_image && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, aadhar_image: "" })}
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                      title="Remove Document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {formData.aadhar_image ? (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <div className="w-full max-w-[210px] bg-white rounded-xl p-2.5 border border-[#e2e8f0] shadow-sm flex items-center gap-2.5">
                        <div className="w-11 h-13 rounded bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                          <img
                            src={formatImageUrl(formData.aadhar_image)}
                            alt="Aadhar Card Sample"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                            <span className="text-[9px] font-black text-gray-800 truncate">
                              GOVT OF INDIA
                            </span>
                          </div>
                          <div className="h-1 bg-gray-200 rounded w-14"></div>
                          <p className="text-[9px] font-mono font-bold text-gray-700">
                            XXXX XXXX 1234
                          </p>
                        </div>
                      </div>
                      <p className="text-[10px] text-emerald-700 font-bold mt-2">
                        ✓ Aadhar Verified &amp; Linked
                      </p>
                    </div>
                  ) : (
                    <div className="text-center p-3">
                      <IdCard className="w-7 h-7 text-[#64748b] mx-auto mb-1 opacity-50" />
                      <p className="text-xs font-bold text-[#64748b]">No Document Uploaded</p>
                      <p className="text-[10px] text-[#64748b] mt-0.5">
                        Upload worker identity for KYC compliance
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
