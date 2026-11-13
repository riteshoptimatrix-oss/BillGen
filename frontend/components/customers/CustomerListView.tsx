"use client";

import {
  Customer,
  getCustomerStatus,
  extractCity
} from "./types";
import CustomerIllustration from "./CustomerIllustration";
import {
  Eye,
  Pencil,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Landmark,
  ShieldCheck
} from "lucide-react";

interface CustomerListViewProps {
  customers: Customer[];
  onQuickView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

function CustomerListRow({
  customer,
  onQuickView,
  onEdit,
  onDelete
}: {
  customer: Customer;
  onQuickView: (c: Customer) => void;
  onEdit: (c: Customer) => void;
  onDelete: (c: Customer) => void;
}) {
  const statusInfo = getCustomerStatus(customer);
  const city = extractCity(customer.billing_address || customer.delivery_address);

  return (
    <div
      onClick={() => onQuickView(customer)}
      className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer group"
    >
      {/* Left: Emblem + Name + GSTIN */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-50 border border-slate-200/80 shrink-0 flex items-center justify-center overflow-hidden">
          <CustomerIllustration
            name={customer.name}
            isGstRegistered={statusInfo.isGst}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            {customer.gst_number ? (
              <span className="text-[10px] font-mono font-bold text-slate-700 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200/80">
                GST: {customer.gst_number}
              </span>
            ) : (
              <span className="text-[10px] font-medium text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200/50">
                Retail Client
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>{city}</span>
            </span>
          </div>

          <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0260de] transition-colors truncate">
            {customer.name}
          </h3>

          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <Phone className="w-3 h-3 text-slate-400" />
              {customer.mobile_number}
            </span>
            {customer.email && (
              <span className="hidden md:flex items-center gap-1 truncate text-[11px]">
                <Mail className="w-3 h-3 text-slate-400" />
                {customer.email}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Middle: Bank Remittance Info */}
      <div className="flex items-center justify-between sm:justify-center sm:w-48 text-right sm:text-left gap-2">
        <div className="sm:text-right">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Remittance Bank
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Landmark className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="text-xs font-bold text-slate-800 truncate">
              {customer.bank_name || "Direct / Cash"}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Status Pill & Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-xs shadow-2xs ${statusInfo.badgeBg}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
          {statusInfo.label}
        </span>

        {/* Action Buttons */}
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onQuickView(customer)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0260de] hover:bg-blue-50 transition-colors"
            title="Quick view"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onEdit(customer)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Edit profile"
          >
            <Pencil className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(customer)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete customer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomerListView({
  customers,
  onQuickView,
  onEdit,
  onDelete
}: CustomerListViewProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden divide-y divide-slate-100">
      {customers.map((c) => (
        <CustomerListRow
          key={c._id}
          customer={c}
          onQuickView={onQuickView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

