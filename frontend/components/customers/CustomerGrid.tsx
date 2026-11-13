"use client";

import { Customer } from "./types";
import CustomerCard from "./CustomerCard";
import CustomerListView from "./CustomerListView";

interface CustomerGridProps {
  customers: Customer[];
  viewMode: "grid" | "list";
  onQuickView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export default function CustomerGrid({
  customers,
  viewMode,
  onQuickView,
  onEdit,
  onDelete
}: CustomerGridProps) {
  if (viewMode === "list") {
    return (
      <CustomerListView
        customers={customers}
        onQuickView={onQuickView}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      {customers.map((customer) => (
        <CustomerCard
          key={customer._id}
          customer={customer}
          onQuickView={onQuickView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

