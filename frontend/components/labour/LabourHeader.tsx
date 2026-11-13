"use client";

import { Download, Upload, Plus, HardHat } from "lucide-react";

interface LabourHeaderProps {
  onAddNew: () => void;
  onImport: () => void;
  onExport: () => void;
  totalCount: number;
}

export default function LabourHeader({
  onAddNew,
  onImport,
  onExport,
  totalCount
}: LabourHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
      {/* Left: Heading and Subtitle */}
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-[#0260de] shrink-0">
            <HardHat className="w-5 h-5 text-[#0260de]" strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Labour Directory
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {totalCount} staff
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Manage workforce directory, compensation, KYC documents and staff profiles.
            </p>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
        {/* Import Labour */}
        <button
          type="button"
          onClick={onImport}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-slate-500" />
          <span>Import</span>
        </button>

        {/* Export Labour */}
        <button
          type="button"
          onClick={onExport}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export</span>
        </button>

        {/* Add New Labour */}
        <button
          type="button"
          onClick={onAddNew}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0260de] text-white text-xs font-bold hover:bg-[#0252bf] shadow-xs hover:shadow transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Labour</span>
        </button>
      </div>
    </div>
  );
}

