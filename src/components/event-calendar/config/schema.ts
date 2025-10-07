import { z } from "zod";

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
  }
);
export const eventSchema = z.object({
  attendees: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      picturePath: z.string().nullable().optional(),
    })
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
});
export type EventFormData = z.infer<typeof eventSchema>;
