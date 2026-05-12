import { Avatar, ListBox, Select } from "@heroui/react";
import { useCalendar } from "../context/calendar-context";

export default function UsersMenu() {
	const { users, selectedUserId, filterEventsBySelectedUser } = useCalendar();

	return (
		<Select
			aria-label="Filter by user"
			value={selectedUserId ?? "all"}
			onChange={(key) => {
				if (key !== null && !Array.isArray(key)) {
					filterEventsBySelectedUser(String(key));
				}
			}}
		>
			<Select.Trigger>
				<Select.Value />
				<Select.Indicator />
			</Select.Trigger>
			<Select.Popover placement="bottom end">
				<ListBox>
					<ListBox.Item id="all" textValue="All">
						All
						<ListBox.ItemIndicator />
					</ListBox.Item>
					{users.map((user) => (
						<ListBox.Item key={user.id} id={user.id} textValue={user.name}>
							<Avatar size="sm" className="size-5 shrink-0">
								<Avatar.Image
									src={user.picturePath ?? ""}
									alt={`Profile image of ${user.name}`}
								/>
								<Avatar.Fallback className="text-[8px]">
									{user.name
										.split(" ")
										.map((n) => n[0])
										.join("")}
								</Avatar.Fallback>
							</Avatar>
							{user.name}
							<ListBox.ItemIndicator />
						</ListBox.Item>
					))}
				</ListBox>
			</Select.Popover>
		</Select>
	);
}
