"use client";

import { Button, Card, Chip, Label, ProgressBar } from "@heroui/react";
import { ArrowRightBigIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import { PLAN_LIMITS, type Plan, TIERS } from "@/config/types";
import type { SubscriptionPlan, SubscriptionStatus } from "@/db/schema";
import { checkout, customer } from "@/lib/auth-client";

interface BillingUsageSnapshot {
	effectivePlan: SubscriptionPlan;
	effectiveStatus: SubscriptionStatus;
	meetingsUsed: number;
	chatMessagesUsed: number;
	usagePeriodStart: string | null;
	usagePeriodEnd: string | null;
	nextResetDate: string | null;
	nextPaymentDate: string | null;
	cycleAnchor: "billing_cycle" | "calendar_month";
}

interface BillingSubscriptionSnapshot {
	status: SubscriptionStatus;
	planName: string;
	productId: string | null;
	currentPeriodStart: string | null;
	currentPeriodEnd: string | null;
	cancelAtPeriodEnd: boolean | null;
	currency: string | null;
	amount: number | null;
	recurringInterval: string | null;
}

interface SubscriptionSettingsProps {
	usage: BillingUsageSnapshot;
	subscription: BillingSubscriptionSnapshot | null;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
	month: "short",
	day: "numeric",
	year: "numeric",
});

function formatDate(value: string | null) {
	if (!value) return "Not available";

	return dateFormatter.format(new Date(value));
}

function formatLimit(value: number) {
	return value === -1 ? "Unlimited" : value.toLocaleString();
}

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function formatMoney(amount: number | null, currency: string | null) {
	if (amount === null || amount === undefined) return null;

	const code = currency?.toUpperCase() || "USD";
	let fmt = currencyFormatters.get(code);
	if (!fmt) {
		fmt = new Intl.NumberFormat(undefined, {
			style: "currency",
			currency: code,
		});
		currencyFormatters.set(code, fmt);
	}

	return fmt.format(amount / 100);
}

function formatUsage(used: number, limit: number) {
	return `${used.toLocaleString()} / ${formatLimit(limit)}`;
}

function getProgressValue(used: number, limit: number) {
	return limit === -1 ? 100 : Math.min((used / limit) * 100, 100);
}

function getStatusColor(
	status: SubscriptionStatus,
): "default" | "success" | "warning" | "danger" {
	switch (status) {
		case "ACTIVE":
			return "success";
		case "PAST_DUE":
		case "UNPAID":
			return "warning";
		case "CANCELED":
			return "danger";
		default:
			return "default";
	}
}

function getPlanDescription(plan: SubscriptionPlan) {
	switch (plan) {
		case "FREE":
			return "Starter usage for trying Vorcle with no paid subscription.";
		case "PRO":
			return "A focused plan for individual meeting workflows.";
		case "BUSINESS":
			return "More room for frequent meeting capture and chat.";
		case "ENTERPRISE":
			return "Unlimited usage for teams that need the most headroom.";
		default:
			return "Your current Vorcle access level.";
	}
}

function resolveButtonLabel(plan: Plan, currentPlan: SubscriptionPlan) {
	if (currentPlan === plan.name) {
		return "Manage current plan";
	}

	if (currentPlan === "FREE") {
		return `Upgrade to ${plan.name}`;
	}

	return `Switch to ${plan.name}`;
}

export default function SubscriptionSettings({
	usage,
	subscription,
}: SubscriptionSettingsProps) {
	const [checkoutPending, startCheckoutTransition] = useTransition();
	const [portalPending, startPortalTransition] = useTransition();

	const limits = PLAN_LIMITS[usage.effectivePlan] ?? PLAN_LIMITS.FREE;
	const currentPaidPlan = useMemo(
		() => TIERS.find((plan) => plan.name === usage.effectivePlan),
		[usage.effectivePlan],
	);
	const subscriptionPrice = formatMoney(
		subscription?.amount ?? null,
		subscription?.currency ?? null,
	);
	const priceLabel = subscriptionPrice
		? `${subscriptionPrice} / ${subscription?.recurringInterval ?? "month"}`
		: currentPaidPlan
			? `$${currentPaidPlan.priceMonthly} / month`
			: "$0 / month";

	function handleCheckout(plan: Plan) {
		if (!plan.productId) {
			toast.error("This plan is not configured yet.");
			return;
		}

		startCheckoutTransition(async () => {
			await checkout({
				products: [plan.productId],
				slug: plan.slug,
			});
		});
	}

	function handleManageSubscription() {
		if (!subscription) {
			toast.error("No paid subscription is available to manage yet.");
			return;
		}

		startPortalTransition(async () => {
			await customer.portal();
		});
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
					Settings
				</h1>
				<p className="mt-1 text-sm text-foreground">
					Manage your subscription, usage, and account settings.
				</p>
			</div>

			<section
				id="subscription"
				className="space-y-4"
				aria-labelledby="subscription-heading"
			>
				<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h2 id="subscription-heading" className="text-xl font-semibold">
							Payments and subscription
						</h2>
						<p className="text-sm text-foreground">
							Review your plan, usage, billing window, and payment controls.
						</p>
					</div>
				</div>

				<div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
					<Card>
						<Card.Header>
							<div className="flex w-full flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
								<div>
									<Card.Title className="flex items-center gap-2">
										Current plan
										<Chip
											color={getStatusColor(usage.effectiveStatus)}
											size="sm"
											variant="soft"
										>
											<Chip.Label>{usage.effectiveStatus}</Chip.Label>
										</Chip>
									</Card.Title>
									<Card.Description>
										{getPlanDescription(usage.effectivePlan)}
									</Card.Description>
								</div>
								<div className="text-left sm:text-right">
									<p className="text-3xl font-semibold">
										{usage.effectivePlan}
									</p>
									<p className="text-sm text-foreground">{priceLabel}</p>
								</div>
							</div>
						</Card.Header>
						<Card.Content className="grid gap-3 text-sm sm:grid-cols-2">
							<div>
								<Label>Next usage reset</Label>
								<p className="font-medium">{formatDate(usage.nextResetDate)}</p>
							</div>
							<div>
								<Label>Polar plan</Label>
								<p className="font-medium">
									{subscription?.planName || usage.effectivePlan}
								</p>
							</div>
							<div>
								<Label>Current period</Label>
								<p className="font-medium">
									{formatDate(
										subscription?.currentPeriodStart ?? usage.usagePeriodStart,
									)}
									{" - "}
									{formatDate(
										subscription?.currentPeriodEnd ?? usage.usagePeriodEnd,
									)}
								</p>
							</div>
							<div>
								<Label>Renewal</Label>
								<p className="font-medium">
									{subscription?.cancelAtPeriodEnd
										? "Cancels at period end"
										: formatDate(
												subscription?.currentPeriodEnd ?? usage.nextPaymentDate,
											)}
								</p>
							</div>
						</Card.Content>
					</Card>

					<Card>
						<Card.Header>
							<Card.Title>Usage this cycle</Card.Title>
							<Card.Description>
								Your plan limits reset with the billing or calendar window.
							</Card.Description>
						</Card.Header>
						<Card.Content className="space-y-5">
							<div className="space-y-2">
								<div className="flex items-center justify-between text-sm">
									<span className="font-medium">Meetings</span>
									<span className="text-foreground">
										{formatUsage(usage.meetingsUsed, limits.meetings)}
									</span>
								</div>
								<ProgressBar
									aria-label="Meeting usage this cycle"
									value={getProgressValue(usage.meetingsUsed, limits.meetings)}
								>
									<ProgressBar.Track>
										<ProgressBar.Fill />
									</ProgressBar.Track>
								</ProgressBar>
							</div>

							<div className="space-y-2">
								<div className="flex items-center justify-between text-sm">
									<span className="font-medium">AI chat messages</span>
									<span className="text-foreground">
										{formatUsage(usage.chatMessagesUsed, limits.chatMessages)}
									</span>
								</div>
								<ProgressBar
									aria-label="AI chat message usage this cycle"
									value={getProgressValue(
										usage.chatMessagesUsed,
										limits.chatMessages,
									)}
								>
									<ProgressBar.Track>
										<ProgressBar.Fill />
									</ProgressBar.Track>
								</ProgressBar>
							</div>
						</Card.Content>
					</Card>
				</div>

				<div className="grid gap-4 md:grid-cols-3">
					{TIERS.map((plan) => {
						const isCurrentPlan = usage.effectivePlan === plan.name;

						return (
							<Card key={plan.id} className="flex flex-col">
								<Card.Header>
									<div className="flex items-center justify-between gap-3">
										<Card.Title>{plan.name}</Card.Title>
										{isCurrentPlan ? (
											<Chip color="success" size="sm" variant="soft">
												<Chip.Label>Current</Chip.Label>
											</Chip>
										) : null}
									</div>
									<Card.Description>{plan.description}</Card.Description>
									<div className="pt-2">
										<span className="text-2xl font-semibold">
											${plan.priceMonthly}
										</span>
										<span className="text-sm text-foreground">
											{" "}
											/ month
										</span>
									</div>
								</Card.Header>
								<Card.Content className="flex flex-1 flex-col gap-4">
									<ul className="space-y-2">
										{plan.features.map((feature) => (
											<li
												key={feature}
												className="flex items-start gap-2 text-sm text-foreground"
											>
												<HugeiconsIcon
													icon={ArrowRightBigIcon}
													size={16}
													aria-hidden="true"
													className="mt-0.5 shrink-0 text-foreground/30"
												/>
												<span>{feature}</span>
											</li>
										))}
									</ul>
								</Card.Content>
								<Card.Footer>
									<Button
										fullWidth
										isDisabled={
											checkoutPending ||
											portalPending ||
											(!isCurrentPlan && !plan.productId)
										}
										onPress={
											isCurrentPlan
												? handleManageSubscription
												: () => handleCheckout(plan)
										}
										variant={isCurrentPlan ? "outline" : undefined}
									>
										{resolveButtonLabel(plan, usage.effectivePlan)}
									</Button>
								</Card.Footer>
							</Card>
						);
					})}
				</div>
			</section>
		</div>
	);
}
