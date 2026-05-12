"use client";

import { Button, Dropdown, Label } from "@heroui/react";
import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";

export function ThemeSwitcher() {
	const { setTheme } = useTheme();

	return (
		<Dropdown>
			<Button isIconOnly variant="outline" aria-label="Toggle theme">
				<HugeiconsIcon
					icon={Sun03Icon}
					size={18}
					className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
				/>
				<HugeiconsIcon
					icon={Moon02Icon}
					size={18}
					className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
				/>
			</Button>
			<Dropdown.Popover>
				<Dropdown.Menu onAction={(key) => setTheme(String(key))}>
					<Dropdown.Item id="light" textValue="Light">
						<Label>Light</Label>
					</Dropdown.Item>
					<Dropdown.Item id="dark" textValue="Dark">
						<Label>Dark</Label>
					</Dropdown.Item>
					<Dropdown.Item id="system" textValue="System">
						<Label>System</Label>
					</Dropdown.Item>
				</Dropdown.Menu>
			</Dropdown.Popover>
		</Dropdown>
	);
}
