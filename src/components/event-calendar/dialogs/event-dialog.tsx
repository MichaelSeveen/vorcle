import {
	Button,
	Input,
	ListBox,
	Modal,
	Select,
	Switch,
	TextArea,
	useOverlayState,
} from "@heroui/react";
import { type Tag, TagInput } from "emblor-maintained";
import {
	type FormEvent,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import type { TimeValue } from "react-aria-components";
import { toast } from "sonner";
import {
	buildRRuleFromForm,
	getRecurrenceFormValues,
} from "@/helpers/event-calendar/recurrence";
import { useAppForm } from "../../ui/tanstack-form";
import { SingleDayPicker } from "../_components/single-day-picker";
import { TimeInput } from "../_components/timepicker";
import { type EventFormData, eventSchema } from "../config/schema";
import type {
	Event,
	EventColor,
	RecurrenceEndType,
	RecurrenceFrequency,
	WeekdayCode,
} from "../config/types";
import { EVENT_COLORS } from "../config/types";
import { getInitialDates } from "../config/utils";
import { useCalendar } from "../context/calendar-context";

const WEEKDAY_OPTIONS: Array<{ code: WeekdayCode; label: string }> = [
	{ code: "SU", label: "S" },
	{ code: "MO", label: "M" },
	{ code: "TU", label: "T" },
	{ code: "WE", label: "W" },
	{ code: "TH", label: "T" },
	{ code: "FR", label: "F" },
	{ code: "SA", label: "S" },
];

interface Props {
	children: ReactNode;
	startDate?: Date;
	startTime?: { hour: number; minute: number };
	event?: Event;
}

function toTag(attendee: NonNullable<Event["attendees"]>[number]): Tag {
	return {
		id: attendee.id ?? attendee.email ?? attendee.name,
		text: attendee.name,
	};
}

export function EventDialog({ children, startDate, startTime, event }: Props) {
	const { addEvent, updateEvent, use24HourFormat } = useCalendar();
	const isEditing = !!event;
	const initialDates = getInitialDates({
		startDate,
		startTime,
		event,
		isEditing,
	});
	const recurrenceDefaults = useMemo(
		() => getRecurrenceFormValues(event),
		[event],
	);
	const initialTags = useMemo(
		() => event?.attendees?.map(toTag) ?? [],
		[event],
	);
	const [tags, setTags] = useState<Tag[]>(initialTags);
	const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
	const [repeats, setRepeats] = useState(recurrenceDefaults.repeats);
	const [repeatFrequency, setRepeatFrequency] = useState<RecurrenceFrequency>(
		recurrenceDefaults.repeatFrequency,
	);
	const [repeatEndType, setRepeatEndType] = useState<RecurrenceEndType>(
		recurrenceDefaults.repeatEndType,
	);

	const resolvedTimeZone =
		event?.recurrence?.timezone ??
		event?.timeZone ??
		Intl.DateTimeFormat().resolvedOptions().timeZone ??
		"UTC";

	useEffect(() => {
		setTags(initialTags);
		setRepeats(recurrenceDefaults.repeats);
		setRepeatFrequency(recurrenceDefaults.repeatFrequency);
		setRepeatEndType(recurrenceDefaults.repeatEndType);
	}, [initialTags, recurrenceDefaults]);

	const form = useAppForm({
		validators: { onBlur: eventSchema },
		defaultValues: {
			attendees: initialTags,
			color: event?.color ?? "blue",
			description: event?.description ?? "",
			endDate: initialDates.endDate,
			endTime: initialDates.endTime,
			isAllDay: event?.isAllDay ?? false,
			location: event?.location ?? "",
			meetingLink: event?.meetingLink ?? "",
			repeats: recurrenceDefaults.repeats,
			repeatCount: recurrenceDefaults.repeatCount,
			repeatEndType: recurrenceDefaults.repeatEndType,
			repeatFrequency: recurrenceDefaults.repeatFrequency,
			repeatInterval: recurrenceDefaults.repeatInterval,
			repeatUntil: recurrenceDefaults.repeatUntil,
			repeatWeekdays: recurrenceDefaults.repeatWeekdays,
			startDate: initialDates.startDate,
			startTime: initialDates.startTime,
			title: event?.title ?? "",
		} as EventFormData,
		onSubmit: async ({ value }) => {
			try {
				const eventStartDate = new Date(value.startDate);
				eventStartDate.setHours(
					value.startTime.hour,
					value.startTime.minute,
					0,
					0,
				);

				const eventEndDate = new Date(value.endDate);
				eventEndDate.setHours(value.endTime.hour, value.endTime.minute, 0, 0);

				const recurrenceRule = buildRRuleFromForm({
					repeats: value.repeats,
					repeatFrequency: value.repeatFrequency as RecurrenceFrequency,
					repeatInterval: value.repeatInterval,
					repeatWeekdays: value.repeatWeekdays as WeekdayCode[],
					repeatEndType: value.repeatEndType as RecurrenceEndType,
					repeatUntil: value.repeatUntil ?? null,
					repeatCount: value.repeatCount ?? null,
					startDate: value.startDate,
					startTime: value.startTime,
					timeZone: resolvedTimeZone,
				});

				const payload = {
					title: value.title,
					description: value.description ?? "",
					startDate: eventStartDate.toISOString(),
					endDate: eventEndDate.toISOString(),
					location: value.location?.trim() || null,
					meetingLink: value.meetingLink?.trim() || null,
					color: value.color as EventColor,
					attendees: (value.attendees as Tag[]).map((tag) => ({
						id: tag.id,
						email: null,
						name: tag.text,
						picturePath: `https://tapback.co/api/avatar/${tag.text}.webp`,
					})),
					isAllDay: false,
					timeZone: resolvedTimeZone,
					recurrence: recurrenceRule
						? {
								rule: recurrenceRule,
								timezone: resolvedTimeZone,
								exDates: [],
							}
						: null,
				};

				if (isEditing && event) {
					await updateEvent({
						...event,
						...payload,
					});
				} else {
					await addEvent(payload);
				}

				overlayState.close();
			} catch (error) {
				console.error(
					`Error ${isEditing ? "editing" : "adding"} event:`,
					error,
				);
				toast.error(`Failed to ${isEditing ? "edit" : "add"} event`);
			}
		},
	});

	const recurrenceState = useOverlayState();
	const overlayState = useOverlayState({
		onOpenChange: (nextOpen) => {
			if (nextOpen) return;

			recurrenceState.close();
			form.reset();
			setTags(initialTags);
			setRepeats(recurrenceDefaults.repeats);
			setRepeatFrequency(recurrenceDefaults.repeatFrequency);
			setRepeatEndType(recurrenceDefaults.repeatEndType);
		},
	});

	const handleSubmit = useCallback(
		(event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			event.stopPropagation();
			form.handleSubmit();
		},
		[form],
	);

	return (
		<Modal state={overlayState}>
			<Modal.Trigger>{children}</Modal.Trigger>
			<Modal.Backdrop>
				<Modal.Container>
					<Modal.Dialog className="p-4">
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Heading>
								{isEditing ? "Edit Event" : "Add New Event"}
							</Modal.Heading>
							<p className="text-sm text-foreground">
								{isEditing
									? "Modify your existing event."
									: "Create a new event for your calendar."}
							</p>
						</Modal.Header>
						<Modal.Body>
							<form.AppForm>
								<form
									id="event-form"
									onSubmit={handleSubmit}
									className="flex flex-col gap-4"
								>
									<form.AppField name="title">
										{(field) => (
											<field.FormItem>
												<field.FormLabel className="required">
													Title
												</field.FormLabel>
												<field.FormControl>
													<Input
														aria-label="Event title"
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
														setTags={(nextTags) => {
															setTags(nextTags);
															field.setValue(
																nextTags as EventFormData["attendees"],
															);
														}}
														placeholder="Add an attendee"
														styleClasses={{
															inlineTagsContainer:
																"border-input rounded-md bg-background shadow-xs transition-[color,box-shadow] focus-within:border-ring outline-none focus-within:ring-[3px] focus-within:ring-ring/50 p-1 gap-1",
															input: "w-full min-w-[80px] shadow-none px-2 h-7",
															tag: {
																body: "h-7 relative bg-background border border-input hover:bg-background rounded-md font-medium text-xs ps-2 pe-7",
																closeButton:
																	"absolute -inset-y-px -end-px p-0 rounded-e-md flex size-7 transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] text-foreground/80 hover:text-foreground",
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
															onSelect={(date) =>
																field.handleChange(date as Date)
															}
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
													<field.FormLabel>Event End Date</field.FormLabel>
													<field.FormControl>
														<SingleDayPicker
															id="endDate"
															onSelect={(date) =>
																field.handleChange(date as Date)
															}
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
													<field.FormLabel>Event End Time</field.FormLabel>
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
													<field.FormLabel>Location</field.FormLabel>
													<field.FormControl>
														<Input
															aria-label="Event location"
															id="location"
															placeholder="Enter a location"
															value={field.state.value}
															onChange={(e) =>
																field.handleChange(e.target.value)
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
													<field.FormLabel>Meeting Link</field.FormLabel>
													<field.FormControl>
														<Input
															aria-label="Meeting link"
															id="meetingLink"
															placeholder="Enter a meeting link"
															value={field.state.value}
															onChange={(e) =>
																field.handleChange(e.target.value)
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
													<Select
														aria-label="Select a variant"
														value={field.state.value}
														onChange={(key) => {
															if (key !== null && !Array.isArray(key)) {
																field.handleChange(String(key) as EventColor);
															}
														}}
													>
														<Select.Trigger>
															<Select.Value />
															<Select.Indicator />
														</Select.Trigger>
														<Select.Popover>
															<ListBox>
																{EVENT_COLORS.map((color) => (
																	<ListBox.Item
																		id={color}
																		key={color}
																		textValue={color}
																		className="capitalize"
																	>
																		<span
																			className={`rounded-full size-3.5 bg-${color}-600 dark:bg-${color}-700`}
																		/>
																		{color}
																		<ListBox.ItemIndicator />
																	</ListBox.Item>
																))}
															</ListBox>
														</Select.Popover>
													</Select>
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
													<TextArea
														aria-label="Event description"
														value={field.state.value}
														onChange={(e) => field.handleChange(e.target.value)}
														placeholder="Enter a description"
													/>
												</field.FormControl>
												<field.FormMessage />
											</field.FormItem>
										)}
									</form.AppField>

									<div className="space-y-4 rounded-lg border p-4">
										<form.AppField name="repeats">
											{(field) => (
												<field.FormItem className="flex items-center justify-between">
													<div className="space-y-1">
														<field.FormLabel>Does this repeat?</field.FormLabel>
														<p className="text-sm text-foreground">
															Create a recurring series for this manual event.
														</p>
													</div>
													<field.FormControl>
														<Switch
															aria-label="Does this repeat?"
															isSelected={Boolean(field.state.value)}
															onChange={(checked: boolean) => {
																field.handleChange(checked);
																setRepeats(checked);
																if (checked) {
																	recurrenceState.open();
																} else {
																	recurrenceState.close();
																}
															}}
														>
															<Switch.Control>
																<Switch.Thumb />
															</Switch.Control>
														</Switch>
													</field.FormControl>
												</field.FormItem>
											)}
										</form.AppField>

										{repeats ? (
											<>
												<div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2">
													<p className="text-sm text-foreground">
														Repeats {repeatFrequency}
														{repeatEndType === "never"
															? ""
															: `, ends ${repeatEndType}`}
													</p>
													<Button
														type="button"
														variant="secondary"
														size="sm"
														onPress={recurrenceState.open}
													>
														Edit repeat settings
													</Button>
												</div>
												<Modal.Backdrop
													isOpen={recurrenceState.isOpen}
													onOpenChange={recurrenceState.setOpen}
												>
													<Modal.Container>
														<Modal.Dialog className="sm:max-w-[520px]">
															<Modal.CloseTrigger />
															<Modal.Header>
																<Modal.Heading>Repeat settings</Modal.Heading>
																<p className="text-sm text-foreground">
																	Choose how this event should repeat.
																</p>
															</Modal.Header>
															<Modal.Body>
																<div className="space-y-4">
																	<div className="grid grid-cols-2 gap-4">
																		<form.AppField name="repeatFrequency">
																			{(field) => (
																				<field.FormItem>
																					<field.FormLabel>
																						Frequency
																					</field.FormLabel>
																					<field.FormControl>
																						<Select
																							aria-label="Frequency"
																							value={
																								field.state.value ?? "weekly"
																							}
																							onChange={(key) => {
																								if (
																									key === null ||
																									Array.isArray(key)
																								)
																									return;
																								field.handleChange(
																									String(
																										key,
																									) as RecurrenceFrequency,
																								);
																								setRepeatFrequency(
																									String(
																										key,
																									) as RecurrenceFrequency,
																								);
																							}}
																						>
																							<Select.Trigger>
																								<Select.Value />
																								<Select.Indicator />
																							</Select.Trigger>
																							<Select.Popover>
																								<ListBox>
																									<ListBox.Item
																										id="daily"
																										textValue="Daily"
																									>
																										Daily
																										<ListBox.ItemIndicator />
																									</ListBox.Item>
																									<ListBox.Item
																										id="weekly"
																										textValue="Weekly"
																									>
																										Weekly
																										<ListBox.ItemIndicator />
																									</ListBox.Item>
																									<ListBox.Item
																										id="monthly"
																										textValue="Monthly"
																									>
																										Monthly
																										<ListBox.ItemIndicator />
																									</ListBox.Item>
																									<ListBox.Item
																										id="yearly"
																										textValue="Yearly"
																									>
																										Yearly
																										<ListBox.ItemIndicator />
																									</ListBox.Item>
																								</ListBox>
																							</Select.Popover>
																						</Select>
																					</field.FormControl>
																					<field.FormMessage />
																				</field.FormItem>
																			)}
																		</form.AppField>
																		<form.AppField name="repeatInterval">
																			{(field) => (
																				<field.FormItem>
																					<field.FormLabel>
																						Repeat every
																					</field.FormLabel>
																					<field.FormControl>
																						<Input
																							aria-label="Repeat interval"
																							type="number"
																							min={1}
																							value={field.state.value ?? 1}
																							onChange={(e) =>
																								field.handleChange(
																									e.target.valueAsNumber || 1,
																								)
																							}
																						/>
																					</field.FormControl>
																					<field.FormMessage />
																				</field.FormItem>
																			)}
																		</form.AppField>
																	</div>

																	{repeatFrequency === "weekly" ? (
																		<form.AppField name="repeatWeekdays">
																			{(field) => (
																				<field.FormItem>
																					<field.FormLabel>
																						Occurrence starts on
																					</field.FormLabel>
																					<field.FormControl>
																						<div className="flex flex-wrap gap-2">
																							{WEEKDAY_OPTIONS.map(
																								(weekday) => {
																									const selectedWeekdays =
																										Array.isArray(
																											field.state.value,
																										)
																											? field.state.value
																											: [];
																									const isSelected =
																										selectedWeekdays.includes(
																											weekday.code,
																										);

																									return (
																										<Button
																											key={weekday.code}
																											type="button"
																											variant={
																												isSelected
																													? "secondary"
																													: "outline"
																											}
																											size="sm"
																											onPress={() => {
																												const nextValue =
																													isSelected
																														? selectedWeekdays.filter(
																																(value) =>
																																	value !==
																																	weekday.code,
																															)
																														: [
																																...selectedWeekdays,
																																weekday.code,
																															];
																												field.handleChange(
																													nextValue as EventFormData["repeatWeekdays"],
																												);
																											}}
																										>
																											{weekday.label}
																										</Button>
																									);
																								},
																							)}
																						</div>
																					</field.FormControl>
																					<field.FormMessage />
																				</field.FormItem>
																			)}
																		</form.AppField>
																	) : null}

																	<form.AppField name="repeatEndType">
																		{(field) => (
																			<field.FormItem>
																				<field.FormLabel>
																					Series Ends
																				</field.FormLabel>
																				<field.FormControl>
																					<Select
																						aria-label="Series Ends"
																						value={field.state.value ?? "never"}
																						onChange={(key) => {
																							if (
																								key === null ||
																								Array.isArray(key)
																							)
																								return;
																							field.handleChange(
																								String(
																									key,
																								) as RecurrenceEndType,
																							);
																							setRepeatEndType(
																								String(
																									key,
																								) as RecurrenceEndType,
																							);
																						}}
																					>
																						<Select.Trigger>
																							<Select.Value />
																							<Select.Indicator />
																						</Select.Trigger>
																						<Select.Popover>
																							<ListBox>
																								<ListBox.Item
																									id="never"
																									textValue="Never"
																								>
																									Never
																									<ListBox.ItemIndicator />
																								</ListBox.Item>
																								<ListBox.Item
																									id="on"
																									textValue="On date"
																								>
																									On date
																									<ListBox.ItemIndicator />
																								</ListBox.Item>
																								<ListBox.Item
																									id="after"
																									textValue="After count"
																								>
																									After count
																									<ListBox.ItemIndicator />
																								</ListBox.Item>
																							</ListBox>
																						</Select.Popover>
																					</Select>
																				</field.FormControl>
																				<field.FormMessage />
																			</field.FormItem>
																		)}
																	</form.AppField>

																	{repeatEndType === "on" ? (
																		<form.AppField name="repeatUntil">
																			{(field) => (
																				<field.FormItem>
																					<field.FormLabel>
																						Series End Date
																					</field.FormLabel>
																					<field.FormControl>
																						<SingleDayPicker
																							id="repeatUntil"
																							onSelect={(date) =>
																								field.handleChange(date as Date)
																							}
																							value={
																								field.state.value ?? undefined
																							}
																							placeholder="Choose a series end date"
																						/>
																					</field.FormControl>
																					<field.FormMessage />
																				</field.FormItem>
																			)}
																		</form.AppField>
																	) : null}

																	{repeatEndType === "after" ? (
																		<form.AppField name="repeatCount">
																			{(field) => (
																				<field.FormItem>
																					<field.FormLabel>
																						Number of occurrences
																					</field.FormLabel>
																					<field.FormControl>
																						<Input
																							aria-label="Repeat occurrence count"
																							type="number"
																							min={1}
																							value={field.state.value ?? ""}
																							onChange={(e) =>
																								field.handleChange(
																									e.target.valueAsNumber ||
																										null,
																								)
																							}
																						/>
																					</field.FormControl>
																					<field.FormMessage />
																				</field.FormItem>
																			)}
																		</form.AppField>
																	) : null}
																</div>
															</Modal.Body>
															<Modal.Footer>
																<Button
																	type="button"
																	variant="tertiary"
																	onPress={() => {
																		form.setFieldValue("repeats", false);
																		setRepeats(false);
																		recurrenceState.close();
																	}}
																>
																	Turn off repeat
																</Button>
																<Button
																	type="button"
																	onPress={recurrenceState.close}
																>
																	Apply repeat settings
																</Button>
															</Modal.Footer>
														</Modal.Dialog>
													</Modal.Container>
												</Modal.Backdrop>
											</>
										) : null}
									</div>
								</form>

								<div className="flex justify-end gap-2 mt-4">
									<Button slot="close" type="button" variant="outline">
										Cancel
									</Button>
									<Button form="event-form" type="submit">
										{isEditing ? "Save Changes" : "Create Event"}
									</Button>
								</div>
							</form.AppForm>
						</Modal.Body>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</Modal>
	);
}
