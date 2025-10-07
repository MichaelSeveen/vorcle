"use client";

import { Event, User } from "@/components/event-calendar/config/types";
import { CalendarProvider } from "@/components/event-calendar/context/calendar-context";
import DndProvider from "@/components/event-calendar/context/dnd-context";
import CalendarHeaderSkeleton from "@/components/event-calendar/skeletons/header-skeleton";
import MonthViewSkeleton from "@/components/event-calendar/skeletons/month-view-skeleton";
import { Shell } from "@/components/ui/shell";
import dynamic from "next/dynamic";

const CalendarHeader = dynamic(
  () => import("@/components/event-calendar/header"),
  { ssr: false, loading: () => <CalendarHeaderSkeleton /> }
);
const CalendarBody = dynamic(
  () => import("@/components/event-calendar/calendar-body"),
  { ssr: false, loading: () => <MonthViewSkeleton /> }
);

interface CalendarProps {
  events: Event[];
  users: User[];
}

export default function Calendar({ events, users }: CalendarProps) {
  return (
    <CalendarProvider events={events} users={users} view="month">
      <DndProvider showConfirmation={false}>
        <Shell>
          <div className="w-full ring ring-accent rounded-xl">
            <CalendarHeader />
            <CalendarBody />
          </div>
        </Shell>
      </DndProvider>
    </CalendarProvider>
  );
}
