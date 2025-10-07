import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  SquareCircle,
  SixCubes,
  Prism,
  TwoPrisms,
  ThreeCubes,
} from "../custom-icons/landing";

export default function FeaturesSection() {
  return (
    <section>
      <div className="relative border-b">
        <div className="pt-15 md:pt-20 lg:pt-30 pb-10 flex flex-col gap-4 lg:gap-6 items-center border-x w-full max-w-[calc(100%-2rem)] md:max-w-[min(calc(100%-5rem),calc(1200/16*1rem))] mx-auto">
          <h2 className="text-2xl md:text-4xl lg:text-5xl tracking-tight font-semibold text-center text-pretty max-w-[20rem] md:max-w-[31.25rem]">
            Smarter meetings that saves you time
          </h2>
          <p className="text-sm md:text-base text-center text-pretty text-muted-foreground max-w-[22rem] md:max-w-[26rem]">
            With summaries, integrations, and next steps captured and organized
            for you without extra effort.
          </p>
        </div>
      </div>

      <div className="relative grid grid-cols-[1fr_calc(100%-2rem)_1fr] md:grid-cols-[1fr_min(calc(100%-5rem),calc(1200/16*1rem))_1fr] [&>*]:col-[2] border-b">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start border-x">
          {/* Summaries */}
          <div className="p-4 aspect-[10/9] md:aspect-[15/5] lg:aspect-[10/8] flex flex-col bg-oceanic-noir shadow-[0_0.5px_0_0_var(--border)] md:shadow-[0.5px_0_0_0_var(--border)]">
            <div className="flex items-center gap-3">
              <FeatureCard>
                <SquareCircle className="size-8" />
              </FeatureCard>
              <h3 className="text-2xl tracking-tight">Meeting Summaries</h3>
            </div>
            <div className="mt-auto border-t pt-3">
              <div className="flex gap-3">
                <div className="h-10 w-1.5 bg-nocturnal" />

                <p className="text-sm lg:text-base text-muted-foreground text-pretty max-w-[20rem]">
                  Automatic meeting summaries and action items after each
                  meeting.
                </p>
              </div>
            </div>
          </div>
          {/* Calendar Integration */}
          <div className="p-4 aspect-[10/9] md:aspect-[15/5] lg:aspect-[10/8] flex flex-col bg-oceanic-noir shadow-[0_-0.5px_0_0_var(--border)] md:shadow-[-0.5px_0_0_0_var(--border)]">
            <div className="flex items-center gap-3">
              <FeatureCard>
                <SixCubes className="size-8" />
              </FeatureCard>
              <h3 className="text-2xl tracking-tight">Calendar Integrations</h3>
            </div>
            <div className="mt-auto border-t pt-3">
              <div className="flex gap-3">
                <div className="h-10 w-1.5 bg-nocturnal" />

                <p className="text-sm lg:text-base text-muted-foreground text-pretty max-w-[20rem]">
                  Connect your google calendar and vorcle can auto-join your
                  meetings on your behalf.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_calc(100%-2rem)_1fr] md:grid-cols-[1fr_min(calc(100%-5rem),calc(1200/16*1rem))_1fr] [&>*]:col-[2] border-b">
        <div className="h-6 border-x" />
      </div>

      <div className="relative grid grid-cols-[1fr_calc(100%-2rem)_1fr] md:grid-cols-[1fr_min(calc(100%-5rem),calc(1200/16*1rem))_1fr] [&>*]:col-[2] border-b">
        <div className="flex flex-col lg:flex-row gap-6 border-x">
          {/* Email Reports */}
          <div className="p-4 flex-1 aspect-[10/9] md:aspect-[15/5] lg:aspect-[10/9] flex flex-col bg-oceanic-noir shadow-[0_0.5px_0_0_var(--border)] md:shadow-[0.5px_0_0_0_var(--border)]">
            <div className="flex items-center gap-3">
              <FeatureCard>
                <Prism className="size-8" />
              </FeatureCard>
              <h3 className="text-2xl tracking-tight">
                Automated Email Reports
              </h3>
            </div>
            <div className="mt-auto border-t pt-3">
              <div className="flex gap-3">
                <div className="h-10 w-1.5 bg-nocturnal" />

                <p className="text-sm lg:text-base text-muted-foreground text-pretty max-w-[20rem]">
                  Receive timely emails after each meeting with all the
                  important details discussed.
                </p>
              </div>
            </div>
          </div>
          {/* Ask Your Meeting*/}
          <div className="p-4 flex-1 aspect-[10/9] md:aspect-[15/5] lg:aspect-[10/9] flex flex-col bg-oceanic-noir max-md:shadow-[0_0.5px_0_0_var(--border),0_-0.5px_0_0_var(--border)] lg:shadow-[0.5px_0_0_0_var(--border),-0.5px_0_0_0_var(--border)]">
            <div className="flex items-center gap-3">
              <FeatureCard>
                <TwoPrisms className="size-8" />
              </FeatureCard>
              <h3 className="text-2xl tracking-tight">Ask Your Meetings</h3>
            </div>
            <div className="mt-auto border-t pt-3">
              <div className="flex gap-3">
                <div className="h-10 w-1.5 bg-nocturnal" />

                <p className="text-sm lg:text-base text-muted-foreground text-pretty max-w-[20rem]">
                  Ask questions about meetings and get quality and insightful
                  answers instantly.
                </p>
              </div>
            </div>
          </div>
          {/* One-click Integrations */}
          <div className="p-4 flex-1 aspect-[10/9] md:aspect-[15/5] lg:aspect-[10/9] flex flex-col bg-oceanic-noir shadow-[0_-0.5px_0_0_var(--border)] md:shadow-[-0.5px_0_0_0_var(--border)]">
            <div className="flex items-center gap-3">
              <FeatureCard>
                <ThreeCubes className="size-8" />
              </FeatureCard>
              <h3 className="text-2xl tracking-tight">
                One-click Integrations
              </h3>
            </div>
            <div className="mt-auto border-t pt-3">
              <div className="flex gap-3">
                <div className="h-10 w-1.5 bg-nocturnal" />

                <p className="text-sm lg:text-base text-muted-foreground text-pretty max-w-[20rem]">
                  Push action items to your favorite tools e.g Slack, Asana,
                  Trello etc.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  children: ReactNode;
  className?: string;
}

function FeatureCard({ children, className }: FeatureCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-none shadow-zinc-950/5 p-1",
        className
      )}
    >
      <CardDecorator />
      {children}
    </div>
  );
}

const CardDecorator = () => (
  <>
    <span className="border-deep-saffron absolute -left-px -top-px block size-1 border-l-1 border-t-1" />
    <span className="border-deep-saffron absolute -right-px -top-px block size-1 border-r-1 border-t-1" />
    <span className="border-deep-saffron absolute -bottom-px -left-px block size-1 border-b-1 border-l-1" />
    <span className="border-deep-saffron absolute -bottom-px -right-px block size-1 border-b-1 border-r-1" />
  </>
);
