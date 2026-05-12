import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { subscriptionPlanEnum, subscriptionStatusEnum } from "./enums";
import { user } from "./users";

export const subscriptionUsage = pgTable("subscription_usage", {
	id: text("_id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("userId").notNull().unique(),
	planName: subscriptionPlanEnum("planName").notNull().default("FREE"),
	subscriptionStatus: subscriptionStatusEnum("subscriptionStatus")
		.notNull()
		.default("INACTIVE"),
	cycleAnchor: text("cycleAnchor").notNull().default("calendar_month"),
	periodStart: timestamp("periodStart", { mode: "date" }).notNull(),
	periodEnd: timestamp("periodEnd", { mode: "date" }).notNull(),
	meetingsUsed: integer("meetingsUsed").notNull().default(0),
	chatMessagesUsed: integer("chatMessagesUsed").notNull().default(0),
	lastReconciledAt: timestamp("lastReconciledAt", { mode: "date" })
		.notNull()
		.defaultNow(),
	createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
	updatedAt: timestamp("updatedAt", { mode: "date" })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const subscriptionUsageRelations = relations(
	subscriptionUsage,
	({ one }) => ({
		user: one(user, {
			fields: [subscriptionUsage.userId],
			references: [user.id],
		}),
	}),
);

export type SubscriptionUsage = typeof subscriptionUsage.$inferSelect;
