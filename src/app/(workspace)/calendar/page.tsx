import { redirect } from "next/navigation";
import { getCurrentUser } from "@/helpers/user";
import { getCalendarEvents, getEventUsers } from "@/helpers/event-calendar";
import Calendar from "./_components";
import { segments } from "@/config/segments";

export default async function WorkspaceCalendarPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(segments.signIn);
  }

  const [events, users] = await Promise.all([
    getCalendarEvents(),
    getEventUsers(),
  ]);

  return (
    <div className="flex flex-col max-w-7xl mx-auto w-full">
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
        Event Calendar
      </h1>
      <p className="text-sm md:text-base text-pretty text-muted-foreground mt-1 mb-3">
        Never forget any important event. Keep them all in one place.
      </p>

      <Calendar events={events} users={users} />
    </div>
  );
}
