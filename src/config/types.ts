import type { Meeting, SubscriptionPlan } from "@prisma/client";
import { JsonValue } from "@prisma/client/runtime/library";
import { JSX } from "react";

export interface PlanLimits {
  meetings: number;
  chatMessages: number;
}

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  FREE: { meetings: 3, chatMessages: 10 },
  PRO: { meetings: 10, chatMessages: 30 },
  BUSINESS: { meetings: 30, chatMessages: 100 },
  ENTERPRISE: { meetings: -1, chatMessages: -1 },
};

export type IntegrationProvider =
  | "asana"
  | "google-calendar"
  | "jira"
  | "slack"
  | "trello";

export interface Integration {
  provider: IntegrationProvider;
  name: string;
  description: string;
  isProviderConnected: boolean;
  boardName?: string;
  projectName?: string;
  channelName?: string;
  logo: ({ className }: { className?: string }) => JSX.Element;
}

export interface MeetingData {
  id: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  transcript?: JsonValue;
  summary: string | null;
  actionItems: JsonValue;
  processed: boolean;
  processedAt?: Date | null;
  recordingUrl: string | null;
  emailSent: boolean;
  emailSentAt: Date | null;
  userId?: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
  };
  ragProcessed?: boolean;
}

export interface ProviderIntegration {
  id: string;
  userId: string;
  provider: string;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  boardId: string | null;
  boardName: string | null;
  projectId: string | null;
  projectName: string | null;
  workspaceId: string | null;
  domain: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActionItem {
  id: number;
  text: string;
}

interface TranscriptWord {
  word: string;
  start: number;
  end: number;
}

export interface TranscriptSegment {
  words: TranscriptWord[];
  offset: number;
  speaker: string;
}

export interface MeetingInfoData {
  title: string;
  date: string;
  time: string;
  userName: string;
}

export interface UserData {
  name: string;
  image: string | null | undefined;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  productId: string;
  priceMonthly: number;
  description: string;
  features: string[];
  highlight: boolean;
}

export const TIERS: Plan[] = [
  {
    id: "pro-tier",
    name: "PRO",
    slug: "pro",
    productId: `${process.env.NEXT_PUBLIC_PRODUCT_PRO}`,
    priceMonthly: 9,
    description:
      "Perfect for individuals who don't want to miss any meetings again",
    features: [
      "10 meetings per month",
      "30 AI chat messages per day",
      "Meeting transcripts and summaries",
      "Action items extraction",
      "Email Notifications",
    ],
    highlight: false,
  },
  {
    id: "business-tier",
    name: "BUSINESS",
    slug: "business",
    productId: `${process.env.NEXT_PUBLIC_PRODUCT_BUSINESS}`,
    priceMonthly: 29,
    description:
      "Great for power users and small businesses who need more flexibility",
    features: [
      "30 meetings per month",
      "100 AI chat messages per day",
      "Meeting transcripts and summaries",
      "Action items extraction",
      "Email Notifications",
      "Priority Support",
    ],
    highlight: true,
  },
  {
    id: "enterprise-tier",
    name: "ENTERPRISE",
    slug: "enterprise",
    productId: `${process.env.NEXT_PUBLIC_PRODUCT_ENTERPRISE}`,
    priceMonthly: 69,
    description:
      "For individuals and teams who want unlimited access and control",
    features: [
      "Unlimited meetings per month",
      "Unlimited AI chat messages per day",
      "Meeting transcripts and summaries",
      "Action items extraction",
      "Email Notifications",
      "Priority Support",
    ],
    highlight: false,
  },
];

export type MeetingTableItems = Pick<
  Meeting,
  | "id"
  | "title"
  | "description"
  | "startTime"
  | "endTime"
  | "processed"
  | "createdAt"
  | "attendees"
>;

export interface UserIntegrationResult {
  provider: IntegrationProvider;
  name: string;
  isProviderConnected: boolean;
  boardName?: string | null;
  projectName?: string | null;
  channelName?: string | null;
}

export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events.readonly",
] as const;

export interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
  };
  attendees?: GoogleCalendarAttendee[];
  hangoutLink?: string | null;
  conferenceData?: {
    entryPoints: Array<{
      uri: string;
    }>;
  } | null;
  botScheduled: boolean;
  meetingId: string;
  location?: string;
}

interface GoogleCalendarAttendee {
  id?: string;
  name?: string;
  email?: string;
  responseStatus?: "accepted" | "declined" | "tentative" | "needsAction";
}
