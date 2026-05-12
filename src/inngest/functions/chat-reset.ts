import { reconcileSubscriptionUsageWindows } from "@/helpers/user/reset-usage";
import { inngest } from "../client";

export const subscriptionUsageMaintenance = inngest.createFunction(
	{
		id: "subscription-usage-maintenance",
		triggers: [{ cron: "TZ=Africa/Lagos 0 0 * * *" }],
	},
	async ({ step }) =>
		step.run("reconcile-subscription-usage", async () =>
			reconcileSubscriptionUsageWindows(),
		),
);
