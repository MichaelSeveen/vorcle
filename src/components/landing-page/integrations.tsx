import { cn } from "@/lib/utils";
import {
  AsanaIcon,
  GoogleCalendarIcon,
  JiraIcon,
  SlackIcon,
  TrelloIcon,
} from "../custom-icons";
import { VorcleLogo } from "../custom-icons/brand-logo";
import { ReactNode } from "react";
import { Square, Triangle, XMark, TwoPrisms } from "../custom-icons/landing";

export default function IntegrationSection() {
  return (
    <section>
      <div className="grid grid-cols-[1fr_calc(100%-2rem)_1fr] md:grid-cols-[1fr_min(calc(100%-5rem),calc(1200/16*1rem))_1fr] [&>*]:col-[2] border-b">
        <div className="h-15 md:h-18 lg:h-30 border-x" />
      </div>
      <div className="border-b">
        <div className="grid grid-cols-1 lg:grid-cols-2 border-x w-full max-w-[calc(100%-2rem)] md:max-w-[min(calc(100%-5rem),calc(1200/16*1rem))] mx-auto h-[35rem] lg:h-[40rem]">
          <div className="relative flex flex-col justify-center h-full pl-5 lg:pl-10 border-b lg:border-r lg:border-b-0">
            <h2 className="text-2xl md:text-4xl tracking-tight font-semibold text-pretty max-w-[20rem] md:max-w-[25rem] mb-2">
              Integrate with your favorite tools
            </h2>
            <p className="text-sm md:text-base text-pretty text-muted-foreground max-w-[22rem]">
              Connect seamlessly with popular platforms and services to enhance
              your workflow.
            </p>
          </div>

          <div className="flex flex-col justify-center h-full">
            <div className="bg-muted/50 relative mx-auto size-fit">
              <div
                aria-hidden
                className="bg-radial to-muted dark:to-background absolute inset-0 z-5 from-transparent to-75%"
              />
              <div className="mx-auto mb-2 flex w-fit justify-center gap-2">
                <IntegrationCard>
                  <GoogleCalendarIcon />
                </IntegrationCard>
              </div>
              <div className="mx-auto my-2 flex w-fit justify-center gap-2">
                <IntegrationCard>
                  <SlackIcon />
                </IntegrationCard>
                <IntegrationCard
                  borderClassName="shadow-black-950/10 shadow-xl border-black/25 dark:border-white/25"
                  className="dark:bg-white/10"
                >
                  <VorcleLogo />
                </IntegrationCard>
                <IntegrationCard>
                  <TrelloIcon />
                </IntegrationCard>
              </div>
              <div className="mx-auto flex w-fit justify-center gap-2">
                <IntegrationCard>
                  <AsanaIcon />
                </IntegrationCard>
                <IntegrationCard>
                  <JiraIcon />
                </IntegrationCard>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_calc(100%-2rem)_1fr] md:grid-cols-[1fr_min(calc(100%-5rem),calc(1200/16*1rem))_1fr] [&>*]:col-[2] items-start border-b">
        <div className="h-15 md:h-18 lg:h-30 border-x" />
      </div>
      <div className="grid grid-cols-[1fr_calc(100%-2rem)_1fr] md:grid-cols-[1fr_min(calc(100%-5rem),calc(1200/16*1rem))_1fr] [&>*]:col-[2] border-b min-h-[40rem]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 border-x p-2">
          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(15.625rem,1fr))] gap-2">
            <div className="flex flex-col p-3 border">
              <FeatureCard className="w-fit">
                <Square className="size-8" />
              </FeatureCard>
              <div className="mt-10 md:mt-auto">
                <h2 className="text-xl tracking-tight mb-2">
                  Complete Meeting Exports
                </h2>
                <p className="text-sm text-muted-foreground">
                  Download audio mp3, transcripts, summaries and action items.
                </p>
              </div>
            </div>
            <div className="flex flex-col p-3 border">
              <FeatureCard className="w-fit">
                <XMark className="size-8" />
              </FeatureCard>
              <div className="mt-10 md:mt-auto">
                <h2 className="text-xl tracking-tight mb-2">
                  Full Customization
                </h2>
                <p className="text-sm text-muted-foreground">
                  Customize bot name, image and control bot participation
                </p>
              </div>
            </div>
            <div className="flex flex-col p-3 border">
              <FeatureCard className="w-fit">
                <Triangle className="size-8" />
              </FeatureCard>
              <div className="mt-10 md:mt-auto">
                <h2 className="text-xl tracking-tight mb-2">
                  Meeting Analytics
                </h2>
                <p className="text-sm text-muted-foreground">
                  Track meeting patterns, participation rates and productivity.
                </p>
              </div>
            </div>
            <div className="flex flex-col p-3 border">
              <FeatureCard className="w-fit">
                <TwoPrisms className="size-8" />
              </FeatureCard>
              <div className="mt-10 md:mt-auto">
                <h2 className="text-xl tracking-tight mb-2">Worskspaces</h2>
                <p className="text-sm text-muted-foreground">
                  Organize your meetings into various workspaces.
                </p>
              </div>
            </div>
          </div>
          <div className="max-sm:h-[15rem] pl-4 flex flex-col bg-oceanic-noir md:pb-6 md:pl-8 lg:pb-8">
            <h2 className="text-2xl md:text-4xl tracking-tight font-semibold mt-auto">
              ...and much more{" "}
              <span className="text-deep-saffron">capabilities</span>
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}

const IntegrationCard = ({
  children,
  className,
  borderClassName,
}: {
  children: React.ReactNode;
  className?: string;
  borderClassName?: string;
}) => {
  return (
    <div
      className={cn(
        "bg-background relative flex size-20 rounded-xl dark:bg-transparent",
        className
      )}
    >
      <div
        role="presentation"
        className={cn(
          "absolute inset-0 rounded-xl border border-black/20 dark:border-white/25",
          borderClassName
        )}
      />
      <div className="relative z-20 m-auto size-fit *:size-8">{children}</div>
    </div>
  );
};

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
