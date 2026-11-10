"use client";

import { useState, useRef } from "react";
import { getApiUrl } from "@/lib/api";
import { Product } from "./types";
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Loader2
} from "lucide-react";

interface ProductImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  showToast: (msg: string) => void;
}

export default function ProductImportExportModal({
  isOpen,
  onClose,
  onImportComplete,
  showToast
}: ProductImportExportModalProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Partial<Product>[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Sample CSV generator & download
  const handleDownloadSampleCsv = () => {
    const headers = [
      "Name",
      "Category",
      "Price",
      "Stock",
      "Unit",
      "HSN_Code",
      "Tax_Rate",
      "Description"
    ];
    const sampleRows = [
      [
        "Auto Rickshaw Chassis Frame Heavy Duty",
        "Chassis & Frame",
        "12500",
        "25",
        "Piece (Pcs)",
        "HSN8708",
        "18",
        "High tensile tubular steel chassis frame"
      ],
      [
        "CNG High Pressure Regulator Kit",
        "CNG Kits",
        "4200",
        "15",
        "Assembly",
        "HSN8409",
        "18",
        "Multi-stage high pressure CNG kit"
      ]
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "siddhivinayak_products_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Sample CSV template downloaded");
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
        showToast("CSV file contains no product data rows");
        return;
      }

      const headers = lines[0]
        .split(",")
        .map((h) => h.replace(/^["']|["']$/g, "").trim().toLowerCase());

      const nameIdx = headers.findIndex((h) => h.includes("name"));
      const catIdx = headers.findIndex((h) => h.includes("category"));
      const priceIdx = headers.findIndex((h) => h.includes("price"));
      const stockIdx = headers.findIndex((h) => h.includes("stock"));
      const unitIdx = headers.findIndex((h) => h.includes("unit"));
      const hsnIdx = headers.findIndex((h) => h.includes("hsn") || h.includes("sku"));
      const taxIdx = headers.findIndex((h) => h.includes("tax") || h.includes("gst"));
      const descIdx = headers.findIndex((h) => h.includes("desc"));

      const rows: Partial<Product>[] = [];

      for (let i = 1; i < lines.length; i++) {
        // CSV split supporting quoted strings
        const cols: string[] = [];
        let cur = "";
        let inQuotes = false;
        for (const char of lines[i]) {
          if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            cols.push(cur.trim());
            cur = "";
          } else {
            cur += char;
          }
        }
        cols.push(cur.trim());

        const nameVal = nameIdx >= 0 ? cols[nameIdx] : "";
        if (!nameVal) continue;

        rows.push({
          name: nameVal,
          category: catIdx >= 0 && cols[catIdx] ? cols[catIdx] : "Chassis & Frame",
          price: priceIdx >= 0 ? parseFloat(cols[priceIdx]) || 0 : 0,
          stock: stockIdx >= 0 ? parseInt(cols[stockIdx]) || 0 : 0,
          unit: unitIdx >= 0 && cols[unitIdx] ? cols[unitIdx] : "Piece (Pcs)",
          hsn_code: hsnIdx >= 0 && cols[hsnIdx] ? cols[hsnIdx] : "HSN8708",
          tax_rate: taxIdx >= 0 ? parseFloat(cols[taxIdx]) || 18 : 18,
          description: descIdx >= 0 ? cols[descIdx] : ""
        });
      }

      setParsedRows(rows);
    };

    reader.readAsText(file);
  };

  // Perform bulk import
  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;

    setIsProcessing(true);
    setProgress({ current: 0, total: parsedRows.length });

    const apiUrl = getApiUrl();
    let successCount = 0;

    for (let i = 0; i < parsedRows.length; i++) {
      try {
        const item = parsedRows[i];
        const res = await fetch(`${apiUrl}/products/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: item.name,
            description: item.description || "",
            price: item.price || 0,
            stock: item.stock || 0,
            category: item.category || "Chassis & Frame",
            unit: item.unit || "Piece (Pcs)",
            hsn_code: item.hsn_code || "HSN8708",
            tax_rate: item.tax_rate ?? 18
          })
        });

        if (res.ok) {
          successCount++;
        }
      } catch (err) {
        console.error("Failed to import row", i, err);
      }
      setProgress({ current: i + 1, total: parsedRows.length });
    }

    setIsProcessing(false);
    showToast(`Successfully imported ${successCount} products into catalog!`);
    onImportComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0260de]">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Import Products (CSV)
              </h3>
              <p className="text-xs text-slate-500">
                Upload a CSV spreadsheet to bulk insert products into inventory.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* File Picker or Drag Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-[#0260de] bg-slate-50/60 rounded-2xl p-6 text-center cursor-pointer transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
              className="sr-only"
            />
            <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800">
              {csvFile ? csvFile.name : "Select or drag a CSV file"}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              File must contain columns: Name, Category, Price, Stock, Unit, HSN
            </p>
          </div>

          {/* Download Sample Template */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <span className="text-slate-600 font-medium">
              Need the standard CSV format template?
            </span>
            <button
              type="button"
              onClick={handleDownloadSampleCsv}
              className="inline-flex items-center gap-1 font-bold text-[#0260de] hover:underline cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template</span>
            </button>
          </div>

          {/* Parsed Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">
                  Ready to Import ({parsedRows.length} Products)
                </span>
                <span className="text-slate-500 text-[11px]">Previewing first 3</span>
              </div>

              <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs overflow-hidden max-h-36 overflow-y-auto">
                {parsedRows.slice(0, 3).map((r, i) => (
                  <div key={i} className="p-2.5 flex items-center justify-between bg-white">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-slate-900 truncate">{r.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {r.category} • ₹{r.price}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 px-2 py-0.5 bg-slate-100 rounded shrink-0">
                      Stock: {r.stock}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          {isProcessing && progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Importing items...</span>
                <span>
                  {progress.current} of {progress.total}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#0260de] h-full transition-all duration-200"
                  style={{
                    width: `${(progress.current / progress.total) * 100}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isProcessing || parsedRows.length === 0}
            onClick={handleExecuteImport}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0260de] text-white text-xs font-bold hover:bg-[#0252bf] shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Start Import</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
