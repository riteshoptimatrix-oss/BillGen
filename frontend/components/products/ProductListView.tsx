"use client";

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
  Trash2,
  Package,
  Tag,
  ExternalLink
} from "lucide-react";

interface ProductListViewProps {
  products: Product[];
  onQuickView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
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
      {products.map((product) => {
        const stockInfo = getStockStatus(product.stock, product.min_stock_alert || 10);
        const sku = getProductSku(product);
        const imageUrl = product.image ? formatImageUrl(product.image) : "";

        return (
          <div
            key={product._id}
            onClick={() => handleOpenSinglePage(product._id)}
            className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer group"
          >
            {/* Left: Thumbnail + Name + Category */}
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-50 border border-slate-200/80 p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <Package className="w-6 h-6 text-slate-300" strokeWidth={1.5} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-medium text-slate-400 px-1.5 py-0.5 rounded bg-slate-100">
                    {sku}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                    <Tag className="w-3 h-3 text-slate-400" />
                    <span>{product.category || "General"}</span>
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

            {/* Right: Stock + Price + Actions */}
            <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              {/* Stock Status Badge */}
              <div className="flex flex-col sm:items-end">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${stockInfo.badgeBg}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${stockInfo.dotColor}`} />
                  {stockInfo.label}
                </span>
                <span className="text-[11px] font-mono font-semibold text-slate-500 mt-0.5">
                  {product.stock} {product.unit || "units"} available
                </span>
              </div>

              {/* Price */}
              <div className="text-right min-w-24">
                <span className="text-[10px] font-medium text-slate-400 block uppercase">
                  Price
                </span>
                <span className="text-base font-extrabold text-slate-900">
                  {formatINR(product.price)}
                </span>
              </div>

              {/* Action Buttons */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 shrink-0"
              >
                <button
                  type="button"
                  onClick={() => handleOpenSinglePage(product._id)}
                  className="p-2 rounded-xl text-slate-500 hover:text-[#0260de] hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                  title="Open Single Product Page"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onQuickView(product)}
                  className="p-2 rounded-xl text-slate-500 hover:text-[#0260de] hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                  title="Quick View"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(product)}
                  className="p-2 rounded-xl text-slate-500 hover:text-[#0260de] hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                  title="Edit Product"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(product)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                  title="Delete Product"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
