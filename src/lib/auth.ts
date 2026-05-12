import {
	checkout,
	polar,
	portal,
	usage,
	webhooks,
} from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import type { Subscription } from "@polar-sh/sdk/models/components/subscription.js";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import type { SubscriptionStatus } from "@/db/schema";
import * as schema from "@/db/schema";
import { subscription } from "@/db/schema";
import { normalizeSubscriptionPlan } from "@/helpers/subscriptions";
import { syncSubscriptionUsageState } from "@/helpers/subscriptions/usage";

function safeParseDate(value: string | Date | null | undefined): Date | null {
	if (!value) return null;
	if (value instanceof Date)
		return Number.isNaN(value.getTime()) ? null : value;

	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// Shared upsert used by all the subscription event handlers
async function upsertSubscription(sub: Subscription): Promise<void> {
	const userId = sub.customer?.externalId;
	if (!userId) {
		throw new Error(`Missing customer.externalId for subscription ${sub.id}`);
	}

	const subscriptionData = {
		modifiedAt: safeParseDate(sub.modifiedAt),
		amount: sub.amount,
		planName: normalizeSubscriptionPlan({
			planName: sub.product?.name,
			productId: sub.productId,
		}),
		currency: sub.currency,
		recurringInterval: sub.recurringInterval,
		status: sub.status.toUpperCase() as SubscriptionStatus,
		currentPeriodStart: safeParseDate(sub.currentPeriodStart) ?? new Date(),
		currentPeriodEnd: safeParseDate(sub.currentPeriodEnd),
		cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
		canceledAt: safeParseDate(sub.canceledAt),
		startedAt: safeParseDate(sub.startedAt),
		endsAt: safeParseDate(sub.endsAt),
		endedAt: safeParseDate(sub.endedAt),
		customerId: sub.customerId,
		productId: sub.productId,
		checkoutId: sub.checkoutId ?? null,
		userId,
	};

	await db.insert(subscription).values(subscriptionData).onConflictDoUpdate({
		target: subscription.userId,
		set: subscriptionData,
	});

	await syncSubscriptionUsageState(userId);

	console.log(`Subscription upserted: ${sub.id} for user ${userId}`);
}

export const polarClient = new Polar({
	accessToken: process.env.POLAR_ACCESS_TOKEN as string,
	server: process.env.POLAR_SERVER_ENV as "sandbox" | "production",
});

export const auth = betterAuth({
	trustedOrigins: [`${process.env.NEXT_PUBLIC_APP_URL}`],
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),
	session: {
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24,
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60,
		},
	},
	user: {
		additionalFields: {
			botName: {
				type: "string",
				required: false,
				defaultValue: "Vorcle Bot",
			},
			botImageUrl: {
				type: "string",
				required: false,
			},
			calendarConnected: {
				type: "boolean",
				required: false,
				defaultValue: false,
			},
			slackUserId: {
				type: "string",
				required: false,
			},
			slackTeamId: {
				type: "string",
				required: false,
			},
			preferredChannelId: {
				type: "string",
				required: false,
			},
			preferredChannelName: {
				type: "string",
				required: false,
			},
			meetingsThisMonth: {
				type: "number",
				required: false,
				defaultValue: 0,
			},
			chatMessagesToday: {
				type: "number",
				required: false,
				defaultValue: 0,
			},
		},
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
			accessType: "offline",
			prompt: "select_account consent",
		},
	},
	plugins: [
		polar({
			client: polarClient,
			createCustomerOnSignUp: true,
			use: [
				checkout({
					products: [
						{
							productId: process.env.POLAR_PRODUCT_PRO as string,
							slug: "pro",
						},
						{
							productId: process.env.POLAR_PRODUCT_BUSINESS as string,
							slug: "business",
						},
						{
							productId: process.env.POLAR_PRODUCT_ENTERPRISE as string,
							slug: "enterprise",
						},
					],
					successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/success?checkout_id={CHECKOUT_ID}`,
					authenticatedUsersOnly: true,
				}),
				portal(),
				usage(),
				webhooks({
					secret: process.env.POLAR_WEBHOOK_SECRET as string,

					onSubscriptionCreated: async ({ data }) => {
						try {
							await upsertSubscription(data);
						} catch (error) {
							console.error("subscription.created webhook error:", error);
							throw error; // re-throw so Polar retries the delivery
						}
					},
					onSubscriptionActive: async ({ data }) => {
						try {
							await upsertSubscription(data);
						} catch (error) {
							console.error("subscription.active webhook error:", error);
							throw error;
						}
					},
					onSubscriptionUpdated: async ({ data }) => {
						try {
							await upsertSubscription(data);
						} catch (error) {
							console.error("subscription.updated webhook error:", error);
							throw error;
						}
					},
					onSubscriptionCanceled: async ({ data }) => {
						try {
							await upsertSubscription(data);
						} catch (error) {
							console.error("subscription.canceled webhook error:", error);
							throw error;
						}
					},
					onSubscriptionUncanceled: async ({ data }) => {
						try {
							await upsertSubscription(data);
						} catch (error) {
							console.error("subscription.uncanceled webhook error:", error);
							throw error;
						}
					},
					onSubscriptionRevoked: async ({ data }) => {
						try {
							await upsertSubscription(data);
						} catch (error) {
							console.error("subscription.revoked webhook error:", error);
							throw error;
						}
					},
				}),
			],
		}),
		nextCookies(),
	],
} satisfies BetterAuthOptions);

export type Session = typeof auth.$Infer.Session;
