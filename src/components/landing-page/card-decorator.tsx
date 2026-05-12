import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardDecoratorProps {
	children: ReactNode;
	className?: string;
}

export default function CardDecorator({
	children,
	className,
}: CardDecoratorProps) {
	return (
		<div
			className={cn(
				"group relative rounded-none shadow-zinc-950/5 p-1",
				className,
			)}
		>
			<Decorator />
			{children}
		</div>
	);
}

const Decorator = () => (
	<>
		<span className="border-white-chalk absolute -left-px -top-px block size-1 border-l-1 border-t-1" />
		<span className="border-white-chalk absolute -right-px -top-px block size-1 border-r-1 border-t-1" />
		<span className="border-white-chalk absolute -bottom-px -left-px block size-1 border-b-1 border-l-1" />
		<span className="border-white-chalk absolute -bottom-px -right-px block size-1 border-b-1 border-r-1" />
	</>
);
