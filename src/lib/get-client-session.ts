import { redirect } from "next/navigation";
import { segments } from "@/config/segments";
import { getSession } from "./auth-client";

export async function getClientSession() {
	const { data: userSession } = await getSession();

	if (!userSession) {
		redirect(segments.signIn);
	}
	return userSession.session.userId;
}
