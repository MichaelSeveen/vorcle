import { betterAuth, type BetterAuthOptions } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import {
  polar,
  checkout,
  portal,
  usage,
  webhooks,
} from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { SubscriptionStatus } from "@prisma/client";

function safeParseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN as string,
  server: process.env.POLAR_SERVER_ENV as "sandbox" | "production",
});

export const auth = betterAuth({
  trustedOrigins: [`${process.env.NEXT_PUBLIC_APP_URL}`],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  user: {
    additionalFields: {
      botName: {
        type: "string",
        required: false,
        defaultValue: "Vorcle Bot",
      },
      botImageUrl: {
        type: "string",
        required: false,
      },
      calendarConnected: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      slackUserId: {
        type: "string",
        required: false,
      },
      slackTeamId: {
        type: "string",
        required: false,
      },
      preferredChannelId: {
        type: "string",
        required: false,
      },
      preferredChannelName: {
        type: "string",
        required: false,
      },
      meetingsThisMonth: {
        type: "number",
        required: false,
        defaultValue: 0,
      },
      chatMessagesToday: {
        type: "number",
        required: false,
        defaultValue: 0,
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      accessType: "offline",
      prompt: "select_account consent",
    },
  },
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: process.env.POLAR_PRODUCT_PRO as string,
              slug: "pro",
            },
            {
              productId: process.env.POLAR_PRODUCT_BUSINESS as string,
              slug: "business",
            },
            {
              productId: process.env.POLAR_PRODUCT_ENTERPRISE as string,
              slug: "enterprise",
            },
          ],
          successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/success?checkout_id={CHECKOUT_ID}`,
          authenticatedUsersOnly: true,
        }),
        portal(),
        usage(),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET as string,
          onPayload: async ({ data, type }) => {
            if (
              type === "subscription.created" ||
              type === "subscription.active" ||
              type === "subscription.canceled" ||
              type === "subscription.revoked" ||
              type === "subscription.uncanceled" ||
              type === "subscription.updated"
            ) {
              try {
                const userId = data.customer?.externalId;

                if (!userId) {
                  throw new Error(
                    `Cannot create subscription without a valid userId (customer.externalId was missing for subscription ${data.id}).`
                  );
                }

                const subscriptionData = {
                  modifiedAt: safeParseDate(data.modifiedAt),
                  amount: data.amount,
                  planName: data.product.name,
                  currency: data.currency,
                  recurringInterval: data.recurringInterval,
                  status: data.status.toUpperCase() as SubscriptionStatus,
                  currentPeriodStart:
                    safeParseDate(data.currentPeriodStart) || new Date(),
                  currentPeriodEnd:
                    safeParseDate(data.currentPeriodEnd) || new Date(),
                  cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
                  canceledAt: safeParseDate(data.canceledAt),
                  startedAt: safeParseDate(data.startedAt) || new Date(),
                  endsAt: safeParseDate(data.endsAt),
                  endedAt: safeParseDate(data.endedAt),
                  customerId: data.customerId,
                  productId: data.productId,
                  checkoutId: data.checkoutId || "",
                  userId,
                };

                // console.log("💾 Final subscription data:", {
                //   id: subscriptionData.productId,
                //   status: subscriptionData.status,
                //   userId: subscriptionData.userId,
                //   amount: subscriptionData.amount,
                // });

                await prisma.subscription.upsert({
                  where: {
                    id: subscriptionData.productId,
                  },
                  update: {
                    modifiedAt: subscriptionData.modifiedAt || new Date(),
                    amount: subscriptionData.amount,
                    planName: subscriptionData.planName,
                    currency: subscriptionData.currency,
                    recurringInterval: subscriptionData.recurringInterval,
                    status: subscriptionData.status,
                    currentPeriodStart: subscriptionData.currentPeriodStart,
                    currentPeriodEnd: subscriptionData.currentPeriodEnd,
                    cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
                    canceledAt: subscriptionData.canceledAt,
                    startedAt: subscriptionData.startedAt,
                    endsAt: subscriptionData.endsAt,
                    endedAt: subscriptionData.endedAt,
                    customerId: subscriptionData.customerId,
                    productId: subscriptionData.productId,
                    checkoutId: subscriptionData.checkoutId,
                    userId: subscriptionData.userId,
                  },
                  create: {
                    ...subscriptionData,
                  },
                });

                console.log("Upserted subscription:", data.id);
              } catch (error) {
                console.error("Error processing subscription webhook:", error);
              }
            }
          },
        }),
      ],
    }),
    nextCookies(),
  ],
} satisfies BetterAuthOptions);

export type Session = typeof auth.$Infer.Session;
