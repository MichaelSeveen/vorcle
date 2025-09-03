import { SubscriptionStatus } from "@prisma/client";

export const LABEL_STYLES_MAP = {
  red: "bg-red-100 border-red-200 text-red-800 dark:bg-red-800 dark:border-red-700 dark:text-red-100",

  amber:
    "bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-800 dark:border-amber-700 dark:text-amber-100",

  green:
    "bg-green-100 border-green-200 text-green-800 dark:bg-green-800 dark:border-green-700 dark:text-green-100",

  teal: "bg-teal-100 border-teal-200 text-teal-800 dark:bg-teal-800 dark:border-teal-700 dark:text-teal-100",
} as const;

export const LABEL_STYLES_BG = {
  red: "bg-red-500",

  amber: "bg-amber-500",

  green: "bg-green-500",

  teal: "bg-teal-500",
} as const;

type TW_COLOR = keyof typeof LABEL_STYLES_MAP;
type TW_COLOR_BG = keyof typeof LABEL_STYLES_BG;

export const mapStatusToLabelAndBg: Record<
  SubscriptionStatus,
  { name: string; color: TW_COLOR; bg: TW_COLOR_BG }
> = {
  ACTIVE: { name: "Active", color: "green", bg: "green" },
  CANCELED: { name: "Canceled", color: "red", bg: "red" },
  PAST_DUE: { name: "Past Due", color: "amber", bg: "amber" },
  INACTIVE: { name: "Inactive", color: "teal", bg: "teal" },
  INCOMPLETE: { name: "Incomplete", color: "amber", bg: "amber" },
  UNPAID: { name: "Unpaid", color: "amber", bg: "amber" },
};
