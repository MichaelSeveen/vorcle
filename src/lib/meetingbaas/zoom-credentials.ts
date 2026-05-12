import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userZoomCredential } from "@/db/schema";

const MEETING_BAAS_API_URL = "https://api.meetingbaas.com";

export interface ZoomCredential {
	credential_id: string;
	name: string;
	credential_type: "app" | "user";
	zoom_user_id: string | null;
	zoom_account_id: string | null;
	scopes: string | null;
	state: "active" | "invalid";
	last_error_message: string | null;
	last_error_at: string | null;
	created_at: string;
	updated_at: string;
}

function getMeetingBaasApiKey() {
	const apiKey = process.env.MEETING_BAAS_API_KEY;

	if (!apiKey) {
		throw new Error("MEETING_BAAS_API_KEY is not set");
	}

	return apiKey;
}

function getZoomRedirectUri() {
	const appUrl = process.env.NEXT_PUBLIC_APP_URL;

	if (!appUrl) {
		throw new Error("NEXT_PUBLIC_APP_URL is not set");
	}

	return `${appUrl}/oauth/zoom/callback`;
}

function getZoomClientCredentials() {
	const clientId = process.env.ZOOM_CLIENT_ID;
	const clientSecret = process.env.ZOOM_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		throw new Error("ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET must both be set");
	}

	return { clientId, clientSecret };
}

async function parseZoomCredentialResponse(response: Response, action: string) {
	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to ${action}: ${errorText}`);
	}

	const result = (await response.json()) as {
		data: ZoomCredential;
	};

	return result.data;
}

export async function createUserZoomCredential({
	authorizationCode,
	credentialName,
}: {
	authorizationCode: string;
	credentialName: string;
}): Promise<ZoomCredential> {
	const { clientId, clientSecret } = getZoomClientCredentials();

	const response = await fetch(`${MEETING_BAAS_API_URL}/v2/zoom-credentials`, {
		body: JSON.stringify({
			authorization_code: authorizationCode,
			client_id: clientId,
			client_secret: clientSecret,
			name: credentialName,
			redirect_uri: getZoomRedirectUri(),
		}),
		headers: {
			"Content-Type": "application/json",
			"x-meeting-baas-api-key": getMeetingBaasApiKey(),
		},
		method: "POST",
	});

	return parseZoomCredentialResponse(response, "create Zoom credential");
}

export async function getZoomCredential(
	credentialId: string,
): Promise<ZoomCredential> {
	const response = await fetch(
		`${MEETING_BAAS_API_URL}/v2/zoom-credentials/${credentialId}`,
		{
			headers: {
				"x-meeting-baas-api-key": getMeetingBaasApiKey(),
			},
		},
	);

	return parseZoomCredentialResponse(
		response,
		`get Zoom credential ${credentialId}`,
	);
}

export async function reauthorizeZoomCredential({
	authorizationCode,
	credentialId,
}: {
	authorizationCode: string;
	credentialId: string;
}): Promise<ZoomCredential> {
	const { clientId, clientSecret } = getZoomClientCredentials();

	const response = await fetch(
		`${MEETING_BAAS_API_URL}/v2/zoom-credentials/${credentialId}`,
		{
			body: JSON.stringify({
				authorization_code: authorizationCode,
				client_id: clientId,
				client_secret: clientSecret,
				redirect_uri: getZoomRedirectUri(),
			}),
			headers: {
				"Content-Type": "application/json",
				"x-meeting-baas-api-key": getMeetingBaasApiKey(),
			},
			method: "PATCH",
		},
	);

	return parseZoomCredentialResponse(
		response,
		`reauthorize Zoom credential ${credentialId}`,
	);
}

export async function deleteZoomCredential(credentialId: string) {
	const response = await fetch(
		`${MEETING_BAAS_API_URL}/v2/zoom-credentials/${credentialId}`,
		{
			headers: {
				"x-meeting-baas-api-key": getMeetingBaasApiKey(),
			},
			method: "DELETE",
		},
	);

	if (!response.ok) {
		throw new Error(`Failed to delete Zoom credential ${credentialId}`);
	}
}

export async function listZoomCredentials(): Promise<ZoomCredential[]> {
	const response = await fetch(`${MEETING_BAAS_API_URL}/v2/zoom-credentials`, {
		headers: {
			"x-meeting-baas-api-key": getMeetingBaasApiKey(),
		},
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to list Zoom credentials: ${errorText}`);
	}

	const result = (await response.json()) as { data: ZoomCredential[] };
	return result.data;
}

export async function getUserZoomCredentialRecord(userId: string) {
	const [credential] = await db
		.select()
		.from(userZoomCredential)
		.where(eq(userZoomCredential.userId, userId))
		.limit(1);

	return credential ?? null;
}

export async function upsertUserZoomCredentialRecord({
	userId,
	zoomCredential,
}: {
	userId: string;
	zoomCredential: ZoomCredential;
}) {
	const values = {
		lastErrorAt: zoomCredential.last_error_at
			? new Date(zoomCredential.last_error_at)
			: null,
		lastErrorMessage: zoomCredential.last_error_message,
		meetingBaasCredentialId: zoomCredential.credential_id,
		name: zoomCredential.name,
		state: zoomCredential.state,
		userId,
		zoomAccountId: zoomCredential.zoom_account_id,
		zoomUserId: zoomCredential.zoom_user_id,
	};

	const [record] = await db
		.insert(userZoomCredential)
		.values(values)
		.onConflictDoUpdate({
			set: {
				lastErrorAt: values.lastErrorAt,
				lastErrorMessage: values.lastErrorMessage,
				meetingBaasCredentialId: values.meetingBaasCredentialId,
				name: values.name,
				state: values.state,
				updatedAt: new Date(),
				zoomAccountId: values.zoomAccountId,
				zoomUserId: values.zoomUserId,
			},
			target: userZoomCredential.userId,
		})
		.returning();

	return record;
}

export async function removeUserZoomCredentialRecord(userId: string) {
	await db
		.delete(userZoomCredential)
		.where(eq(userZoomCredential.userId, userId));
}

export async function getUsableZoomCredentialIdForUser(userId: string) {
	const storedCredential = await getUserZoomCredentialRecord(userId);

	if (!storedCredential) {
		return null;
	}

	const remoteCredential = await getZoomCredential(
		storedCredential.meetingBaasCredentialId,
	);
	await upsertUserZoomCredentialRecord({
		userId,
		zoomCredential: remoteCredential,
	});

	if (remoteCredential.state !== "active") {
		return null;
	}

	return remoteCredential.credential_id;
}
