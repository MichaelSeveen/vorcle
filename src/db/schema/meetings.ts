import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	vector,
} from "drizzle-orm/pg-core";
import { user } from "./users";

export const meeting = pgTable("meeting", {
	id: text("_id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text("title").notNull(),
	description: text("description"),
	meetingUrl: text("meetingUrl"),
	location: text("location"),
	startTime: timestamp("startTime", { mode: "date" }).notNull(),
	endTime: timestamp("endTime", { mode: "date" }).notNull(),
	attendees: jsonb("attendees"),
	calendarEventId: text("calendarEventId").unique(),
	isFromCalendar: boolean("isFromCalendar").notNull().default(false),
	botScheduled: boolean("botScheduled").notNull().default(true),
	botSent: boolean("botSent").notNull().default(false),
	botId: text("botId"),
	botStatus: text("botStatus"),
	botStatusUpdatedAt: timestamp("botStatusUpdatedAt", { mode: "date" }),
	botFailureCode: text("botFailureCode"),
	botFailureMessage: text("botFailureMessage"),
	botJoinedAt: timestamp("botJoinedAt", { mode: "date" }),
	meetingEnded: boolean("meetingEnded").notNull().default(false),
	transcriptReady: boolean("transcriptReady").notNull().default(false),
	transcript: jsonb("transcript"),
	transcriptSourceLanguage: text("transcriptSourceLanguage"),
	transcriptTranslations: jsonb("transcriptTranslations"),
	recordingUrl: text("recordingUrl"),
	audioObjectKey: text("audioObjectKey"),
	videoObjectKey: text("videoObjectKey"),
	transcriptionObjectKey: text("transcriptionObjectKey"),
	rawTranscriptionObjectKey: text("rawTranscriptionObjectKey"),
	diarizationObjectKey: text("diarizationObjectKey"),
	chatMessagesObjectKey: text("chatMessagesObjectKey"),
	speakers: jsonb("speakers"),
	summary: text("summary"),
	decisions: jsonb("decisions"),
	blockers: jsonb("blockers"),
	actionItems: jsonb("actionItems"),
	processed: boolean("processed").notNull().default(false),
	processedAt: timestamp("processedAt", { mode: "date" }),
	emailSent: boolean("emailSent").notNull().default(false),
	emailSentAt: timestamp("emailSentAt", { mode: "date" }),
	ragProcessed: boolean("ragProcessed").notNull().default(false),
	ragProcessedAt: timestamp("ragProcessedAt", { mode: "date" }),
	usageCountedAt: timestamp("usageCountedAt", { mode: "date" }),
	userId: text("userId").notNull(),
	createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
	updatedAt: timestamp("updatedAt", { mode: "date" })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const meetingRelations = relations(meeting, ({ one, many }) => ({
	user: one(user, {
		fields: [meeting.userId],
		references: [user.id],
	}),
	transcriptChunks: many(transcriptChunk),
}));

export const transcriptChunk = pgTable("transcript_chunk", {
	id: text("_id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	chunkIndex: integer("chunkIndex").notNull(),
	content: text("content").notNull(),
	speakerName: text("speakerName"),
	vectorId: text("vectorId"),
	embedding: vector("embedding", { dimensions: 1536 }),
	meetingId: text("meetingId").notNull(),
	createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const transcriptChunkRelations = relations(
	transcriptChunk,
	({ one }) => ({
		meeting: one(meeting, {
			fields: [transcriptChunk.meetingId],
			references: [meeting.id],
		}),
	}),
);

export type Meeting = typeof meeting.$inferSelect;
export type NewMeeting = typeof meeting.$inferInsert;
export type TranscriptChunk = typeof transcriptChunk.$inferSelect;
