import CalendarHeaderSkeleton from "./header-skeleton";
import MonthViewSkeleton from "./month-view-skeleton";

export default function CalendarSkeleton() {
  return (
    <div className="w-full border rounded-xl min-h-svh max-w-7xl mx-auto">
      <div className="flex flex-col h-full">
        <CalendarHeaderSkeleton />
        <div className="flex-1">
          <MonthViewSkeleton />
        </div>
      </div>
    </div>
  );
}
