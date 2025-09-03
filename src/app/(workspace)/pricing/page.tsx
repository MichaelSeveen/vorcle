import { segments } from "@/config/segments";
import { getCurrentUser } from "@/helpers/user";
import { redirect } from "next/navigation";
import React from "react";
import WorkspacePricingView from "./_components";
import { TIERS } from "@/config/types";
import { hasActiveSubscription } from "@/helpers/subscriptions";

export default async function WorkspacePricingPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(segments.signIn);
  }

  const activeSubscription = await hasActiveSubscription(currentUser.id);

  return (
    <div className="mx-auto max-w-5xl min-h-svh w-full">
      <h1 className="text-3xl font-semibold tracking-tight text-center mt-16">
        Make Every Meeting Matter
      </h1>
      <h2 className="text-lg text-pretty tracking-tight text-center">
        Flexible plans that fit your team&apos;s needs. Upgrade to get unlimited
        transcripts and summaries
      </h2>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIERS.map((plan) => {
          const isActivePlan = activeSubscription?.productId === plan.productId;

          return (
            <WorkspacePricingView
              key={plan.id}
              planData={plan}
              isActivePlan={isActivePlan}
            />
          );
        })}
      </div>
    </div>
  );
}
