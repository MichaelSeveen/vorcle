import "server-only";

import prisma from "./prisma";
import { PLAN_LIMITS } from "@/config/types";
import { SubscriptionPlan } from "@prisma/client";
import { getUserActiveSubscription } from "@/helpers/subscriptions";

export async function canUserSendBot(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { allowed: false, reason: "User not found" };
  }

  const activeSubscription = await getUserActiveSubscription(userId);

  if (!activeSubscription) {
    return { allowed: false, reason: "You do not have an active subscription" };
  }

  const planName = (activeSubscription.planName as SubscriptionPlan) || "FREE";
  const status = activeSubscription.status;

  if (planName === "FREE" || status !== "ACTIVE") {
    return {
      allowed: false,
      reason: "Upgrade your plan to send bots to your meetings",
    };
  }

  const limits = PLAN_LIMITS[planName];

  if (!limits) {
    console.error(`Unknown plan: ${planName}`);
    return { allowed: false, reason: "Invalid subscription plan" };
  }

  if (limits.meetings !== -1 && user.meetingsThisMonth >= limits.meetings) {
    return {
      allowed: false,
      reason: `You've reached your monthly limit of ${limits.meetings} meetings`,
    };
  }

  return { allowed: true };
}

export async function canUserChat(userId: string) {
  const { success, data } = await getCurrentUserTokenUsage(userId);

  if (!success || !data) {
    return { allowed: false, reason: "Failed to get user data" };
  }

  const { effectivePlan, effectiveStatus, chatMessagesToday } = data;

  const limits = PLAN_LIMITS[effectivePlan];
  const isFree = effectivePlan === "FREE";
  const isActivePaid = !isFree && effectiveStatus === "ACTIVE";

  const canChat =
    (isFree || isActivePaid) &&
    (limits.chatMessages === -1 || chatMessagesToday < limits.chatMessages);

  if (!canChat) {
    return {
      allowed: false,
      reason:
        limits.chatMessages === -1
          ? "Not allowed for your current plan"
          : `Reached limit of ${limits.chatMessages} daily messages`,
    };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { chatMessagesToday: { increment: 1 } },
  });

  return { allowed: true };
}

export async function incrementMeetingUsage(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { meetingsThisMonth: { increment: 1 } },
  });
}

export async function incrementUserChatTokenUsage(userId: string) {
  try {
    const chatCheck = await canUserChat(userId);

    if (!chatCheck.allowed) {
      return {
        success: false,
        message: chatCheck.reason,
        upgradeRequired: true,
      };
    }

    return { success: chatCheck.allowed };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Failed to increment your usage" };
  }
}

export async function incrementUserMeetingsTokenUsage(userId: string) {
  try {
    await incrementMeetingUsage(userId);
    return { success: true };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Failed to increment your usage" };
  }
}

export async function getCurrentUserTokenUsage(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        chatMessagesToday: true,
        meetingsThisMonth: true,
      },
    });

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    const activeSubscription = await getUserActiveSubscription(userId);
    const effectivePlan =
      (activeSubscription?.planName as SubscriptionPlan) || "FREE";
    const effectiveStatus = activeSubscription?.status || "INACTIVE";
    const nextPaymentDate = activeSubscription?.currentPeriodEnd;

    return {
      success: true,
      data: {
        ...user,
        effectivePlan,
        effectiveStatus,
        nextPaymentDate,
      },
    };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Failed to get your usage" };
  }
}

export function getPlanLimits(plan: SubscriptionPlan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
}
