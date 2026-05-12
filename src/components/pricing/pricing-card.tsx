import { type ComponentProps, useId } from "react";
import { cn } from "@/lib/utils";
import { Starfield } from "../custom-icons";

const PRICING_CARD_VARIANTS = {
	gold: {
		"--pc-head-bg": "#FCEEB3",
		"--pc-main-grad-start": "white",
		"--pc-main-grad-end": "#F9DD81",
		"--pc-accent-grad-start": "#F5C34F",
		"--pc-accent-grad-end": "#F9DD81",
		"--pc-inner-shadow-accent": "rgba(254, 216, 181, 0.8)",
	},
	purple: {
		"--pc-head-bg": "#E9E9FF",
		"--pc-main-grad-start": "white",
		"--pc-main-grad-end": "#CCE5F1",
		"--pc-accent-grad-start": "#B45DE7",
		"--pc-accent-grad-end": "#A100FF",
		"--pc-inner-shadow-accent": "rgba(222, 179, 225, 0.8)",
	},
	blue: {
		"--pc-head-bg": "#DAE7F3",
		"--pc-main-grad-start": "white",
		"--pc-main-grad-end": "#CCE5F1",
		"--pc-accent-grad-start": "#5DD0E7",
		"--pc-accent-grad-end": "#7300FF",
		"--pc-inner-shadow-accent": "rgba(186, 247, 255, 0.8)",
	},
} as const;

type PricingCardVariant = keyof typeof PRICING_CARD_VARIANTS;

interface PricingCardProps extends ComponentProps<"div"> {
	variant?: PricingCardVariant;
}

function PricingCard({
	variant = "gold",
	className,
	style,
	...props
}: PricingCardProps) {
	return (
		<div
			className={cn(
				"bg-white shadow-surface flex w-[320px] flex-col rounded-3xl",
				"max-lg:w-full max-md:w-full",
				className,
			)}
			style={
				{ ...PRICING_CARD_VARIANTS[variant], ...style } as React.CSSProperties
			}
			{...props}
		/>
	);
}

function PricingCardGraphicalHeader({
	className,
	children,
	...props
}: ComponentProps<"div">) {
	const id = useId();

	return (
		<div
			className={cn(
				"relative bg-default mx-2 mb-2 mt-2 h-[255px] overflow-clip rounded-2xl",
				"bg-[var(--pc-head-bg)]",
				className,
			)}
			{...props}
		>
			<div
				className="absolute left-[-10px] top-[-148px] flex h-[406px] w-[328px] items-center justify-center max-lg:left-0 max-lg:top-0 max-lg:h-full max-lg:w-full pointer-events-none"
				style={
					{ "--inner-h": "153.5", "--inner-w": "1200" } as React.CSSProperties
				}
			>
				<div className="flex-none -rotate-90 max-lg:contents">
					<div className="relative h-[328px] w-[406px] max-lg:size-full max-lg:-scale-y-100">
						<svg
							className="absolute block size-full"
							fill="none"
							preserveAspectRatio="none"
							viewBox="0 0 406 328"
							aria-hidden="true"
						>
							<g clipPath={`url(#clip-${id})`}>
								<g
									className="max-lg:hidden"
									filter={`url(#filter-inner-${id})`}
								>
									<path
										d="M3 10H302V366H3V10Z"
										fill={`url(#grad-main-${id})`}
									/>
								</g>
								<g filter={`url(#filter-glow-${id})`}>
									<path
										d="M301.812 168C361.459 168 409.812 216.353 409.812 276C409.812 335.647 361.459 384 301.812 384C242.166 384 193.813 335.647 193.812 276C193.812 216.353 242.166 168 301.812 168Z"
										fill={`url(#grad-accent-${id})`}
									/>
								</g>
							</g>
							<defs>
								<filter
									id={`filter-inner-${id}`}
									colorInterpolationFilters="sRGB"
									filterUnits="userSpaceOnUse"
									height="356"
									width="299"
									x="3"
									y="10"
								>
									<feFlood floodOpacity="0" result="bg" />
									<feBlend in="SourceGraphic" in2="bg" mode="normal" />
									<feColorMatrix
										in="SourceAlpha"
										type="matrix"
										values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
									/>
									<feMorphology
										in="SourceAlpha"
										operator="erode"
										radius="3.125"
									/>
									<feOffset />
									<feGaussianBlur stdDeviation="19.5312" />
									<feComposite
										in2="hardAlpha"
										k2="-1"
										k3="1"
										operator="arithmetic"
									/>
									<feColorMatrix
										type="matrix"
										values="0 0 0 0 1 0 0 0 0 0.85 0 0 0 0 0.7 0 0 0 0.8 0"
									/>
									<feBlend mode="normal" in2="shape" />
								</filter>
								<filter
									id={`filter-glow-${id}`}
									colorInterpolationFilters="sRGB"
									filterUnits="userSpaceOnUse"
								>
									<feFlood floodOpacity="0" result="bg" />
									<feBlend in="SourceGraphic" in2="bg" mode="normal" />
									<feGaussianBlur stdDeviation="32.03" />
								</filter>
								<linearGradient
									id={`grad-main-${id}`}
									x1="152.5"
									x2="152.5"
									y1="10"
									y2="366"
									gradientUnits="userSpaceOnUse"
								>
									<stop stopColor="var(--pc-main-grad-start)" />
									<stop offset="1" stopColor="var(--pc-main-grad-end)" />
								</linearGradient>
								<linearGradient
									id={`grad-accent-${id}`}
									x1="242.597"
									x2="398.153"
									y1="226.295"
									y2="416.523"
									gradientUnits="userSpaceOnUse"
								>
									<stop stopColor="var(--pc-accent-grad-start)" />
									<stop offset="1" stopColor="var(--pc-accent-grad-end)" />
								</linearGradient>
								<clipPath id={`clip-${id}`}>
									<rect fill="white" height="328" width="406" />
								</clipPath>
							</defs>
						</svg>
					</div>
				</div>
			</div>

			{/* Bottom/Left Particle Field */}
			<div className="absolute left-[calc(50%+48.35px)] top-[calc(50%-213.65px)] flex h-[637.702px] w-[760.706px] -translate-x-1/2 -translate-y-1/2 items-center justify-center pointer-events-none">
				<div className="flex-none rotate-180">
					<div className="relative h-[637.702px] w-[760.706px] overflow-clip">
						<div className="absolute left-1/2 top-0 h-[637.702px] w-[760.706px] -translate-x-1/2">
							<div className="absolute inset-[5.73%_3.6%_4.36%_3.18%] animate-[float-stars_12s_ease-in-out_infinite]">
								<Starfield />
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Top-Right Particle Field */}
			<div className="absolute left-[calc(50%-63.96px)] top-[86.38px] h-[637.702px] w-[760.706px] -translate-x-1/2 overflow-clip pointer-events-none">
				<div className="absolute left-1/2 top-0 h-[637.702px] w-[760.706px] -translate-x-1/2">
					<div className="absolute inset-[5.73%_3.6%_4.36%_3.18%] animate-[float-stars-reverse_15s_ease-in-out_infinite]">
						<Starfield />
					</div>
				</div>
			</div>

			{/* Content container within Header */}
			<div className="relative z-10 flex h-full flex-col p-4">{children}</div>

			{/* Inset shadow */}
			<div className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_1px_0_var(--border)]" />
		</div>
	);
}

function PricingCardHeaderPlanName({
	className,
	...props
}: ComponentProps<"p">) {
	return (
		<p
			className={cn("font-heading mt-3 text-xl leading-[normal]", className)}
			{...props}
		/>
	);
}

function PricingCardHeaderDescription({
	className,
	...props
}: ComponentProps<"p">) {
	return (
		<p
			className={cn(
				"mt-1 w-[214px] whitespace-pre-wrap text-xs font-normal leading-[1.34]",
				className,
			)}
			{...props}
		/>
	);
}

function PricingCardHeaderPriceContainer({
	className,
	...props
}: ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"mt-5 flex items-baseline gap-2 font-medium leading-[normal]",
				className,
			)}
			{...props}
		/>
	);
}

function PricingCardHeaderPriceItem({
	className,
	...props
}: ComponentProps<"span">) {
	return (
		<span
			className={cn("relative shrink-0 text-[2rem] font-semibold", className)}
			{...props}
		/>
	);
}

function PricingCardHeaderPeriod({ className, ...props }: ComponentProps<"p">) {
	return (
		<div className={cn("mt-[7px]", className)}>
			<p className="text-muted text-xs font-medium leading-[1.34]" {...props} />
		</div>
	);
}

function PricingCardList({ className, ...props }: ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"flex flex-col items-start gap-3 px-5 pb-5 pt-5",
				className,
			)}
			{...props}
		/>
	);
}

interface PricingCardListItemProps extends ComponentProps<"div"> {
	icon?: React.ReactNode;
}

function PricingCardListItem({
	icon,
	children,
	className,
	...props
}: PricingCardListItemProps) {
	return (
		<div
			className={cn(
				"relative flex shrink-0 content-stretch items-center gap-2",
				className,
			)}
			{...props}
		>
			{icon}
			<p className="relative shrink-0 text-xs font-normal leading-[1.34]">
				{children}
			</p>
		</div>
	);
}

export {
	PricingCard,
	PricingCardGraphicalHeader,
	PricingCardHeaderDescription,
	PricingCardHeaderPeriod,
	PricingCardHeaderPlanName,
	PricingCardHeaderPriceContainer,
	PricingCardHeaderPriceItem,
	PricingCardList,
	PricingCardListItem,
};
