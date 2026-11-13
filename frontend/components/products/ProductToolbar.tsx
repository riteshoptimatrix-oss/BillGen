"use client";

import {
  Search,
  LayoutGrid,
  List,
  X,
  RotateCcw,
  ArrowUpDown
} from "lucide-react";
import {
  FilterState,
  StockFilter,
  PriceRangeFilter,
  SortField
} from "./types";

interface ProductToolbarProps {
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onResetFilters: () => void;
  categories: string[];
  totalFiltered: number;
  totalProducts: number;
}

export default function ProductToolbar({
  filters,
  onFilterChange,
  onResetFilters,
  categories,
  totalFiltered,
  totalProducts
}: ProductToolbarProps) {
  const hasActiveFilters =
    filters.searchQuery.trim() !== "" ||
    filters.category !== "ALL" ||
    filters.stockFilter !== "ALL" ||
    filters.priceRange !== "ALL" ||
    filters.sortBy !== "newest";

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 sm:p-4 space-y-3">
      {/* Top Row: Search Input + View Toggle + Quick Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="Search products by name or SKU..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50/70 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0260de] focus:ring-2 focus:ring-[#0260de]/10 transition-all font-medium"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => onFilterChange({ searchQuery: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns & View Mode Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <div className="relative flex-1 sm:flex-initial min-w-[130px]">
            <select
              value={filters.category}
              onChange={(e) => onFilterChange({ category: e.target.value })}
              className="w-full appearance-none bg-slate-50/70 hover:bg-slate-100/70 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-[#0260de] cursor-pointer pr-7 transition-all"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>

          {/* Stock Filter Dropdown */}
          <div className="relative flex-1 sm:flex-initial min-w-[120px]">
            <select
              value={filters.stockFilter}
              onChange={(e) => onFilterChange({ stockFilter: e.target.value as StockFilter })}
              className="w-full appearance-none bg-slate-50/70 hover:bg-slate-100/70 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-[#0260de] cursor-pointer pr-7 transition-all"
            >
              <option value="ALL">All Stock</option>
              <option value="IN_STOCK">In Stock (10+)</option>
              <option value="LOW_STOCK">Low Stock (1-9)</option>
              <option value="OUT_OF_STOCK">Out of Stock (0)</option>
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="relative flex-1 sm:flex-initial min-w-[125px]">
            <select
              value={filters.priceRange}
              onChange={(e) => onFilterChange({ priceRange: e.target.value as PriceRangeFilter })}
              className="w-full appearance-none bg-slate-50/70 hover:bg-slate-100/70 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-[#0260de] cursor-pointer pr-7 transition-all"
            >
              <option value="ALL">All Prices</option>
              <option value="UNDER_1K">Under ₹1,000</option>
              <option value="1K_5K">₹1,000 – ₹5,000</option>
              <option value="5K_20K">₹5,000 – ₹20,000</option>
              <option value="ABOVE_20K">Above ₹20,000</option>
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>

          {/* Sort By Dropdown */}
          <div className="relative flex-1 sm:flex-initial min-w-[135px]">
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as SortField })}
              className="w-full appearance-none bg-slate-50/70 hover:bg-slate-100/70 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-[#0260de] cursor-pointer pr-7 transition-all"
            >
              <option value="newest">Sort: Newest</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="stock_desc">Stock: High to Low</option>
              <option value="stock_asc">Stock: Low to High</option>
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <ArrowUpDown className="w-3 h-3" />
            </div>
          </div>

          {/* Grid / List View Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => onFilterChange({ viewMode: "grid" })}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                filters.viewMode === "grid"
                  ? "bg-white text-[#0260de] shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Grid View (Default)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ viewMode: "list" })}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                filters.viewMode === "list"
                  ? "bg-white text-[#0260de] shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Sub-row: Results counter and Active Filter chips */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">
            Showing <strong className="text-slate-900 font-bold">{totalFiltered}</strong> of{" "}
            <span className="text-slate-700">{totalProducts}</span> products
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0260de] hover:text-[#0252bf] ml-2 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset filters</span>
            </button>
          )}
        </div>

        {/* Active Filter Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.category !== "ALL" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#0260de] border border-blue-100 text-[11px] font-semibold">
              Category: {filters.category}
              <button
                type="button"
                onClick={() => onFilterChange({ category: "ALL" })}
                className="hover:text-blue-900 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.stockFilter !== "ALL" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold">
              Stock: {filters.stockFilter.replace("_", " ")}
              <button
                type="button"
                onClick={() => onFilterChange({ stockFilter: "ALL" })}
                className="hover:text-slate-900 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.priceRange !== "ALL" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold">
              Price: {filters.priceRange.replace("_", " ")}
              <button
                type="button"
                onClick={() => onFilterChange({ priceRange: "ALL" })}
                className="hover:text-slate-900 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
