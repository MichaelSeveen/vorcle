import { redirect } from "next/navigation";
import { getCurrentUser } from "@/helpers/user";
import { segments } from "@/config/segments";
import WorkspaceHomeView from "./_components";

export default async function WorkspaceHomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(segments.signIn);
  }

  return <WorkspaceHomeView />;
}
