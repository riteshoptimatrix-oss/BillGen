"use client";

interface CustomerSkeletonProps {
  viewMode?: "grid" | "list";
  count?: number;
}

export default function CustomerSkeleton({
  viewMode = "grid",
  count = 8
}: CustomerSkeletonProps) {
  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden divide-y divide-slate-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 shrink-0" />
              <div className="space-y-2 flex-1 max-w-sm">
                <div className="h-3 bg-slate-100 rounded-md w-24" />
                <div className="h-4 bg-slate-200 rounded-md w-48" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="h-4 bg-slate-100 rounded-md w-16" />
              <div className="h-5 bg-slate-200 rounded-md w-24" />
              <div className="h-8 bg-slate-100 rounded-xl w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs flex flex-col h-full animate-pulse"
        >
          {/* Visual container skeleton */}
          <div className="w-full aspect-[4/3] bg-slate-100 relative">
            <div className="absolute top-3 left-3 w-20 h-4 bg-slate-200/80 rounded-full" />
            <div className="absolute top-3 right-3 w-7 h-7 bg-slate-200/80 rounded-xl" />
          </div>

          {/* Info skeleton */}
          <div className="p-4 flex-1 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="h-3 bg-slate-100 rounded-md w-16" />
                <div className="h-3 bg-slate-100 rounded-md w-20" />
              </div>
              <div className="h-4 bg-slate-200 rounded-md w-3/4" />
              <div className="h-3 bg-slate-100 rounded-md w-1/2" />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <div className="h-4 bg-slate-200 rounded-md w-24" />
              <div className="h-3 bg-slate-100 rounded-md w-14" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

