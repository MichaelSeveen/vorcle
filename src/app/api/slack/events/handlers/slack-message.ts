import type { SayFn } from "@slack/bolt";
import type { MessageEvent, WebClient } from "@slack/web-api";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { isDuplicateEvent } from "../utils/deduplicate-responses";

interface MessageProps {
	message: MessageEvent;
	say: SayFn;
	client: WebClient;
}

export async function handleMessage({ message, say, client }: MessageProps) {
	try {
		if (
			message.subtype === "bot_message" ||
			!("user" in message) ||
			!("text" in message)
		) {
			return;
		}

		if (message.user?.startsWith("B")) {
			return;
		}

		const authTest = await client.auth.test();

		if (message.user === authTest.user_id) {
			return;
		}

		const text = message.text || "";

		if (text.includes(`<@${authTest.user_id}>`)) {
			return;
		}

		const eventId = `message-${message.channel}-${message.user}`;
		const eventTs = message.ts;

		if (isDuplicateEvent(eventId, eventTs)) {
			return;
		}

		const slackUserId = message.user;

		if (!slackUserId) {
			return;
		}

		const cleanText = text.replace(/<@[^>]+>/g, "").trim();

		if (!cleanText) {
			await say(
				"👋 Hi! Ask me anything about your meetings. For example:\n· What were the key decisions in yesterday's meeting?\n· Summarize yesterday's meeting action items\n· Who attended the product planning session?",
			);
			return;
		}

		const userInfo = await client.users.info({ user: slackUserId });
		const userEmail = userInfo.user?.profile?.email;

		if (!userEmail) {
			await say(
				"Sorry, I cant access your email. Please make sure your slack email is visible on your profile settings.",
			);
			return;
		}

		const [userRow] = await db
			.select()
			.from(user)
			.where(eq(user.email, userEmail))
			.limit(1);

		if (!userRow) {
			await say({
				text: "Account not found",
				blocks: [
					{
						type: "section",
						text: {
							type: "mrkdwn",
							text: `👋 Hi! I coant find an accoutn with email *${userEmail}*.\n\nPlease sign up first, then you can chat with me here!`,
						},
					},
					{
						type: "context",
						elements: [
							{
								type: "mrkdwn",
								text: "Once you have an account, I can help you with meeting summaries, action items, and more!",
							},
						],
					},
				],
			});
			return;
		}

		const { team_id: teamId } = await client.auth.test();
		await db
			.update(user)
			.set({
				slackUserId: slackUserId,
				slackTeamId: teamId as string,
				slackConnected: true,
			})
			.where(eq(user.id, userRow.id));

		await say("🤖 Searching through your meetings...");

		const response = await fetch(
			`${process.env.NEXT_PUBLIC_APP_URL}/api/rag/chat-all`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					question: cleanText as string,
					userId: userRow.id,
				}),
			},
		);

		if (!response.ok) {
			throw new Error(`RAG API failed: ${response.status}`);
		}

		const data = await response.json();

		if (data.answer) {
			const answer = data.answer;

			await say({
				text: "Meeting Assistant Response",
				blocks: [
					{
						type: "section",
						text: {
							type: "mrkdwn",
							text: `*Meeting Assistant*\n\n${answer}`,
						},
					},
					{
						type: "divider",
					},
					{
						type: "context",
						elements: [
							{
								type: "mrkdwn",
								text: "💡 Ask me about meetings, decisions, action items or participants",
							},
						],
					},
				],
			});
		} else {
			await say(
				"Sorry, i encountered an error searching through your meetings",
			);
		}
	} catch (error) {
		console.error("App mention handler error:", error);
		await say("Sorry, something went wrong. Please try again.");
	}
}
