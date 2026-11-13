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
import ProductIllustration from "./ProductIllustration";
import {
  Eye,
  Pencil,
  MoreVertical,
  Copy,
  Trash2,
  Check,
  Tag,
  ArrowUpRight
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
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const stockInfo = getStockStatus(product.stock, product.min_stock_alert || 10);
  const sku = getProductSku(product);
  const imageUrl = product.image ? formatImageUrl(product.image) : "";

  // Reset image error if product changes
  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

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
      className="group relative bg-white rounded-2xl border border-slate-200/80 hover:border-[#0260de]/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-full cursor-pointer overflow-hidden select-none"
    >
      {/* 1. PRODUCT VISUAL / IMAGE CONTAINER */}
      <div className="relative w-full aspect-[4/3] bg-gradient-to-b from-slate-50/90 to-white border-b border-slate-100 flex items-center justify-center overflow-hidden">
        {/* Top-Left: Stock Status Badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-xs shadow-2xs ${stockInfo.badgeBg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${stockInfo.dotColor}`} />
            {stockInfo.label}
          </span>
        </div>

        {/* Top-Right: Three-Dot Actions Menu */}
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2.5 right-2.5 z-20"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white text-slate-500 hover:text-slate-900 border border-slate-200/80 shadow-2xs flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs"
            title="Product actions"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {/* Clean Context Menu */}
          {isMenuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
            >
              <button
                type="button"
                onClick={(e) => {
                  setIsMenuOpen(false);
                  handleOpenSinglePage(e);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-[#0260de]" />
                <span>View Full Details</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onEdit(product);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-400" />
                <span>Edit Product</span>
              </button>

              <button
                type="button"
                onClick={handleCopySku}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
              >
                {copiedSku ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-semibold">Copied SKU</span>
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
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 font-semibold cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Delete Product</span>
              </button>
            </div>
          )}
        </div>

        {/* Real Product Image OR Guaranteed High-End Automotive Illustration Fallback */}
        {imageUrl && !imageError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-contain p-3 transition-transform duration-300 ease-out group-hover:scale-105"
            onError={() => {
              // Smoothly fallback to blueprint technical vector if image URL fails or 404s
              setImageError(true);
            }}
          />
        ) : (
          <ProductIllustration
            name={product.name}
            category={product.category}
          />
        )}

        {/* Hover Bottom Action Pill: Quick View */}
        <div className="absolute inset-x-0 bottom-2.5 flex justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 pointer-events-none z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0f172a]/90 hover:bg-[#0260de] text-white text-[11px] font-bold rounded-full shadow-md backdrop-blur-xs transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>
        </div>
      </div>

      {/* 2. CARD CONTENT & METADATA */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-3">
        {/* Category & SKU Sub-row */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 truncate">
              <Tag className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{product.category || "Commercial 3-Wheeler"}</span>
            </span>
            <span className="text-[10px] font-mono font-medium text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 shrink-0 border border-slate-200/50">
              {sku}
            </span>
          </div>

          {/* Product Name */}
          <h3
            className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0260de] transition-colors line-clamp-2 leading-snug"
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
            <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
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
