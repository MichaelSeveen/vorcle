import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  CheckCircle,
  ArrowRight,
  CreditCard,
  Calendar,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { getCurrentUser } from "@/helpers/user";
import { getCheckoutData } from "@/helpers/subscriptions";
import { segments } from "@/config/segments";
import { cn, formatAmount } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  LABEL_STYLES_BG,
  LABEL_STYLES_MAP,
  mapStatusToLabelAndBg,
} from "@/helpers/label-colour";
import { SubscriptionStatus } from "@prisma/client";

// function getStatusBadgeVariant(
//   status: string
// ): "default" | "secondary" | "destructive" | "outline" {
//   switch (status?.toLowerCase()) {
//     case "active":
//       return "secondary";
//     case "canceled":
//     case "revoked":
//       return "destructive";
//     case "incomplete":
//     case "pending":
//       return "outline";
//     default:
//       return "default";
//   }
// }

async function SuccessContent({
  searchParams,
}: {
  searchParams: Promise<{ checkout_id?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const checkoutId = resolvedSearchParams.checkout_id;

  if (!checkoutId) {
    redirect(segments.home);
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(segments.signIn);
  }

  const data = await getCheckoutData(checkoutId, currentUser.id);

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertCircle className="size-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Processing Payment
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Your payment is being processed. This page will update shortly.
              </p>
            </div>
          </div>

          <Alert>
            <AlertCircle className="size-4" />
            <AlertDescription>
              We&apos;re still processing your checkout. If this page
              doesn&apos;t update in a few minutes, please contact support with
              checkout ID:{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">
                {checkoutId}
              </code>
            </AlertDescription>
          </Alert>

          <div className="flex justify-center">
            <Link
              href={segments.home}
              className={buttonVariants({
                variant: "outline",
              })}
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { checkout, subscription, user } = data;

  const displayData = {
    checkout: {
      id: checkout.polarId,
      status: checkout.status,
      product: checkout.productName || "Unknown Product",
      amount: formatAmount(checkout.amount, checkout.currency),
      currency: checkout.currency?.toUpperCase() || "USD",
    },
    subscription: subscription
      ? {
          id: subscription.polarId,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd
            ? new Date(subscription.currentPeriodEnd).toLocaleDateString(
                "en-US",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }
              )
            : "N/A",
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          canceledAt: subscription.canceledAt,
        }
      : null,
    customer: {
      email: user?.email || "N/A",
      name: user?.name || "N/A",
      id: checkout.customerId || "N/A",
    },
  };

  return (
    <div className="min-h-svh flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto size-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="size-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Payment Successful!</h1>
            <p className="text-lg text-gray-600 mt-2">
              Welcome to {displayData.checkout.product}
            </p>
          </div>
        </div>

        {/* Checkout Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5" />
              {displayData.subscription
                ? "Subscription Details"
                : "Purchase Details"}
            </CardTitle>
            <CardDescription>
              {displayData.subscription
                ? `Your subscription is ${displayData.subscription.status}`
                : `Your purchase is ${displayData.checkout.status}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Product</Label>
                <p className="text-lg font-semibold">
                  {displayData.checkout.product}
                </p>
              </div>
              <div>
                <Label>Amount</Label>
                <p className="text-lg font-semibold">
                  {displayData.checkout.amount}
                  {displayData.subscription && "/month"}
                </p>
              </div>
              {displayData.subscription && (
                <>
                  <div>
                    <Label>Status</Label>
                    <div
                      className={cn(
                        "flex items-center justify-center w-full max-w-[6rem] gap-1 py-1 px-2 rounded-md mt-1 text-sm shadow-xs text-white font-medium border",
                        LABEL_STYLES_MAP[
                          mapStatusToLabelAndBg[
                            displayData.subscription
                              ?.status as SubscriptionStatus
                          ].color
                        ],
                        LABEL_STYLES_BG[
                          mapStatusToLabelAndBg[
                            displayData.subscription
                              ?.status as SubscriptionStatus
                          ].bg
                        ]
                      )}
                    >
                      {
                        mapStatusToLabelAndBg[
                          displayData.subscription?.status as SubscriptionStatus
                        ].name
                      }
                    </div>
                  </div>
                  <div>
                    <Label>Subscription ID</Label>
                    <p className="text-sm font-mono mt-1">
                      {displayData.subscription.id}
                    </p>
                  </div>
                </>
              )}

              <div>
                <Label>Checkout Status</Label>
                <div className="mt-1">
                  <Badge variant="secondary">
                    {displayData.checkout.status.charAt(0).toUpperCase() +
                      displayData.checkout.status.slice(1)}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Checkout ID</Label>
                <p className="text-sm font-mono mt-1">
                  {displayData.checkout.id}
                </p>
              </div>
            </div>

            {displayData.subscription &&
              displayData.subscription.currentPeriodEnd !== "N/A" && (
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="size-4" />
                    <span className="mt-0.5">
                      {displayData.subscription.cancelAtPeriodEnd
                        ? `Access expires: ${displayData.subscription.currentPeriodEnd}`
                        : `Next billing date: ${displayData.subscription.currentPeriodEnd}`}
                    </span>
                  </div>
                  {displayData.subscription.cancelAtPeriodEnd && (
                    <p className="text-sm text-orange-600 mt-2">
                      Your subscription is set to cancel at the end of the
                      current period.
                    </p>
                  )}
                </div>
              )}
          </CardContent>
        </Card>

        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <p>{displayData.customer.email}</p>
                </div>
                {displayData.customer.name !== "N/A" && (
                  <div>
                    <Label>Name</Label>
                    <p>{displayData.customer.name}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Customer ID</Label>
                  <p className="text-sm font-mono text-pretty">
                    {displayData.customer.id}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Checkout ID</Label>
                  <p className="text-sm font-mono text-pretty">{checkoutId}</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="gap-6 border-t">
            <Link
              href={segments.workspace.home}
              className={buttonVariants({
                className: "flex-1",
              })}
            >
              Go to Workspace
              <ArrowRight />
            </Link>

            <Link
              href={segments.home}
              className={buttonVariants({
                variant: "outline",
                className: "flex-1",
              })}
            >
              Return Home
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout_id?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="animate-spin size-8 mx-auto" />
            <p className="mt-2 text-gray-600">
              Loading your purchase details...
            </p>
          </div>
        </div>
      }
    >
      <SuccessContent searchParams={searchParams} />
    </Suspense>
  );
}
