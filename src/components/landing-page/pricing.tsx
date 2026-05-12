import { Button } from "@heroui/react";
import { ArrowRightBigIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	PricingCard,
	PricingCardGraphicalHeader,
	PricingCardHeaderDescription,
	PricingCardHeaderPeriod,
	PricingCardHeaderPlanName,
	PricingCardHeaderPriceContainer,
	PricingCardHeaderPriceItem,
	PricingCardList,
	PricingCardListItem,
} from "@/components/pricing/pricing-card";
import { type Plan, TIERS } from "@/config/types";
import { cn } from "@/lib/utils";

const VARIANT_MAP: Record<string, "blue" | "gold" | "purple"> = {
	pro: "blue",
	business: "gold",
	enterprise: "purple",
};

function FeatureIcon() {
	return (
		<HugeiconsIcon
			icon={ArrowRightBigIcon}
			size={16}
			className="shrink-0 text-muted"
			aria-hidden="true"
		/>
	);
}

function TierCard({ plan }: { plan: Plan }) {
	const variant = VARIANT_MAP[plan.slug] ?? "blue";

	return (
		<PricingCard variant={variant}>
			<PricingCardGraphicalHeader>
				<div className="pt-4">
					<PricingCardHeaderPlanName>{plan.name}</PricingCardHeaderPlanName>
					<PricingCardHeaderDescription>
						{plan.description}
					</PricingCardHeaderDescription>

					<PricingCardHeaderPriceContainer>
						<PricingCardHeaderPriceItem>
							${plan.priceMonthly}
						</PricingCardHeaderPriceItem>
					</PricingCardHeaderPriceContainer>

					<PricingCardHeaderPeriod>/ month</PricingCardHeaderPeriod>

					<Button
						// as={Link}
						// href={segments.signIn}
						size="sm"
						className={cn(
							"mt-3 min-h-8 w-full transition-opacity duration-[180ms] ease-out hover:opacity-90 text-white",
							plan.highlight ? "bg-vivid-deep-blue" : "bg-black",
						)}
					>
						Start with {plan.name}
					</Button>
				</div>
			</PricingCardGraphicalHeader>

			<PricingCardList>
				{plan.features.map((feature) => (
					<PricingCardListItem key={feature} icon={<FeatureIcon />}>
						{feature}
					</PricingCardListItem>
				))}
			</PricingCardList>
		</PricingCard>
	);
}

export default function PricingSection() {
	return (
		<section
			id="pricing"
			className="border-t"
			aria-labelledby="homepage-pricing-heading"
		>
			<div className="mx-auto w-full max-w-[calc(100%-2rem)] md:max-w-[min(calc(100%-5rem),calc(1200/16*1rem))] py-16 lg:py-24">
				<div className="mx-auto max-w-md text-center">
					<h2
						id="homepage-pricing-heading"
						className="text-2xl font-semibold tracking-tight md:text-4xl"
					>
						Pricing that scales with your meeting load
					</h2>
					<p className="mt-3 text-pretty text-sm text-muted md:text-base">
						Start with the plan that matches your workflow. Upgrade when you
						need more meetings, chat messages, or support.
					</p>
				</div>

				<div className="mt-10 flex flex-wrap items-start justify-center gap-4">
					{TIERS.map((plan) => (
						<div
							key={plan.id}
							className="w-full md:w-[calc(50%-0.5rem)] lg:w-auto"
						>
							<TierCard plan={plan} />
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
