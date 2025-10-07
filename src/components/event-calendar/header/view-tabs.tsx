"use client";

import { memo } from "react";
import { useCalendar } from "../context/calendar-context";
import { CalendarRange, List, Columns, Grid3X3 } from "lucide-react";
import {
  ButtonGroupIcon,
  ButtonGroupItem,
  ButtonGroupRoot,
} from "@/components/align-ui/button-group";
import { cn } from "@/lib/utils";
import { CalendarView } from "../config/types";
import { useIsMobile } from "@/hooks/use-mobile";

function ViewTabs() {
  const { view, setView } = useCalendar();
  const isMobile = useIsMobile();

  const VIEW_TABS = [
    {
      id: 1,
      name: "Agenda",
      value: "agenda",
      icon: CalendarRange,
    },
    {
      id: 2,
      name: "Day",
      value: "day",
      icon: List,
    },
    {
      id: 3,
      name: "Week",
      value: "week",
      icon: Columns,
    },
    {
      id: 4,
      name: "Month",
      value: "month",
      icon: Grid3X3,
    },
  ];

  return (
    <ButtonGroupRoot>
      {VIEW_TABS.map((tabView) => (
        <ButtonGroupItem
          key={tabView.id}
          aria-label={`Toggle ${tabView.value} view`}
          onClick={() => setView(tabView.value as CalendarView)}
          className={cn(
            view === tabView.value
              ? "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80"
              : ""
          )}
        >
          {!isMobile ? <ButtonGroupIcon as={tabView.icon} /> : null}
          {tabView.name}
        </ButtonGroupItem>
      ))}
    </ButtonGroupRoot>
  );
}

export default memo(ViewTabs);
