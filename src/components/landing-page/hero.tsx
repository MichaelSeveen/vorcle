import { segments } from "@/config/segments";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative">
      <div className="pt-24 md:pt-36 border-b">
        <div className="mx-auto max-w-2xl md:max-w-5xl lg:max-w-6xl p-6">
          <h1 className="text-2xl md:text-5xl lg:text-5xl max-md:font-semibold tracking-tight w-full md:max-w-[55rem] lg:mx-auto text-center">
            The Meeting Assistant That Actually Reduces Your Meetings
          </h1>
          <p className="mt-6 mb-8 text-sm lg:text-base text-pretty text-muted-foreground text-center">
            Precise summaries, key takeaways and useful insights into all your
            team conversations.
          </p>
          <div className="flex flex-col md:flex-row items-center gap-6 justify-center">
            <Link
              aria-label="go to log in page"
              href={segments.signIn}
              className="w-fit px-8 py-3 inline-flex items-center justify-center text-sm font-semibold bg-deep-saffron text-muted"
            >
              Start for free
            </Link>
            <Link
              href="#"
              className="w-fit px-8 py-3 inline-flex items-center justify-center gap-2 text-sm font-semibold bg-transparent border"
            >
              Request a Demo
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        <div className="mask-b-from-55% relative mt-8 overflow-hidden px-4 sm:mt-16 md:mt-20 ">
          <div className="inset-shadow-2xs -mr-56 ring-background dark:inset-shadow-white/20 bg-background relative rounded-lg md:mx-auto max-w-2xl sm:max-w-4xl lg:max-w-6xl border p-2 shadow-lg shadow-zinc-950/15 ring-1">
            <Image
              alt="App screenshot"
              src="/images/landing-summary.webp"
              width="1912"
              height="953"
              priority
              className="z-2 border-border/25 aspect-15/8 relative rounded-md border"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
