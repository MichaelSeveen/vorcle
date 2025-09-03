import { segments } from "@/config/segments";
import { getCurrentUser } from "@/helpers/user";
import { redirect } from "next/navigation";
import WorkspaceChatView from "./_components";

export default async function WorkspaceChatPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(segments.signIn);
  }

  return <WorkspaceChatView />;
}
