"use client";

import { useState, useEffect, useMemo } from "react";
import { getApiUrl, formatImageUrl } from "@/lib/api";

interface Product {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  stock: number;
  category?: string;
  unit?: string;
  hsn_code?: string;
  tax_rate?: number;
}

type StockFilter = "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selection & Mode State
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // In mobile view, ALWAYS default to "directory" so the user sees the list first
  const [mobileView, setMobileView] = useState<"directory" | "detail">("directory");

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("ALL");

  // Accordion toggle for additional details
  const [isAdditionalDetailsOpen, setIsAdditionalDetailsOpen] = useState(true);

  // Form State
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    price: 0,
    stock: 0,
    category: "Chassis & Frame",
    unit: "Piece (Pcs)",
    hsn_code: "HSN8708",
    tax_rate: 18
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchProducts = async () => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/products/`);
      if (res.ok) {
        const data: Product[] = await res.json();
        setProducts(data);
        if (data.length > 0 && !activeProductId && !isCreatingNew) {
          populateProductForm(data[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch products", error);
      showToast("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const populateProductForm = (p: Product) => {
    setActiveProductId(p._id);
    setFormData({
      name: p.name,
      description: p.description || "",
      image: p.image || "",
      price: p.price,
      stock: p.stock,
      category: p.category || "Chassis & Frame",
      unit: p.unit || "Piece (Pcs)",
      hsn_code: p.hsn_code || "HSN8708",
      tax_rate: p.tax_rate ?? 18
    });
  };

  const selectProduct = (p: Product) => {
    setIsCreatingNew(false);
    populateProductForm(p);
    // Switch to detail view on mobile
    setMobileView("detail");
  };

  const handleStartCreateNew = () => {
    setIsCreatingNew(true);
    setActiveProductId(null);
    setFormData({
      name: "",
      description: "",
      image: "",
      price: 0,
      stock: 10,
      category: "Chassis & Frame",
      unit: "Piece (Pcs)",
      hsn_code: "HSN8708",
      tax_rate: 18
    });
    setMobileView("detail");
  };

  const handleCancel = () => {
    if (products.length > 0) {
      populateProductForm(products[0]);
    }
    setMobileView("directory");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Fast local preview
    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, image: previewUrl }));

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/products/upload`, {
        method: "POST",
        body: uploadData,
      });
      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({ ...prev, image: data.url }));
        showToast("Product image uploaded successfully");
      }
    } catch (err) {
      console.error("Upload failed, retaining local preview", err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Please enter product name");
      return;
    }

    setIsSaving(true);
    const apiUrl = getApiUrl();

    try {
      if (isCreatingNew) {
        const res = await fetch(`${apiUrl}/products/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          const newProduct: Product = await res.json();
          setProducts((prev) => [newProduct, ...prev]);
          setActiveProductId(newProduct._id);
          setIsCreatingNew(false);
          populateProductForm(newProduct);
          showToast("Product created successfully!");
        } else {
          showToast("Failed to create product");
        }
      } else if (activeProductId) {
        const res = await fetch(`${apiUrl}/products/${activeProductId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          const updated: Product = await res.json();
          setProducts((prev) =>
            prev.map((p) => (p._id === activeProductId ? updated : p))
          );
          populateProductForm(updated);
          showToast("Product updated successfully!");
        } else {
          showToast("Failed to update product");
        }
      }
    } catch (error) {
      console.error(error);
      showToast("Error saving product");
    } finally {
      setIsSaving(false);
      // Automatically redirect back to the Products Catalog on mobile!
      setMobileView("directory");
    }
  };

  const handleDeleteActive = async () => {
    if (!activeProductId) return;
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/products/${activeProductId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("Product deleted successfully");
        const remaining = products.filter((p) => p._id !== activeProductId);
        setProducts(remaining);
        if (remaining.length > 0) {
          populateProductForm(remaining[0]);
        } else {
          handleStartCreateNew();
        }
        setMobileView("directory");
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to delete product");
    }
  };

  // Stock status counts
  const stockCounts = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    products.forEach((p) => {
      if (p.stock <= 0) outOfStock++;
      else if (p.stock < 10) lowStock++;
      else inStock++;
    });

    return {
      all: products.length,
      inStock,
      lowStock,
      outOfStock
    };
  }, [products]);

  // Filtered product list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesStock = true;
      if (stockFilter === "IN_STOCK") matchesStock = p.stock >= 10;
      else if (stockFilter === "LOW_STOCK") matchesStock = p.stock > 0 && p.stock < 10;
      else if (stockFilter === "OUT_OF_STOCK") matchesStock = p.stock <= 0;

      return matchesSearch && matchesStock;
    });
  }, [products, searchQuery, stockFilter]);

  const getStockBadge = (stock: number) => {
    if (stock <= 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-[#fef1f0] text-[#cf382b] border border-[#fbd6d3]">
          Out of Stock
        </span>
      );
    }
    if (stock < 10) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-[#fff7ed] text-[#c2641e] border border-[#fedec2]">
          Low Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-[#eaf8ea] text-[#1e822d] border border-[#d2f0d2]">
        In Stock
      </span>
    );
  };

  return (
    <div className="space-y-5 sm:space-y-6 pb-12 font-sans text-[#0f172a] w-full max-w-full overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0f172a] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-[#86efac]"></span>
          {toastMessage}
        </div>
      )}

      {/* 1. TOP HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#eff6ff] flex items-center justify-center text-[#0260de] shrink-0 border border-[#e2e8f0] shadow-xs">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0f172a] tracking-tight">
              Products
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#64748b] font-medium mt-1 line-clamp-1 sm:line-clamp-none">
            Manage your product catalog, pricing and inventory.
          </p>
        </div>

        {/* Right Actions: Import & Export hidden in mobile view, + Add Product full width on mobile */}
        <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          {/* Desktop Only: Import */}
          <button
            type="button"
            onClick={() => showToast("Exporting catalog to CSV...")}
            className="hidden sm:flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-white text-xs font-bold text-[#0f172a] hover:bg-[#f8fafc] shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-[#64748b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Import</span>
          </button>

          {/* Desktop Only: Export */}
          <button
            type="button"
            onClick={() => showToast("Catalog downloaded as CSV")}
            className="hidden sm:flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-white text-xs font-bold text-[#0f172a] hover:bg-[#f8fafc] shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-[#64748b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
            </svg>
            <span>Export</span>
          </button>

          {/* Mobile + Desktop: + Add Product */}
          <button
            type="button"
            onClick={handleStartCreateNew}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-[#0260de] text-white text-xs font-bold hover:bg-[#0252bf] shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <span className="text-sm font-bold leading-none">+</span>
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN SPLIT PANE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* ======================================================== */}
        {/* LEFT COLUMN: MASTER LIST & FILTERS (approx 4.5 cols)     */}
        {/* Mobile: Shown by default; hidden when editing a product  */}
        {/* Desktop: Always visible (5 Columns)                      */}
        {/* ======================================================== */}
        <div
          className={`lg:col-span-4 xl:col-span-5 space-y-3.5 sm:space-y-4 ${
            mobileView === "detail" ? "hidden lg:block" : "block"
          }`}
        >
          {/* Filter Pills Header */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
            <button
              onClick={() => setStockFilter("ALL")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                stockFilter === "ALL"
                  ? "bg-[#0260de] text-white shadow-2xs"
                  : "bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>All Products</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${stockFilter === "ALL" ? "bg-white/20 text-white" : "bg-[#eff6ff] text-[#0260de]"}`}>
                {stockCounts.all}
              </span>
            </button>

            <button
              onClick={() => setStockFilter("IN_STOCK")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                stockFilter === "IN_STOCK"
                  ? "bg-[#1e822d] text-white shadow-2xs"
                  : "bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#1e822d]" />
              <span>In Stock</span>
              <span className="text-[10px] bg-[#eaf8ea] text-[#1e822d] px-1.5 py-0.2 rounded-md font-bold">
                {stockCounts.inStock}
              </span>
            </button>

            <button
              onClick={() => setStockFilter("LOW_STOCK")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                stockFilter === "LOW_STOCK"
                  ? "bg-[#d96527] text-white shadow-2xs"
                  : "bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#d96527]" />
              <span>Low Stock</span>
              <span className="text-[10px] bg-[#fff2e8] text-[#d96527] px-1.5 py-0.2 rounded-md font-bold">
                {stockCounts.lowStock}
              </span>
            </button>

            <button
              onClick={() => setStockFilter("OUT_OF_STOCK")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                stockFilter === "OUT_OF_STOCK"
                  ? "bg-[#cf382b] text-white shadow-2xs"
                  : "bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#cf382b]" />
              <span>Out of Stock</span>
              <span className="text-[10px] bg-[#fef1f0] text-[#cf382b] px-1.5 py-0.2 rounded-md font-bold">
                {stockCounts.outOfStock}
              </span>
            </button>
          </div>

          {/* Search Row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search products by name or spec..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#e2e8f0] rounded-xl pl-9 pr-3 py-2 text-xs text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:border-[#0260de] shadow-2xs"
              />
            </div>

            <button
              type="button"
              title="Filter"
              className="p-2.5 bg-white border border-[#e2e8f0] rounded-xl text-[#64748b] hover:bg-[#f8fafc] shadow-2xs cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          </div>

          {/* Product Cards List */}
          <div className="space-y-2 max-h-[500px] lg:max-h-[580px] overflow-y-auto pr-0.5">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#0260de]" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-xs font-medium text-[#64748b] bg-white rounded-2xl border border-[#e2e8f0]">
                No products match your search.
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isSelected = p._id === activeProductId && !isCreatingNew;
                return (
                  <div
                    key={p._id}
                    onClick={() => selectProduct(p)}
                    className={`p-3 rounded-2xl cursor-pointer transition-all duration-150 flex items-center justify-between gap-3 border ${
                      isSelected
                        ? "bg-[#0260de] text-white border-[#0260de] shadow-md"
                        : "bg-white text-[#0f172a] border-[#e2e8f0] hover:bg-[#f8fafc] shadow-xs"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      {/* Product Thumbnail */}
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white border border-[#e2e8f0] overflow-hidden shrink-0 flex items-center justify-center p-1">
                        {p.image ? (
                          <img
                            src={formatImageUrl(p.image)}
                            alt={p.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <svg className="w-5 h-5 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold truncate ${isSelected ? "text-white" : "text-[#0f172a]"}`} title={p.name}>
                          {p.name}
                        </p>
                        <p className={`text-xs font-black mt-0.5 ${isSelected ? "text-blue-100" : "text-[#0260de]"}`}>
                          ₹{p.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {/* Stock badge + Chevron */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isSelected ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-white/20 text-white">
                          In Stock
                        </span>
                      ) : (
                        getStockBadge(p.stock)
                      )}
                      <svg
                        className={`w-3.5 h-3.5 transition-transform ${isSelected ? "text-white translate-x-0.5" : "text-stone-400"}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: PRODUCT DETAIL & EDIT PANE (approx 7.5 cols)*/}
        {/* Mobile: Hidden by default; shown when a product is clicked */}
        {/* Desktop: Always visible (7 Columns)                      */}
        {/* ======================================================== */}
        <div
          className={`lg:col-span-8 xl:col-span-7 bg-white rounded-3xl p-4 sm:p-7 border border-[#e2e8f0] shadow-xs ${
            mobileView === "directory" ? "hidden lg:block" : "block"
          }`}
        >
          {/* Mobile Back Button */}
          <div className="lg:hidden pb-1">
            <button
              type="button"
              onClick={() => setMobileView("directory")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0260de] hover:text-[#0252bf] p-1 -ml-1 transition-colors cursor-pointer mb-2"
            >
              <svg className="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Product Catalog</span>
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-5 sm:space-y-6">
            {/* Header: Edit Product + Cancel & Save Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#f1f5f9] gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#eff6ff] flex items-center justify-center text-[#0260de] shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#0f172a]">
                    {isCreatingNew ? "Add New Product" : "Edit Product"}
                  </h2>
                  <p className="text-xs text-[#64748b]">
                    Update product information, pricing and stock details.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-1 sm:pt-0">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-[#e2e8f0] bg-white text-xs font-bold text-[#64748b] hover:bg-[#f8fafc] shadow-2xs transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-[#0260de] text-white text-xs font-bold hover:bg-[#0252bf] shadow-sm transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap active:scale-95"
                >
                  <span>✓</span>
                  <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </div>

            {/* Top Grid: Image Gallery Left & Text Inputs Right */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-start">
              {/* Left Side: Product Image Display & Upload */}
              <div className="md:col-span-5 space-y-3">
                {/* Main Image Container */}
                <div className="relative w-full h-44 sm:h-56 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] overflow-hidden flex items-center justify-center p-3 group">
                  <span className="absolute top-3 left-3 bg-[#0260de] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-lg z-10 shadow-2xs">
                    Main Image
                  </span>

                  {!isCreatingNew && (
                    <button
                      type="button"
                      onClick={handleDeleteActive}
                      title="Delete Product"
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/90 hover:bg-rose-50 text-rose-600 border border-[#e2e8f0] z-10 shadow-2xs backdrop-blur-xs cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}

                  {formData.image ? (
                    <img
                      src={formatImageUrl(formData.image)}
                      alt="Product preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-stone-300">
                      <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-[#64748b] font-medium mt-1">No image uploaded</span>
                    </div>
                  )}
                </div>

                {/* Thumbnail Gallery & Add Image Button */}
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white border-2 border-[#0260de] p-1 overflow-hidden flex items-center justify-center shadow-2xs">
                    {formData.image ? (
                      <img src={formatImageUrl(formData.image)} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-stone-400">1</span>
                    )}
                  </div>

                  <label className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#f8fafc] border-2 border-dashed border-[#cbd5e1] hover:border-[#0260de] flex flex-col items-center justify-center text-[#0260de] hover:bg-[#eff6ff] cursor-pointer transition-colors">
                    <span className="text-base sm:text-lg font-bold leading-none">+</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="sr-only" />
                  </label>
                </div>
              </div>

              {/* Right Side: Form Inputs */}
              <div className="md:col-span-7 space-y-3.5 sm:space-y-4">
                {/* Product Name */}
                <div>
                  <label className="block text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-1">
                    PRODUCT NAME <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Auto Rickshaw Heavy-Duty Tubular Chassis Frame"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3.5 py-2 sm:py-2.5 text-xs font-semibold text-[#0f172a] focus:outline-none focus:border-[#0260de] shadow-2xs"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-1">
                    DESCRIPTION
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide technical specs, grade, welding and assembly details..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3.5 py-2 text-xs text-[#0f172a] focus:outline-none focus:border-[#0260de] shadow-2xs"
                  />
                </div>

                {/* Price & Stock in 2 columns */}
                <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-1">
                      PRICE (INR) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#0260de]">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl pl-8 pr-3 py-2 text-xs font-black text-[#0f172a] focus:outline-none focus:border-[#0260de] shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-1">
                      STOCK INVENTORY <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#64748b]">
                        📦
                      </span>
                      <input
                        type="number"
                        required
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                        className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl pl-8 pr-8 py-2 text-xs font-black text-[#0f172a] focus:outline-none focus:border-[#0260de] shadow-2xs"
                      />
                      <div className="absolute right-2 flex flex-col">
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, stock: prev.stock + 1 }))}
                          className="text-[10px] text-[#64748b] hover:text-[#0f172a] leading-none cursor-pointer"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, stock: Math.max(0, prev.stock - 1) }))}
                          className="text-[10px] text-[#64748b] hover:text-[#0f172a] leading-none cursor-pointer"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Section: 4 Quick Stats Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
              {/* Box 1: Stock Status */}
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-2.5 sm:p-3 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-xs shadow-2xs shrink-0">
                  📦
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-[#64748b] uppercase block truncate">Stock Status</span>
                  {getStockBadge(formData.stock)}
                </div>
              </div>

              {/* Box 2: Added On */}
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-2.5 sm:p-3 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-xs shadow-2xs shrink-0">
                  🏷️
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-[#64748b] uppercase block truncate">Catalog Status</span>
                  <span className="text-xs font-bold text-[#0f172a]">Active</span>
                </div>
              </div>

              {/* Box 3: Category */}
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-2.5 sm:p-3 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-xs shadow-2xs shrink-0">
                  ⚙️
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-[#64748b] uppercase block truncate">Category</span>
                  <span className="text-[11px] font-bold text-[#0f172a] truncate block">{formData.category}</span>
                </div>
              </div>

              {/* Box 4: Product ID */}
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-2.5 sm:p-3 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-xs shadow-2xs shrink-0">
                  ║▌
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-[#64748b] uppercase block truncate">Product ID</span>
                  <span className="text-xs font-mono font-bold text-[#0260de] truncate block">
                    PRD-{activeProductId ? activeProductId.slice(-6).toUpperCase() : "NEW"}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Section: "Additional Details" Accordion */}
            <div className="border border-[#e2e8f0] rounded-2xl overflow-hidden bg-[#f8fafc]">
              <button
                type="button"
                onClick={() => setIsAdditionalDetailsOpen(!isAdditionalDetailsOpen)}
                className="w-full px-4 py-3 flex items-center justify-between bg-white text-xs font-bold text-[#0f172a] hover:bg-[#f8fafc] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#eff6ff] text-[#0260de] flex items-center justify-center text-[10px]">
                    ⓘ
                  </span>
                  <span>Additional Details &amp; Tax Specs</span>
                </div>
                <svg
                  className={`w-4 h-4 text-[#64748b] transition-transform ${isAdditionalDetailsOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isAdditionalDetailsOpen && (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-[#f8fafc] border-t border-[#f1f5f9]">
                  <div>
                    <label className="block text-[10px] font-bold text-[#64748b] uppercase mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-white border border-[#e2e8f0] rounded-xl px-3 py-1.5 text-xs text-[#0f172a] focus:outline-none focus:border-[#0260de] cursor-pointer"
                    >
                      <option value="Chassis & Frame">Chassis &amp; Frame</option>
                      <option value="Engine & Powertrain">Engine &amp; Powertrain</option>
                      <option value="Transmission & Differential">Transmission &amp; Differential</option>
                      <option value="Suspension & Steering">Suspension &amp; Steering</option>
                      <option value="Sheet Metal Body">Sheet Metal Body</option>
                      <option value="Electrical & Wiring">Electrical &amp; Wiring</option>
                      <option value="Braking System">Braking System</option>
                      <option value="CNG Kits">CNG Kits</option>
                      <option value="Tyres & Rims">Tyres &amp; Rims</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#64748b] uppercase mb-1">
                      Unit
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full bg-white border border-[#e2e8f0] rounded-xl px-3 py-1.5 text-xs text-[#0f172a] focus:outline-none focus:border-[#0260de] cursor-pointer"
                    >
                      <option value="Piece (Pcs)">Piece (Pcs)</option>
                      <option value="Set">Set</option>
                      <option value="Assembly">Assembly</option>
                      <option value="Box">Box</option>
                      <option value="Kilogram (Kg)">Kilogram (Kg)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#64748b] uppercase mb-1">
                      HSN / SKU
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. HSN8708"
                      value={formData.hsn_code}
                      onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                      className="w-full bg-white border border-[#e2e8f0] rounded-xl px-3 py-1.5 text-xs text-[#0f172a] focus:outline-none focus:border-[#0260de]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#64748b] uppercase mb-1">
                      % Tax (GST)
                    </label>
                    <select
                      value={formData.tax_rate}
                      onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-[#e2e8f0] rounded-xl px-3 py-1.5 text-xs text-[#0f172a] focus:outline-none focus:border-[#0260de] cursor-pointer"
                    >
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                      <option value={12}>12%</option>
                      <option value={5}>5%</option>
                      <option value={0}>0%</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
