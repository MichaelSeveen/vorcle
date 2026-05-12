import { z } from "zod/v4";

export const summarySchema = z.object({
	summary: z
		.string()
		.describe(
			"A clear, concise 2-4 sentence summary of the main discussion points, decisions, blockers, and next steps.",
		),

	decisions: z
		.array(z.string())
		.describe(
			"A list of concrete decisions made during the meeting. Return an empty array if none were clearly made.",
		),

	actionItems: z
		.array(
			z.object({
				task: z
					.string()
					.describe("A specific, actionable task mentioned in the meeting."),
				owner: z
					.string()
					.nullable()
					.describe(
						"The person responsible for the task, if explicitly stated or clearly implied; otherwise null.",
					),
				deadline: z
					.string()
					.nullable()
					.describe(
						"The due date or timeframe for the task, if explicitly stated; otherwise null.",
					),
			}),
		)
		.describe(
			"A list of specific action items mentioned in the meeting. Return an empty array if none are found.",
		),

	blockers: z
		.array(z.string())
		.describe(
			"A list of blockers, risks, or open issues mentioned in the meeting. Return an empty array if none are found.",
		),
});

export type MeetingSummary = z.infer<typeof summarySchema>;
