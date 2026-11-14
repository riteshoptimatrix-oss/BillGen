"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getApiUrl, formatImageUrl, getAuthToken } from "@/lib/api";
import {
  Product,
  formatINR,
  getProductSku,
  getStockStatus,
  ERP_UNITS,
  GST_RATES
} from "@/components/products/types";
import ProductIllustration from "@/components/products/ProductIllustration";
import {
  ArrowLeft,
  Check,
  Package,
  UploadCloud,
  Trash2,
  Copy,
  Link as LinkIcon,
  Receipt,
  FileText
} from "lucide-react";

export default function ProductDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-80">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0260de]" />
        </div>
      }
    >
      <ProductDetailContent />
    </Suspense>
  );
}

function ProductDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pid = searchParams.get("pid");

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedSku, setCopiedSku] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Image input options
  const [imageInputMode, setImageInputMode] = useState<"system" | "url">("system");
  const [imageUrlInput, setImageUrlInput] = useState("");

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    image: string;
    price: number;
    cost_price: number;
    stock: number;
    min_stock_alert: number;
    category: string;
    unit: string;
    hsn_code: string;
    tax_rate: number;
  }>({
    name: "",
    description: "",
    image: "",
    price: 0,
    cost_price: 0,
    stock: 0,
    min_stock_alert: 5,
    category: "Chassis & Frame",
    unit: "Piece (Pcs)",
    hsn_code: "HSN8708",
    tax_rate: 18
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    if (!pid) {
      router.push("/products");
      return;
    }

    async function fetchProduct() {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/products/${pid}`);
        if (res.ok) {
          const data: Product = await res.json();
          setProduct(data);
          setFormData({
            name: data.name,
            description: data.description || "",
            image: data.image || "",
            price: data.price,
            cost_price: data.cost_price || 0,
            stock: data.stock,
            min_stock_alert: data.min_stock_alert || 5,
            category: data.category || "Chassis & Frame",
            unit: data.unit || "Piece (Pcs)",
            hsn_code: data.hsn_code || "HSN8708",
            tax_rate: data.tax_rate ?? 18
          });
        } else {
          router.push("/products");
        }
      } catch (err) {
        console.error("Failed to load product", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProduct();
  }, [pid, router]);

  // Derived hasChanges
  const hasChanges = useMemo(() => {
    if (!product) return false;
    return (
      product.name !== formData.name ||
      (product.description || "") !== formData.description ||
      (product.image || "") !== formData.image ||
      product.price !== formData.price ||
      (product.cost_price || 0) !== formData.cost_price ||
      product.stock !== formData.stock ||
      (product.min_stock_alert || 5) !== formData.min_stock_alert ||
      (product.category || "Chassis & Frame") !== formData.category ||
      (product.unit || "Piece (Pcs)") !== formData.unit ||
      (product.hsn_code || "HSN8708") !== formData.hsn_code ||
      (product.tax_rate ?? 18) !== formData.tax_rate
    );
  }, [formData, product]);

  // Upload image from file system
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      const apiUrl = getApiUrl();
      const token = getAuthToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${apiUrl}/products/upload`, {
        method: "POST",
        headers,
        credentials: "include",
        body: uploadData
      });

      if (res.ok) {
        const data = await res.json();
        const uploadedUrl = data.url || data.path;
        setFormData((prev) => ({ ...prev, image: uploadedUrl }));
        setImageError(false);
        showToast("✓ Product image uploaded successfully");
      } else {
        // Fallback: Read as base64 Data URL so image is always preserved and editable
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            setFormData((prev) => ({ ...prev, image: reader.result as string }));
            setImageError(false);
            showToast("Product image attached successfully");
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error("Upload failed", err);
      // Client-side fallback to FileReader Data URL
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setFormData((prev) => ({ ...prev, image: reader.result as string }));
          setImageError(false);
          showToast("Product image attached successfully");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Direct Image URL Handler
  const handleApplyImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) {
      showToast("Please enter a valid image URL");
      return;
    }
    if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("/") && !url.startsWith("data:")) {
      showToast("URL must start with http:// or https://");
      return;
    }
    setFormData((prev) => ({ ...prev, image: url }));
    setImageError(false);
    setImageUrlInput("");
    showToast("Product image updated from direct URL");
  };

  const handleSave = async () => {
    if (!pid || !formData.name.trim()) return;
    setIsSaving(true);
    const apiUrl = getApiUrl();
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch(`${apiUrl}/products/${pid}`, {
        method: "PUT",
        headers,
        credentials: "include",
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const updated = await res.json();
        setProduct(updated);
        showToast("✓ Product updated successfully! Returning to products...");
        // Directly navigate back to /products page as requested
        setTimeout(() => {
          router.push("/products");
        }, 200);
      } else {
        showToast("Failed to save product changes");
      }
    } catch (err) {
      console.error("Save error", err);
      showToast("Error saving product changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pid || !confirm("Are you sure you want to permanently delete this product?"))
      return;
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/products/${pid}`, {
        method: "DELETE"
      });
      if (res.ok) {
        router.push("/products");
      }
    } catch (err) {
      console.error("Delete error", err);
    }
  };

  const handleCopySku = () => {
    if (!product) return;
    const sku = getProductSku(product);
    navigator.clipboard.writeText(sku);
    setCopiedSku(true);
    setTimeout(() => setCopiedSku(false), 1500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0260de]" />
      </div>
    );
  }

  if (!product) return null;

  const stockInfo = getStockStatus(formData.stock, formData.min_stock_alert);
  const sku = getProductSku(product);
  const imageUrl = formData.image ? formatImageUrl(formData.image) : "";
  const taxAmount = (formData.price * formData.tax_rate) / 100;
  const priceWithTax = formData.price + taxAmount;
  const grossMargin = formData.cost_price > 0 && formData.price > formData.cost_price
    ? Math.round(((formData.price - formData.cost_price) / formData.price) * 100)
    : 0;

  return (
    <div className="font-sans max-w-6xl mx-auto pb-16 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-[#0260de] transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span>All Products</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-bold text-slate-800 truncate max-w-xs">{formData.name}</span>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/bill-invoice/create"
            className="px-3.5 py-2.5 rounded-xl border border-blue-200 bg-blue-50/70 text-xs font-bold text-[#0260de] hover:bg-blue-100 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
            title="Create New Invoice with this product"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Create Invoice</span>
          </Link>

          <button
            type="button"
            onClick={handleDelete}
            className="px-3.5 py-2.5 rounded-xl border border-rose-200 bg-white text-xs font-semibold text-rose-600 hover:bg-rose-50 shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !formData.name.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0260de] hover:bg-[#0252bf] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        {/* Left Column: Image & Media Management (approx 5 cols) */}
        <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-50/50 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Product Image Showcase
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${stockInfo.badgeBg}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${stockInfo.dotColor}`} />
                {stockInfo.label}
              </span>
            </div>

            {/* Image Preview Box */}
            <div className="relative w-full aspect-square rounded-2xl bg-white border border-slate-200/90 flex items-center justify-center overflow-hidden group shadow-2xs">
              {imageUrl && !imageError ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={imageUrl}
                  alt={formData.name}
                  className="w-full h-full object-contain p-4"
                  onError={() => setImageError(true)}
                />
              ) : (
                <ProductIllustration
                  name={formData.name}
                  category={formData.category}
                />
              )}

              {formData.image && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, image: "" }));
                    setImageError(false);
                    showToast("Product image removed");
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-xl bg-white/90 text-rose-600 border border-slate-200 hover:bg-rose-50 shadow-xs transition-all cursor-pointer opacity-80 group-hover:opacity-100"
                  title="Remove image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Image Source Mode (System Upload vs Direct URL) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl">
                <button
                  type="button"
                  onClick={() => setImageInputMode("system")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    imageInputMode === "system"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload from PC</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputMode("url")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    imageInputMode === "url"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Direct Image URL</span>
                </button>
              </div>

              {/* Mode 1: File Upload */}
              {imageInputMode === "system" && (
                <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-dashed border-slate-300 hover:border-[#0260de] bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer transition-colors shadow-2xs">
                  <UploadCloud className="w-4 h-4 text-[#0260de]" />
                  <span>Select Image from Computer</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="sr-only"
                  />
                </label>
              )}

              {/* Mode 2: Direct URL Input */}
              {imageInputMode === "url" && (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleApplyImageUrl();
                      }
                    }}
                    placeholder="Paste image link https://..."
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#0260de]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyImageUrl}
                    className="px-3 py-2 bg-[#0260de] hover:bg-[#0252bf] text-white text-xs font-bold rounded-xl shadow-2xs shrink-0"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Technical Summary Cards */}
          <div className="space-y-2">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 text-xs space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">SKU / Product ID</span>
                <button
                  type="button"
                  onClick={handleCopySku}
                  className="font-mono font-bold text-[#0260de] hover:underline flex items-center gap-1 cursor-pointer"
                  title="Click to copy SKU"
                >
                  <span>{sku}</span>
                  {copiedSku ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Category</span>
                <span className="font-semibold text-slate-800">{formData.category}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">HSN / SAC Code</span>
                <span className="font-mono font-semibold text-slate-700">{formData.hsn_code}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">GST Rate</span>
                <span className="font-bold text-slate-900">{formData.tax_rate}%</span>
              </div>

              <div className="h-px bg-slate-100 my-1" />

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Gross Price (incl. GST)</span>
                <span className="font-black text-[#0260de] text-sm">{formatINR(priceWithTax)}</span>
              </div>
            </div>

            {grossMargin > 0 && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <span className="text-emerald-800 font-medium">Estimated Gross Margin</span>
                <span className="font-black text-emerald-700">+{grossMargin}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Specifications & Fields (approx 7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-8 space-y-6">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              General Information
            </span>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Chassis Assembly Heavy Duty"
              className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-[#0260de] focus:ring-2 focus:ring-[#0260de]/10 transition-all"
            />
          </div>

          {/* Description & Technical Specifications */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Description &amp; Engineering Specifications</span>
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide technical specifications, dimensions, material grade, compatibility..."
              className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-[#0260de]"
            />
          </div>

          {/* Pricing, Cost & Stock Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Selling Price (INR) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#0260de]">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl pl-8 pr-3.5 py-2.5 text-xs sm:text-sm font-extrabold text-slate-900 focus:outline-none focus:bg-white focus:border-[#0260de]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Cost / Purchase Price
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost_price || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="Optional cost"
                  className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl pl-8 pr-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#0260de]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Available Stock <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
                }
                className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-extrabold text-slate-900 focus:outline-none focus:bg-white focus:border-[#0260de]"
              />
            </div>
          </div>

          {/* Unit, HSN, Tax Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Unit of Measurement
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-[#0260de] cursor-pointer"
              >
                {ERP_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                HSN / SAC Code
              </label>
              <input
                type="text"
                value={formData.hsn_code}
                onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-[#0260de]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                GST Tax Bracket
              </label>
              <select
                value={formData.tax_rate}
                onChange={(e) =>
                  setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-[#0260de] cursor-pointer"
              >
                {GST_RATES.map((r) => (
                  <option key={r} value={r}>
                    {r}% GST
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Minimum Stock Alert Level
              </label>
              <input
                type="number"
                min="0"
                value={formData.min_stock_alert}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    min_stock_alert: parseInt(e.target.value) || 0
                  })
                }
                className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-[#0260de]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
