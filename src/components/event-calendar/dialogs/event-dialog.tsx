import {
  type ReactNode,
  useCallback,
  useMemo,
  FormEvent,
  useState,
} from "react";
import { Tag, TagInput } from "emblor-maintained";
import { useAppForm } from "../../ui/tanstack-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/align-ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCalendar } from "../context/calendar-context";
import { useDisclosure } from "../config/hooks";
import { Event, EVENT_COLORS, EventColor } from "../config/types";
import { eventSchema, EventFormData } from "../config/schema";
import { SingleDayPicker } from "../_components/single-day-picker";
import { TimeInput } from "../_components/timepicker";
import type { TimeValue } from "react-aria-components";
import { getInitialDates } from "../config/utils";
import { toast } from "sonner";

interface Props {
  children: ReactNode;
  startDate?: Date;
  startTime?: { hour: number; minute: number };
  event?: Event;
}

export function EventDialog({ children, startDate, startTime, event }: Props) {
  const { isOpen, onClose, onToggle } = useDisclosure();
  const { addEvent, updateEvent, use24HourFormat } = useCalendar();
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);

  const isEditing = !!event;

  const initialDates = getInitialDates({
    startDate,
    startTime,
    event,
    isEditing,
  });

  const attendees = useMemo(() => {
    if (!event) return [];

    const eventAttendees = event.attendees?.map((attendee) => ({
      id: attendee.id,
      text: attendee.name,
    }));

    setTags(eventAttendees || []);
    return eventAttendees || [];
  }, [event]);

  const form = useAppForm({
    validators: { onBlur: eventSchema },
    defaultValues: {
      title: event?.title ?? "",
      description: event?.description ?? "",
      startDate: initialDates.startDate,
      startTime: initialDates.startTime,
      location: event?.location ?? "",
      meetingLink: event?.meetingLink ?? "",
      endDate: initialDates.endDate || undefined,
      endTime: initialDates.endTime || undefined,
      attendees: attendees,
      color: event?.color ?? "blue",
    } as EventFormData,
    onSubmit: async ({ value }) => {
      try {
        const eventStartDate = new Date(value.startDate);
        eventStartDate.setHours(
          value.startTime.hour,
          value.startTime.minute,
          0,
          0
        );
        const eventEndDate = new Date(value.endDate);
        eventEndDate.setHours(value.endTime.hour, value.endTime.minute, 0, 0);

        const payload = {
          title: value.title,
          description: value.description ?? "",
          startDate: eventStartDate.toISOString(),
          endDate: eventEndDate.toISOString(),
          location: value.location ?? "",
          meetingLink: value.meetingLink ?? "",
          color: value.color as EventColor,
          attendees: (value.attendees as Tag[]).map((tag) => ({
            id: tag.id,
            name: tag.text,
            picturePath:
              `https://tapback.co/api/avatar/${tag.text}.webp` || null,
          })),
        } as Omit<Event, "id" | "user">;

        if (isEditing && event) {
          // preserve existing id and user info when updating
          const updatedEvent: Event = {
            ...event,
            ...payload,
          } as Event;

          await updateEvent(updatedEvent);
        } else {
          await addEvent(payload);
        }

        onClose();
        form.reset();
      } catch (error) {
        console.error(
          `Error ${isEditing ? "editing" : "adding"} event:`,
          error
        );
        toast.error(`Failed to ${isEditing ? "edit" : "add"} event`);
      }
    },
  });

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      e.stopPropagation();

      form.handleSubmit();
    },
    [form]
  );

  return (
    <Dialog open={isOpen} onOpenChange={onToggle}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Event" : "Add New Event"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modify your existing event."
              : "Create a new event for your calendar."}
          </DialogDescription>
        </DialogHeader>

        <form.AppForm>
          <form
            id="event-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <form.AppField name="title">
              {(field) => (
                <field.FormItem>
                  <field.FormLabel className="required">Title</field.FormLabel>
                  <field.FormControl>
                    <Input
                      id="title"
                      placeholder="Enter a title"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0
                          ? "border-red-500"
                          : ""
                      }
                    />
                  </field.FormControl>
                  <field.FormMessage />
                </field.FormItem>
              )}
            </form.AppField>
            <form.AppField name="attendees">
              {(field) => (
                <field.FormItem>
                  <field.FormLabel>Attendees</field.FormLabel>
                  <field.FormControl>
                    <TagInput
                      tags={tags}
                      setTags={(newTags) => {
                        setTags(newTags);
                        field.setValue(newTags as [Tag, ...Tag[]]);
                      }}
                      placeholder="Add an attendee"
                      styleClasses={{
                        inlineTagsContainer:
                          "border-input rounded-md bg-background shadow-xs transition-[color,box-shadow] focus-within:border-ring outline-none focus-within:ring-[3px] focus-within:ring-ring/50 p-1 gap-1",
                        input: "w-full min-w-[80px] shadow-none px-2 h-7",
                        tag: {
                          body: "h-7 relative bg-background border border-input hover:bg-background rounded-md font-medium text-xs ps-2 pe-7",
                          closeButton:
                            "absolute -inset-y-px -end-px p-0 rounded-e-md flex size-7 transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] text-muted-foreground/80 hover:text-foreground",
                        },
                      }}
                      activeTagIndex={activeTagIndex}
                      setActiveTagIndex={setActiveTagIndex}
                    />
                  </field.FormControl>
                  <field.FormMessage />
                </field.FormItem>
              )}
            </form.AppField>
            <div className="grid grid-cols-2 gap-4">
              <form.AppField name="startDate">
                {(field) => (
                  <field.FormItem>
                    <field.FormLabel>Start Date</field.FormLabel>
                    <field.FormControl>
                      <SingleDayPicker
                        id="startDate"
                        onSelect={(date) => field.handleChange(date as Date)}
                        value={field.state.value}
                        placeholder="Select a date"
                      />
                    </field.FormControl>
                    <field.FormMessage />
                  </field.FormItem>
                )}
              </form.AppField>
              <form.AppField name="startTime">
                {(field) => (
                  <field.FormItem>
                    <field.FormLabel>Start Time</field.FormLabel>
                    <field.FormControl>
                      <TimeInput
                        value={field.state.value as TimeValue}
                        onChange={(time) =>
                          field.handleChange(time as TimeValue)
                        }
                        hourCycle={use24HourFormat ? 24 : 12}
                        data-invalid={field.state.meta.errors.length > 0}
                      />
                    </field.FormControl>
                    <field.FormMessage />
                  </field.FormItem>
                )}
              </form.AppField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <form.AppField name="endDate">
                {(field) => (
                  <field.FormItem>
                    <field.FormLabel>End Date</field.FormLabel>
                    <field.FormControl>
                      <SingleDayPicker
                        id="endDate"
                        onSelect={(date) => field.handleChange(date as Date)}
                        value={field.state.value}
                        placeholder="Select a date"
                      />
                    </field.FormControl>
                    <field.FormMessage />
                  </field.FormItem>
                )}
              </form.AppField>
              <form.AppField name="endTime">
                {(field) => (
                  <field.FormItem>
                    <field.FormLabel>End Time</field.FormLabel>
                    <field.FormControl>
                      <TimeInput
                        value={field.state.value as TimeValue}
                        onChange={(time) =>
                          field.handleChange(time as TimeValue)
                        }
                        hourCycle={use24HourFormat ? 24 : 12}
                        data-invalid={field.state.meta.errors.length > 0}
                      />
                    </field.FormControl>
                    <field.FormMessage />
                  </field.FormItem>
                )}
              </form.AppField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <form.AppField name="location">
                {(field) => (
                  <field.FormItem>
                    <field.FormLabel className="required">
                      Location
                    </field.FormLabel>
                    <field.FormControl>
                      <Input
                        id="location"
                        placeholder="Enter a location"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className={
                          field.state.meta.isTouched &&
                          field.state.meta.errors.length > 0
                            ? "border-red-500"
                            : ""
                        }
                      />
                    </field.FormControl>
                    <field.FormMessage />
                  </field.FormItem>
                )}
              </form.AppField>
              <form.AppField name="meetingLink">
                {(field) => (
                  <field.FormItem>
                    <field.FormLabel className="required">
                      Meeting Link
                    </field.FormLabel>
                    <field.FormControl>
                      <Input
                        id="meetingLink"
                        placeholder="Enter a meeting link"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className={
                          field.state.meta.isTouched &&
                          field.state.meta.errors.length > 0
                            ? "border-red-500"
                            : ""
                        }
                      />
                    </field.FormControl>
                    <field.FormMessage />
                  </field.FormItem>
                )}
              </form.AppField>
            </div>
            <form.AppField name="color">
              {(field) => (
                <field.FormItem>
                  <field.FormLabel className="required">
                    Variant
                  </field.FormLabel>
                  <field.FormControl>
                    <SelectRoot
                      value={field.state.value}
                      onValueChange={(value) =>
                        field.handleChange(value as EventColor)
                      }
                    >
                      <SelectTrigger
                        className={`w-full ${
                          field.state.meta.isTouched &&
                          field.state.meta.errors.length > 0
                            ? "border-red-500"
                            : ""
                        }`}
                      >
                        <SelectValue placeholder="Select a variant" />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_COLORS.map((color) => (
                          <SelectItem
                            value={color}
                            key={color}
                            className="capitalize"
                          >
                            <span
                              className={`rounded-full size-3.5 bg-${color}-600 dark:bg-${color}-700`}
                            />
                            {color}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </SelectRoot>
                  </field.FormControl>
                  <field.FormMessage />
                </field.FormItem>
              )}
            </form.AppField>
            <form.AppField name="description">
              {(field) => (
                <field.FormItem>
                  <field.FormLabel className="required">
                    Description
                  </field.FormLabel>
                  <field.FormControl>
                    <Textarea
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter a description"
                      className={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0
                          ? "border-red-500"
                          : ""
                      }
                    />
                  </field.FormControl>
                  <field.FormMessage />
                </field.FormItem>
              )}
            </form.AppField>
          </form>
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button form="event-form" type="submit">
              {isEditing ? "Save Changes" : "Create Event"}
            </Button>
          </div>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}
