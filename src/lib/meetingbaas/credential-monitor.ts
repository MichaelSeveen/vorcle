import "server-only";

import { db } from "@/db";
import { userZoomCredential } from "@/db/schema";
import {
	getZoomCredential,
	upsertUserZoomCredentialRecord,
} from "./zoom-credentials";

export async function scanZoomCredentialHealth() {
	const storedCredentials = await db.select().from(userZoomCredential);

	let active = 0;
	let invalid = 0;

	for (const credential of storedCredentials) {
		try {
			const remoteCredential = await getZoomCredential(
				credential.meetingBaasCredentialId,
			);
			await upsertUserZoomCredentialRecord({
				userId: credential.userId,
				zoomCredential: remoteCredential,
			});

			if (remoteCredential.state === "active") {
				active += 1;
			} else {
				invalid += 1;
				console.error(
					`[MeetingBaas] Zoom credential invalid for user ${credential.userId}: ${remoteCredential.last_error_message ?? "unknown error"}`,
				);
			}
		} catch (error) {
			invalid += 1;
			console.error(
				`[MeetingBaas] Failed to inspect Zoom credential ${credential.meetingBaasCredentialId}:`,
				error,
			);
		}
	}

	return {
		active,
		invalid,
		total: storedCredentials.length,
	};
}
