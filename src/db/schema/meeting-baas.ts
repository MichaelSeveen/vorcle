import { relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./users";

export const userZoomCredential = pgTable("user_zoom_credential", {
	id: text("_id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("userId").notNull().unique(),
	meetingBaasCredentialId: text("meetingBaasCredentialId").notNull().unique(),
	name: text("name").notNull(),
	zoomUserId: text("zoomUserId"),
	zoomAccountId: text("zoomAccountId"),
	state: text("state").notNull().default("active"),
	lastErrorMessage: text("lastErrorMessage"),
	lastErrorAt: timestamp("lastErrorAt", { mode: "date" }),
	connectedAt: timestamp("connectedAt", { mode: "date" })
		.notNull()
		.defaultNow(),
	createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
	updatedAt: timestamp("updatedAt", { mode: "date" })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const userZoomCredentialRelations = relations(
	userZoomCredential,
	({ one }) => ({
		user: one(user, {
			fields: [userZoomCredential.userId],
			references: [user.id],
		}),
	}),
);

export const meetingBaasWebhookEvent = pgTable("meeting_baas_webhook_event", {
	id: text("_id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	svixId: text("svixId").notNull().unique(),
	eventType: text("eventType").notNull(),
	botId: text("botId"),
	eventId: text("eventId"),
	processedAt: timestamp("processedAt", { mode: "date" })
		.notNull()
		.defaultNow(),
	createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export type UserZoomCredential = typeof userZoomCredential.$inferSelect;
export type NewUserZoomCredential = typeof userZoomCredential.$inferInsert;
export type MeetingBaasWebhookEvent =
	typeof meetingBaasWebhookEvent.$inferSelect;
