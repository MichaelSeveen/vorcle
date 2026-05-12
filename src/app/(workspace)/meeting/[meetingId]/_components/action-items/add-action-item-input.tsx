"use client";

import { Button, Input } from "@heroui/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

interface AddActionItemInputProps {
	onAddItem: (text: string) => Promise<void>;
	isPending: boolean;
}

export default function AddActionItemInput({
	onAddItem,
	isPending,
}: AddActionItemInputProps) {
	const [showAddInput, setShowAddInput] = useState(false);
	const [newItemText, setNewItemText] = useState("");

	if (showAddInput) {
		return (
			<div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
				<Input
					aria-label="New action item"
					type="text"
					value={newItemText}
					onChange={(e) => setNewItemText(e.target.value)}
					placeholder="Enter action item..."
					className="flex-1"
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							onAddItem(newItemText);
						}
						if (e.key === "Escape") {
							setShowAddInput(false);
							setNewItemText("");
						}
					}}
					autoFocus
					disabled={isPending}
				/>
				<Button
					onPress={() => onAddItem(newItemText)}
					isDisabled={!newItemText.trim() || isPending}
					size="sm"
				>
					Add
				</Button>
				<Button
					variant="outline"
					size="sm"
					onPress={() => {
						setShowAddInput(false);
						setNewItemText("");
					}}
				>
					Cancel
				</Button>
			</div>
		);
	}
	return (
		<Button
			variant="outline"
			size="sm"
			className="mt-3"
			isDisabled={isPending}
			onPress={() => setShowAddInput(true)}
		>
			<HugeiconsIcon icon={Add01Icon} />
			Add Action Item
		</Button>
	);
}
