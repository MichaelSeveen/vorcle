import type { Selection } from "@heroui/react";
import {
	Button,
	Dropdown,
	Header,
	Label,
	Separator,
	Switch,
} from "@heroui/react";
import { Settings01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { REMINDER_LEAD_MINUTE_PRESETS } from "../config/settings";
import { useCalendar } from "../context/calendar-context";
import { useDragDrop } from "../context/dnd-context";

export function Settings() {
	const {
		badgeVariant,
		setBadgeVariant,
		showGoogleOverlay,
		setShowGoogleOverlay,
		remindersEnabled,
		setRemindersEnabled,
		reminderLeadMinutes,
		setReminderLeadMinutes,
		use24HourFormat,
		toggleTimeFormat,
		agendaModeGroupBy,
		setAgendaModeGroupBy,
	} = useCalendar();
	const { showConfirmation, setShowConfirmation } = useDragDrop();

	const isDotVariant = badgeVariant === "dot";

	return (
		<Dropdown>
			<Button
				isIconOnly
				variant="outline"
				aria-label="Calendar settings"
				className="shrink-0"
			>
				<HugeiconsIcon icon={Settings01Icon} />
			</Button>
			<Dropdown.Popover placement="bottom right">
				<Dropdown.Menu>
					<Dropdown.Section>
						<Header>Calendar settings</Header>
					</Dropdown.Section>
					<Separator />
					<Dropdown.Section>
						<Dropdown.Item
							id="drop-confirmation"
							textValue="Show drop confirmation"
							className="justify-between opacity-100"
						>
							<Label className="text-sm cursor-pointer">
								Show drop confirmation
							</Label>
							<Switch
								aria-label="Show drop confirmation"
								isSelected={showConfirmation}
								onChange={setShowConfirmation}
								size="sm"
							>
								<Switch.Control>
									<Switch.Thumb />
								</Switch.Control>
							</Switch>
						</Dropdown.Item>
						<Dropdown.Item
							id="dot-badge"
							textValue="Use dot badge"
							className="justify-between opacity-100"
						>
							<Label className="text-sm cursor-pointer">Use dot badge</Label>
							<Switch
								aria-label="Use dot badge"
								isSelected={isDotVariant}
								onChange={(checked: boolean) =>
									setBadgeVariant(checked ? "dot" : "colored")
								}
								size="sm"
							>
								<Switch.Control>
									<Switch.Thumb />
								</Switch.Control>
							</Switch>
						</Dropdown.Item>
						<Dropdown.Item
							id="24-hour"
							textValue="Use 24 hour format"
							className="justify-between opacity-100"
						>
							<Label className="text-sm cursor-pointer">
								Use{" "}
								<strong className="text-blue-600 md:text-blue-500">24</strong>{" "}
								hour format
							</Label>
							<Switch
								aria-label="Use 24 hour format"
								isSelected={use24HourFormat}
								onChange={toggleTimeFormat}
								size="sm"
							>
								<Switch.Control>
									<Switch.Thumb />
								</Switch.Control>
							</Switch>
						</Dropdown.Item>
						<Dropdown.Item
							id="google-overlay"
							textValue="Show Google overlay"
							className="justify-between opacity-100"
						>
							<Label className="text-sm cursor-pointer">
								Show Google overlay
							</Label>
							<Switch
								aria-label="Show Google overlay"
								isSelected={showGoogleOverlay}
								onChange={setShowGoogleOverlay}
								size="sm"
							>
								<Switch.Control>
									<Switch.Thumb />
								</Switch.Control>
							</Switch>
						</Dropdown.Item>
						<Dropdown.Item
							id="reminders"
							textValue="Enable reminders"
							className="justify-between opacity-100"
						>
							<Label className="text-sm cursor-pointer">Enable reminders</Label>
							<Switch
								aria-label="Enable reminders"
								isSelected={remindersEnabled}
								onChange={setRemindersEnabled}
								size="sm"
							>
								<Switch.Control>
									<Switch.Thumb />
								</Switch.Control>
							</Switch>
						</Dropdown.Item>
					</Dropdown.Section>
					<Separator />
					<Dropdown.Section>
						<Header>Reminder lead time</Header>
					</Dropdown.Section>

					<Dropdown.SubmenuTrigger>
						<Dropdown.Item id="reminderLeadTime" textValue="Reminder lead time">
							<Label>Reminder lead time</Label>
							<Dropdown.SubmenuIndicator />
						</Dropdown.Item>
						<Dropdown.Popover>
							<Dropdown.Menu
								selectionMode="single"
								selectedKeys={new Set([String(reminderLeadMinutes)])}
								onSelectionChange={(keys: Selection) => {
									if (keys === "all") return;
									const selected = [...keys][0];
									if (selected) setReminderLeadMinutes(Number(selected));
								}}
							>
								{REMINDER_LEAD_MINUTE_PRESETS.map((minutes) => (
									<Dropdown.Item
										key={String(minutes)}
										id={String(minutes)}
										textValue={`${minutes} minutes`}
									>
										{minutes} minutes
									</Dropdown.Item>
								))}
							</Dropdown.Menu>
						</Dropdown.Popover>
					</Dropdown.SubmenuTrigger>
					<Separator />

					<Dropdown.SubmenuTrigger>
						<Dropdown.Item
							id="agendaModeGroupBy"
							textValue="Agenda view group by"
						>
							<Label>Agenda view group by</Label>
							<Dropdown.SubmenuIndicator />
						</Dropdown.Item>
						<Dropdown.Popover>
							<Dropdown.Menu
								selectionMode="single"
								selectedKeys={new Set([String(agendaModeGroupBy)])}
								onSelectionChange={(keys: Selection) => {
									if (keys === "all") return;
									const selected = [...keys][0];
									if (selected)
										setAgendaModeGroupBy(selected as "date" | "color");
								}}
							>
								<Dropdown.Item id="date" textValue="Date">
									Date
								</Dropdown.Item>
								<Dropdown.Item id="color" textValue="Color">
									Color
								</Dropdown.Item>
							</Dropdown.Menu>
						</Dropdown.Popover>
					</Dropdown.SubmenuTrigger>
				</Dropdown.Menu>
			</Dropdown.Popover>
		</Dropdown>
	);
}
