"use client";

import { Labour } from "./types";
import LabourCard from "./LabourCard";
import LabourListView from "./LabourListView";

interface LabourGridProps {
  labours: Labour[];
  viewMode: "grid" | "list";
  onQuickView: (labour: Labour) => void;
  onEdit: (labour: Labour) => void;
  onDelete: (labour: Labour) => void;
}

export default function LabourGrid({
  labours,
  viewMode,
  onQuickView,
  onEdit,
  onDelete
}: LabourGridProps) {
  if (viewMode === "list") {
    return (
      <LabourListView
        labours={labours}
        onQuickView={onQuickView}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      {labours.map((labour) => (
        <LabourCard
          key={labour._id || labour.id}
          labour={labour}
          onQuickView={onQuickView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

