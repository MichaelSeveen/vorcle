import { Skeleton } from "@/components/ui/skeleton";

export default function MonthViewSkeleton() {
  return (
    <div className="flex flex-col h-svh max-w-[85rem] mx-auto">
      <div className="grid grid-cols-7 border-b py-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex justify-center">
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-7 grid-rows-6">
        {Array.from({ length: 42 }).map((_, i) => {
          const count = (i * 7) % 3;
          return (
            <div key={i} className="border-b border-r p-1">
              <Skeleton className="mb-1 size-6 rounded-full" />
              <div className="mt-1 space-y-1">
                {Array.from({ length: count }).map((_, j) => (
                  <Skeleton key={j} className="h-5 w-full" />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
