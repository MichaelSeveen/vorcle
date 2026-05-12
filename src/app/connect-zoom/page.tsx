import { Button, Link } from "@heroui/react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { segments } from "@/config/segments";
import { getCurrentUser } from "@/helpers/user";
import { getUserZoomCredentialRecord } from "@/lib/meetingbaas/zoom-credentials";

interface ConnectZoomPageProps {
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ConnectZoomPage({
	searchParams,
}: ConnectZoomPageProps) {
	const currentUser = await getCurrentUser();

	if (!currentUser) {
		redirect(`${segments.signIn}?callbackURL=/connect-zoom`);
	}

	const [zoomCredential, resolvedSearchParams] = await Promise.all([
		getUserZoomCredentialRecord(currentUser.id),
		searchParams ??
			Promise.resolve<Record<string, string | string[] | undefined>>({}),
	]);

	const errorParam = resolvedSearchParams.error;
	const successParam = resolvedSearchParams.success;
	const error =
		typeof errorParam === "string" ? decodeURIComponent(errorParam) : null;
	const success =
		typeof successParam === "string" ? decodeURIComponent(successParam) : null;

	async function connectZoom() {
		"use server";

		const user = await getCurrentUser();

		if (!user) {
			redirect(`${segments.signIn}?callbackURL=/connect-zoom`);
		}

		const clientId = process.env.ZOOM_CLIENT_ID;
		const appUrl = process.env.NEXT_PUBLIC_APP_URL;

		if (!clientId || !appUrl) {
			throw new Error(
				"ZOOM_CLIENT_ID and NEXT_PUBLIC_APP_URL must both be configured",
			);
		}

		const state = crypto.randomUUID();
		const cookieStore = await cookies();

		cookieStore.set("zoom_oauth_state", state, {
			httpOnly: true,
			maxAge: 600,
			path: "/",
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
		});

		const params = new URLSearchParams({
			client_id: clientId,
			redirect_uri: `${appUrl}/oauth/zoom/callback`,
			response_type: "code",
			state,
		});

		redirect(`https://zoom.us/oauth/authorize?${params.toString()}`);
	}

	return (
		<div className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col justify-center gap-6 px-4 py-10">
			<div className="space-y-2">
				<p className="text-sm text-foreground">MeetingBaas + Zoom OBF</p>
				<h1 className="text-3xl font-semibold tracking-tight">
					Connect Zoom for external meeting recording
				</h1>
				<p className="max-w-2xl text-sm text-foreground">
					Authorize Zoom once so Vorcle can create MeetingBaas bots that join
					external Zoom meetings on your behalf. The authorized Zoom user must
					still be present in the meeting for the bot to stay connected.
				</p>
			</div>

			<div className="rounded-xl border bg-card p-6">
				<div className="space-y-3">
					<p className="text-sm text-foreground">
						Connection status:
						<strong className="ml-2 text-foreground">
							{zoomCredential
								? zoomCredential.state === "active"
									? "Connected"
									: "Reconnect required"
								: "Not connected"}
						</strong>
					</p>

					{zoomCredential ? (
						<p className="text-sm text-foreground">
							Credential name:
							<strong className="ml-2 text-foreground">
								{zoomCredential.name}
							</strong>
						</p>
					) : null}

					{zoomCredential?.lastErrorMessage ? (
						<p className="text-sm text-destructive">
							Last Zoom error: {zoomCredential.lastErrorMessage}
						</p>
					) : null}

					{success ? (
						<p className="text-sm text-emerald-600">{success}</p>
					) : null}

					{error ? <p className="text-sm text-destructive">{error}</p> : null}
				</div>

				<form action={connectZoom} className="mt-6 flex flex-wrap gap-3">
					<Button type="submit">
						{zoomCredential ? "Reconnect Zoom" : "Connect Zoom"}
					</Button>

					<Link href={segments.workspace.integrations}>
						Back to Integrations
					</Link>
				</form>
			</div>
		</div>
	);
}
