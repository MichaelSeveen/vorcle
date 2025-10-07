import { redirect } from "next/navigation";
import { segments } from "@/config/segments";
import { getCurrentUser } from "@/helpers/user";
import WorkspaceIntegrationsView from "./_components";
import { getUserIntegrationStatus } from "@/helpers/integrations/status";
import { getUserCalendarStatus } from "@/helpers/user/calendar";

export default async function WorkspaceIntegrationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(segments.signIn);
  }

  const [userIntegrations, userCalendarStatus] = await Promise.all([
    getUserIntegrationStatus(user.id),
    getUserCalendarStatus(user.id),
  ]);

  return (
    <WorkspaceIntegrationsView
      integrationData={userIntegrations}
      calendarStatus={userCalendarStatus}
      currentUserId={user.id}
    />
  );
}
