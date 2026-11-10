"use client";

import { PackageSearch, Plus, RotateCcw } from "lucide-react";

interface ProductEmptyStateProps {
  isFiltering: boolean;
  onResetFilters: () => void;
  onAddNew: () => void;
}

export default function ProductEmptyState({
  isFiltering,
  onResetFilters,
  onAddNew
}: ProductEmptyStateProps) {
  if (isFiltering) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-2xs">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4 border border-slate-200">
          <PackageSearch className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">
          No matching products found
        </h3>
        <p className="text-xs text-slate-500 max-w-xs mx-auto mb-5 leading-relaxed">
          We couldn&apos;t find any items matching your active search terms and filter criteria. Try adjusting your filters or search keywords.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Filters</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-14 text-center max-w-lg mx-auto shadow-2xs">
      <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0260de] mx-auto mb-4 shadow-2xs">
        <PackageSearch className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">
        Your Product Catalog is Empty
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-6 leading-relaxed">
        Start building your inventory catalog by adding spare parts, chassis assemblies, engine kits, or consumables.
      </p>
      <button
        type="button"
        onClick={onAddNew}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0260de] text-white text-xs sm:text-sm font-bold hover:bg-[#0252bf] transition-all cursor-pointer shadow-xs hover:shadow-md"
      >
        <Plus className="w-4 h-4" />
        <span>Add Your First Product</span>
      </button>
    </div>
  );
}

