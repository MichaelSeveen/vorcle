"use client";

import dynamic from "next/dynamic";
import { Suspense, use } from "react";
import { useMeetings } from "../hooks/use-meetings";
import { getPastMeetings } from "@/helpers/meetings/past-meetings";

import UpcomingMeetings from "./upcoming-meetings";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import {
  TabMenuHorizontalContent,
  TabMenuHorizontalList,
  TabMenuHorizontalRoot,
  TabMenuHorizontalTrigger,
} from "@/components/align-ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Shell } from "@/components/ui/shell";
import { GoogleCalendarEvent } from "@/config/types";

const PastMeetingsTableDynamic = dynamic(() => import("./past-meetings"), {
  ssr: false,
  loading: () => (
    <DataTableSkeleton
      columnCount={7}
      cellWidths={[
        "10rem",
        "10rem",
        "10rem",
        "10rem",
        "10rem",
        "10rem",
        "10rem",
      ]}
      shrinkZero
    />
  ),
});

interface WorkspaceHomeViewProps {
  pastMeetings: Promise<Awaited<ReturnType<typeof getPastMeetings>>>;
  currentUserId: string;
  upcomingEvents: {
    ok: boolean;
    events: GoogleCalendarEvent[];
    connected: boolean;
    source: string;
  };
  calendarStatus: { success: boolean; message?: string; connected?: boolean };
}

export default function WorkspaceHomeView({
  pastMeetings,
  upcomingEvents,
  calendarStatus,
}: WorkspaceHomeViewProps) {
  const {
    events,
    isCalendarConnected,
    error,
    meetingBotState,
    isLinking,
    isRefreshing,
    refreshEvents,
    toggleMeetingBot,
    linkGoogleCalendar,
  } = useMeetings({
    upcomingEvents,
    calendarStatus,
  });

  const { data, pageCount } = use(pastMeetings);
  const isMobile = useIsMobile();

  return (
    <div className="grid grid-cols-[1fr_calc(100%-2rem)_1fr] md:grid-cols-[1fr_min(calc(100%-5rem),calc(1200/16*1rem))_1fr] [&>*]:col-[2] h-full">
      <div className="flex flex-col">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Your Meetings
        </h1>
        <p className="text-sm md:text-base text-pretty text-muted-foreground mt-1 mb-4">
          Keep track of all your meetings in one place.
        </p>
        <div className="relative">
          <TabMenuHorizontalRoot defaultValue="past-meetings">
            <TabMenuHorizontalList>
              <TabMenuHorizontalTrigger value="past-meetings">
                Past meetings
              </TabMenuHorizontalTrigger>
              <TabMenuHorizontalTrigger value="upcoming-events">
                Upcoming events
              </TabMenuHorizontalTrigger>

              <Button
                className="absolute top-2 right-0"
                size="sm"
                variant="fancy"
                onClick={refreshEvents}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <RefreshCcw />
                )}
                {!isMobile && (
                  <span>{isRefreshing ? "Loading..." : "Get Latest"}</span>
                )}
              </Button>
            </TabMenuHorizontalList>
            <TabMenuHorizontalContent value="past-meetings" className="mt-3">
              <Shell className="gap-2">
                <Suspense
                  fallback={
                    <DataTableSkeleton
                      columnCount={7}
                      cellWidths={[
                        "10rem",
                        "10rem",
                        "10rem",
                        "10rem",
                        "10rem",
                        "10rem",
                        "10rem",
                      ]}
                      shrinkZero
                    />
                  }
                >
                  <PastMeetingsTableDynamic data={data} pageCount={pageCount} />
                </Suspense>
              </Shell>
            </TabMenuHorizontalContent>
            <TabMenuHorizontalContent value="upcoming-events" className="mt-3">
              <UpcomingMeetings
                upcomingEvents={events}
                calendarConnected={isCalendarConnected}
                error={error}
                loading={isLinking}
                meetingBotState={meetingBotState}
                onBotToggle={toggleMeetingBot}
                onConnectCalendar={linkGoogleCalendar}
              />
            </TabMenuHorizontalContent>
          </TabMenuHorizontalRoot>
        </div>
      </div>
    </div>
  );
}
