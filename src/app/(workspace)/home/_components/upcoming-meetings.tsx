import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertCircleIcon,
  CalendarSync,
  Clock,
  ExternalLink,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarIcon, EmptyStateIcon } from "@/components/custom-icons";
import Link from "next/link";
import { CalendarEvent } from "../hooks/use-meetings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface UpcomingMeetingsProps {
  upcomingEvents: CalendarEvent[];
  calendarConnected: boolean;
  error: string;
  loading: boolean;
  initialLoading: boolean;
  meetingBotState: { [key: string]: boolean };
  onRefresh: () => void;
  onBotToggle: (eventId: string) => void;
  onConnectCalendar: () => void;
}

export default function UpcomingMeetings({
  upcomingEvents,
  calendarConnected,
  error,
  loading,
  initialLoading,
  meetingBotState,
  onRefresh,
  onBotToggle,
  onConnectCalendar,
}: UpcomingMeetingsProps) {
  return (
    <>
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Upcoming meetings error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {initialLoading ? (
        <Skeleton className="p-6">
          <Skeleton className="w-12 h-12 mb-3" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2 mb-4" />
          <Skeleton className="h-8 w-full" />
        </Skeleton>
      ) : !calendarConnected ? (
        <div className="flex items-center justify-center my-20">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CalendarIcon className="mx-auto size-[4rem]" />
              <CardTitle className="text-center">Connect Calendar</CardTitle>
              <CardDescription className="text-center">
                Connect your google calendar to see upcoming meetings
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                onClick={onConnectCalendar}
                disabled={loading}
                className="w-full cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <CalendarSync />
                )}
                {loading ? "Connecting..." : "Connect your google calendar"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : upcomingEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center my-20">
          <EmptyStateIcon className="h-[8rem] w-[8.5rem]" />
          <h3 className="font-medium mb-2 text-foreground text-xl">
            No upcoming meetings.
          </h3>
          <p className="text-muted-foreground text-sm">
            Your calendar is clear.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <Button
            className="w-fit mb-4 cursor-pointer"
            onClick={onRefresh}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : <RefreshCcw />}
            {loading ? "Loading..." : "Refresh"}
          </Button>

          {upcomingEvents.map((event) => (
            <Card key={event.id} className="w-full max-w-lg">
              <CardHeader>
                <CardTitle className="sr-only">
                  Title of an upcoming google calendar event
                </CardTitle>
                <CardDescription className="sr-only">
                  Description of an upcoming google calendar event
                </CardDescription>
              </CardHeader>

              <Switch
                checked={!!meetingBotState[event.id]}
                onCheckedChange={() => onBotToggle(event.id)}
                aria-label="Toggle bot for this meeting"
                className="absolute top-0 right-0 rounded-sm [&_span]:rounded cursor-pointer"
              />

              <CardContent>
                <h4 className="font-medium text-sm mb-2">
                  {event.summary || "No Title"}
                </h4>

                <div className="flex items-center gap-1 text-sm">
                  <Clock className="size-4" />
                  <time dateTime={event.start?.date}>
                    {format(
                      new Date(
                        event.start?.dateTime || event.start?.date || ""
                      ),
                      "MMM d, h:mm a"
                    )}
                  </time>
                </div>

                {event.attendees && (
                  <p className="text-sm mt-2">
                    <strong>{event.attendees.length}</strong>
                    attendees
                  </p>
                )}
              </CardContent>

              <CardFooter>
                {(event.hangoutLink || event.location) && (
                  <Link
                    href={event.hangoutLink || event.location || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({
                      variant: "fancy",
                      className: "w-full",
                    })}
                  >
                    <ExternalLink />
                    Join Meeting
                  </Link>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
