"use client";

import { Breadcrumbs } from "@heroui/react";
import { usePathname } from "next/navigation";

function toTitleCase(str: string) {
	return str.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function DashboardBreadcrumbs() {
	const pathname = usePathname();
	const segments = pathname
		.split("/")
		.filter(Boolean)
		.filter((segment) => segment.length < 25);

	return (
		<Breadcrumbs>
			{segments.map((segment, index) => {
				const href = "/" + segments.slice(0, index + 1).join("/");
				const isLast = index === segments.length - 1;
				const label = toTitleCase(segment);

				return (
					<Breadcrumbs.Item key={href} href={isLast ? undefined : href}>
						{label}
					</Breadcrumbs.Item>
				);
			})}
		</Breadcrumbs>
	);
}
