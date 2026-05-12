import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
	createUserZoomCredential,
	getUserZoomCredentialRecord,
	reauthorizeZoomCredential,
	upsertUserZoomCredentialRecord,
} from "@/lib/meetingbaas/zoom-credentials";

function redirectWithError(error: string): never {
	redirect(`/connect-zoom?error=${encodeURIComponent(error)}`);
}

function redirectWithSuccess(message: string): never {
	redirect(`/connect-zoom?success=${encodeURIComponent(message)}`);
}

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const code = searchParams.get("code");
	const state = searchParams.get("state");
	const error = searchParams.get("error");

	if (error) {
		redirectWithError("Zoom authorization was cancelled.");
	}

	if (!code || !state) {
		redirectWithError("Zoom did not return the required OAuth parameters.");
	}

	const cookieStore = await cookies();
	const storedState = cookieStore.get("zoom_oauth_state")?.value;

	if (!storedState || storedState !== state) {
		cookieStore.delete("zoom_oauth_state");
		redirectWithError("Zoom OAuth state validation failed.");
	}

	cookieStore.delete("zoom_oauth_state");

	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session?.user) {
		redirectWithError(
			"Your session expired before Zoom authorization completed.",
		);
	}

	try {
		const existingCredential = await getUserZoomCredentialRecord(
			session.user.id,
		);
		const zoomCredential = existingCredential
			? await reauthorizeZoomCredential({
					authorizationCode: code,
					credentialId: existingCredential.meetingBaasCredentialId,
				})
			: await createUserZoomCredential({
					authorizationCode: code,
					credentialName:
						session.user.email || session.user.name || "Vorcle User",
				});

		await upsertUserZoomCredentialRecord({
			userId: session.user.id,
			zoomCredential,
		});
	} catch (callbackError) {
		console.error("[MeetingBaas] Zoom OAuth callback failed:", callbackError);
		redirectWithError("Zoom credential exchange failed. Please try again.");
	}

	redirectWithSuccess("Zoom connected successfully.");
}
