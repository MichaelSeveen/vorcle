import { cache } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/helpers/user";
import WorkspaceMeetingDetailView from "./_components";
import { segments } from "@/config/segments";
import { getMeetingById } from "@/helpers/meetings";
import prisma from "@/lib/prisma";
import { getUserIntegrationStatus } from "@/helpers/integrations/status";

const getAllMeetings = cache(async () => {
  const meetings = await prisma.meeting.findMany({ select: { id: true } });

  return meetings.map(({ id }) => ({ meetingId: id }));
});

export async function generateStaticParams() {
  return await getAllMeetings();
}

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
