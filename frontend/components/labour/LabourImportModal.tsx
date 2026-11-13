"use client";

import { useState, useRef } from "react";
import { getApiUrl } from "@/lib/api";
import { Labour } from "./types";
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  HardHat
} from "lucide-react";

interface LabourImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  showToast: (msg: string) => void;
}

export default function LabourImportModal({
  isOpen,
  onClose,
  onImportComplete,
  showToast
}: LabourImportModalProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Partial<Labour>[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Sample CSV generator & download
  const handleDownloadSampleCsv = () => {
    const headers = [
      "Name",
      "Mobile_Number",
      "Salary",
      "Work_Type",
      "Status",
      "Address",
      "Joining_Date",
      "Labour_ID"
    ];
    const sampleRows = [
      [
        "Ramesh Bhai Patel",
        "9876543210",
        "18500",
        "Assembly Technician",
        "Active",
        "Plot 42, GIDC Odhav, Ahmedabad",
        "2024-01-15",
        "LBR-0001"
      ],
      [
        "Mukesh K. Sharma",
        "9824012345",
        "22000",
        "CNC Machinist",
        "Active",
        "12 Shivam Park, Naroda, Ahmedabad",
        "2023-08-10",
        "LBR-0002"
      ],
      [
        "Sunil Verma",
        "9879054321",
        "16000",
        "TIG Welder",
        "Active",
        "28 Krishna Nagar, Vatva, Ahmedabad",
        "2024-03-01",
        "LBR-0003"
      ]
    ];

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "siddhivinayak_labour_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Sample Labour CSV template downloaded");
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
        showToast("CSV file contains no labour records");
        return;
      }

      const rawHeaders = lines[0].split(",").map((h) => h.replace(/["']/g, "").trim().toLowerCase());
      const nameIdx = rawHeaders.findIndex((h) => h.includes("name"));
      const mobileIdx = rawHeaders.findIndex((h) => h.includes("mobile") || h.includes("phone"));
      const salaryIdx = rawHeaders.findIndex((h) => h.includes("salary") || h.includes("wage"));
      const workTypeIdx = rawHeaders.findIndex((h) => h.includes("work") || h.includes("role") || h.includes("type"));
      const statusIdx = rawHeaders.findIndex((h) => h.includes("status"));
      const addressIdx = rawHeaders.findIndex((h) => h.includes("address") || h.includes("city"));
      const joinIdx = rawHeaders.findIndex((h) => h.includes("join") || h.includes("date"));
      const idIdx = rawHeaders.findIndex((h) => h.includes("labour_id") || h.includes("id"));

      const rows: Partial<Labour>[] = [];
      for (let i = 1; i < lines.length; i++) {
        // Simple comma split handling quotes
        const match = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        const cols = match ? match.map((c) => c.replace(/^"|"$/g, "").trim()) : lines[i].split(",").map((c) => c.trim());

        const name = nameIdx !== -1 ? cols[nameIdx] : cols[0];
        if (!name) continue;

        const mobile = mobileIdx !== -1 ? cols[mobileIdx] || "" : "";
        const salary = salaryIdx !== -1 ? parseFloat(cols[salaryIdx]) || 15000 : 15000;
        const workType = workTypeIdx !== -1 ? cols[workTypeIdx] || "Assembly Technician" : "Assembly Technician";
        const status = statusIdx !== -1 ? cols[statusIdx] || "Active" : "Active";
        const address = addressIdx !== -1 ? cols[addressIdx] || "" : "";
        const joiningDate = joinIdx !== -1 ? cols[joinIdx] || "" : "";
        const labourId = idIdx !== -1 ? cols[idIdx] || "" : "";

        rows.push({
          name,
          mobile_number: mobile,
          salary,
          work_type: workType,
          status,
          address,
          joining_date: joiningDate,
          labour_id: labourId
        });
      }

      setParsedRows(rows);
      showToast(`Parsed ${rows.length} labour records from CSV`);
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
          salary: record.salary || 15000,
          work_type: record.work_type || "Assembly Technician",
          status: record.status || "Active",
          address: record.address || "",
          joining_date: record.joining_date || new Date().toISOString().split("T")[0],
          labour_id: record.labour_id || undefined,
          image: "",
          aadhar_image: ""
        };

        const res = await fetch(`${apiUrl}/labours/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          successCount++;
        }
      } catch (err) {
        console.error("Row import error", err);
      }
    }

    setIsProcessing(false);
    setProgress(null);
    showToast(`Successfully imported ${successCount} of ${parsedRows.length} staff records`);
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
              <h3 className="text-base font-bold text-slate-900">Import Labour Directory (CSV)</h3>
              <p className="text-xs text-slate-500">Bulk import workforce records using a standard CSV spreadsheet</p>
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
                <p className="text-[11px] text-blue-800/80">Download our pre-formatted labour CSV template.</p>
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
                  Ready to Import: {parsedRows.length} Labour Records
                </span>
                <span className="text-slate-400 text-[11px]">Previewing first 5 rows</span>
              </div>
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Work Type</th>
                      <th className="p-2.5">Mobile</th>
                      <th className="p-2.5 text-right">Wage (INR)</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {parsedRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-medium text-slate-900">{row.name}</td>
                        <td className="p-2.5 text-slate-600">{row.work_type}</td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-600">{row.mobile_number}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">₹{(row.salary || 0).toLocaleString("en-IN")}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            {row.status || "Active"}
                          </span>
                        </td>
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
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Import {parsedRows.length} Records</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

