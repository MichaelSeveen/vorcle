import { Skeleton } from "@heroui/react";

const WEEKDAY_SLOTS = Array.from(
	{ length: 7 },
	(_, day) => `weekday-slot-${day}`,
);

const MONTH_DAY_SLOTS = Array.from({ length: 42 }, (_, day) => ({
	id: `month-day-slot-${day}`,
	eventSlots: Array.from(
		{ length: (day * 7) % 3 },
		(_, event) => `month-day-${day}-event-slot-${event}`,
	),
}));

export default function MonthViewSkeleton() {
	return (
		<div className="mx-auto flex h-svh max-w-[85rem] flex-col">
			<div className="grid grid-cols-7 border-b py-2">
				{WEEKDAY_SLOTS.map((day) => (
					<div key={day} className="flex justify-center">
						<Skeleton className="h-6 w-12" />
					</div>
				))}
			</div>

			<div className="grid flex-1 grid-cols-7 grid-rows-6">
				{MONTH_DAY_SLOTS.map((day) => (
					<div key={day.id} className="border-b border-r p-1">
						<Skeleton className="mb-1 size-6 rounded-full" />

						<div className="mt-1 space-y-1">
							{day.eventSlots.map((eventSlot) => (
								<Skeleton key={eventSlot} className="h-5 w-full" />
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
