import { pgEnum } from "drizzle-orm/pg-core";

export const subscriptionPlanEnum = pgEnum("SubscriptionPlan", [
	"FREE",
	"PRO",
	"BUSINESS",
	"ENTERPRISE",
]);

export const subscriptionStatusEnum = pgEnum("SubscriptionStatus", [
	"INACTIVE",
	"INCOMPLETE",
	"ACTIVE",
	"PAST_DUE",
	"CANCELED",
	"UNPAID",
]);

export type SubscriptionPlan = (typeof subscriptionPlanEnum.enumValues)[number];
export type SubscriptionStatus =
	(typeof subscriptionStatusEnum.enumValues)[number];
