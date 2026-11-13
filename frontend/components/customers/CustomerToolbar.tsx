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
  CustomerFilterState,
  GstStatusFilter,
  BankStatusFilter,
  CustomerSortField
} from "./types";

interface CustomerToolbarProps {
  filters: CustomerFilterState;
  onFilterChange: (updates: Partial<CustomerFilterState>) => void;
  onResetFilters: () => void;
  cities: string[];
  totalFiltered: number;
  totalCustomers: number;
}

export default function CustomerToolbar({
  filters,
  onFilterChange,
  onResetFilters,
  cities,
  totalFiltered,
  totalCustomers
}: CustomerToolbarProps) {
  const hasActiveFilters =
    filters.searchQuery.trim() !== "" ||
    filters.gstFilter !== "ALL" ||
    filters.bankFilter !== "ALL" ||
    filters.cityFilter !== "ALL" ||
    filters.sortBy !== "newest";

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 sm:p-4 space-y-3">
      {/* Top Row: Search Input + View Toggle + Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="Search customers by name, phone, GSTIN or city..."
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
          {/* GST Status Filter */}
          <div className="relative flex-1 sm:flex-initial min-w-[130px]">
            <select
              value={filters.gstFilter}
              onChange={(e) => onFilterChange({ gstFilter: e.target.value as GstStatusFilter })}
              className="w-full appearance-none bg-slate-50/70 hover:bg-slate-100/70 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-[#0260de] cursor-pointer pr-7 transition-all"
            >
              <option value="ALL">All GST Types</option>
              <option value="GST_REGISTERED">GST Registered</option>
              <option value="UNREGISTERED">Retail / Regular</option>
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>

          {/* City / Region Filter */}
          {cities.length > 0 && (
            <div className="relative flex-1 sm:flex-initial min-w-[125px]">
              <select
                value={filters.cityFilter}
                onChange={(e) => onFilterChange({ cityFilter: e.target.value })}
                className="w-full appearance-none bg-slate-50/70 hover:bg-slate-100/70 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-[#0260de] cursor-pointer pr-7 transition-all"
              >
                <option value="ALL">All Cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          )}

          {/* Bank Info Filter */}
          <div className="relative flex-1 sm:flex-initial min-w-[125px]">
            <select
              value={filters.bankFilter}
              onChange={(e) => onFilterChange({ bankFilter: e.target.value as BankStatusFilter })}
              className="w-full appearance-none bg-slate-50/70 hover:bg-slate-100/70 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-[#0260de] cursor-pointer pr-7 transition-all"
            >
              <option value="ALL">All Accounts</option>
              <option value="WITH_BANK">Bank Linked</option>
              <option value="WITHOUT_BANK">No Bank Details</option>
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
              onChange={(e) => onFilterChange({ sortBy: e.target.value as CustomerSortField })}
              className="w-full appearance-none bg-slate-50/70 hover:bg-slate-100/70 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-[#0260de] cursor-pointer pr-7 transition-all"
            >
              <option value="newest">Sort: Newest</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
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
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">
            Showing <strong className="text-slate-800">{totalFiltered}</strong> of {totalCustomers} customers
          </span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-200/60">
              Filtered
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0260de] hover:text-[#0252bf] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset filters</span>
          </button>
        )}
      </div>
    </div>
  );
}

