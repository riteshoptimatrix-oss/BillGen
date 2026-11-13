export interface Customer {
  _id: string;
  name: string;
  mobile_number: string;
  email?: string;
  gst_number?: string;
  delivery_address?: string;
  billing_address?: string;
  bank_name?: string;
  account_holder_name?: string;
  account_number?: string;
  ifsc_code?: string;
  branch_name?: string;
  account_type?: string;
}

export type GstStatusFilter = "ALL" | "GST_REGISTERED" | "UNREGISTERED";
export type BankStatusFilter = "ALL" | "WITH_BANK" | "WITHOUT_BANK";
export type CustomerSortField = "newest" | "name_asc" | "name_desc";

export interface CustomerFilterState {
  searchQuery: string;
  gstFilter: GstStatusFilter;
  bankFilter: BankStatusFilter;
  cityFilter: string;
  sortBy: CustomerSortField;
  viewMode: "grid" | "list";
}

export function getCustomerStatus(customer: Customer): {
  isGst: boolean;
  label: string;
  dotColor: string;
  badgeBg: string;
} {
  const hasGst = Boolean(customer.gst_number && customer.gst_number.trim().length >= 10);
  if (hasGst) {
    return {
      isGst: true,
      label: "GST Registered",
      dotColor: "bg-emerald-500",
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200/80"
    };
  }
  return {
    isGst: false,
    label: "Retail / Regular",
    dotColor: "bg-slate-400",
    badgeBg: "bg-slate-100 text-slate-700 border-slate-200"
  };
}

export function extractCity(address?: string): string {
  if (!address || !address.trim()) return "Unspecified";
  const parts = address.split(/,|\n/);
  const lastPart = parts[parts.length - 1]?.trim() || "";
  // Check if last part is pincode
  if (/^\d{6}$/.test(lastPart) && parts.length > 1) {
    return parts[parts.length - 2]?.trim() || lastPart;
  }
  return parts[0]?.trim() || "Unspecified";
}

