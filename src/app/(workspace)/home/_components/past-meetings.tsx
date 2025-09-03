import { format } from "date-fns";
import AttendeesAvatarGroup from "./attendees-avatar-group";
import { EmptyStateIcon } from "@/components/custom-icons";
import { BadgeCheck, Clock, ExternalLink } from "lucide-react";
import { PastMeeting } from "../hooks/use-meetings";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pill, PillStatus } from "@/components/ui/pill";

interface PastMeetingsProps {
  pastMeetings: PastMeeting[];
  pastLoading: boolean;
  getAttendeeList: (attendees: unknown) => string[];
}

export default function PastMeetings({
  pastMeetings,
  pastLoading,
  getAttendeeList,
}: PastMeetingsProps) {
  if (pastLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-6 w-48" />
                <div className="flex -space-x-[0.525rem]">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="size-6 rounded-full" />
                  ))}
                </div>
              </div>
              <Skeleton className="h-5 w-20" />
            </div>

            <Skeleton className="h-4 w-3/4 mb-3" />
            <Skeleton className="h-4 w-1/2 mb-3" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (pastMeetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center my-20">
        <EmptyStateIcon className="h-[8rem] w-[8.5rem]" />
        <h3 className="text-xl font-medium mb-2 text-foreground">
          No past meetings.
        </h3>
        <p className="text-muted-foreground text-sm">
          Your completed meetings will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {pastMeetings.map((meeting) => (
        <Card key={meeting.id} className="w-full">
          <CardHeader className="relative">
            <CardTitle className="flex items-center justify-between">
              {meeting.title}
              <Pill>
                <PillStatus>
                  <BadgeCheck className="size-3.5" />
                </PillStatus>
                Completed
              </Pill>
            </CardTitle>
            <CardDescription>
              {meeting.description ? meeting.description : null}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {meeting?.attendees ? (
              <AttendeesAvatarGroup
                attendees={meeting.attendees}
                getAttendeeList={getAttendeeList}
              />
            ) : null}
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="size-4" />
                <time
                  dateTime={`${new Date(
                    meeting.startTime
                  ).toISOString()}-${new Date(meeting.endTime).toISOString()}`}
                >
                  {format(new Date(meeting.startTime), "PPp")} -{" "}
                  {format(new Date(meeting.endTime), "pp")}
                </time>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Link
              href={`/meeting/${meeting.id}`}
              className={buttonVariants({
                className: "mt-4 cursor-pointer w-fit",
              })}
            >
              <ExternalLink />
              View Details
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
