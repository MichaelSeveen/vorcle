import { Skeleton } from "@heroui/react";

const WEEK_DAY_SLOTS = Array.from({ length: 7 }, (_, day) => ({
	id: `week-day-slot-${day}`,
	hourSlots: Array.from(
		{ length: 12 },
		(_, hour) => `week-day-${day}-hour-slot-${hour}`,
	),
}));

const HOUR_LABEL_SLOTS = Array.from(
	{ length: 12 },
	(_, hour) => `hour-label-slot-${hour}`,
);

export default function WeekViewSkeleton() {
	return (
		<div className="flex h-full flex-col">
			<div className="grid grid-cols-8 border-b">
				<div className="w-18" />

				{WEEK_DAY_SLOTS.map((day) => (
					<div
						key={day.id}
						className="flex flex-col items-center justify-center py-2"
					>
						<Skeleton className="h-6 w-10 rounded-full" />
						<Skeleton className="mt-1 h-4 w-6" />
					</div>
				))}
			</div>

			<div className="flex flex-1 overflow-y-auto">
				<div className="w-18 flex-shrink-0">
					{HOUR_LABEL_SLOTS.map((hour) => (
						<div key={hour} className="relative h-12 border-b pr-2 text-right">
							<Skeleton className="absolute -top-3 right-2 h-4 w-10" />
						</div>
					))}
				</div>

				<div className="grid flex-1 grid-cols-7 divide-x">
					{WEEK_DAY_SLOTS.map((day) => (
						<div key={day.id} className="relative">
							{day.hourSlots.map((hour) => (
								<div key={hour} className="h-12 border-b" />
							))}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
