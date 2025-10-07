import "server-only";

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

// async function resetMonthlyUsage(userId: string, lastUsageReset: Date | null) {
//   const now = new Date();
//   const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

//   if (!lastUsageReset || lastUsageReset < startOfMonth) {
//     await prisma.user.update({
//       where: { id: userId },
//       data: {
//         meetingsThisMonth: 0,
//         chatMessagesToday: 0,
//         lastUsageReset: now,
//       },
//     });
//   }
// }

async function cancelExpiredPastDueSubscriptions(userId: string) {
  const now = new Date();

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
}

async function findActiveSubscription(userId: string) {
  const now = new Date();

  return prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE"] },
      OR: [
        { currentPeriodEnd: null },
        { currentPeriodEnd: { gt: now } },
        { gracePeriodEndsAt: { gt: now } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserActiveSubscription(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastUsageReset: true },
    });

    if (!user) return null;

    // await resetMonthlyUsage(userId, user.lastUsageReset);
    await cancelExpiredPastDueSubscriptions(userId);

    return await findActiveSubscription(userId);
  } catch (error) {
    console.error("Error loading user subscription data:", error);
    return null;
  }
}
