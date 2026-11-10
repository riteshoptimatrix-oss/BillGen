"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatImageUrl } from "@/lib/api";
import {
  Product,
  formatINR,
  getProductSku,
  getStockStatus
} from "./types";
import {
  Eye,
  Pencil,
  MoreVertical,
  Package,
  Copy,
  Trash2,
  Check,
  Tag,
  ExternalLink
} from "lucide-react";

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export default function ProductCard({
  product,
  onQuickView,
  onEdit,
  onDelete
}: ProductCardProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copiedSku, setCopiedSku] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const stockInfo = getStockStatus(product.stock, product.min_stock_alert || 10);
  const sku = getProductSku(product);
  const imageUrl = product.image ? formatImageUrl(product.image) : "";

  const handleOpenSinglePage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (product._id) {
      router.push(`/products/detail?pid=${product._id}`);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleCopySku = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sku);
    setCopiedSku(true);
    setTimeout(() => {
      setCopiedSku(false);
      setIsMenuOpen(false);
    }, 1200);
  };

  return (
    <div
      onClick={handleOpenSinglePage}
      className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col h-full cursor-pointer overflow-hidden select-none"
    >
      {/* 1. IMAGE CONTAINER */}
      <div className="relative w-full aspect-[4/3] bg-slate-50/70 border-b border-slate-100 p-4 flex items-center justify-center overflow-hidden">
        {/* Floating Top Left: Stock Status Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-xs shadow-2xs ${stockInfo.badgeBg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${stockInfo.dotColor}`} />
            {stockInfo.label}
          </span>
        </div>

        {/* Floating Top Right: Action Overlay */}
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1"
        >
          {/* Quick View Button (Revealed on hover or on mobile) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="w-8 h-8 rounded-xl bg-white/90 hover:bg-white text-slate-600 hover:text-[#0260de] border border-slate-200/80 shadow-2xs flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 sm:translate-y-1 sm:group-hover:translate-y-0 cursor-pointer"
            title="Quick View Drawer"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Single Product Page Link */}
          <button
            type="button"
            onClick={handleOpenSinglePage}
            className="w-8 h-8 rounded-xl bg-white/90 hover:bg-white text-slate-600 hover:text-[#0260de] border border-slate-200/80 shadow-2xs flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 sm:translate-y-1 sm:group-hover:translate-y-0 cursor-pointer"
            title="Open Product Page"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Edit Product Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(product);
            }}
            className="w-8 h-8 rounded-xl bg-white/90 hover:bg-white text-slate-600 hover:text-[#0260de] border border-slate-200/80 shadow-2xs flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 sm:translate-y-1 sm:group-hover:translate-y-0 cursor-pointer"
            title="Edit Product"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          {/* Three-Dot Menu Button */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="w-8 h-8 rounded-xl bg-white/90 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-2xs flex items-center justify-center transition-all cursor-pointer"
              title="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-9 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    setIsMenuOpen(false);
                    handleOpenSinglePage(e);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer font-bold text-[#0260de]"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#0260de]" />
                  <span>Open Product Page</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onQuickView(product);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>Quick View</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onEdit(product);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-400" />
                  <span>Edit Details</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySku}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
                >
                  {copiedSku ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied SKU</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy SKU</span>
                    </>
                  )}
                </button>

                <div className="h-px bg-slate-100 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDelete(product);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 cursor-pointer font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Delete Product</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Product Image or Fallback */}
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-contain transition-transform duration-300 ease-out group-hover:scale-105"
            onError={(e) => {
              // Graceful fallback if image load fails
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-300 group-hover:text-slate-400 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center mb-1 text-slate-400">
              <Package className="w-6 h-6 stroke-[1.5]" />
            </div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              No Image
            </span>
          </div>
        )}
      </div>

      {/* 2. CARD CONTENT & METADATA */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-3">
        {/* Category & SKU Sub-row */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 truncate">
              <Tag className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{product.category || "General"}</span>
            </span>
            <span className="text-[10px] font-mono font-medium text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 shrink-0">
              {sku}
            </span>
          </div>

          {/* Product Name */}
          <h3
            className="text-sm font-bold text-slate-900 group-hover:text-[#0260de] transition-colors line-clamp-2 leading-snug"
            title={product.name}
          >
            {product.name}
          </h3>
        </div>

        {/* 3. PRICE & INVENTORY FOOTER */}
        <div className="pt-2.5 border-t border-slate-100 flex items-end justify-between gap-2">
          {/* Selling Price */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Selling Price
            </span>
            <span className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              {formatINR(product.price)}
            </span>
          </div>

          {/* Available Stock */}
          <div className="text-right">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Stock
            </span>
            <span className="text-xs font-bold text-slate-700">
              {product.stock} {product.unit ? product.unit.split(" ")[0] : "Pcs"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

