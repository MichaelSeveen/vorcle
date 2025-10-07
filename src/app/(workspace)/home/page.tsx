import { redirect } from "next/navigation";
import { getCurrentUser } from "@/helpers/user";
import { segments } from "@/config/segments";
import WorkspaceHomeView from "./_components";
import { getPastMeetings } from "@/helpers/meetings/past-meetings";
import { searchParamsCache } from "@/lib/zod-schema";
import { getUpcomingMeetings } from "@/helpers/meetings";
import { getUserCalendarStatus } from "@/helpers/user/calendar";

export type SearchParams = {
  [key: string]: string | string[];
};

export interface PageProps {
  searchParams?: Promise<SearchParams>;
}

export default async function WorkspaceHomePage({ searchParams }: PageProps) {
  const pageSearchParams = await searchParams;
  const search = searchParamsCache.parse(pageSearchParams ?? {});
  const user = await getCurrentUser();

  if (!user) {
    redirect(segments.signIn);
  }

  const userId = user.id;

  const pastMeetings = getPastMeetings({ userId, input: search });

  const [upcomingMeetings, userCalendarStatus] = await Promise.all([
    getUpcomingMeetings(userId, user.calendarConnected),
    getUserCalendarStatus(user.id),
  ]);

  if (!upcomingMeetings.ok) {
    return [];
  }

  return (
    <WorkspaceHomeView
      pastMeetings={pastMeetings}
      currentUserId={userId}
      upcomingEvents={upcomingMeetings}
      calendarStatus={userCalendarStatus}
    />
  );
}
