import { Button, Calendar, Popover } from "@heroui/react";
import { CalendarDate } from "@internationalized/date";
import { format } from "date-fns";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

import { cn } from "@/lib/utils";
import { useDisclosure } from "../../event-calendar/config/hooks";

type TProps = Omit<
	ButtonHTMLAttributes<HTMLButtonElement>,
	"onSelect" | "value"
> & {
	onSelect: (value: Date | undefined) => void;
	value?: Date | undefined;
	placeholder: string;
	labelVariant?: "P" | "PP" | "PPP";
};

type CalendarSelection = {
	year: number;
	month: number;
	day: number;
};

type HeroCalendarValue = ComponentProps<typeof Calendar>["value"];

function SingleDayPicker({
	id,
	onSelect,
	className,
	placeholder,
	labelVariant = "PPP",
	value,
}: TProps) {
	const { isOpen, onClose, onOpen } = useDisclosure();

	const handleSelect = (date: CalendarSelection) => {
		onSelect(new Date(date.year, date.month - 1, date.day));
		onClose();
	};

	return (
		<Popover
			isOpen={isOpen}
			onOpenChange={(open) => (open ? onOpen() : onClose())}
		>
			<Popover.Trigger>
				<Button
					id={id}
					variant="outline"
					className={cn(
						"group relative h-9 w-full justify-start whitespace-nowrap px-3 py-2 font-normal hover:bg-inherit",
						className,
					)}
				>
					{value && <span>{format(value, labelVariant)}</span>}
					{!value && (
						<span className="text-foreground">{placeholder}</span>
					)}
				</Button>
			</Popover.Trigger>

			<Popover.Content className="w-fit p-0">
				<Calendar
					aria-label="Pick a date"
					value={
						value
							? (new CalendarDate(
									value.getFullYear(),
									value.getMonth() + 1,
									value.getDate(),
								) as unknown as HeroCalendarValue)
							: null
					}
					onChange={(date) => handleSelect(date)}
					autoFocus
				/>
			</Popover.Content>
		</Popover>
	);
}

export { SingleDayPicker };
