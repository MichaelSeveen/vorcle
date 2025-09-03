"use client";

import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import {
  PricingCard,
  PricingCardBody,
  PricingCardDescription,
  PricingCardHeader,
  PricingCardList,
  PricingCardListItem,
  PricingCardPeriod,
  PricingCardPlan,
  PricingCardPlanName,
  PricingCardPrice,
  PricingCardPriceItem,
} from "./pricing-card";
import { Plan } from "@/config/types";
import { Pill, PillIndicator } from "@/components/ui/pill";
import { checkout, customer } from "@/lib/auth-client";

interface WorkspacePricingViewProps {
  planData: Plan;
  isActivePlan?: boolean;
}

export default function WorkspacePricingView({
  planData,
  isActivePlan,
}: WorkspacePricingViewProps) {
  const [transition, startTransition] = useTransition();
  const [isPortalLoading, startPortalTransition] = useTransition();

  function handleCheckout(slug: string, productId: string) {
    startTransition(async () => {
      await checkout({
        products: [productId],
        slug,
      });
    });
  }

  function handleManageSubscription() {
    startPortalTransition(async () => {
      await customer.portal();
    });
  }

  return (
    <PricingCard className={cn(planData.highlight && "ring-1 ring-orange-600")}>
      <PricingCardHeader>
        <PricingCardPlan>
          <PricingCardPlanName>{planData.name}</PricingCardPlanName>

          {isActivePlan ? (
            <Pill>
              <PillIndicator pulse variant="success" />
              Active
            </Pill>
          ) : null}
        </PricingCardPlan>
        <PricingCardDescription>{planData.description}</PricingCardDescription>
        <PricingCardPrice>
          <PricingCardPriceItem>${planData.priceMonthly}</PricingCardPriceItem>
          <PricingCardPeriod>/ month</PricingCardPeriod>
        </PricingCardPrice>

        {isActivePlan ? (
          <Button
            disabled={isPortalLoading}
            className="w-full cursor-pointer"
            onClick={handleManageSubscription}
          >
            Manage Subscription
          </Button>
        ) : (
          <Button
            disabled={transition}
            className={cn(
              "w-full cursor-pointer",
              planData.highlight &&
                "bg-gradient-to-b from-orange-500 to-orange-600 shadow-[0_10px_25px_rgba(255,115,0,0.3)]"
            )}
            onClick={() => handleCheckout(planData.slug, planData.productId)}
          >
            Get Started
          </Button>
        )}
      </PricingCardHeader>
      <PricingCardBody>
        <PricingCardList>
          {planData.features.map((item) => (
            <PricingCardListItem key={item}>
              <Check className="size-4 text-green-500" aria-hidden="true" />

              <span>{item}</span>
            </PricingCardListItem>
          ))}
        </PricingCardList>
      </PricingCardBody>
    </PricingCard>
  );
}
