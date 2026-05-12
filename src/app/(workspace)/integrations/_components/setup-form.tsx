import { Button, Checkbox, Input, Label, ListBox, Select } from "@heroui/react";
import { useState } from "react";
import type { Integration, IntegrationProvider } from "@/config/types";

type SelectableItem = {
	id?: string;
	key?: string;
	gid?: string;
	name: string;
};

type TrelloData = {
	workspaceId?: string;
	boards: SelectableItem[];
};

type SlackData = {
	workspaceId?: string;
	channels: SelectableItem[];
};

type NotionData = {
	workspaceId?: string;
	databases: SelectableItem[];
};

type ProjectData = {
	workspaceId?: string;
	projects: SelectableItem[];
};

interface SetupFormProps {
	provider: string;
	data: unknown;
	onSubmit: (
		provider: Integration["provider"],
		config: unknown,
	) => Promise<void>;
	onCancel: () => void;
	onRefresh?: () => void;
	loading: boolean;
}

export default function SetupForm({
	provider,
	data,
	onSubmit,
	onCancel,
	onRefresh,
	loading,
}: SetupFormProps) {
	const [selectedId, setSelectedId] = useState("");
	const [selectedName, setSelectedName] = useState("");
	const [createNew, setCreateNew] = useState(false);
	const [newName, setNewName] = useState("");

	const setupData = data as TrelloData | SlackData | NotionData | ProjectData;

	const items =
		provider === "trello"
			? (data as TrelloData)?.boards
			: provider === "slack"
				? (data as SlackData)?.channels
				: provider === "notion"
					? (data as NotionData)?.databases
					: (data as ProjectData)?.projects;

	const itemLabel =
		provider === "trello"
			? "board"
			: provider === "slack"
				? "channel"
				: provider === "notion"
					? "database"
					: "project";

	const allowCreateNew = provider !== "notion";
	const isCreatingNew = allowCreateNew && createNew;

	const handleSubmit = async () => {
		if (provider === "notion") {
			await onSubmit(provider as IntegrationProvider, {
				dataSourceId: selectedId,
				databaseName: selectedName,
			});
			return;
		}

		if (isCreatingNew) {
			await onSubmit(provider as IntegrationProvider, {
				createNew: true,
				[`${itemLabel}Name`]: newName,
				workspaceId: setupData?.workspaceId,
			});
			return;
		}

		await onSubmit(provider as IntegrationProvider, {
			[`${itemLabel}Id`]: selectedId,
			[`${itemLabel}Name`]: selectedName,
			projectKey: selectedId,
			workspaceId: setupData?.workspaceId,
		});
	};

	return (
		<div>
			{provider === "notion" ? (
				<div className="mb-4 rounded-lg border border-dashed p-3 text-sm text-foreground">
					Share the database with your Notion integration first. If it does not
					appear yet, click Refresh and wait a few seconds for Notion search to
					catch up.
				</div>
			) : null}

			<div className="mb-4">
				<Label className="block text-sm font-medium text-foreground mb-2">
					Select {itemLabel} for action items:
				</Label>

				{!isCreatingNew ? (
					<Select
						aria-label={`Select ${itemLabel} for action items`}
						selectedKey={selectedId || undefined}
						onSelectionChange={(key) => {
							const value = key as string;
							const selected = items?.find(
								(item) =>
									item.id === value || item.key === value || item.gid === value,
							);
							setSelectedId(value);
							setSelectedName(selected?.name || "");
						}}
						className="w-full"
						placeholder={`Choose existing ${itemLabel}...`}
					>
						<Select.Trigger>
							<Select.Value />
							<Select.Indicator />
						</Select.Trigger>
						<Select.Popover>
							<ListBox>
								{items?.map((item) => (
									<ListBox.Item
										key={item.id ?? item.key ?? item.gid}
										id={item.id ?? item.key ?? item.gid ?? ""}
										textValue={item.name}
									>
										{item.name}
										<ListBox.ItemIndicator />
									</ListBox.Item>
								))}
							</ListBox>
						</Select.Popover>
					</Select>
				) : (
					<Input
						aria-label={`New ${itemLabel} name`}
						type="text"
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						placeholder={`Enter new ${itemLabel} name...`}
					/>
				)}
			</div>

			{provider === "notion" ? (
				<div className="mb-6">
					<Button
						variant="outline"
						onPress={onRefresh}
						isDisabled={loading}
						fullWidth
						className="cursor-pointer"
					>
						Refresh databases
					</Button>
				</div>
			) : null}

			{allowCreateNew ? (
				<div className="mb-6">
					<div className="flex items-center gap-2 text-sm">
						<Checkbox
							isSelected={createNew}
							onChange={(checked) => setCreateNew(!!checked)}
						>
							Create new {itemLabel}
						</Checkbox>
					</div>
				</div>
			) : null}

			<div className="flex gap-3">
				<Button
					variant="outline"
					onPress={onCancel}
					className="flex-1 cursor-pointer"
				>
					Cancel
				</Button>

				<Button
					onPress={handleSubmit}
					isDisabled={
						loading ||
						(!allowCreateNew && !selectedId) ||
						(allowCreateNew && !isCreatingNew && !selectedId) ||
						(allowCreateNew && isCreatingNew && !newName)
					}
					className="flex-1 cursor-pointer"
				>
					{loading ? "Saving..." : "Save"}
				</Button>
			</div>
		</div>
	);
}
