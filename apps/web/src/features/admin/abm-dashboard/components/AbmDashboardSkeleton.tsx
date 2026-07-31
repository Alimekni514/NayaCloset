import { Skeleton } from '@/components/ui/skeleton';

export const AbmDashboardSkeleton = () => (
  <div className="space-y-8">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={`total-${index}`} className="h-36 rounded-3xl" />
      ))}
    </div>
    <div className="space-y-4">
      <Skeleton className="h-8 w-36 rounded-xl" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }).map((_, index) => (
          <Skeleton key={`position-${index}`} className="h-48 rounded-3xl" />
        ))}
      </div>
    </div>
    <div className="space-y-4">
      <Skeleton className="h-8 w-28 rounded-xl" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`retour-${index}`} className="h-48 rounded-3xl" />
        ))}
      </div>
    </div>
    <div className="space-y-4">
      <Skeleton className="h-8 w-28 rounded-xl" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`echange-${index}`} className="h-48 rounded-3xl" />
        ))}
      </div>
    </div>
  </div>
);
