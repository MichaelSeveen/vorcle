"use client";

import { Spinner } from "@heroui/react";
import {
	Alert02Icon,
	CheckmarkCircle02Icon,
	InformationCircleIcon,
	OctagonXIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = "system" } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster group"
			icons={{
				success: <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />,
				info: <HugeiconsIcon icon={InformationCircleIcon} size={16} />,
				warning: <HugeiconsIcon icon={Alert02Icon} size={16} />,
				error: <HugeiconsIcon icon={OctagonXIcon} size={16} />,
				loading: <Spinner />,
			}}
			style={
				{
					"--normal-bg": "var(--popover)",
					"--normal-text": "var(--popover-foreground)",
					"--normal-border": "var(--border)",
					"--border-radius": "var(--radius)",
				} as React.CSSProperties
			}
			toastOptions={{
				classNames: {
					toast: "cn-toast",
				},
			}}
			{...props}
		/>
	);
};

export { Toaster };
