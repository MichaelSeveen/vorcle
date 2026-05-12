import "server-only";

import { and, desc, eq, lt, sql } from "drizzle-orm";
import { PLAN_LIMITS } from "@/config/types";
import { db } from "@/db";
import type {
	Subscription,
	SubscriptionPlan,
	SubscriptionStatus,
	SubscriptionUsage,
} from "@/db/schema";
import { subscription, subscriptionUsage, user } from "@/db/schema";
import { normalizeSubscriptionPlan } from ".";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbExecutor = typeof db | DbTransaction;

export type UsageCycleAnchor = "billing_cycle" | "calendar_month";

export interface UserUsageSnapshot {
	id: string;
	effectivePlan: SubscriptionPlan;
	effectiveStatus: SubscriptionStatus;
	chatMessagesUsed: number;
	meetingsUsed: number;
	usagePeriodStart: Date;
	usagePeriodEnd: Date;
	nextResetDate: Date;
	cycleAnchor: UsageCycleAnchor;
}

interface UsageContext {
	cycleAnchor: UsageCycleAnchor;
	effectivePlan: SubscriptionPlan;
	effectiveStatus: SubscriptionStatus;
	periodEnd: Date;
	periodStart: Date;
}

interface UsageDecision {
	allowed: boolean;
	code?: string;
	reason?: string;
	snapshot?: UserUsageSnapshot;
}

function getCalendarMonthWindow(reference = new Date()) {
	const periodStart = new Date(
		Date.UTC(
			reference.getUTCFullYear(),
			reference.getUTCMonth(),
			1,
			0,
			0,
			0,
			0,
		),
	);
	const periodEnd = new Date(
		Date.UTC(
			reference.getUTCFullYear(),
			reference.getUTCMonth() + 1,
			1,
			0,
			0,
			0,
			0,
		),
	);

	return { periodEnd, periodStart };
}

function addRecurringInterval(date: Date, recurringInterval: string | null) {
	const next = new Date(date);

	switch (recurringInterval?.toLowerCase()) {
		case "day":
		case "daily":
			next.setUTCDate(next.getUTCDate() + 1);
			return next;
		case "week":
		case "weekly":
			next.setUTCDate(next.getUTCDate() + 7);
			return next;
		case "year":
		case "yearly":
		case "annual":
			next.setUTCFullYear(next.getUTCFullYear() + 1);
			return next;
		default:
			next.setUTCMonth(next.getUTCMonth() + 1);
			return next;
	}
}

function subtractRecurringInterval(
	date: Date,
	recurringInterval: string | null,
) {
	const previous = new Date(date);

	switch (recurringInterval?.toLowerCase()) {
		case "day":
		case "daily":
			previous.setUTCDate(previous.getUTCDate() - 1);
			return previous;
		case "week":
		case "weekly":
			previous.setUTCDate(previous.getUTCDate() - 7);
			return previous;
		case "year":
		case "yearly":
		case "annual":
			previous.setUTCFullYear(previous.getUTCFullYear() - 1);
			return previous;
		default:
			previous.setUTCMonth(previous.getUTCMonth() - 1);
			return previous;
	}
}

function resolveSubscriptionWindow(activeSubscription: Subscription) {
	const directStart = activeSubscription.currentPeriodStart;
	const directEnd = activeSubscription.currentPeriodEnd;

	if (directStart && directEnd && directStart < directEnd) {
		return { periodEnd: directEnd, periodStart: directStart };
	}

	if (directStart) {
		return {
			periodEnd:
				directEnd ??
				addRecurringInterval(directStart, activeSubscription.recurringInterval),
			periodStart: directStart,
		};
	}

	if (directEnd) {
		return {
			periodEnd: directEnd,
			periodStart: subtractRecurringInterval(
				directEnd,
				activeSubscription.recurringInterval,
			),
		};
	}

	return null;
}

function buildUsageSnapshot(row: SubscriptionUsage): UserUsageSnapshot {
	return {
		cycleAnchor: row.cycleAnchor as UsageCycleAnchor,
		chatMessagesUsed: row.chatMessagesUsed,
		effectivePlan: row.planName,
		effectiveStatus: row.subscriptionStatus,
		id: row.userId,
		meetingsUsed: row.meetingsUsed,
		nextResetDate: row.periodEnd,
		usagePeriodEnd: row.periodEnd,
		usagePeriodStart: row.periodStart,
	};
}

function createUsageRecord({
	context,
	userId,
}: {
	context: UsageContext;
	userId: string;
}) {
	return {
		chatMessagesUsed: 0,
		cycleAnchor: context.cycleAnchor,
		meetingsUsed: 0,
		periodEnd: context.periodEnd,
		periodStart: context.periodStart,
		planName: context.effectivePlan,
		subscriptionStatus: context.effectiveStatus,
		userId,
	};
}

function periodsMatch(row: SubscriptionUsage, context: UsageContext) {
	return (
		row.cycleAnchor === context.cycleAnchor &&
		row.periodStart.getTime() === context.periodStart.getTime() &&
		row.periodEnd.getTime() === context.periodEnd.getTime()
	);
}

function getMeetingLimitReason(
	snapshot: UserUsageSnapshot,
): UsageDecision | null {
	const isFree = snapshot.effectivePlan === "FREE";
	const isActivePaid = !isFree && snapshot.effectiveStatus === "ACTIVE";

	if (!(isFree || isActivePaid)) {
		return {
			allowed: false,
			code: "SUBSCRIPTION_RESTRICTION",
			reason: "Upgrade your plan to send bots to your meetings",
			snapshot,
		};
	}

	const limits = PLAN_LIMITS[snapshot.effectivePlan];
	if (limits.meetings !== -1 && snapshot.meetingsUsed >= limits.meetings) {
		return {
			allowed: false,
			code: "MEETING_LIMIT_REACHED",
			reason: `You've reached your limit of ${limits.meetings} meetings for this cycle`,
			snapshot,
		};
	}

	return null;
}

function getChatLimitReason(snapshot: UserUsageSnapshot): UsageDecision | null {
	const isFree = snapshot.effectivePlan === "FREE";
	const isActivePaid = !isFree && snapshot.effectiveStatus === "ACTIVE";

	if (!(isFree || isActivePaid)) {
		return {
			allowed: false,
			code: "CHAT_NOT_AVAILABLE",
			reason: "Chat is not available for your current subscription status",
			snapshot,
		};
	}

	const limits = PLAN_LIMITS[snapshot.effectivePlan];
	if (
		limits.chatMessages !== -1 &&
		snapshot.chatMessagesUsed >= limits.chatMessages
	) {
		return {
			allowed: false,
			code: "CHAT_LIMIT_REACHED",
			reason: `Reached limit of ${limits.chatMessages} messages for this cycle`,
			snapshot,
		};
	}

	return null;
}

async function cancelExpiredPastDueSubscriptions(
	executor: DbExecutor,
	userId: string,
) {
	const now = new Date();

	const [pastDueSub] = await executor
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
		await executor
			.update(subscription)
			.set({ status: "CANCELED" })
			.where(eq(subscription.id, pastDueSub.id));
	}
}

async function resolveUsageContext(
	executor: DbExecutor,
	userId: string,
): Promise<UsageContext> {
	await cancelExpiredPastDueSubscriptions(executor, userId);

	const [activeSubscription] = await executor
		.select()
		.from(subscription)
		.where(
			and(eq(subscription.userId, userId), eq(subscription.status, "ACTIVE")),
		)
		.orderBy(desc(subscription.createdAt))
		.limit(1);

	if (!activeSubscription) {
		const calendarWindow = getCalendarMonthWindow();
		return {
			cycleAnchor: "calendar_month",
			effectivePlan: "FREE",
			effectiveStatus: "INACTIVE",
			...calendarWindow,
		};
	}

	const effectivePlan = normalizeSubscriptionPlan({
		planName: activeSubscription.planName,
		productId: activeSubscription.productId,
	});
	const subscriptionWindow = resolveSubscriptionWindow(activeSubscription);

	if (subscriptionWindow) {
		return {
			cycleAnchor: "billing_cycle",
			effectivePlan,
			effectiveStatus: activeSubscription.status,
			...subscriptionWindow,
		};
	}

	const calendarWindow = getCalendarMonthWindow();
	return {
		cycleAnchor: "calendar_month",
		effectivePlan,
		effectiveStatus: activeSubscription.status,
		...calendarWindow,
	};
}

export async function syncSubscriptionUsageState(
	userId: string,
	executor: DbExecutor = db,
) {
	const [userRow] = await executor
		.select({ id: user.id })
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);

	if (!userRow) {
		throw new Error("User not found");
	}

	const context = await resolveUsageContext(executor, userId);
	const [existingUsage] = await executor
		.select()
		.from(subscriptionUsage)
		.where(eq(subscriptionUsage.userId, userId))
		.limit(1);

	if (!existingUsage) {
		const [createdUsage] = await executor
			.insert(subscriptionUsage)
			.values(createUsageRecord({ context, userId }))
			.returning();

		return createdUsage;
	}

	if (!periodsMatch(existingUsage, context)) {
		const [resetUsage] = await executor
			.update(subscriptionUsage)
			.set({
				chatMessagesUsed: 0,
				cycleAnchor: context.cycleAnchor,
				lastReconciledAt: new Date(),
				meetingsUsed: 0,
				periodEnd: context.periodEnd,
				periodStart: context.periodStart,
				planName: context.effectivePlan,
				subscriptionStatus: context.effectiveStatus,
			})
			.where(eq(subscriptionUsage.userId, userId))
			.returning();

		return resetUsage;
	}

	if (
		existingUsage.planName !== context.effectivePlan ||
		existingUsage.subscriptionStatus !== context.effectiveStatus
	) {
		const [updatedUsage] = await executor
			.update(subscriptionUsage)
			.set({
				lastReconciledAt: new Date(),
				planName: context.effectivePlan,
				subscriptionStatus: context.effectiveStatus,
			})
			.where(eq(subscriptionUsage.userId, userId))
			.returning();

		return updatedUsage;
	}

	return existingUsage;
}

export async function getUsageSnapshot(userId: string) {
	const syncedUsage = await db.transaction((tx) =>
		syncSubscriptionUsageState(userId, tx),
	);

	return buildUsageSnapshot(syncedUsage);
}

export async function previewMeetingUsage(
	userId: string,
): Promise<UsageDecision> {
	try {
		const snapshot = await getUsageSnapshot(userId);
		return getMeetingLimitReason(snapshot) ?? { allowed: true, snapshot };
	} catch (error) {
		console.error("Failed to preview meeting usage:", error);
		return {
			allowed: false,
			code: "USAGE_LOOKUP_FAILED",
			reason: "Failed to get your usage",
		};
	}
}

export async function previewChatUsage(userId: string): Promise<UsageDecision> {
	try {
		const snapshot = await getUsageSnapshot(userId);
		return getChatLimitReason(snapshot) ?? { allowed: true, snapshot };
	} catch (error) {
		console.error("Failed to preview chat usage:", error);
		return {
			allowed: false,
			code: "USAGE_LOOKUP_FAILED",
			reason: "Failed to get your usage",
		};
	}
}

export async function consumeChatUsage(userId: string): Promise<UsageDecision> {
	try {
		return await db.transaction(async (tx) => {
			const syncedUsage = await syncSubscriptionUsageState(userId, tx);
			const snapshot = buildUsageSnapshot(syncedUsage);
			const denied = getChatLimitReason(snapshot);

			if (denied) {
				return denied;
			}

			await tx
				.update(subscriptionUsage)
				.set({
					chatMessagesUsed: sql`${subscriptionUsage.chatMessagesUsed} + 1`,
					lastReconciledAt: new Date(),
				})
				.where(eq(subscriptionUsage.userId, userId));

			return {
				allowed: true,
				snapshot: {
					...snapshot,
					chatMessagesUsed: snapshot.chatMessagesUsed + 1,
				},
			};
		});
	} catch (error) {
		console.error("Failed to consume chat usage:", error);
		return {
			allowed: false,
			code: "USAGE_INCREMENT_FAILED",
			reason: "Failed to increment your usage",
		};
	}
}

export async function consumeMeetingUsage(
	userId: string,
	executor: DbExecutor = db,
): Promise<UsageDecision> {
	const syncedUsage = await syncSubscriptionUsageState(userId, executor);
	const snapshot = buildUsageSnapshot(syncedUsage);
	const denied = getMeetingLimitReason(snapshot);

	if (denied) {
		return denied;
	}

	await executor
		.update(subscriptionUsage)
		.set({
			lastReconciledAt: new Date(),
			meetingsUsed: sql`${subscriptionUsage.meetingsUsed} + 1`,
		})
		.where(eq(subscriptionUsage.userId, userId));

	return {
		allowed: true,
		snapshot: {
			...snapshot,
			meetingsUsed: snapshot.meetingsUsed + 1,
		},
	};
}

export async function releaseMeetingUsage(
	userId: string,
	executor: DbExecutor = db,
) {
	const syncedUsage = await syncSubscriptionUsageState(userId, executor);

	if (syncedUsage.meetingsUsed <= 0) {
		return buildUsageSnapshot(syncedUsage);
	}

	const [updatedUsage] = await executor
		.update(subscriptionUsage)
		.set({
			lastReconciledAt: new Date(),
			meetingsUsed: sql`GREATEST(${subscriptionUsage.meetingsUsed} - 1, 0)`,
		})
		.where(eq(subscriptionUsage.userId, userId))
		.returning();

	return buildUsageSnapshot(updatedUsage);
}

export async function releaseChatUsage(
	userId: string,
	executor: DbExecutor = db,
) {
	const syncedUsage = await syncSubscriptionUsageState(userId, executor);

	if (syncedUsage.chatMessagesUsed <= 0) {
		return buildUsageSnapshot(syncedUsage);
	}

	const [updatedUsage] = await executor
		.update(subscriptionUsage)
		.set({
			chatMessagesUsed: sql`GREATEST(${subscriptionUsage.chatMessagesUsed} - 1, 0)`,
			lastReconciledAt: new Date(),
		})
		.where(eq(subscriptionUsage.userId, userId))
		.returning();

	return buildUsageSnapshot(updatedUsage);
}

export async function reconcileAllSubscriptionUsagePeriods() {
	const users = await db.select({ id: user.id }).from(user);
	let reconciled = 0;
	let failed = 0;

	for (const currentUser of users) {
		try {
			await db.transaction((tx) =>
				syncSubscriptionUsageState(currentUser.id, tx),
			);
			reconciled += 1;
		} catch (error) {
			failed += 1;
			console.error(
				`Failed to reconcile subscription usage for ${currentUser.id}:`,
				error,
			);
		}
	}

	return {
		failed,
		reconciled,
		totalUsers: users.length,
	};
}
