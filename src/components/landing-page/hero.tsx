import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { segments } from "@/config/segments";

export default function HeroSection() {
	return (
		<section className="relative">
			<div className="pt-24 md:pt-36 lg:pt-48 border-b">
				<div className="mx-auto max-w-2xl md:max-w-5xl lg:max-w-6xl p-6">
					<h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight w-full md:max-w-[55rem] lg:mx-auto text-center">
						The Meeting Assistant That Actually Reduces Your Meetings
					</h1>
					<p className="mt-6 mb-8 text-sm lg:text-base text-pretty text-foreground text-center">
						Precise summaries, key takeaways and useful insights into all your
						team conversations.
					</p>
					<div className="flex flex-col md:flex-row items-center gap-6 justify-center">
						<Link
							aria-label="go to log in page"
							href={segments.signIn}
							className="w-fit px-6 py-3 grid place-content-center text-lg font-medium bg-vivid-deep-blue text-white"
						>
							Start for free
						</Link>
						<Link
							href="#"
							className="w-fit px-6 py-3 inline-flex items-center justify-center gap-2 text-lg font-medium border"
						>
							Request a Demo
							<HugeiconsIcon icon={ArrowRight02Icon} />
						</Link>
					</div>
				</div>

				<div className="relative mt-8 overflow-hidden px-4 sm:mt-16 md:mt-20 pt-2 pb-8">
					<div className="inset-shadow-2xs -mr-56 ring-white/20 bg-white relative rounded-lg md:mx-auto max-w-2xl sm:max-w-4xl lg:max-w-6xl border p-2 shadow-lg ring-1">
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
