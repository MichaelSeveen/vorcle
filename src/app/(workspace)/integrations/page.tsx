import { redirect } from "next/navigation";
import { segments } from "@/config/segments";
import { getUserIntegrationStatus } from "@/helpers/integrations/status";
import { getCurrentUser } from "@/helpers/user";
import { getUserCalendarStatus } from "@/helpers/user/calendar";
import WorkspaceIntegrationsView from "./_components";

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
