"use client";

import { useMeetings } from "../hooks/use-meetings";
import PastMeetings from "./past-meetings";
import UpcomingMeetings from "./upcoming-meetings";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function WorkspaceHomeView() {
  const {
    upcomingEvents,
    pastMeetings,
    loading,
    pastMeetingsLoading,
    calendarConnected,
    error,
    meetingBotState,
    initialLoading,
    fetchUpcomingEvents,
    toggleMeetingBotServerAction,
    linkGoogleCalendar,
    getAttendeeList,
  } = useMeetings();

  return (
    <div className="min-h-svh bg-background w-full max-w-3xl md:max-w-5xl mx-auto">
      <Tabs defaultValue="past-meetings" className="w-full">
        <TabsList className="h-auto rounded-none border-b bg-transparent p-0 w-full">
          <TabsTrigger
            value="past-meetings"
            className="data-[state=active]:after:bg-primary relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Past meetings
          </TabsTrigger>
          <TabsTrigger
            value="upcoming-events"
            className="data-[state=active]:after:bg-primary relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Upcoming events ({upcomingEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="past-meetings">
          <PastMeetings
            pastMeetings={pastMeetings}
            pastLoading={pastMeetingsLoading}
            getAttendeeList={getAttendeeList}
          />
        </TabsContent>
        <TabsContent value="upcoming-events">
          <UpcomingMeetings
            upcomingEvents={upcomingEvents}
            calendarConnected={calendarConnected}
            error={error}
            loading={loading}
            initialLoading={initialLoading}
            meetingBotState={meetingBotState}
            onRefresh={fetchUpcomingEvents}
            onBotToggle={toggleMeetingBotServerAction}
            onConnectCalendar={linkGoogleCalendar}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
