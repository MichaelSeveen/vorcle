import { relations } from "drizzle-orm";
import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./users";

export const event = pgTable("event", {
	id: text("_id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text("title").notNull(),
	description: text("description"),
	startDate: timestamp("startDate", { mode: "date" }).notNull(),
	endDate: timestamp("endDate", { mode: "date" }).notNull(),
	color: text("color").notNull(),
	location: text("location"),
	meetingLink: text("meetingLink"),
	attendees: jsonb("attendees"),
	isAllDay: boolean("isAllDay").notNull().default(false),
	timeZone: text("timeZone"),
	recurrenceRule: text("recurrenceRule"),
	recurrenceTimezone: text("recurrenceTimezone"),
	recurrenceExDates: jsonb("recurrenceExDates"),
	userId: text("userId").notNull(),
	createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
	updatedAt: timestamp("updatedAt", { mode: "date" })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const eventRelations = relations(event, ({ one }) => ({
	user: one(user, {
		fields: [event.userId],
		references: [user.id],
	}),
}));

export type Event = typeof event.$inferSelect;
export type NewEvent = typeof event.$inferInsert;
