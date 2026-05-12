import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { event } from "./events";
import { meeting } from "./meetings";
import { subscriptionUsage } from "./subscription-usage";
import { subscription } from "./subscriptions";

export const user = pgTable("user", {
	id: text("_id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("emailVerified").notNull().default(false),
	image: text("image"),
	botName: text("botName").default("Vorcle Bot"),
	botImageUrl: text("botImageUrl"),
	calendarConnected: boolean("calendarConnected").default(false),
	slackUserId: text("slackUserId"),
	slackTeamId: text("slackTeamId"),
	slackConnected: boolean("slackConnected").default(false),
	preferredChannelId: text("preferredChannelId"),
	preferredChannelName: text("preferredChannelName"),
	meetingsThisMonth: integer("meetingsThisMonth").notNull().default(0),
	chatMessagesToday: integer("chatMessagesToday").notNull().default(0),
	lastUsageReset: timestamp("lastUsageReset", { mode: "date" }).defaultNow(),
	createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
	updatedAt: timestamp("updatedAt", { mode: "date" })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const userRelations = relations(user, ({ many, one }) => ({
	meetings: many(meeting),
	accounts: many(account),
	sessions: many(session),
	subscription: one(subscription),
	subscriptionUsage: one(subscriptionUsage),
	events: many(event),
}));

export const account = pgTable("account", {
	id: text("_id").primaryKey(),
	userId: text("userId").notNull(),
	accountId: text("accountId").notNull(),
	providerId: text("providerId").notNull(),
	accessToken: text("accessToken"),
	refreshToken: text("refreshToken"),
	accessTokenExpiresAt: timestamp("accessTokenExpiresAt", { mode: "date" }),
	refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", { mode: "date" }),
	scope: text("scope"),
	idToken: text("idToken"),
	password: text("password"),
	createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
	updatedAt: timestamp("updatedAt", { mode: "date" })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

export const session = pgTable("session", {
	id: text("_id").primaryKey(),
	userId: text("userId").notNull(),
	token: text("token").notNull(),
	expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
	ipAddress: text("ipAddress"),
	userAgent: text("userAgent"),
	createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
	updatedAt: timestamp("updatedAt", { mode: "date" })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const verification = pgTable("verification", {
	id: text("_id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
	createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
	updatedAt: timestamp("updatedAt", { mode: "date" })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Account = typeof account.$inferSelect;
export type Session = typeof session.$inferSelect;
