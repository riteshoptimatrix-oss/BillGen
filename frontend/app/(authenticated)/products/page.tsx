"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { getApiUrl } from "@/lib/api";
import {
  Product,
  FilterState,
  ERP_CATEGORIES
} from "@/components/products/types";

import ProductHeader from "@/components/products/ProductHeader";
import ProductStatistics from "@/components/products/ProductStatistics";
import ProductToolbar from "@/components/products/ProductToolbar";
import ProductGrid from "@/components/products/ProductGrid";
import ProductQuickView from "@/components/products/ProductQuickView";
import ProductFormModal from "@/components/products/ProductFormModal";
import ProductImportExportModal from "@/components/products/ProductImportExportModal";
import ProductEmptyState from "@/components/products/ProductEmptyState";
import ProductSkeleton from "@/components/products/ProductSkeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Modals & Drawer State
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Filter & View State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    category: "ALL",
    stockFilter: "ALL",
    priceRange: "ALL",
    sortBy: "newest",
    viewMode: "grid"
  });

  // Pagination State (16 items per page = 4 rows of 4 on desktop)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16;

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Fetch products from backend
  const refreshCatalog = useCallback(async () => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/products/`);
      if (res.ok) {
        const data: Product[] = await res.json();
        setProducts(data);
      } else {
        showToast("Failed to fetch product list");
      }
    } catch (err) {
      console.error("Products fetch error", err);
      showToast("Cannot connect to server to load products");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/products/`);
        if (res.ok && !ignore) {
          const data: Product[] = await res.json();
          setProducts(data);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Products fetch error", err);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  // Compute category list from constants + existing products
  const availableCategories = useMemo(() => {
    const set = new Set<string>(ERP_CATEGORIES);
    products.forEach((p) => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return Array.from(set);
  }, [products]);

  // Stock summary counts for top statistics
  const stockCounts = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    products.forEach((p) => {
      const minAlert = p.min_stock_alert ?? 10;
      if (p.stock <= 0) {
        outOfStock++;
      } else if (p.stock < minAlert) {
        lowStock++;
      } else {
        inStock++;
      }
    });

    return {
      total: products.length,
      inStock,
      lowStock,
      outOfStock
    };
  }, [products]);

  // Filtering & Sorting Pipeline
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search query
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          const nameMatch = p.name.toLowerCase().includes(q);
          const descMatch = p.description?.toLowerCase().includes(q) ?? false;
          const skuMatch =
            (p.sku && p.sku.toLowerCase().includes(q)) ||
            (p.hsn_code && p.hsn_code.toLowerCase().includes(q)) ||
            p._id.toLowerCase().includes(q);
          if (!nameMatch && !descMatch && !skuMatch) return false;
        }

        // Category filter
        if (filters.category !== "ALL" && p.category !== filters.category) {
          return false;
        }

        // Stock availability filter
        const minAlert = p.min_stock_alert ?? 10;
        if (filters.stockFilter === "IN_STOCK" && p.stock < minAlert) return false;
        if (
          filters.stockFilter === "LOW_STOCK" &&
          (p.stock <= 0 || p.stock >= minAlert)
        )
          return false;
        if (filters.stockFilter === "OUT_OF_STOCK" && p.stock > 0) return false;

        // Price range filter
        if (filters.priceRange === "UNDER_1K" && p.price >= 1000) return false;
        if (filters.priceRange === "1K_5K" && (p.price < 1000 || p.price > 5000))
          return false;
        if (
          filters.priceRange === "5K_20K" &&
          (p.price < 5000 || p.price > 20000)
        )
          return false;
        if (filters.priceRange === "ABOVE_20K" && p.price <= 20000) return false;

        return true;
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case "name_asc":
            return a.name.localeCompare(b.name);
          case "name_desc":
            return b.name.localeCompare(a.name);
          case "price_asc":
            return a.price - b.price;
          case "price_desc":
            return b.price - a.price;
          case "stock_asc":
            return a.stock - b.stock;
          case "stock_desc":
            return b.stock - a.stock;
          case "newest":
          default:
            return 0; // Backend list already defaults to database creation order
        }
      });
  }, [products, filters]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handleFilterUpdate = (updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: "",
      category: "ALL",
      stockFilter: "ALL",
      priceRange: "ALL",
      sortBy: "newest",
      viewMode: "grid"
    });
    setCurrentPage(1);
  };

  // Quick View Handlers
  const handleOpenQuickView = (product: Product) => {
    setQuickViewProduct(product);
    setIsQuickViewOpen(true);
  };

  const handleCloseQuickView = () => {
    setIsQuickViewOpen(false);
    setQuickViewProduct(null);
  };

  // Add / Edit Handlers
  const handleAddNewProduct = () => {
    setProductToEdit(null);
    setFormModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setProductToEdit(product);
    setFormModalOpen(true);
  };

  const handleFormSuccess = (savedProduct: Product, isNew: boolean) => {
    if (isNew) {
      setProducts((prev) => [savedProduct, ...prev]);
    } else {
      setProducts((prev) =>
        prev.map((p) => (p._id === savedProduct._id ? savedProduct : p))
      );
      if (quickViewProduct && quickViewProduct._id === savedProduct._id) {
        setQuickViewProduct(savedProduct);
      }
    }
  };

  // Delete Handler
  const handleDeleteProduct = async (product: Product) => {
    if (!product._id) return;
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/products/${product._id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p._id !== product._id));
        showToast(`Product "${product.name}" deleted`);
        if (quickViewProduct?._id === product._id) {
          setIsQuickViewOpen(false);
        }
      } else {
        showToast("Failed to delete product from server");
      }
    } catch (err) {
      console.error("Delete error", err);
      showToast("Network error deleting product");
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (products.length === 0) {
      showToast("No products to export");
      return;
    }

    const headers = [
      "Product ID",
      "Name",
      "Category",
      "SKU",
      "Price (INR)",
      "Stock",
      "Unit",
      "HSN Code",
      "Tax Rate (%)",
      "Description"
    ];

    const rows = products.map((p) => [
      p._id || "",
      `"${(p.name || "").replace(/"/g, '""')}"`,
      `"${(p.category || "").replace(/"/g, '""')}"`,
      `"${(p.sku || p.hsn_code || "").replace(/"/g, '""')}"`,
      p.price || 0,
      p.stock || 0,
      `"${(p.unit || "Piece (Pcs)").replace(/"/g, '""')}"`,
      `"${(p.hsn_code || "").replace(/"/g, '""')}"`,
      p.tax_rate ?? 18,
      `"${(p.description || "").replace(/"/g, '""')}"`
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `siddhivinayak_products_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${products.length} products to CSV`);
  };

  return (
    <div className="space-y-5 sm:space-y-6 pb-12 font-sans text-slate-900 w-full max-w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 text-xs sm:text-sm font-semibold border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. PAGE HEADER */}
      <ProductHeader
        onAddNew={handleAddNewProduct}
        onImport={() => setIsImportModalOpen(true)}
        onExport={handleExportCsv}
        totalCount={products.length}
      />

      {/* 2. COMPACT HORIZONTAL PRODUCT STATISTICS */}
      <ProductStatistics
        counts={stockCounts}
        activeFilter={filters.stockFilter}
        onFilterChange={(filter) => handleFilterUpdate({ stockFilter: filter })}
      />

      {/* 3. FILTERING & SEARCH TOOLBAR */}
      <ProductToolbar
        filters={filters}
        onFilterChange={handleFilterUpdate}
        onResetFilters={handleResetFilters}
        categories={availableCategories}
        totalFiltered={filteredProducts.length}
        totalProducts={products.length}
      />

      {/* 4. PRODUCT CATALOG GRID / LIST OR STATES */}
      {isLoading ? (
        <ProductSkeleton viewMode={filters.viewMode} count={8} />
      ) : products.length === 0 ? (
        <ProductEmptyState
          isFiltering={false}
          onResetFilters={handleResetFilters}
          onAddNew={handleAddNewProduct}
        />
      ) : filteredProducts.length === 0 ? (
        <ProductEmptyState
          isFiltering={true}
          onResetFilters={handleResetFilters}
          onAddNew={handleAddNewProduct}
        />
      ) : (
        <div className="space-y-6">
          <ProductGrid
            products={paginatedProducts}
            viewMode={filters.viewMode}
            onQuickView={handleOpenQuickView}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
          />

          {/* 5. PAGINATION BAR (When products exceed itemsPerPage) */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200/90 text-xs text-slate-500">
              <span>
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of{" "}
                {filteredProducts.length} items
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const pNum = i + 1;
                  const isCurrent = pNum === currentPage;
                  if (
                    totalPages > 7 &&
                    pNum !== 1 &&
                    pNum !== totalPages &&
                    Math.abs(pNum - currentPage) > 1
                  ) {
                    if (Math.abs(pNum - currentPage) === 2) {
                      return (
                        <span key={pNum} className="px-1 text-slate-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-8 h-8 rounded-xl font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-[#0260de] text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. PRODUCT QUICK VIEW DRAWER */}
      <ProductQuickView
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={handleCloseQuickView}
        onEdit={(prod) => {
          handleCloseQuickView();
          handleEditProduct(prod);
        }}
        onDelete={handleDeleteProduct}
      />

      {/* 7. ADD / EDIT PRODUCT MODAL */}
      <ProductFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
        onSuccess={handleFormSuccess}
        showToast={showToast}
      />

      {/* 8. IMPORT / EXPORT MODAL */}
      <ProductImportExportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={refreshCatalog}
        showToast={showToast}
      />
    </div>
  );
}
