import { z } from "zod";
import {
	RECURRENCE_END_TYPES,
	RECURRENCE_FREQUENCIES,
	WEEKDAY_CODES,
} from "./types";

export const timeSchema = z.object(
	{
		hour: z.number(),
		minute: z.number(),
	},
	{
		error: (issue) => {
			if (issue.code === "invalid_type") {
				return "Invalid time";
			}
			return issue.message;
		},
	},
);

export const eventSchema = z
	.object({
		attendees: z.array(
			z.object({
				id: z.string(),
				text: z.string(),
				picturePath: z.string().nullable().optional(),
			}),
		),
		title: z.string().min(1, "Title is required"),
		description: z.string().min(1, "Description is required"),
		location: z.string().optional(),
		meetingLink: z.string().optional(),
		startDate: z.date({
			error: (issue) =>
				issue.input === undefined ? "Start date is required" : "Invalid date",
		}),
		startTime: timeSchema,
		endDate: z.date({
			error: (issue) =>
				issue.input === undefined ? "End date is required" : "Invalid date",
		}),
		endTime: timeSchema,
		color: z.enum(["blue", "green", "red", "yellow", "purple", "orange"], {
			error: "Variant is required",
		}),
		repeats: z.boolean(),
		repeatFrequency: z.enum(RECURRENCE_FREQUENCIES),
		repeatInterval: z.number().int().min(1, "Interval must be at least 1"),
		repeatWeekdays: z.array(z.enum(WEEKDAY_CODES)),
		repeatEndType: z.enum(RECURRENCE_END_TYPES),
		repeatUntil: z.date().nullable().optional(),
		repeatCount: z.number().int().min(1, "Count must be at least 1").nullable(),
		isAllDay: z.boolean(),
	})
	.superRefine((value, ctx) => {
		const start = new Date(value.startDate);
		start.setHours(value.startTime.hour, value.startTime.minute, 0, 0);

		const end = new Date(value.endDate);
		end.setHours(value.endTime.hour, value.endTime.minute, 0, 0);

		if (end <= start) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "End time must be after the start time",
				path: ["endTime"],
			});
		}

		if (!value.repeats) {
			return;
		}

		if (
			value.repeatFrequency === "weekly" &&
			value.repeatWeekdays.length === 0
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Choose at least one weekday",
				path: ["repeatWeekdays"],
			});
		}

		if (value.repeatEndType === "on" && !value.repeatUntil) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Choose an end date",
				path: ["repeatUntil"],
			});
		}

		if (
			value.repeatEndType === "on" &&
			value.repeatUntil &&
			value.repeatUntil < value.startDate
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "End date must be on or after the first event date",
				path: ["repeatUntil"],
			});
		}

		if (value.repeatEndType === "after" && !value.repeatCount) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Choose how many times the event repeats",
				path: ["repeatCount"],
			});
		}
	});

export type EventFormData = z.infer<typeof eventSchema>;
