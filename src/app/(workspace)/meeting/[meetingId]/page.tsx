import { getCurrentUser } from "@/helpers/user";
import WorkspaceMeetingDetailView from "./_components";
import { redirect } from "next/navigation";
import { segments } from "@/config/segments";
import { getMeetingById } from "@/helpers/meetings";
import { toast } from "sonner";

export default async function WorkspaceMeetingDetail({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const user = await getCurrentUser();

  const { meetingId } = await params;

  if (!user) {
    redirect(segments.signIn);
  }

  const { error, data } = await getMeetingById(meetingId, user.id);

  if (error) {
    toast.error(error);
    console.error(error);
  }

  const userData = {
    name: user.name,
    image: user?.image,
  };

  return (
    <WorkspaceMeetingDetailView
      meetingData={data}
      meetingId={meetingId}
      userData={userData}
    />
  );
}
