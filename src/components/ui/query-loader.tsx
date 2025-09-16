import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function QueryLoader({ className }: { className?: string }) {
  return (
    <div className={`max-w-7xl w-full mx-auto space-y-6 p-4 ${className}`}>
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-32" />
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>

      {/* Content Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-12 w-64" />
              <Skeleton className="h-6 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          </Card>

          <Card className="p-6">
            <Skeleton className="h-6 w-24 mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function QueryCardLoader({ className }: { className?: string }) {
  return (
    <Card className={`max-w-7xl w-full mx-auto p-6 ${className}`}>
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-10 w-full" />
      </div>
    </Card>
  );
}

export function QueryListLoader({ className }: { className?: string }) {
  return (
    <div className={`space-y-4 p-4 ${className}`}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i}>
          <div className="flex space-x-3">
            <Skeleton className="h-14 w-14 rounded-sm shrink-0" />
            <div className="space-y-3 flex-1">
              <Skeleton className="h-14 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
