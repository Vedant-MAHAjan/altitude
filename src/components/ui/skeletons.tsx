export function TrekCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-border p-1">
      <div className="skeleton h-32 rounded-2xl" />
      <div className="space-y-3 px-4 pb-4 pt-4">
        <div className="skeleton h-6 w-3/4 rounded-lg" />
        <div className="skeleton h-3 w-1/2 rounded-lg" />
        <div className="flex gap-2">
          <div className="skeleton h-5 w-16 rounded-full" />
          <div className="skeleton h-5 w-20 rounded-full" />
        </div>
        <div className="skeleton h-20 rounded-2xl" />
      </div>
    </div>
  );
}

export function TrekGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <TrekCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
      <div className="skeleton mb-6 h-6 w-52 rounded-full" />
      <div className="skeleton mb-4 h-14 w-full max-w-3xl rounded-xl" />
      <div className="skeleton mb-8 h-6 w-full max-w-xl rounded-lg" />
      <div className="skeleton h-14 w-full max-w-2xl rounded-2xl" />
    </div>
  );
}

export function ComparisonTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-12 rounded-2xl" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton h-16 rounded-xl" />
      ))}
    </div>
  );
}
