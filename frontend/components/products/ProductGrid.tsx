"use client";

import { Product } from "./types";
import ProductCard from "./ProductCard";
import ProductListView from "./ProductListView";

interface ProductGridProps {
  products: Product[];
  viewMode: "grid" | "list";
  onQuickView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export default function ProductGrid({
  products,
  viewMode,
  onQuickView,
  onEdit,
  onDelete
}: ProductGridProps) {
  if (viewMode === "list") {
    return (
      <ProductListView
        products={products}
        onQuickView={onQuickView}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      {products.map((product) => (
        <ProductCard
          key={product._id}
          product={product}
          onQuickView={onQuickView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

