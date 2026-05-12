import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { segments } from "@/config/segments";
import { VorcleLogoMain } from "../custom-icons/brand-logo";

const MENU_ITEMS = [
	{ name: "Product", href: "#" },
	{ name: "Features", href: "#" },
	{ name: "Careers", href: "#" },
	{ name: "Pricing", href: "#pricing" },
];

export default function Header() {
	return (
		<header className="bg-white-chalk fixed top-0 w-full z-50 border-b py-4 grid grid-cols-[1fr_calc(100%-2rem)_1fr] md:grid-cols-[1fr_min(calc(100%-5rem),calc(1200/16*1rem))_1fr]">
			<nav
				aria-label="global"
				className="flex items-center justify-between col-[2]"
			>
				<div className="flex">
					<a href={segments.home}>
						<VorcleLogoMain svgColor="black" className="h-6" />
						<span className="sr-only">Vorcle brand logo</span>
					</a>
				</div>
				<div className="hidden lg:flex lg:gap-x-12">
					{MENU_ITEMS.map((item) => (
						<a key={item.name} href={item.href} className="text-sm">
							{item.name}
						</a>
					))}
				</div>
				<Link
					href={segments.signIn}
					className="flex items-center gap-1 group text-sm px-4 py-2 border font-medium"
					aria-label="go to log in page"
				>
					Log in
					<HugeiconsIcon icon={ArrowRight02Icon} size={16} aria-hidden="true" />
				</Link>
			</nav>
		</header>
	);
}
