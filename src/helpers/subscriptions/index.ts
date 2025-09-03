import "server-only";

import { polarClient } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function hasActiveSubscription(userId: string) {
  try {
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: {
          in: ["ACTIVE"],
        },
        OR: [
          { currentPeriodEnd: null },
          { currentPeriodEnd: { gt: new Date() } },
        ],
      },
    });

    return activeSubscription;
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return null;
  }
}

export async function getUserActiveSubscription(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscriptions: true },
    });

    if (!user) {
      return null;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    if (!user.lastUsageReset || user.lastUsageReset < startOfMonth) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          meetingsThisMonth: 0,
          chatMessagesToday: 0,
          lastUsageReset: now,
        },
      });
    }

    const pastDueSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: "PAST_DUE",
        gracePeriodEndsAt: { lt: now },
      },
    });

    if (pastDueSubscription) {
      await prisma.subscription.update({
        where: { id: pastDueSubscription.id },
        data: { status: "CANCELED" },
      });
    }

    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: {
          in: ["ACTIVE"],
        },
        OR: [
          { currentPeriodEnd: null },
          { currentPeriodEnd: { gt: new Date() } },

          { gracePeriodEndsAt: { gt: new Date() } },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return activeSubscription;
  } catch (error) {
    console.error("Error loading user subscription data:", error);
    return null;
  }
}

export async function saveWebhookEvent(
  eventType: string,
  payload: unknown,
  polarId?: string
) {
  try {
    if (!payload) {
      throw new Error("Payload is required");
    }

    await prisma.webhookEvent.create({
      data: {
        eventType,
        polarId,
        payload: payload,
        processed: false,
      },
    });
  } catch (error) {
    console.error("Failed to save webhook event:", error);
  }
}

export async function getUserIdFromCustomerId(customerId: string) {
  try {
    const customer = await polarClient.customers.get({ id: customerId });

    if (customer.externalId) {
      const user = await prisma.user.findUnique({
        where: { id: customer.externalId },
        select: { id: true },
      });

      if (user) {
        return user.id;
      }
    }

    const existingSubscription = await prisma.subscription.findFirst({
      where: { customerId },
      select: { userId: true },
    });

    if (existingSubscription) {
      return existingSubscription.userId;
    }

    console.warn(`No user found for customerId: ${customerId}`);
    return null;
  } catch (error) {
    console.error("Failed to get userId from customerId:", error);
    return null;
  }
}

export async function getCheckoutData(checkoutId: string, userId?: string) {
  try {
    const checkout = await prisma.checkout.findUnique({
      where: { polarId: checkoutId },
      include: {
        subscription: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!checkout) {
      return null;
    }

    if (
      !userId ||
      !checkout.subscription?.userId ||
      checkout.subscription.userId !== userId
    ) {
      return null;
    }

    return {
      checkout,
      subscription: checkout.subscription,
      user: checkout.subscription?.user,
    };
  } catch (error) {
    console.error("Failed to get checkout data:", error);
    return null;
  }
}
