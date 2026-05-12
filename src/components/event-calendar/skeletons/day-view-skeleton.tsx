import { Skeleton } from "@heroui/react";

const HOUR_SLOTS = Array.from({ length: 12 }, (_, hour) => `hour-slot-${hour}`);

export default function DayViewSkeleton() {
	return (
		<div className="flex flex-col h-svh max-w-[85rem] mx-auto">
			<div className="grid grid-cols-2 border-b">
				<div className="w-18" />
				<div className="flex flex-col items-center justify-center py-2">
					<Skeleton className="h-6 w-24 rounded-full" />
					<Skeleton className="mt-1 h-4 w-16" />
				</div>
			</div>

			<div className="flex flex-1">
				<div className="w-18 flex-shrink-0">
					{HOUR_SLOTS.map((hour) => (
						<div key={hour} className="relative h-12 border-b pr-2 text-right">
							<Skeleton className="absolute -top-3 right-2 h-4 w-10" />
						</div>
					))}
				</div>

				<div className="flex-1">
					<div className="relative">
						{HOUR_SLOTS.map((hour) => (
							<div key={hour} className="h-12 border-b" />
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
