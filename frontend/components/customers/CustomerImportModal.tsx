"use client";

import { useState, useRef } from "react";
import { getApiUrl } from "@/lib/api";
import { Customer } from "./types";
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  Users
} from "lucide-react";

interface CustomerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  showToast: (msg: string) => void;
}

export default function CustomerImportModal({
  isOpen,
  onClose,
  onImportComplete,
  showToast
}: CustomerImportModalProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Partial<Customer>[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Sample CSV generator & download
  const handleDownloadSampleCsv = () => {
    const headers = [
      "Name",
      "Mobile_Number",
      "Email",
      "GST_Number",
      "Billing_Address",
      "Delivery_Address",
      "Bank_Name",
      "Account_Number",
      "IFSC_Code"
    ];
    const sampleRows = [
      [
        "Malwa Three-Wheeler Logistics & Spares",
        "9752048291",
        "malwa.transport.spare@gmail.com",
        "23AAACM7412P1ZL",
        "12/A Sanwer Road Industrial Area Sector C, Indore MP",
        "12/A Sanwer Road Industrial Area Sector C, Indore MP",
        "State Bank of India",
        "39482019482",
        "SBIN0001042"
      ],
      [
        "Gujarat Auto Electricals & Spares",
        "9825012345",
        "gujarat.auto@gmail.com",
        "24AAAFG5678Q1Z2",
        "Plot 44, GIDC Vatva Phase 2, Ahmedabad",
        "Plot 44, GIDC Vatva Phase 2, Ahmedabad",
        "HDFC Bank",
        "50200012345678",
        "HDFC0000123"
      ]
    ];

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "siddhivinayak_customers_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Sample Customer CSV template downloaded");
  };

  // CSV Parser
  const handleFileChange = (file: File) => {
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text
        .split(/\r\n|\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length <= 1) {
        showToast("CSV file contains no customer records");
        return;
      }

      const rawHeaders = lines[0].split(",").map((h) => h.replace(/["']/g, "").trim().toLowerCase());
      const nameIdx = rawHeaders.findIndex((h) => h.includes("name"));
      const mobileIdx = rawHeaders.findIndex((h) => h.includes("mobile") || h.includes("phone"));
      const emailIdx = rawHeaders.findIndex((h) => h.includes("email"));
      const gstIdx = rawHeaders.findIndex((h) => h.includes("gst"));
      const billAddrIdx = rawHeaders.findIndex((h) => h.includes("billing") || (h.includes("address") && !h.includes("delivery")));
      const delivAddrIdx = rawHeaders.findIndex((h) => h.includes("delivery"));
      const bankIdx = rawHeaders.findIndex((h) => h.includes("bank"));
      const accIdx = rawHeaders.findIndex((h) => h.includes("account") || h.includes("acc"));
      const ifscIdx = rawHeaders.findIndex((h) => h.includes("ifsc"));

      const rows: Partial<Customer>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const match = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        const cols = match ? match.map((c) => c.replace(/^"|"$/g, "").trim()) : lines[i].split(",").map((c) => c.trim());

        const name = nameIdx !== -1 ? cols[nameIdx] : cols[0];
        if (!name) continue;

        const mobile = mobileIdx !== -1 ? cols[mobileIdx] || "" : "";
        const email = emailIdx !== -1 ? cols[emailIdx] || "" : "";
        const gst = gstIdx !== -1 ? cols[gstIdx] || "" : "";
        const billingAddress = billAddrIdx !== -1 ? cols[billAddrIdx] || "" : "";
        const deliveryAddress = delivAddrIdx !== -1 ? cols[delivAddrIdx] || billingAddress : billingAddress;
        const bankName = bankIdx !== -1 ? cols[bankIdx] || "" : "";
        const accountNumber = accIdx !== -1 ? cols[accIdx] || "" : "";
        const ifsc = ifscIdx !== -1 ? cols[ifscIdx] || "" : "";

        rows.push({
          name,
          mobile_number: mobile || "9876543210",
          email,
          gst_number: gst,
          billing_address: billingAddress,
          delivery_address: deliveryAddress,
          bank_name: bankName,
          account_number: accountNumber,
          ifsc_code: ifsc,
          account_holder_name: name,
          account_type: "Current Account"
        });
      }

      setParsedRows(rows);
      showToast(`Parsed ${rows.length} customer records from CSV`);
    };
    reader.readAsText(file);
  };

  // Upload Batch to Backend
  const handleBatchImport = async () => {
    if (parsedRows.length === 0) return;
    setIsProcessing(true);
    const apiUrl = getApiUrl();
    let successCount = 0;

    for (let i = 0; i < parsedRows.length; i++) {
      setProgress({ current: i + 1, total: parsedRows.length });
      const record = parsedRows[i];

      try {
        const payload = {
          name: record.name,
          mobile_number: record.mobile_number || "9876543210",
          email: record.email || "",
          gst_number: record.gst_number || "",
          billing_address: record.billing_address || "",
          delivery_address: record.delivery_address || record.billing_address || "",
          bank_name: record.bank_name || "",
          account_holder_name: record.account_holder_name || record.name,
          account_number: record.account_number || "",
          ifsc_code: record.ifsc_code || "",
          branch_name: record.branch_name || "",
          account_type: record.account_type || "Current Account"
        };

        const res = await fetch(`${apiUrl}/customers/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          successCount++;
        }
      } catch (err) {
        console.error("Customer import error", err);
      }
    }

    setIsProcessing(false);
    setProgress(null);
    showToast(`Successfully imported ${successCount} of ${parsedRows.length} customers`);
    onImportComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Import Customer Directory (CSV)</h3>
              <p className="text-xs text-slate-500">Bulk import client records with GST and remittance details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Download Sample */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-50/60 border border-blue-100/80">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-blue-950">Need the correct column format?</p>
                <p className="text-[11px] text-blue-800/80">Download our pre-formatted customer CSV template.</p>
              </div>
            </div>
            <button
              onClick={handleDownloadSampleCsv}
              className="px-3.5 py-1.5 rounded-xl bg-white text-blue-600 font-semibold text-xs border border-blue-200 hover:bg-blue-50 transition-colors shadow-sm"
            >
              Download Sample
            </button>
          </div>

          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                {csvFile ? csvFile.name : "Click to upload or drag & drop CSV"}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Supports UTF-8 CSV up to 10MB</p>
            </div>
          </div>

          {/* Parsed Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Ready to Import: {parsedRows.length} Customers
                </span>
                <span className="text-slate-400 text-[11px]">Previewing first 5 rows</span>
              </div>
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-2.5">Customer Name</th>
                      <th className="p-2.5">Mobile</th>
                      <th className="p-2.5">GST Number</th>
                      <th className="p-2.5">Bank Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {parsedRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-medium text-slate-900">{row.name}</td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-600">{row.mobile_number}</td>
                        <td className="p-2.5 font-mono text-[11px]">
                          {row.gst_number ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                              {row.gst_number}
                            </span>
                          ) : (
                            <span className="text-slate-400">Regular</span>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-600">{row.bank_name || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          {progress && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Importing records...</span>
                <span>
                  {progress.current} of {progress.total}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-150"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/80 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleBatchImport}
            disabled={parsedRows.length === 0 || isProcessing}
            className="px-5 py-2.5 rounded-xl bg-[#0260de] hover:bg-[#0252bf] text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Import {parsedRows.length} Customers</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

