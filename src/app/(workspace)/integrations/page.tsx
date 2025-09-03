import { segments } from "@/config/segments";
import { getCurrentUser } from "@/helpers/user";
import { redirect } from "next/navigation";
import React from "react";
import WorkspaceIntegrationsView from "./_components";

export default async function WorkspaceIntegrationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(segments.signIn);
  }
  return <WorkspaceIntegrationsView />;
}
