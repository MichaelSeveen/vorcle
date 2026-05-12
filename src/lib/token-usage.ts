import "server-only";

import { PLAN_LIMITS } from "@/config/types";
import type { SubscriptionPlan } from "@/db/schema";
import {
	consumeChatUsage,
	consumeMeetingUsage,
	getUsageSnapshot,
	previewChatUsage,
	previewMeetingUsage,
	releaseChatUsage,
	releaseMeetingUsage,
} from "@/helpers/subscriptions/usage";

export async function canUserSendBot(userId: string) {
	return previewMeetingUsage(userId);
}

export async function canUserChat(userId: string) {
	const result = await previewChatUsage(userId);

	return {
		allowed: result.allowed,
		code: result.code,
		reason: result.reason,
	};
}

export async function incrementMeetingUsage(userId: string) {
	const result = await consumeMeetingUsage(userId);

	if (!result.allowed) {
		throw new Error(result.reason ?? "Failed to increment meeting usage");
	}

	return result;
}

export async function decrementMeetingUsage(userId: string) {
	return releaseMeetingUsage(userId);
}

export async function decrementChatUsage(userId: string) {
	return releaseChatUsage(userId);
}

export async function incrementUserChatTokenUsage(userId: string) {
	try {
		const result = await consumeChatUsage(userId);

		if (!result.allowed) {
			return {
				success: false,
				message: result.reason,
				upgradeRequired: result.code === "CHAT_LIMIT_REACHED",
			};
		}

		return { success: true };
	} catch (error) {
		console.error("incrementUserChatTokenUsage failed:", error);
		return { success: false, message: "Failed to increment your usage" };
	}
}

export async function incrementUserMeetingsTokenUsage(userId: string) {
	try {
		const result = await consumeMeetingUsage(userId);

		if (!result.allowed) {
			return { success: false, message: result.reason };
		}

		return { success: true };
	} catch (error) {
		console.error("incrementUserMeetingsTokenUsage failed:", error);
		return { success: false, message: "Failed to increment your usage" };
	}
}

export async function getCurrentUserTokenUsage(userId: string) {
	try {
		const snapshot = await getUsageSnapshot(userId);

		return {
			success: true,
			data: {
				id: snapshot.id,
				effectivePlan: snapshot.effectivePlan,
				effectiveStatus: snapshot.effectiveStatus,
				chatMessagesUsed: snapshot.chatMessagesUsed,
				meetingsUsed: snapshot.meetingsUsed,
				usagePeriodStart: snapshot.usagePeriodStart,
				usagePeriodEnd: snapshot.usagePeriodEnd,
				nextPaymentDate: snapshot.nextResetDate,
				nextResetDate: snapshot.nextResetDate,
				cycleAnchor: snapshot.cycleAnchor,
				// Legacy aliases retained while the client fully migrates.
				chatMessagesToday: snapshot.chatMessagesUsed,
				meetingsThisMonth: snapshot.meetingsUsed,
			},
		};
	} catch (error) {
		console.error("getCurrentUserTokenUsage failed:", error);
		return { success: false, message: "Failed to get your usage" };
	}
}

export function getPlanLimits(plan: SubscriptionPlan) {
	return PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
}
