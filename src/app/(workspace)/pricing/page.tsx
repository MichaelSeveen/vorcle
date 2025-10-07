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
    <div className="flex flex-col mx-auto max-w-6xl w-full">
      <h1 className="text-2xl lg:text-4xl font-semibold tracking-tight text-center mt-16 text-pretty">
        Make Every <span className="text-deep-saffron">Meeting</span> Matter
      </h1>
      <h2 className="text-base text-pretty tracking-tight text-center text-muted-foreground">
        Summaries, action items, and valuable insights for every meeting. Never
        miss important details again.
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
