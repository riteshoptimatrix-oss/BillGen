"use client";

import { useState } from "react";
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
  Trash2,
  Tag,
  ArrowUpRight
} from "lucide-react";

interface ProductListViewProps {
  products: Product[];
  onQuickView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

function ProductListRow({
  product,
  onOpen,
  onQuickView,
  onEdit,
  onDelete
}: {
  product: Product;
  onOpen: (id?: string) => void;
  onQuickView: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}) {
  const [imageError, setImageError] = useState(false);
  const stockInfo = getStockStatus(product.stock, product.min_stock_alert || 10);
  const sku = getProductSku(product);
  const imageUrl = product.image ? formatImageUrl(product.image) : "";

  return (
    <div
      onClick={() => onOpen(product._id)}
      className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer group"
    >
      {/* Left: Thumbnail + Name + Category */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-50 border border-slate-200/80 p-1 shrink-0 flex items-center justify-center overflow-hidden">
          {imageUrl && !imageError ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform"
              onError={() => setImageError(true)}
            />
          ) : (
            <ProductIllustration name={product.name} category={product.category} className="p-0.5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-medium text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200/50">
              {sku}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <Tag className="w-3 h-3 text-slate-400" />
              <span>{product.category || "Commercial 3-Wheeler"}</span>
            </span>
          </div>

          <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#0260de] transition-colors truncate">
            {product.name}
          </h4>

          {product.description && (
            <p className="text-xs text-slate-400 truncate max-w-lg mt-0.5">
              {product.description}
            </p>
          )}
        </div>
      </div>

      {/* Middle: Stock Status Badge */}
      <div className="sm:w-36 flex sm:flex-col sm:items-end justify-between items-center shrink-0">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${stockInfo.badgeBg}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${stockInfo.dotColor}`} />
          {stockInfo.label}
        </span>
        <span className="text-xs font-semibold text-slate-600 mt-1">
          {product.stock} {product.unit ? product.unit.split(" ")[0] : "Pcs"} in stock
        </span>
      </div>

      {/* Right: Price + Action Buttons */}
      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 sm:w-64 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
        <div className="text-left sm:text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Selling Price
          </span>
          <span className="text-base font-black text-slate-900">
            {formatINR(product.price)}
          </span>
        </div>

        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <button
            type="button"
            onClick={() => onOpen(product._id)}
            className="p-2 rounded-xl text-slate-500 hover:text-[#0260de] hover:bg-slate-100 transition-colors cursor-pointer"
            title="Open Product Page"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onQuickView(product)}
            className="p-2 rounded-xl text-slate-500 hover:text-[#0260de] hover:bg-slate-100 transition-colors cursor-pointer"
            title="Quick View Drawer"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(product)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Edit Product"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(product)}
            className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Delete Product"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductListView({
  products,
  onQuickView,
  onEdit,
  onDelete
}: ProductListViewProps) {
  const router = useRouter();

  const handleOpenSinglePage = (id?: string) => {
    if (id) {
      router.push(`/products/detail?pid=${id}`);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden divide-y divide-slate-100">
      {products.map((product) => (
        <ProductListRow
          key={product._id}
          product={product}
          onOpen={handleOpenSinglePage}
          onQuickView={onQuickView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
