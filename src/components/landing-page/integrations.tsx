import { cn } from "@/lib/utils";
import {
	AsanaIcon,
	GoogleCalendarIcon,
	JiraIcon,
	SlackIcon,
	TrelloIcon,
} from "../custom-icons";
import { VorcleLogo } from "../custom-icons/brand-logo";
import { Square, Triangle, TwoPrisms, XMark } from "../custom-icons/landing";
import CardDecorator from "./card-decorator";

export default function IntegrationSection() {
	return (
		<section className="pt-15 md:pt-18 lg:pt-30">
			<div className="border-y">
				<div className="grid grid-cols-1 lg:grid-cols-2 w-full max-w-[calc(100%-2rem)] md:max-w-[min(calc(100%-5rem),calc(1200/16*1rem))] h-[35rem] lg:h-[40rem] mx-auto border-x">
					<div className="relative flex flex-col gap-2 justify-center h-full lg:pl-10 border-b lg:border-r lg:border-b-0 items-center lg:items-start">
						<h2 className="text-2xl md:text-4xl lg:text-5xl tracking-tight font-semibold">
							Integrate with your favorite tools
						</h2>
						<p className="text-sm md:text-base text-center lg:text-start text-pretty text-muted w-full max-w-sm px-4 md:px-0">
							Connect seamlessly with popular platforms and services to enhance
							your workflow.
						</p>
					</div>

					{/* Integrations Cloud */}
					<div className="flex flex-col justify-center h-full">
						<div className="relative mx-auto w-fit">
							<div
								aria-hidden
								role="presentation"
								className="bg-radial to-white-chalk absolute inset-0 z-5 from-transparent to-75%"
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
									<VorcleLogo svgColor="black" />
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

			<div className="py-15 md:py-18 lg:py-30">
				<div className="grid grid-cols-[1fr_calc(100%-2rem)_1fr] md:grid-cols-[1fr_min(calc(100%-5rem),calc(1200/16*1rem))_1fr] [&>*]:col-[2] min-h-[70rem] lg:min-h-[40rem]">
					<div className="grid grid-cols-1 lg:grid-cols-4 auto-rows-fr lg:auto-rows-auto gap-4 h-full">
						<div className="lg:col-span-2 flex flex-col p-3 bg-vivid-deep-blue text-white">
							<CardDecorator className="w-fit">
								<Square className="size-10" />
							</CardDecorator>
							<div className="mt-auto">
								<h2 className="text-xl tracking-tight mb-2">
									Complete Meeting Exports
								</h2>
								<p className="text-sm">
									Download audio mp3, transcripts, summaries and action items.
								</p>
							</div>
						</div>
						<div className="lg:col-span-2 flex flex-col p-3 bg-vivid-sky-blue text-white">
							<CardDecorator className="w-fit">
								<XMark className="size-10" />
							</CardDecorator>
							<div className="mt-auto">
								<h2 className="text-xl tracking-tight mb-2">
									Full Customization
								</h2>
								<p className="text-sm">
									Customize bot name, image and control bot participation
								</p>
							</div>
						</div>
						<div className="lg:col-span-1 flex flex-col p-3 bg-deep-blue text-white">
							<CardDecorator className="w-fit">
								<Triangle className="size-10" />
							</CardDecorator>
							<div className="mt-auto">
								<h2 className="text-xl tracking-tight mb-2">
									Meeting Analytics
								</h2>
								<p className="text-sm">
									Track meeting patterns, participation rates and productivity.
								</p>
							</div>
						</div>
						<div className="lg:col-span-1 flex flex-col p-3 bg-vivid-deep-blue text-white">
							<CardDecorator className="w-fit">
								<TwoPrisms className="size-10" />
							</CardDecorator>
							<div className="mt-auto">
								<h2 className="text-xl tracking-tight mb-2">Worskspaces</h2>
								<p className="text-sm">
									Organize your meetings into various workspaces.
								</p>
							</div>
						</div>
						<div className="lg:col-span-2 flex flex-col p-6 bg-vivid-sky-blue">
							<h2 className="text-xl md:text-3xl lg:text-4xl text-white tracking-tight font-semibold mt-auto">
								...and much more <span className="">capabilities</span>
							</h2>
						</div>
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
				className,
			)}
		>
			<div
				role="presentation"
				className={cn(
					"absolute inset-0 rounded-xl border border-black/20 dark:border-white/25",
					borderClassName,
				)}
			/>
			<div className="relative z-20 m-auto size-fit *:size-8">{children}</div>
		</div>
	);
};
