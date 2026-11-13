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
  LabourFilterState,
  LabourStatusFilter,
  WorkTypeFilter,
  SalaryRangeFilter,
  LabourSortField,
  WORK_TYPES
} from "./types";

interface LabourToolbarProps {
  filters: LabourFilterState;
  onFilterChange: (updates: Partial<LabourFilterState>) => void;
  onResetFilters: () => void;
  totalFiltered: number;
  totalLabours: number;
}

export default function LabourToolbar({
  filters,
  onFilterChange,
  onResetFilters,
  totalFiltered,
  totalLabours
}: LabourToolbarProps) {
  const hasActiveFilters =
    filters.searchQuery.trim() !== "" ||
    filters.statusFilter !== "ALL" ||
    filters.workTypeFilter !== "ALL" ||
    filters.salaryRange !== "ALL" ||
    filters.sortBy !== "newest";

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 sm:p-4 space-y-3">
      {/* Top Row: Search Input + Filter Dropdowns + View Mode Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="Search staff by name, phone or ID..."
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
          {/* Work Type Dropdown */}
          <div className="relative flex-1 sm:flex-initial min-w-[130px]">
            <select
              value={filters.workTypeFilter}
              onChange={(e) => onFilterChange({ workTypeFilter: e.target.value as WorkTypeFilter })}
              className="w-full appearance-none bg-slate-50/70 hover:bg-slate-100/70 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-[#0260de] cursor-pointer pr-7 transition-all"
            >
              <option value="ALL">All Work Types</option>
              {WORK_TYPES.map((wt) => (
                <option key={wt} value={wt}>
                  {wt}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="relative flex-1 sm:flex-initial min-w-[115px]">
            <select
              value={filters.statusFilter}
              onChange={(e) => onFilterChange({ statusFilter: e.target.value as LabourStatusFilter })}
              className="w-full appearance-none bg-slate-50/70 hover:bg-slate-100/70 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-[#0260de] cursor-pointer pr-7 transition-all"
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>

          {/* Salary Range Dropdown */}
          <div className="relative flex-1 sm:flex-initial min-w-[125px]">
            <select
              value={filters.salaryRange}
              onChange={(e) => onFilterChange({ salaryRange: e.target.value as SalaryRangeFilter })}
              className="w-full appearance-none bg-slate-50/70 hover:bg-slate-100/70 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-[#0260de] cursor-pointer pr-7 transition-all"
            >
              <option value="ALL">All Wages</option>
              <option value="UNDER_15K">Under ₹15,000</option>
              <option value="15K_25K">₹15,000 – ₹25,000</option>
              <option value="ABOVE_25K">Above ₹25,000</option>
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="relative flex-1 sm:flex-initial min-w-[125px]">
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as LabourSortField })}
              className="w-full appearance-none bg-slate-50/70 hover:bg-slate-100/70 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-[#0260de] cursor-pointer pr-7 transition-all"
            >
              <option value="newest">Sort: Newest</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
              <option value="salary_desc">Salary: High to Low</option>
              <option value="salary_asc">Salary: Low to High</option>
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <ArrowUpDown className="w-3 h-3" />
            </div>
          </div>

          {/* View Mode Toggle (Grid / List) */}
          <div className="flex items-center p-0.5 bg-slate-100/80 rounded-xl border border-slate-200/80 shrink-0">
            <button
              type="button"
              onClick={() => onFilterChange({ viewMode: "grid" })}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                filters.viewMode === "grid"
                  ? "bg-white text-[#0260de] shadow-2xs"
                  : "text-slate-400 hover:text-slate-700"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ viewMode: "list" })}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                filters.viewMode === "list"
                  ? "bg-white text-[#0260de] shadow-2xs"
                  : "text-slate-400 hover:text-slate-700"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sub-row: Result count + Active Filter reset pill */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
        <div>
          Showing <span className="font-bold text-slate-900">{totalFiltered}</span> of{" "}
          <span className="font-semibold text-slate-700">{totalLabours}</span> staff members
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0260de] hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset filters</span>
          </button>
        )}
      </div>
    </div>
  );
}

