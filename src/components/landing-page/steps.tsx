import Image from "next/image";
import { cn } from "@/lib/utils";
import { LayerOne, LayerThree, LayerTwo } from "../custom-icons/landing";

const STEPS = [
	{
		step: "01",
		icon: LayerOne,
		title: "Connect Calendar",
		description:
			"Link your Google and we will automatically detect your meetings",
		bg: "bg-deep-blue",
	},
	{
		step: "02",
		icon: LayerTwo,
		title: "Vorcle Joins Meeting",
		description:
			"Our AI bot joins your meeting and captures key conversation points with full transcription.",
		bg: "bg-vivid-deep-blue",
	},
	{
		step: "03",
		icon: LayerThree,
		title: "Get Insights",
		description:
			"Receive summaries, transcripts, action items and push them to your favourite tools instantly.",
		bg: "bg-vivid-sky-blue",
	},
];

export default function StepsSection() {
	return (
		<section>
			<div className="relative grid grid-cols-[1fr_calc(100%-2rem)_1fr] md:grid-cols-[1fr_min(calc(100%-5rem),calc(1200/16*1rem))_1fr] [&>*]:col-[2]">
				<div className="flex flex-col justify-center items-center py-15 md:py-18 lg:py-30 gap-4 text-center">
					<h2 className="text-2xl md:text-4xl lg:text-5xl tracking-tight font-semibold w-full max-w-md lg:max-w-xl text-pretty">
						The meeting is over. Your insights are just beginning.
					</h2>
					<p className="text-sm md:text-base text-pretty text-muted w-full max-w-md">
						Connect your calendar, we&apos;ll handle the rest. Your key
						conversation points, captured and organized automatically.
					</p>
				</div>
			</div>

			{/* Steps */}
			<div className="h-[50rem] lg:h-[25rem]">
				<div className="grid grid-cols-1 lg:grid-cols-3 h-full">
					{STEPS.map(({ icon: Icon, step, title, description, bg }) => (
						<div
							key={step}
							className={cn(bg, "flex flex-col p-4 md:p-6 lg:p-8")}
						>
							<div className="flex justify-between">
								<Icon className="size-16 md:size-18 lg:size-32" />
								<span className="font-mono text-white">{step}.</span>
							</div>
							<div className="flex flex-col gap-2 mt-auto text-white">
								<h3 className="text-lg font-semibold">{title}</h3>
								<p className="text-sm text-pretty max-w-sm w-full">
									{description}
								</p>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Calendar Showcase */}
			<div className="relative grid grid-cols-[1fr_calc(100%-2rem)_1fr] md:grid-cols-[1fr_min(calc(100%-5rem),calc(1200/16*1rem))_1fr] [&>*]:col-[2] gap-4 pt-20 pb-10 lg:pt-30 lg:pb-15">
				<div className="overflow-hidden pb-4">
					<div className="inset-shadow-2xs ring-white/20 bg-white relative rounded-lg md:mx-auto max-w-2xl sm:max-w-4xl lg:max-w-6xl border p-2 shadow-md ring-1">
						<Image
							alt="App calendar screenshot"
							src="/images/landing-calendar.webp"
							width="1900"
							height="951"
							className="z-2 border-border/25 rounded-md border"
						/>
					</div>
				</div>

				<div className="lg:ml-5">
					<h3 className="text-xl md:text-3xl lg:text-4xl font-semibold">
						All Your Events, One Clear View.
					</h3>
					<p className="text-muted text-sm md:text-base w-full max-w-md text-pretty">
						Save events that are important to you. We&apos;ll keep them
						organized and remind you when it counts.
					</p>
				</div>
			</div>
		</section>
	);
}
