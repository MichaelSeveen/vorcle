export type CalendarView = "day" | "week" | "month" | "year" | "agenda";

export const EVENT_COLORS = [
  "blue",
  "green",
  "red",
  "yellow",
  "purple",
  "orange",
] as const;

export type EventColor = (typeof EVENT_COLORS)[number];

export interface User {
  id: string;
  name: string;
  picturePath: string | null;
}

export interface Event {
  id: string;
  startDate: string;
  endDate: string;
  title: string;
  color: EventColor;
  location: string | null;
  meetingLink: string | null;
  description: string;
  attendees?: User[];
  user: User;
}

export interface CalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}
