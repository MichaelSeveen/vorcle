import { scanZoomCredentialHealth } from "@/lib/meetingbaas/credential-monitor";
import { inngest } from "../client";

export const zoomCredentialHealth = inngest.createFunction(
	{
		id: "zoom-credential-health",
		triggers: [{ cron: "TZ=Africa/Lagos 0 9 * * *" }],
	},
	async ({ step }) =>
		step.run("scan-zoom-credential-health", async () =>
			scanZoomCredentialHealth(),
		),
);
