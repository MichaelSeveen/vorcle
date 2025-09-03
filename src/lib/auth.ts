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
import {
  validateCheckoutCreated,
  validateCheckoutUpdated,
  validateSubscriptionCreated,
  validateSubscriptionUpdated,
  validateSubscriptionActive,
  validateSubscriptionRevoked,
  validateSubscriptionCanceled,
} from "@/config/polar-webhooks";
import prisma from "./prisma";
import {
  getUserIdFromCustomerId,
  saveWebhookEvent,
} from "@/helpers/subscriptions";
import { SubscriptionStatus } from "@prisma/client";

export const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN as string,
  server: process.env.POLAR_SERVER_ENV as "sandbox" | "production",
});

export const auth = betterAuth({
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
      prompt: "select_account+consent",
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
          async onCheckoutCreated(payload) {
            const validation = validateCheckoutCreated(payload);
            if (!validation.success) {
              console.error(
                `Invalid ${payload.type} payload:`,
                validation.error
              );
              await saveWebhookEvent(payload.type, payload.data);
              return;
            }

            const { data: event } = validation;
            const eventId = event.data.id;
            console.log(`Checkout created ${eventId}`);
            await saveWebhookEvent(payload.type, event, eventId);

            try {
              await prisma.$transaction(async (tx) => {
                await tx.checkout.create({
                  data: {
                    polarId: eventId,
                    status: event.data.status,
                    productId: event.data.productId,
                    productName: event.data.product?.name,
                    amount: event.data.totalAmount,
                    currency: event.data.currency,
                    successUrl: event.data.successUrl,
                    url: event.data.url,
                    expiresAt: event.data.expiresAt || null,
                    customerId: event.data.customerId,
                  },
                });

                await tx.webhookEvent.updateMany({
                  where: {
                    eventType: event.type,
                    polarId: eventId,
                    processed: false,
                  },
                  data: { processed: true },
                });
              });
            } catch (error) {
              console.error(
                "Failed to process checkout.created webhook:",
                error
              );
              await prisma.webhookEvent.updateMany({
                where: {
                  eventType: event.type,
                  polarId: eventId,
                },
                data: {
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                },
              });
            }
          },

          async onCheckoutUpdated(payload) {
            const validation = validateCheckoutUpdated(payload);

            if (!validation.success) {
              console.error(
                `Invalid ${payload.type} payload:`,
                validation.error
              );
              await saveWebhookEvent(payload.type, payload.data);
              return;
            }

            const { data: event } = validation;
            console.log(
              "Checkout updated",
              event.data.id,
              "Status:",
              event.data.status
            );
            const eventId = event.data.id;
            await saveWebhookEvent(event.type, event, eventId);

            try {
              await prisma.$transaction(async (tx) => {
                await tx.checkout.update({
                  where: { polarId: eventId },
                  data: {
                    status: event.data.status,
                    amount: event.data.totalAmount,
                    currency: event.data.currency,
                    customerId: event.data.customerId,
                  },
                });

                await tx.webhookEvent.updateMany({
                  where: {
                    eventType: event.type,
                    polarId: eventId,
                    processed: false,
                  },
                  data: { processed: true },
                });
              });
            } catch (error) {
              console.error(
                "Failed to process checkout.updated webhook:",
                error
              );
              await prisma.webhookEvent.updateMany({
                where: {
                  eventType: event.type,
                  polarId: eventId,
                },
                data: {
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                },
              });
            }
          },

          async onSubscriptionCreated(payload) {
            const validation = validateSubscriptionCreated(payload);

            if (!validation.success) {
              console.error(
                `Invalid ${payload.type} payload:`,
                validation.error
              );
              await saveWebhookEvent(payload.type, payload.data);
              return;
            }

            const { data: event } = validation;
            const eventId = event.data.id;
            console.log(`Subscription created ${eventId}`);
            await saveWebhookEvent(event.type, event, eventId);

            try {
              const userId = await getUserIdFromCustomerId(
                event.data.customerId
              );

              if (!userId) {
                throw new Error(
                  `Cannot create subscription: No user found for customerId ${event.data.customerId}`
                );
              }

              await prisma.$transaction(async (tx) => {
                await tx.subscription.create({
                  data: {
                    polarId: event.data.id,
                    userId: userId,
                    customerId: event.data.customerId,
                    status:
                      event.data.status.toUpperCase() as SubscriptionStatus,
                    productId: event.data.productId,
                    planName: event.data.product?.name.toUpperCase(),
                    priceId: event.data.priceId,
                    amount: event.data.price?.priceAmount,
                    currency: event.data.price?.priceCurrency,
                    currentPeriodStart: event.data.currentPeriodStart || null,
                    currentPeriodEnd: event.data.currentPeriodEnd || null,
                  },
                });

                if (event.data.checkoutId) {
                  await tx.checkout.update({
                    where: { polarId: event.data.checkoutId },
                    data: { subscriptionId: event.data.id },
                  });
                }

                await tx.webhookEvent.updateMany({
                  where: {
                    eventType: payload.type,
                    polarId: eventId,
                    processed: false,
                  },
                  data: { processed: true },
                });
              });
            } catch (error) {
              console.error(`Failed to process ${event.type} webhook:`, error);
              await prisma.webhookEvent.updateMany({
                where: {
                  eventType: event.type,
                  polarId: eventId,
                },
                data: {
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                },
              });
            }
          },

          async onSubscriptionUpdated(payload) {
            const validation = validateSubscriptionUpdated(payload);
            if (!validation.success) {
              console.error(
                `Invalid ${payload.type} payload:`,
                validation.error
              );

              await saveWebhookEvent(payload.type, payload.data);
              return;
            }

            const { data: event } = validation;

            const eventId = event.data.id;
            const eventStatus =
              event.data.status.toUpperCase() as SubscriptionStatus;
            console.log(`${event.type}`, eventId, "Status:", eventStatus);
            await saveWebhookEvent(event.type, event, eventId);

            try {
              await prisma.$transaction(async (tx) => {
                await tx.subscription.update({
                  where: { polarId: event.data.id },
                  data: {
                    status: eventStatus,
                    currentPeriodStart: event.data.currentPeriodStart || null,
                    currentPeriodEnd: event.data.currentPeriodEnd || null,
                    cancelAtPeriodEnd: event.data.cancelAtPeriodEnd || false,
                    canceledAt: event.data.canceledAt || null,
                    gracePeriodEndsAt:
                      eventStatus === "PAST_DUE"
                        ? (() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 2);
                            return d;
                          })()
                        : null,
                  },
                });

                await tx.webhookEvent.updateMany({
                  where: {
                    eventType: event.type,
                    polarId: eventId,
                    processed: false,
                  },
                  data: { processed: true },
                });
              });
            } catch (error) {
              console.error(`Failed to process ${event.type} webhook:`, error);
              await prisma.webhookEvent.updateMany({
                where: {
                  eventType: event.type,
                  polarId: eventId,
                },
                data: {
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                },
              });
            }
          },

          async onSubscriptionActive(payload) {
            const validation = validateSubscriptionActive(payload);
            if (!validation.success) {
              console.error(
                `Invalid ${payload.type} payload:`,
                validation.error
              );
              await saveWebhookEvent(payload.type, payload);
              return;
            }

            const { data: event } = validation;
            const eventId = event.data.id;
            console.log(`${event.type}`, eventId);
            await saveWebhookEvent(event.type, event, eventId);

            try {
              await prisma.subscription.update({
                where: { polarId: eventId },
                data: { status: "ACTIVE" },
              });

              await prisma.webhookEvent.updateMany({
                where: {
                  eventType: event.type,
                  polarId: eventId,
                  processed: false,
                },
                data: { processed: true },
              });
            } catch (error) {
              console.error(`Failed to process ${event.type} webhook:`, error);
              await prisma.webhookEvent.updateMany({
                where: {
                  eventType: event.type,
                  polarId: eventId,
                },
                data: {
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                },
              });
            }
          },

          async onSubscriptionRevoked(payload) {
            const validation = validateSubscriptionRevoked(payload);

            if (!validation.success) {
              console.error(
                `Invalid ${payload.type} payload:`,
                validation.error
              );
              await saveWebhookEvent(payload.type, payload);
              return;
            }

            const { data: event } = validation;
            const eventId = event.data.id;
            console.log("Subscription revoked", eventId);
            await saveWebhookEvent(event.type, event, eventId);

            try {
              await prisma.$transaction(async (tx) => {
                await tx.subscription.update({
                  where: { polarId: eventId },
                  data: {
                    status: "CANCELED",
                    canceledAt: new Date(),
                  },
                });

                await tx.webhookEvent.updateMany({
                  where: {
                    eventType: event.type,
                    polarId: event.data.id,
                    processed: false,
                  },
                  data: { processed: true },
                });
              });

              // TODO: Add any business logic for when subscription is revoked
              // - Revoke access to premium features
              // - Send notification email
              // - Update user permissions
            } catch (error) {
              console.error(`Failed to process ${event.type} webhook:`, error);
              await prisma.webhookEvent.updateMany({
                where: {
                  eventType: event.type,
                  polarId: event.data.id,
                },
                data: {
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                },
              });
            }
          },

          async onSubscriptionCanceled(payload) {
            const validation = validateSubscriptionCanceled(payload);
            if (!validation.success) {
              console.error(
                `Invalid ${payload.type} payload:`,
                validation.error
              );
              await saveWebhookEvent(payload.type, payload.data);
              return;
            }

            const { data: event } = validation;
            const eventId = event.data.id;

            console.log(`${event.type}`, eventId);
            await saveWebhookEvent(event.type, event, eventId);

            try {
              const subscription = await prisma.subscription.findUnique({
                where: { polarId: eventId },
                select: { userId: true },
              });

              await prisma.$transaction(async (tx) => {
                await tx.subscription.update({
                  where: { polarId: event.data.id },
                  data: {
                    cancelAtPeriodEnd: true,
                  },
                });

                if (subscription?.userId) {
                  await tx.user.update({
                    where: { id: subscription.userId },
                    data: {
                      meetingsThisMonth: 0,
                      chatMessagesToday: 0,
                    },
                  });
                }

                await tx.webhookEvent.updateMany({
                  where: {
                    eventType: event.type,
                    polarId: eventId,
                    processed: false,
                  },
                  data: { processed: true },
                });
              });
            } catch (error) {
              console.error(`Failed to process ${event.type} webhook: `, error);
              await prisma.webhookEvent.updateMany({
                where: {
                  eventType: event.type,
                  polarId: eventId,
                },
                data: {
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                },
              });
            }
          },
        }),
      ],
    }),
    nextCookies(),
  ],
} satisfies BetterAuthOptions);

export type Session = typeof auth.$Infer.Session;
