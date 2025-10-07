"use client";

import { createContext, useContext, useState, useMemo, useEffect } from "react";
import { isSameDay, parseISO } from "date-fns";
import { create, remove, update } from "@/app/actions/event-calendar-actions";
import { useLocalStorage } from "../config/hooks";
import { CalendarView, EventColor, Event, User } from "../config/types";
import { toast } from "sonner";

interface CalendarContext {
  selectedDate: Date | null;
  view: CalendarView;
  setView: (view: CalendarView) => void;
  agendaModeGroupBy: "date" | "color";
  setAgendaModeGroupBy: (groupBy: "date" | "color") => void;
  use24HourFormat: boolean;
  toggleTimeFormat: () => void;
  setSelectedDate: (date: Date | undefined | null) => void;
  selectedUserId: User["id"] | "all";
  setSelectedUserId: (userId: User["id"] | "all") => void;
  badgeVariant: "dot" | "colored";
  setBadgeVariant: (variant: "dot" | "colored") => void;
  selectedColors: EventColor[];
  filterEventsBySelectedColors: (colors: EventColor) => void;
  filterEventsBySelectedUser: (userId: User["id"] | "all") => void;
  users: User[];
  allEvents: Event[];
  filteredEvents: Event[];
  singleDayEvents: Event[];
  multiDayEvents: Event[];
  addEvent: (event: Omit<Event, "id" | "user">) => Promise<void>;
  updateEvent: (event: Event) => Promise<void>;
  removeEvent: (eventId: string) => Promise<void>;
  clearFilter: () => void;
}

interface CalendarSettings {
  badgeVariant: "dot" | "colored";
  view: CalendarView;
  use24HourFormat: boolean;
  agendaModeGroupBy: "date" | "color";
}

const DEFAULT_SETTINGS: CalendarSettings = {
  badgeVariant: "colored",
  view: "month",
  use24HourFormat: true,
  agendaModeGroupBy: "date",
};

const CalendarContext = createContext({} as CalendarContext);

export function CalendarProvider({
  children,
  users,
  events,
  badge = "colored",
  view = "month",
}: {
  children: React.ReactNode;
  users: User[];
  events: Event[];
  view?: CalendarView;
  badge?: "dot" | "colored";
}) {
  const [settings, setSettings] = useLocalStorage<CalendarSettings>(
    "calendar-settings",
    {
      ...DEFAULT_SETTINGS,
      badgeVariant: badge,
      view: view,
    }
  );

  const [badgeVariant, setBadgeVariantState] = useState<"dot" | "colored">(
    settings.badgeVariant
  );
  const [currentView, setCurrentViewState] = useState<CalendarView>(
    settings.view
  );
  const [use24HourFormat, setUse24HourFormatState] = useState<boolean>(
    settings.use24HourFormat
  );
  const [agendaModeGroupBy, setAgendaModeGroupByState] = useState<
    "date" | "color"
  >(settings.agendaModeGroupBy);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<User["id"] | "all">(
    "all"
  );
  const [selectedColors, setSelectedColors] = useState<EventColor[]>([]);

  const [allEvents, setAllEvents] = useState<Event[]>(events || []);

  useEffect(() => {
    if (selectedDate === null) {
      setSelectedDate(new Date());
    }
  }, [selectedDate]);

  const updateSettings = (newPartialSettings: Partial<CalendarSettings>) => {
    setSettings({
      ...settings,
      ...newPartialSettings,
    });
  };

  const setBadgeVariant = (variant: "dot" | "colored") => {
    setBadgeVariantState(variant);
    updateSettings({ badgeVariant: variant });
  };

  const setView = (newView: CalendarView) => {
    setCurrentViewState(newView);
    updateSettings({ view: newView });
  };

  const toggleTimeFormat = () => {
    const newValue = !use24HourFormat;
    setUse24HourFormatState(newValue);
    updateSettings({ use24HourFormat: newValue });
  };

  const setAgendaModeGroupBy = (groupBy: "date" | "color") => {
    setAgendaModeGroupByState(groupBy);
    updateSettings({ agendaModeGroupBy: groupBy });
  };

  const handleSelectDate = (date: Date | undefined | null) => {
    if (!date) return;
    setSelectedDate(date);
  };

  const addEvent = async (event: Omit<Event, "id" | "user">) => {
    const { success, error, event: newEvent } = await create(event);

    if (success && newEvent) {
      setAllEvents((prev) => [...prev, newEvent]);
      toast.success("Event created successfully");
    }

    if (!success) {
      toast.error(error);
    }
  };

  const updateEvent = async (event: Event) => {
    const { success, error, event: updatedEvent } = await update(event);

    if (success && updatedEvent) {
      toast.success("Event updated successfully");
      setAllEvents((prev) =>
        prev.map((e) => (e.id === event.id ? updatedEvent : e))
      );
    }

    if (!success) {
      toast.error(error);
    }
  };

  const removeEvent = async (eventId: string) => {
    setAllEvents((prev) => prev.filter((e) => e.id !== eventId));
    const { success, error } = await remove(eventId);

    if (success) {
      toast.success("Event deleted successfully");
    }

    if (!success) {
      toast.error(error);
    }
  };

  const clearFilter = () => {
    setSelectedColors([]);
    setSelectedUserId("all");
  };

  const filteredEvents = useMemo(() => {
    if (!selectedDate) return [];

    let dateAndUserFiltered = allEvents.filter((event) => {
      const eventStartDate = parseISO(event.startDate);
      const eventEndDate = parseISO(event.endDate);
      const isUserMatch =
        selectedUserId === "all" ||
        event.user.id === selectedUserId ||
        (Array.isArray(event.attendees) &&
          event.attendees.some((att) => att.id === selectedUserId));

      if (!isUserMatch) return false;

      if (currentView === "year") {
        const yearStart = new Date(selectedDate.getFullYear(), 0, 1);
        const yearEnd = new Date(
          selectedDate.getFullYear(),
          11,
          31,
          23,
          59,
          59,
          999
        );
        return eventStartDate <= yearEnd && eventEndDate >= yearStart;
      }

      if (currentView === "month" || currentView === "agenda") {
        const monthStart = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          1
        );
        const monthEnd = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
        return eventStartDate <= monthEnd && eventEndDate >= monthStart;
      }

      if (currentView === "week") {
        const dayOfWeek = selectedDate.getDay();
        const weekStart = new Date(selectedDate);
        weekStart.setDate(selectedDate.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        return eventStartDate <= weekEnd && eventEndDate >= weekStart;
      }

      if (currentView === "day") {
        const dayStart = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          0,
          0,
          0
        );
        const dayEnd = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          23,
          59,
          59
        );
        return eventStartDate <= dayEnd && eventEndDate >= dayStart;
      }

      return false;
    });

    if (selectedColors.length > 0) {
      dateAndUserFiltered = dateAndUserFiltered.filter((event) => {
        const eventColor = event.color || "blue";
        return selectedColors.includes(eventColor);
      });
    }

    return dateAndUserFiltered;
  }, [allEvents, selectedDate, selectedUserId, selectedColors, currentView]);

  const singleDayEvents = useMemo(() => {
    return filteredEvents.filter((event) => {
      const startDate = parseISO(event.startDate);
      const endDate = parseISO(event.endDate);
      return isSameDay(startDate, endDate);
    });
  }, [filteredEvents]);

  const multiDayEvents = useMemo(() => {
    return filteredEvents.filter((event) => {
      const startDate = parseISO(event.startDate);
      const endDate = parseISO(event.endDate);
      return !isSameDay(startDate, endDate);
    });
  }, [filteredEvents]);

  const filterEventsBySelectedColors = (color: EventColor) => {
    const isColorSelected = selectedColors.includes(color);
    const newColors = isColorSelected
      ? selectedColors.filter((c) => c !== color)
      : [...selectedColors, color];
    setSelectedColors(newColors);
  };

  const filterEventsBySelectedUser = (userId: User["id"] | "all") => {
    setSelectedUserId(userId);
  };

  const value = {
    selectedDate,
    setSelectedDate: handleSelectDate,
    selectedUserId,
    setSelectedUserId,
    badgeVariant,
    setBadgeVariant,
    users,
    selectedColors,
    filterEventsBySelectedColors,
    filterEventsBySelectedUser,
    allEvents,
    filteredEvents,
    singleDayEvents,
    multiDayEvents,
    view: currentView,
    use24HourFormat,
    toggleTimeFormat,
    setView,
    agendaModeGroupBy,
    setAgendaModeGroupBy,
    addEvent,
    updateEvent,
    removeEvent,
    clearFilter,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar(): CalendarContext {
  const context = useContext(CalendarContext);
  if (!context)
    throw new Error("useCalendar must be used within a CalendarProvider.");
  return context;
}
