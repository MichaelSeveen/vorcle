import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { subscriptionStatusEnum } from "./enums";
import { user } from "./users";

export const subscription = pgTable("subscription", {
	id: text("_id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	status: subscriptionStatusEnum("status").notNull().default("INACTIVE"),
	planName: text("planName").notNull().default("FREE"),
	productId: text("productId").notNull().unique(),
	customerId: text("customerId"),
	checkoutId: text("checkoutId"),
	endsAt: timestamp("endsAt", { mode: "date" }),
	endedAt: timestamp("endedAt", { mode: "date" }),
	amount: integer("amount"),
	currency: text("currency"),
	modifiedAt: timestamp("modifiedAt", { mode: "date" }),
	startedAt: timestamp("startedAt", { mode: "date" }),
	cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false),
	currentPeriodStart: timestamp("currentPeriodStart", { mode: "date" }),
	currentPeriodEnd: timestamp("currentPeriodEnd", { mode: "date" }),
	recurringInterval: text("recurringInterval"),
	gracePeriodEndsAt: timestamp("gracePeriodEndsAt", { mode: "date" }),
	userId: text("userId").notNull().unique(),
	canceledAt: timestamp("canceledAt", { mode: "date" }),
	createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
	updatedAt: timestamp("updatedAt", { mode: "date" })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const subscriptionRelations = relations(subscription, ({ one }) => ({
	user: one(user, {
		fields: [subscription.userId],
		references: [user.id],
	}),
}));

export type Subscription = typeof subscription.$inferSelect;
