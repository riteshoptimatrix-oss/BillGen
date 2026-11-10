export interface Product {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  gallery?: string[];
  price: number;
  cost_price?: number;
  stock: number;
  min_stock_alert?: number;
  category?: string;
  unit?: string;
  hsn_code?: string;
  tax_rate?: number;
  sku?: string;
  status?: "Active" | "Draft" | "Archived";
  specifications?: string;
  created_at?: string;
  updated_at?: string;
}

export type StockFilter = "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export type SortField =
  | "name_asc"
  | "name_desc"
  | "price_asc"
  | "price_desc"
  | "stock_asc"
  | "stock_desc"
  | "newest";

export type PriceRangeFilter = "ALL" | "UNDER_1K" | "1K_5K" | "5K_20K" | "ABOVE_20K";

export interface FilterState {
  searchQuery: string;
  category: string;
  stockFilter: StockFilter;
  priceRange: PriceRangeFilter;
  sortBy: SortField;
  viewMode: "grid" | "list";
}

export const ERP_CATEGORIES = [
  "Chassis & Frame",
  "Engine & Powertrain",
  "Transmission & Differential",
  "Suspension & Steering",
  "Sheet Metal Body",
  "Electrical & Wiring",
  "Braking System",
  "CNG Kits",
  "Tyres & Rims",
  "Consumables & Hardware",
  "Accessories"
] as const;

export const ERP_UNITS = [
  "Piece (Pcs)",
  "Set",
  "Assembly",
  "Box",
  "Kilogram (Kg)",
  "Meter (m)",
  "Pair",
  "Liter (L)"
] as const;

export const GST_RATES = [0, 5, 12, 18, 28] as const;

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2
  }).format(amount);
}

export function getProductSku(product: Product): string {
  if (product.sku && product.sku.trim()) return product.sku.trim();
  if (product.hsn_code && product.hsn_code.trim()) return product.hsn_code.trim();
  const shortId = product._id ? product._id.slice(-6).toUpperCase() : "NEW";
  return `PRD-${shortId}`;
}

export function getStockStatus(stock: number, minStock = 10): {
  label: string;
  variant: "in_stock" | "low_stock" | "out_of_stock";
  colorClass: string;
  badgeBg: string;
  dotColor: string;
} {
  if (stock <= 0) {
    return {
      label: "Out of Stock",
      variant: "out_of_stock",
      colorClass: "text-rose-700 border-rose-200 bg-rose-50",
      badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
      dotColor: "bg-rose-500"
    };
  }
  if (stock < minStock) {
    return {
      label: "Low Stock",
      variant: "low_stock",
      colorClass: "text-amber-700 border-amber-200 bg-amber-50",
      badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
      dotColor: "bg-amber-500"
    };
  }
  return {
    label: "In Stock",
    variant: "in_stock",
    colorClass: "text-emerald-700 border-emerald-200 bg-emerald-50",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotColor: "bg-emerald-500"
  };
}

