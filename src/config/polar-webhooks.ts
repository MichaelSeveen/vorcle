import { z } from "zod";

export const PolarProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.date(),
  modifiedAt: z.date().nullable(),
  recurringInterval: z.string().optional(),
  isRecurring: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  organizationId: z.string().optional(),
  prices: z.array(z.any()).optional(),
  benefits: z.array(z.any()).optional(),
  medias: z.array(z.any()).optional(),
});

export const PolarPriceSchema = z.object({
  id: z.string(),
  priceAmount: z.number(),
  priceCurrency: z.string(),
  createdAt: z.date().optional(),
  modifiedAt: z.date().nullable().optional(),
  amountType: z.string().optional(),
  isArchived: z.boolean().optional(),
  productId: z.string().optional(),
  type: z.string().optional(),
  recurringInterval: z.string().optional(),
});

export const PolarCheckoutDataSchema = z.object({
  id: z.string(),
  status: z.string(),
  productId: z.string(),
  product: PolarProductSchema.optional(),
  productPrice: PolarPriceSchema.optional(),
  productPriceId: z.string().optional(),
  totalAmount: z.int(),
  amount: z.int().optional(),
  netAmount: z.int().optional(),
  discountAmount: z.int().optional(),
  taxAmount: z.int().nullable().optional(),
  currency: z.string(),
  successUrl: z.string().optional(),
  url: z.string().optional(),
  expiresAt: z.date().optional(),
  customerId: z.string().nullable().optional(),
  customerEmail: z.string().nullable().optional(),
  customerName: z.string().nullable().optional(),
  customerIpAddress: z.string().nullable().optional(),
  customerBillingName: z.string().nullable().optional(),
  customerBillingAddress: z.any().nullable().optional(),
  customerTaxId: z.string().nullable().optional(),
  subscriptionId: z.string().nullable().optional(),
  discountId: z.string().nullable().optional(),
  allowDiscountCodes: z.boolean().optional(),
  requireBillingAddress: z.boolean().optional(),
  isDiscountApplicable: z.boolean().optional(),
  isFreeProductPrice: z.boolean().optional(),
  isPaymentRequired: z.boolean().optional(),
  isPaymentSetupRequired: z.boolean().optional(),
  isPaymentFormRequired: z.boolean().optional(),
  isBusinessCustomer: z.boolean().optional(),
  paymentProcessor: z.string().optional(),
  paymentProcessorMetadata: z.any().optional(),
  customerBillingAddressFields: z.any().optional(),
  customFieldData: z.any().optional(),
  metadata: z.any().optional(),
  externalCustomerId: z.string().nullable().optional(),
  customerExternalId: z.string().nullable().optional(),
  products: z.array(z.any()).optional(),
  discount: z.any().nullable().optional(),
  attachedCustomFields: z.array(z.any()).optional(),
  customerMetadata: z.any().optional(),
  clientSecret: z.string().optional(),
  embedOrigin: z.string().nullable().optional(),
  createdAt: z.date(),
  modifiedAt: z.date().nullable(),
});

export const PolarSubscriptionDataSchema = z.object({
  id: z.string(),
  status: z.string(),
  productId: z.string(),
  product: PolarProductSchema.optional(),
  priceId: z.string().optional(),
  price: PolarPriceSchema.optional(),
  customerId: z.string(),
  userId: z.string().optional(),
  currentPeriodStart: z.date().optional(),
  currentPeriodEnd: z.date().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  canceledAt: z.date().nullable().optional(),
  checkoutId: z.string().optional(),
  createdAt: z.date(),
  modifiedAt: z.date().nullable(),
  organizationId: z.string().optional(),
  recurringInterval: z.string().optional(),
  isRecurring: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  startedAt: z.date().nullable().optional(),
  endedAt: z.date().nullable().optional(),
  metadata: z.any().optional(),
});

export const PolarWebhookEventSchema = <T extends z.ZodTypeAny>(
  dataSchema: T
) =>
  z.object({
    type: z.string(),
    data: dataSchema,
  });

export const CheckoutCreatedEventSchema = PolarWebhookEventSchema(
  PolarCheckoutDataSchema
);
export const CheckoutUpdatedEventSchema = PolarWebhookEventSchema(
  PolarCheckoutDataSchema
);
export const SubscriptionCreatedEventSchema = PolarWebhookEventSchema(
  PolarSubscriptionDataSchema
);
export const SubscriptionUpdatedEventSchema = PolarWebhookEventSchema(
  PolarSubscriptionDataSchema
);
export const SubscriptionActiveEventSchema = PolarWebhookEventSchema(
  PolarSubscriptionDataSchema
);
export const SubscriptionRevokedEventSchema = PolarWebhookEventSchema(
  PolarSubscriptionDataSchema
);
export const SubscriptionCanceledEventSchema = PolarWebhookEventSchema(
  PolarSubscriptionDataSchema
);

export type PolarProduct = z.infer<typeof PolarProductSchema>;
export type PolarPrice = z.infer<typeof PolarPriceSchema>;
export type PolarCheckoutData = z.infer<typeof PolarCheckoutDataSchema>;
export type PolarSubscriptionData = z.infer<typeof PolarSubscriptionDataSchema>;

export type CheckoutCreatedEvent = z.infer<typeof CheckoutCreatedEventSchema>;
export type CheckoutUpdatedEvent = z.infer<typeof CheckoutUpdatedEventSchema>;
export type SubscriptionCreatedEvent = z.infer<
  typeof SubscriptionCreatedEventSchema
>;
export type SubscriptionUpdatedEvent = z.infer<
  typeof SubscriptionUpdatedEventSchema
>;
export type SubscriptionActiveEvent = z.infer<
  typeof SubscriptionActiveEventSchema
>;
export type SubscriptionRevokedEvent = z.infer<
  typeof SubscriptionRevokedEventSchema
>;
export type SubscriptionCanceledEvent = z.infer<
  typeof SubscriptionCanceledEventSchema
>;

export function validateWebhookPayload<T>(
  payload: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(payload);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export const validateCheckoutCreated = (payload: unknown) =>
  validateWebhookPayload(payload, CheckoutCreatedEventSchema);

export const validateCheckoutUpdated = (payload: unknown) =>
  validateWebhookPayload(payload, CheckoutUpdatedEventSchema);

export const validateSubscriptionCreated = (payload: unknown) =>
  validateWebhookPayload(payload, SubscriptionCreatedEventSchema);

export const validateSubscriptionUpdated = (payload: unknown) =>
  validateWebhookPayload(payload, SubscriptionUpdatedEventSchema);

export const validateSubscriptionActive = (payload: unknown) =>
  validateWebhookPayload(payload, SubscriptionActiveEventSchema);

export const validateSubscriptionRevoked = (payload: unknown) =>
  validateWebhookPayload(payload, SubscriptionRevokedEventSchema);

export const validateSubscriptionCanceled = (payload: unknown) =>
  validateWebhookPayload(payload, SubscriptionCanceledEventSchema);
