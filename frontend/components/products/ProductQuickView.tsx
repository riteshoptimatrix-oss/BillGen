"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatImageUrl } from "@/lib/api";
import {
  Product,
  formatINR,
  getProductSku,
  getStockStatus
} from "./types";
import {
  X,
  Pencil,
  Trash2,
  Copy,
  Check,
  Package,
  Tag,
  Layers,
  ExternalLink
} from "lucide-react";

interface ProductQuickViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export default function ProductQuickView({
  product,
  isOpen,
  onClose,
  onEdit,
  onDelete
}: ProductQuickViewProps) {
  const [copiedSku, setCopiedSku] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Close on ESC key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const stockInfo = getStockStatus(product.stock, product.min_stock_alert || 10);
  const sku = getProductSku(product);
  const imageUrl = product.image ? formatImageUrl(product.image) : "";
  const taxRate = product.tax_rate ?? 18;
  const taxAmount = (product.price * taxRate) / 100;
  const priceWithTax = product.price + taxAmount;

  const handleCopySku = () => {
    navigator.clipboard.writeText(sku);
    setCopiedSku(true);
    setTimeout(() => setCopiedSku(false), 1500);
  };

  const handleDelete = () => {
    onDelete(product);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-over Drawer */}
      <div className="relative w-full max-w-xl bg-white shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-300 overflow-hidden">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200/90 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Product Overview
            </span>
            <span className="text-xs text-slate-300">•</span>
            <span className="font-mono text-xs text-[#0260de] font-semibold">
              {sku}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopySku}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Copy SKU"
            >
              {copiedSku ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Large Image */}
          <div className="relative w-full aspect-[4/3] rounded-2xl bg-slate-50 border border-slate-200/90 p-6 flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imageUrl}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-300">
                <Package className="w-16 h-16 stroke-[1.2] mb-2" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  No Image Available
                </span>
              </div>
            )}

            {/* Floating Stock Badge */}
            <div className="absolute top-3 left-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-xs shadow-xs ${stockInfo.badgeBg}`}
              >
                <span className={`w-2 h-2 rounded-full ${stockInfo.dotColor}`} />
                {stockInfo.label}
              </span>
            </div>

            {/* Category tag */}
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/95 text-slate-700 border border-slate-200 shadow-2xs">
                <Tag className="w-3 h-3 text-slate-400" />
                {product.category || "General"}
              </span>
            </div>
          </div>

          {/* Product Name & Description */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 leading-snug">
              {product.name}
            </h2>
            {product.description ? (
              <p className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            ) : (
              <p className="mt-2 text-xs italic text-slate-400">
                No description provided for this catalog item.
              </p>
            )}
          </div>

          {/* Pricing Highlight Card */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/90 grid grid-cols-2 gap-4">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Selling Price (Excl. Tax)
              </span>
              <span className="text-2xl font-black text-slate-900 mt-0.5 block tracking-tight">
                {formatINR(product.price)}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Per {product.unit || "Piece (Pcs)"}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Estimated Price (Incl. GST)
              </span>
              <span className="text-2xl font-black text-[#0260de] mt-0.5 block tracking-tight">
                {formatINR(priceWithTax)}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {taxRate}% GST (+{formatINR(taxAmount)})
              </span>
            </div>
          </div>

          {/* Specifications & Inventory Details Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-400" />
              <span>Catalog &amp; Tax Specifications</span>
            </h4>

            <div className="rounded-xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden text-xs">
              <div className="flex items-center justify-between p-3 bg-white">
                <span className="font-medium text-slate-500">Available Stock</span>
                <span className="font-bold text-slate-900">
                  {product.stock} {product.unit || "Pcs"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50/50">
                <span className="font-medium text-slate-500">Unit of Measurement</span>
                <span className="font-semibold text-slate-800">
                  {product.unit || "Piece (Pcs)"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white">
                <span className="font-medium text-slate-500">HSN / SAC Code</span>
                <span className="font-mono font-semibold text-slate-800">
                  {product.hsn_code || "HSN8708"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50/50">
                <span className="font-medium text-slate-500">GST Tax Bracket</span>
                <span className="font-semibold text-slate-800">
                  {taxRate}% GST
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white">
                <span className="font-medium text-slate-500">Category</span>
                <span className="font-semibold text-slate-800">
                  {product.category || "Chassis & Frame"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50/50">
                <span className="font-medium text-slate-500">System Product ID</span>
                <span className="font-mono text-slate-600 truncate max-w-[200px]">
                  {product._id}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Action Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/90 shrink-0 flex items-center justify-between gap-3">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2 w-full justify-between animate-in fade-in">
              <span className="text-xs font-semibold text-rose-700">
                Confirm delete product?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-xs cursor-pointer"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-rose-200 bg-white text-xs font-semibold text-rose-600 hover:bg-rose-50 shadow-2xs transition-colors cursor-pointer"
                  title="Delete Product"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </button>

                <Link
                  href={`/products/detail?pid=${product._id}`}
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-blue-200 bg-blue-50/70 text-xs font-bold text-[#0260de] hover:bg-blue-100 transition-colors shadow-2xs cursor-pointer"
                  title="Open Dedicated Product Page"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Single Product Page</span>
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(product);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-[#0260de] text-white text-xs font-bold hover:bg-[#0252bf] shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Product</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
