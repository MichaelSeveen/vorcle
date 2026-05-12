import { redirect } from "next/navigation";
import { segments } from "@/config/segments";
import { getUserActiveSubscription } from "@/helpers/subscriptions";
import { getCurrentUser } from "@/helpers/user";
import { getCurrentUserTokenUsage } from "@/lib/token-usage";
import SubscriptionSettings from "./_components/subscription-settings";

function toIsoString(value: Date | string | null | undefined) {
	if (!value) return null;
	return value instanceof Date ? value.toISOString() : value;
}

export default async function SettingsPage() {
	const currentUser = await getCurrentUser();

	if (!currentUser) {
		redirect(segments.signIn);
	}

	const [activeSubscription, usageResult] = await Promise.all([
		getUserActiveSubscription(currentUser.id),
		getCurrentUserTokenUsage(currentUser.id),
	]);

	const usageData =
		usageResult.success && usageResult.data ? usageResult.data : null;
	const usage = usageData
		? {
				effectivePlan: usageData.effectivePlan,
				effectiveStatus: usageData.effectiveStatus,
				meetingsUsed: usageData.meetingsUsed,
				chatMessagesUsed: usageData.chatMessagesUsed,
				usagePeriodStart: toIsoString(usageData.usagePeriodStart),
				usagePeriodEnd: toIsoString(usageData.usagePeriodEnd),
				nextResetDate: toIsoString(usageData.nextResetDate),
				nextPaymentDate: toIsoString(usageData.nextPaymentDate),
				cycleAnchor: usageData.cycleAnchor,
			}
		: {
				effectivePlan: "FREE" as const,
				effectiveStatus: "INACTIVE" as const,
				meetingsUsed: 0,
				chatMessagesUsed: 0,
				usagePeriodStart: null,
				usagePeriodEnd: null,
				nextResetDate: null,
				nextPaymentDate: null,
				cycleAnchor: "calendar_month" as const,
			};

	return (
		<div className="mx-auto h-full w-full max-w-6xl">
			<SubscriptionSettings
				usage={usage}
				subscription={
					activeSubscription
						? {
								status: activeSubscription.status,
								planName: activeSubscription.planName,
								productId: activeSubscription.productId,
								currentPeriodStart:
									activeSubscription.currentPeriodStart?.toISOString() ?? null,
								currentPeriodEnd:
									activeSubscription.currentPeriodEnd?.toISOString() ?? null,
								cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
								currency: activeSubscription.currency,
								amount: activeSubscription.amount,
								recurringInterval: activeSubscription.recurringInterval,
							}
						: null
				}
			/>
		</div>
	);
}
