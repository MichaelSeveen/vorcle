import "server-only";

import { createBaasClient } from "@meeting-baas/sdk";

export function getMeetingBaasClient() {
	const apiKey = process.env.MEETING_BAAS_API_KEY;

	if (!apiKey) {
		throw new Error("MEETING_BAAS_API_KEY is not set");
	}

	return createBaasClient({
		api_key: apiKey,
		api_version: "v2",
	});
}
