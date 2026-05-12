import "server-only";

import { reconcileAllSubscriptionUsagePeriods } from "@/helpers/subscriptions/usage";

export async function reconcileSubscriptionUsageWindows() {
	return reconcileAllSubscriptionUsagePeriods();
}
