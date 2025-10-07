import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/align-ui/switch";
import {
  AlertCircleIcon,
  CalendarSync,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyStateIcon, GoogleCalendarIcon } from "@/components/custom-icons";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DuoClockIcon } from "@/components/custom-icons/duotone";
import { GoogleCalendarEvent } from "@/config/types";

interface UpcomingMeetingsProps {
  upcomingEvents: GoogleCalendarEvent[];
  calendarConnected: boolean;
  error: string | null;
  loading: boolean;
  meetingBotState: { [key: string]: boolean };
  onBotToggle: (eventId: string) => void;
  onConnectCalendar: () => void;
}

function UpcomingMeetingsError({ error }: { error: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>Upcoming meetings error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}

// function UpcomingMeetingsSkeleton() {
//   return (
//     <Skeleton className="p-6">
//       <Skeleton className="w-12 h-12 mb-3" />
//       <Skeleton className="h-4 w-3/4 mb-2" />
//       <Skeleton className="h-3 w-1/2 mb-4" />
//       <Skeleton className="h-8 w-full" />
//     </Skeleton>
//   );
// }

function ConnectCalendarCard({
  onConnect,
  loading,
}: {
  onConnect: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-center my-20">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <GoogleCalendarIcon className="mx-auto size-[4rem]" />
          <CardTitle className="text-center">Connect Calendar</CardTitle>
          <CardDescription className="text-center">
            Connect your google calendar to see upcoming meetings
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            onClick={onConnect}
            disabled={loading}
            className="w-full cursor-pointer"
          >
            {loading ? <Loader2 className="animate-spin" /> : <CalendarSync />}
            {loading ? "Connecting..." : "Connect"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function EmptyMeetingsState() {
  return (
    <div className="flex flex-col items-center justify-center my-20">
      <EmptyStateIcon className="h-[8rem] w-[8.5rem]" />
      <h3 className="font-medium mb-2 text-foreground text-xl">
        No upcoming meetings.
      </h3>
      <p className="text-muted-foreground text-sm">Your calendar is clear.</p>
    </div>
  );
}

function MeetingsList({
  events,
  meetingBotState,
  onBotToggle,
}: {
  events: GoogleCalendarEvent[];
  meetingBotState: { [key: string]: boolean };
  onBotToggle: (eventId: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 items-start">
        {events.map((event) => (
          <div
            key={event.id}
            className="bg-card rounded-lg ring ring-accent shadow-sm p-4"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="font-medium text-sm md:text-base">
                  {event.summary || "No Title"}
                </h2>
                <Switch
                  checked={!!meetingBotState[event.id]}
                  onCheckedChange={() => onBotToggle(event.id)}
                  aria-label="Toggle bot for this meeting"
                />
              </div>
              <div className="flex items-center gap-1 text-sm">
                <DuoClockIcon className="size-4" />
                <time dateTime={event.start?.date}>
                  {format(
                    new Date(event.start?.dateTime || event.start?.date || ""),
                    "MMM d, h:mm a"
                  )}
                </time>
              </div>
              {event.attendees && (
                <p className="text-sm">
                  <strong>{event.attendees.length}</strong> attendees
                </p>
              )}
              {(event.hangoutLink || event.location) && (
                <Link
                  href={event.hangoutLink || event.location || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({
                    className: "w-fit",
                  })}
                >
                  <ExternalLink />
                  Join Meeting
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UpcomingMeetings({
  upcomingEvents,
  calendarConnected,
  error,
  loading,
  meetingBotState,
  onBotToggle,
  onConnectCalendar,
}: UpcomingMeetingsProps) {
  if (!calendarConnected)
    return (
      <ConnectCalendarCard onConnect={onConnectCalendar} loading={loading} />
    );
  if (error) return <UpcomingMeetingsError error={error} />;
  if (upcomingEvents.length === 0) return <EmptyMeetingsState />;

  return (
    <MeetingsList
      events={upcomingEvents}
      meetingBotState={meetingBotState}
      onBotToggle={onBotToggle}
    />
  );
}
