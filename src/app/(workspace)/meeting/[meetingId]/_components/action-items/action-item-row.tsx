import { Button, Dropdown, Label } from "@heroui/react";
import {
	ArrowDown01Icon,
	Delete02Icon,
	Share04Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	AsanaIcon,
	JiraIcon,
	NotionIcon,
	SlackIcon,
	TrelloIcon,
} from "@/components/custom-icons";
import type { ActionItem, UserIntegrationResult } from "@/config/types";
import { formatActionItemMetadata } from "@/helpers/meetings/action-items";

interface ActionItemRowProps {
	item: ActionItem;
	integrations: UserIntegrationResult[];
	pendingIntegrationKeys: string[];
	addToIntegration: (provider: string, item: ActionItem) => void;
	handleDeleteItem: (id: number) => void;
}

export default function ActionItemRow({
	item,
	integrations,
	pendingIntegrationKeys,
	addToIntegration,
	handleDeleteItem,
}: ActionItemRowProps) {
	const hasConnectedIntegrations = integrations.length > 0;
	const isAnyIntegrationPendingForItem = integrations.some((integration) =>
		pendingIntegrationKeys.includes(
			getPendingIntegrationKey(item.id, integration.provider),
		),
	);

	function handleIntegrationLogo(name: UserIntegrationResult["provider"]) {
		switch (name) {
			case "jira":
				return <JiraIcon />;

			case "trello":
				return <TrelloIcon />;

			case "asana":
				return <AsanaIcon />;

			case "notion":
				return <NotionIcon />;

			case "slack":
				return <SlackIcon />;
			default:
				break;
		}
	}

	return (
		<li className="group relative">
			<div className="flex items-center gap-3">
				<span className="size-2 rounded-full bg-accent shrink-0 ml-0.5" />

				<div className="flex-1 space-y-1">
					<p className="text-sm text-foreground">{item.text}</p>
					{formatActionItemMetadata(item) ? (
						<p className="text-xs text-foreground">
							{formatActionItemMetadata(item)}
						</p>
					) : null}
				</div>

				{hasConnectedIntegrations && (
					<div className="transition-opacity relative">
						{integrations.length === 1 ? (
							<Button
								onPress={() => addToIntegration(integrations[0].provider, item)}
								isDisabled={isAnyIntegrationPendingForItem}
								size="sm"
								className="px-3 py-1 text-xs flex items-center gap-1"
							>
								{pendingIntegrationKeys.includes(
									getPendingIntegrationKey(item.id, integrations[0].provider),
								) ? (
									"Adding..."
								) : (
									<>
										Add to {integrations[0].name}
										<HugeiconsIcon icon={Share04Icon} />
									</>
								)}
							</Button>
						) : (
							<Dropdown>
								<Button size="sm" isDisabled={isAnyIntegrationPendingForItem}>
									{isAnyIntegrationPendingForItem ? "Adding..." : "Add to"}
									{isAnyIntegrationPendingForItem ? null : (
										<HugeiconsIcon icon={ArrowDown01Icon} />
									)}
								</Button>
								<Dropdown.Popover
									placement="bottom end"
									className="min-w-[160px]"
								>
									<Dropdown.Menu>
										{integrations.map((integration) => (
											<Dropdown.Item
												key={integration.provider}
												id={integration.provider}
												textValue={`Add to ${integration.name}`}
												onAction={() =>
													addToIntegration(integration.provider, item)
												}
												isDisabled={isAnyIntegrationPendingForItem}
											>
												{handleIntegrationLogo(integration.provider)}
												<Label>
													{pendingIntegrationKeys.includes(
														getPendingIntegrationKey(
															item.id,
															integration.provider,
														),
													)
														? "Adding..."
														: `Add to ${integration.name}`}
												</Label>
											</Dropdown.Item>
										))}
									</Dropdown.Menu>
								</Dropdown.Popover>
							</Dropdown>
						)}
					</div>
				)}
				<Button
					variant="ghost"
					isIconOnly
					onPress={() => handleDeleteItem(item.id)}
					className="opacity-0 group-hover:opacity-100 hover:bg-destructive/20 text-destructive rounded transition-all cursor-pointer"
				>
					<HugeiconsIcon icon={Delete02Icon} />
				</Button>
			</div>
		</li>
	);
}

function getPendingIntegrationKey(itemId: number, provider: string) {
	return `${itemId}:${provider}`;
}
