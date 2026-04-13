export function CardSkeleton() {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl animate-pulse">
      <div className="h-4 bg-surface-container-high rounded w-1/3 mb-4" />
      <div className="h-3 bg-surface-container-high rounded w-2/3 mb-3" />
      <div className="h-3 bg-surface-container-high rounded w-1/2 mb-6" />
      <div className="h-2 bg-surface-container-high rounded-full w-full mb-4" />
      <div className="flex gap-4">
        <div className="h-3 bg-surface-container-high rounded w-20" />
        <div className="h-3 bg-surface-container-high rounded w-20" />
      </div>
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="w-10 h-10 bg-surface-container-high rounded-lg" />
        <div className="h-4 bg-surface-container-high rounded w-16" />
      </div>
      <div className="h-8 bg-surface-container-high rounded w-16 mb-2" />
      <div className="h-3 bg-surface-container-high rounded w-24" />
    </div>
  );
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-surface-container-lowest p-6 rounded-xl animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-surface-container-high rounded-full" />
            <div className="flex-1">
              <div className="h-5 bg-surface-container-high rounded w-1/3 mb-2" />
              <div className="h-3 bg-surface-container-high rounded w-1/2" />
            </div>
            <div className="h-12 w-12 bg-surface-container-high rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
