import React from "react";
import { cn } from "@/lib/utils";

function PricingCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-card relative w-full max-w-lg rounded-lg dark:bg-transparent",
        "p-1.5 shadow-xl backdrop-blur-xl",
        "dark:border-border/80 border",
        className
      )}
      {...props}
    />
  );
}

function PricingCardHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-muted/80 dark:bg-muted/50 relative mb-4 rounded-md border p-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function PricingCardPlan({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mb-8 flex items-center justify-between", className)}
      {...props}
    />
  );
}

function PricingCardDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-muted-foreground text-sm text-pretty", className)}
      {...props}
    />
  );
}

function PricingCardPlanName({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-muted-foreground flex items-center gap-2 text-sm font-medium [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  );
}

function PricingCardPrice({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("mb-3 flex items-end gap-1", className)} {...props} />
  );
}

function PricingCardPriceItem({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <span
      className={cn("text-2xl font-semibold tabular-nums", className)}
      {...props}
    />
  );
}

function PricingCardPeriod({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("text-foreground/80 pb-1 text-sm", className)}
      {...props}
    />
  );
}

function PricingCardBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6 p-3", className)} {...props} />
  );
}

function PricingCardList({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul className={cn("flex flex-col gap-3", className)} {...props} />;
}

function PricingCardListItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      className={cn(
        "text-muted-foreground inline-flex items-start gap-3 text-sm shrink-0 [&_svg]:shrink-0 [&_svg]:size-4 text-pretty",
        className
      )}
      {...props}
    />
  );
}

function PricingCardSeparator({
  children = "Upgrade to access",
  className,
  ...props
}: React.ComponentProps<"div"> & {
  children?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-muted-foreground flex items-center gap-3 text-sm",
        className
      )}
      {...props}
    >
      <span className="bg-muted-foreground/40 h-[1px] flex-1" />
      <span className="text-muted-foreground shrink-0">{children}</span>
      <span className="bg-muted-foreground/40 h-[1px] flex-1" />
    </div>
  );
}

export {
  PricingCard,
  PricingCardHeader,
  PricingCardDescription,
  PricingCardPlan,
  PricingCardPlanName,
  PricingCardPrice,
  PricingCardPriceItem,
  PricingCardPeriod,
  PricingCardBody,
  PricingCardList,
  PricingCardListItem,
  PricingCardSeparator,
};
