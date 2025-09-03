import { getSession } from "./auth-client";
import { redirect } from "next/navigation";
import { segments } from "@/config/segments";

export async function getClientSession() {
  const { data: userSession } = await getSession();

  if (!userSession) {
    redirect(segments.signIn);
  }
  return userSession.session.userId;
}
