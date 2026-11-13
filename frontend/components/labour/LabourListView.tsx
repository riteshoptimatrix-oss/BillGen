"use client";

import { useState } from "react";
import { formatImageUrl } from "@/lib/api";
import {
  Labour,
  formatINR,
  getLabourStatus
} from "./types";
import LabourIllustration from "./LabourIllustration";
import {
  Eye,
  Pencil,
  Trash2,
  Briefcase,
  Phone,
  Calendar,
  ShieldCheck
} from "lucide-react";

interface LabourListViewProps {
  labours: Labour[];
  onQuickView: (labour: Labour) => void;
  onEdit: (labour: Labour) => void;
  onDelete: (labour: Labour) => void;
}

function LabourListRow({
  labour,
  onQuickView,
  onEdit,
  onDelete
}: {
  labour: Labour;
  onQuickView: (l: Labour) => void;
  onEdit: (l: Labour) => void;
  onDelete: (l: Labour) => void;
}) {
  const [imageError, setImageError] = useState(false);
  const statusInfo = getLabourStatus(labour.status);
  const imageUrl = labour.image ? formatImageUrl(labour.image) : "";

  return (
    <div
      onClick={() => onQuickView(labour)}
      className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer group"
    >
      {/* Left: Thumbnail + Name + Work Type */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-50 border border-slate-200/80 p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
          {imageUrl && !imageError ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imageUrl}
              alt={labour.name}
              className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform"
              onError={() => setImageError(true)}
            />
          ) : (
            <LabourIllustration
              name={labour.name}
              workType={labour.work_type}
              labourId={labour.labour_id}
              className="p-1"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-medium text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200/50">
              {labour.labour_id || "LBR-0001"}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <Briefcase className="w-3 h-3 text-slate-400" />
              <span>{labour.work_type || "Full Time"}</span>
            </span>
            {labour.aadhar_image && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                <span>KYC</span>
              </span>
            )}
          </div>

          <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#0260de] transition-colors truncate">
            {labour.name}
          </h4>

          <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{labour.mobile_number}</span>
            </span>
            {labour.joining_date && (
              <span className="hidden md:flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Joined: {labour.joining_date}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Middle: Status Badge */}
      <div className="sm:w-32 flex sm:flex-col sm:items-end justify-between items-center shrink-0">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusInfo.badgeBg}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
          {statusInfo.label}
        </span>
      </div>

      {/* Right: Salary + Action Buttons */}
      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 sm:w-56 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
        <div className="text-left sm:text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Monthly Wages
          </span>
          <span className="text-base font-black text-slate-900">
            {formatINR(labour.salary)}
          </span>
        </div>

        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <button
            type="button"
            onClick={() => onQuickView(labour)}
            className="p-2 rounded-xl text-slate-500 hover:text-[#0260de] hover:bg-slate-100 transition-colors cursor-pointer"
            title="Quick View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(labour)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Edit Profile"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(labour)}
            className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Delete Profile"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LabourListView({
  labours,
  onQuickView,
  onEdit,
  onDelete
}: LabourListViewProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden divide-y divide-slate-100">
      {labours.map((labour) => (
        <LabourListRow
          key={labour._id || labour.id}
          labour={labour}
          onQuickView={onQuickView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

