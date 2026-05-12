import {
	Prism,
	SixCubes,
	SquareCircle,
	ThreeCubes,
	TwoPrisms,
} from "../custom-icons/landing";
import CardDecorator from "./card-decorator";

const MAIN_FEATURE_CARDS = [
	{
		id: 1,
		icon: SquareCircle,
		title: "Meeting Summaries",
		description:
			"Automatic meeting summaries and action items after each meeting.",
	},
	{
		id: 2,
		icon: SixCubes,
		title: "Calendar Integrations",
		description:
			"Connect your google calendar and vorcle can auto-join your meetings on your behalf.",
	},
];

const SUB_FEATURE_CARDS = [
	{
		id: 1,
		icon: ThreeCubes,
		title: "One-click Integrations",
		description:
			"Push action items to your favorite tools e.g., Slack, Asana, Trello etc.",
	},
	{
		id: 2,
		icon: Prism,
		title: "Auto-Email Reports",
		description:
			"Receive timely emails after each meeting with all the important details discussed.",
	},
	{
		id: 3,
		icon: TwoPrisms,
		title: "Ask Your Meetings",
		description:
			"Ask questions about meetings and get quality and insightful answers instantly.",
	},
];

export default function FeaturesSection() {
	return (
		<section className="border-t">
			<div className="grid grid-cols-[1fr_calc(100%-2rem)_1fr] md:grid-cols-[1fr_min(calc(100%-5rem),calc(1200/16*1rem))_1fr] [&>*]:col-[2]">
				<div className="flex flex-col justify-center items-center pt-15 md:pt-18 lg:pt-30 gap-4 text-center">
					<h2 className="text-2xl md:text-4xl lg:text-5xl tracking-tight font-semibold w-full max-w-md text-pretty">
						Smarter meetings that saves you time
					</h2>
					<p className="text-sm md:text-base text-pretty text-muted w-full max-w-md">
						With summaries, integrations, and next steps captured and organized
						for you without extra effort.
					</p>
				</div>

				<div className="pt-15 md:pt-20 h-[40rem] lg:h-[27rem]">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
						{MAIN_FEATURE_CARDS.map(({ icon: Icon, title, description }) => (
							<div
								key={title}
								className="flex flex-col p-4 lg:p-6 bg-vivid-deep-blue"
							>
								<div className="flex items-center justify-between gap-3">
									<Icon className="size-10 md:size-16" />
									<CardDecorator>
										<h3 className="font-mono text-base md:text-xl tracking-tight text-white">
											{title}
										</h3>
									</CardDecorator>
								</div>
								<div className="mt-auto border-t pt-3 flex gap-3">
									<div className="h-10 w-1.5 bg-[#1B6F81]" />
									<p className="text-sm text-white text-pretty max-w-sm w-full">
										{description}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="mt-4 pb-15 md:pb-20 h-[55rem] lg:h-[27rem]">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
						{SUB_FEATURE_CARDS.map(({ icon: Icon, title, description }) => (
							<div
								key={title}
								className="flex flex-col p-4 lg:p-6 bg-vivid-deep-blue"
							>
								<div className="flex items-center justify-between gap-3">
									<Icon className="size-10 md:size-16" />
									<CardDecorator>
										<h3 className="font-mono md:text-lg lg:text-xl tracking-tight text-white">
											{title}
										</h3>
									</CardDecorator>
								</div>
								<div className="mt-auto border-t pt-3 flex gap-3">
									<div className="h-10 w-1.5 bg-[#1B6F81]" />
									<p className="text-sm text-white text-pretty max-w-sm w-full">
										{description}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
