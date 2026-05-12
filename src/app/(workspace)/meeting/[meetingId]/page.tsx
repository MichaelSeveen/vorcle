import { redirect } from "next/navigation";
import { segments } from "@/config/segments";
import { getUserIntegrationStatus } from "@/helpers/integrations/status";
import { getMeetingById } from "@/helpers/meetings";
import { getCurrentUser } from "@/helpers/user";
import WorkspaceMeetingDetailView from "./_components";

export default async function WorkspaceMeetingDetail({
	params,
}: {
	params: Promise<{ meetingId: string }>;
}) {
	const user = await getCurrentUser();

	if (!user) {
		redirect(segments.signIn);
	}

	const { meetingId } = await params;

	const [meetingData, userIntegrations] = await Promise.all([
		getMeetingById(meetingId, user.id),
		getUserIntegrationStatus(user.id),
	]);

	const userData = {
		id: user.id,
		name: user.name,
		image: user?.image,
	};

	const integrationsData = userIntegrations
		.filter((filteredData) => filteredData.isProviderConnected)
		.filter((data) => data.provider !== "slack")
		.map((integration) => ({
			...integration,
		}));

	return (
		<WorkspaceMeetingDetailView
			meetingData={meetingData}
			meetingId={meetingId}
			userData={userData}
			integrationsData={integrationsData}
		/>
	);
}
