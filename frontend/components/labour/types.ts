export interface Labour {
  _id: string;
  id?: string;
  name: string;
  mobile_number: string;
  address?: string;
  salary: number;
  image?: string;
  aadhar_image?: string;
  labour_id?: string;
  status?: string; // "Active" | "On Leave" | "Inactive"
  work_type?: string; // "Full Time" | "Part Time" | "Contractual" | "Daily Wage"
  joining_date?: string;
  notes?: string;
}

export type LabourStatusFilter = "ALL" | "Active" | "On Leave" | "Inactive";
export type WorkTypeFilter = "ALL" | "Full Time" | "Part Time" | "Contractual" | "Daily Wage";
export type SalaryRangeFilter = "ALL" | "UNDER_15K" | "15K_25K" | "ABOVE_25K";
export type LabourSortField = "newest" | "name_asc" | "name_desc" | "salary_asc" | "salary_desc";

export interface LabourFilterState {
  searchQuery: string;
  statusFilter: LabourStatusFilter;
  workTypeFilter: WorkTypeFilter;
  salaryRange: SalaryRangeFilter;
  sortBy: LabourSortField;
  viewMode: "grid" | "list";
}

export const WORK_TYPES = [
  "Full Time",
  "Part Time",
  "Contractual",
  "Daily Wage"
] as const;

export const LABOUR_STATUSES = [
  "Active",
  "On Leave",
  "Inactive"
] as const;

export function formatINR(val?: number): string {
  if (val === undefined || val === null || isNaN(val)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(val);
}

export function getLabourStatus(status?: string): {
  label: string;
  dotColor: string;
  badgeBg: string;
} {
  const s = (status || "Active").toLowerCase();
  if (s === "inactive") {
    return {
      label: "Inactive",
      dotColor: "bg-rose-500",
      badgeBg: "bg-rose-50 text-rose-700 border-rose-200"
    };
  }
  if (s === "on leave" || s === "leave") {
    return {
      label: "On Leave",
      dotColor: "bg-amber-500",
      badgeBg: "bg-amber-50 text-amber-700 border-amber-200"
    };
  }
  return {
    label: "Active",
    dotColor: "bg-emerald-500",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200"
  };
}

