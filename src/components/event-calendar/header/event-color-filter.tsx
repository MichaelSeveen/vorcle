import { CheckIcon, RefreshCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { useCalendar } from "../context/calendar-context";
import { EVENT_COLORS } from "../config/types";
import { ColorFilterIcon } from "@/components/custom-icons/duotone";
import { Button } from "@/components/ui/button";

export default function EventsColorFilter() {
  const { selectedColors, filterEventsBySelectedColors, clearFilter } =
    useCalendar();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <ColorFilterIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        {EVENT_COLORS.map((color, index) => (
          <DropdownMenuItem
            key={index}
            className="justify-between cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              filterEventsBySelectedColors(color);
            }}
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`size-3.5 rounded-full bg-${color}-600 dark:bg-${color}-700`}
              />
              <span className="capitalize">{color}</span>
            </div>
            {selectedColors.includes(color) && <CheckIcon />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={selectedColors.length === 0}
          className="flex gap-2 cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            clearFilter();
          }}
        >
          <RefreshCcw />
          Clear Filter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
