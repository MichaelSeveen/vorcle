import "server-only";

import { and, desc, eq, lt } from "drizzle-orm";
import { db } from "@/db";
import type { SubscriptionPlan } from "@/db/schema";
import { subscription } from "@/db/schema";

const PRODUCT_PLAN_MAPPINGS: Array<{
	plan: SubscriptionPlan;
	productId: string | undefined;
}> = [
	{ plan: "PRO", productId: process.env.POLAR_PRODUCT_PRO },
	{ plan: "BUSINESS", productId: process.env.POLAR_PRODUCT_BUSINESS },
	{ plan: "ENTERPRISE", productId: process.env.POLAR_PRODUCT_ENTERPRISE },
];

function isSubscriptionPlan(value: string): value is SubscriptionPlan {
	return ["FREE", "PRO", "BUSINESS", "ENTERPRISE"].includes(value);
}

export function normalizeSubscriptionPlan({
	planName,
	productId,
}: {
	planName?: string | null;
	productId?: string | null;
}): SubscriptionPlan {
	if (productId) {
		const mappedPlan = PRODUCT_PLAN_MAPPINGS.find(
			(entry) => entry.productId === productId,
		)?.plan;

		if (mappedPlan) {
			return mappedPlan;
		}
	}

	const normalizedPlan = planName?.trim().toUpperCase();
	return normalizedPlan && isSubscriptionPlan(normalizedPlan)
		? normalizedPlan
		: "FREE";
}

export async function hasActiveSubscription(userId: string) {
	try {
		const [row] = await db
			.select()
			.from(subscription)
			.where(
				and(eq(subscription.userId, userId), eq(subscription.status, "ACTIVE")),
			)
			.limit(1);

		return row ?? null;
	} catch (error) {
		console.error("Error checking subscription status:", error);
		return null;
	}
}

async function cancelExpiredPastDueSubscriptions(userId: string) {
	const now = new Date();

	const [pastDueSub] = await db
		.select()
		.from(subscription)
		.where(
			and(
				eq(subscription.userId, userId),
				eq(subscription.status, "PAST_DUE"),
				lt(subscription.gracePeriodEndsAt, now),
			),
		)
		.limit(1);

	if (pastDueSub) {
		await db
			.update(subscription)
			.set({ status: "CANCELED" })
			.where(eq(subscription.id, pastDueSub.id));
	}
}

async function findActiveSubscription(userId: string) {
	const [row] = await db
		.select()
		.from(subscription)
		.where(
			and(eq(subscription.userId, userId), eq(subscription.status, "ACTIVE")),
		)
		.orderBy(desc(subscription.createdAt))
		.limit(1);

	return row ?? null;
}

export async function getUserActiveSubscription(userId: string) {
	try {
		await cancelExpiredPastDueSubscriptions(userId);
		return await findActiveSubscription(userId);
	} catch (error) {
		console.error("Error loading user subscription data:", error);
		return null;
	}
}
