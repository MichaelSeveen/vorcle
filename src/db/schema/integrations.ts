import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { user } from "./users";

export const userIntegration = pgTable(
	"user_integration",
	{
		id: text("_id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text("userId").notNull(),
		provider: text("provider").notNull(),
		accessToken: text("accessToken").notNull(),
		refreshToken: text("refreshToken"),
		tokenExpiresAt: timestamp("tokenExpiresAt", { mode: "date" }),
		boardId: text("boardId"),
		boardName: text("boardName"),
		projectId: text("projectId"),
		projectName: text("projectName"),
		workspaceId: text("workspaceId"),
		domain: text("domain"),
		createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
		updatedAt: timestamp("updatedAt", { mode: "date" })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		unique("user_integration_userId_provider_key").on(
			table.userId,
			table.provider,
		),
	],
);

export const userIntegrationRelations = relations(
	userIntegration,
	({ one }) => ({
		user: one(user, {
			fields: [userIntegration.userId],
			references: [user.id],
		}),
	}),
);

export const slackInstallation = pgTable("slack_installation", {
	id: text("_id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	teamId: text("teamId").notNull().unique(),
	teamName: text("teamName"),
	botToken: text("botToken").notNull(),
	botUserId: text("botUserId"),
	appId: text("appId"),
	installerUserId: text("installerUserId"),
	scope: text("scope"),
	createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
	updatedAt: timestamp("updatedAt", { mode: "date" })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export type UserIntegration = typeof userIntegration.$inferSelect;
export type SlackInstallation = typeof slackInstallation.$inferSelect;
