"use client";

import { Button, Card, Switch } from "@heroui/react";
import { Settings01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTransition } from "react";
import type { Integration, IntegrationProvider } from "@/config/types";

interface IntegrationCardProps {
	integration: Integration;
	enable: (provider: IntegrationProvider) => Promise<void>;
	disable: (provider: IntegrationProvider) => Promise<void>;
	onSetup: (provider: string) => void;
}

export default function IntegrationCard({
	integration,
	enable,
	disable,
	onSetup,
}: IntegrationCardProps) {
	const [providerTransition, startProviderTransition] = useTransition();

	const integrationTitle =
		integration.provider === "trello"
			? "Board Name:"
			: integration.provider === "notion"
				? "Database Name:"
				: integration.provider === "slack"
					? "Channel Name:"
					: "Project Name:";

	function handleProviderToggle(checked: boolean) {
		startProviderTransition(async () => {
			if (checked) {
				await enable(integration.provider);
			} else {
				await disable(integration.provider);
			}
		});
	}

	return (
		<Card>
			<Card.Header>
				<Card.Title className="inline-flex items-center justify-between">
					<div className="inline-flex items-center gap-2">
						<integration.logo className="size-6" />
						{integration.name}
					</div>
					<Switch
						aria-label={`Toggle ${integration.name}`}
						isSelected={integration.isProviderConnected}
						onChange={handleProviderToggle}
						isDisabled={providerTransition}
					>
						<Switch.Control>
							<Switch.Thumb />
						</Switch.Control>
					</Switch>
				</Card.Title>

				<Card.Description>{integration.description}</Card.Description>
			</Card.Header>

			<Card.Content>
				{integration.isProviderConnected &&
					integration.provider !== "google-calendar" &&
					(integration.boardName ||
						integration.databaseName ||
						integration.projectName ||
						integration.channelName) && (
						<div className="p-2 bg-muted/50 rounded-lg">
							<p className="text-sm text-foreground">
								{integrationTitle}
								<strong className="ml-1 font-mono">
									{integration.provider === "slack" &&
										integration.channelName &&
										`#${integration.channelName}`}
									{integration.provider === "trello" && integration.boardName}
									{integration.provider === "notion" &&
										integration.databaseName}
									{integration.provider === "jira" && integration.projectName}
									{integration.provider === "asana" && integration.projectName}
								</strong>
							</p>
						</div>
					)}

				{integration.isProviderConnected &&
					integration.provider === "google-calendar" && (
						<div className="p-2 bg-muted/50 rounded-lg">
							<p className="text-sm text-foreground">
								Status:
								<strong className="ml-1 font-mono">
									Inngest auto-sync enabled
								</strong>
							</p>
						</div>
					)}
			</Card.Content>

			<Card.Footer>
				{integration.isProviderConnected ? (
					integration.provider === "google-calendar" ? null : (
						<Button
							variant="outline"
							onPress={() => onSetup(integration.provider)}
							fullWidth
						>
							<HugeiconsIcon icon={Settings01Icon} />
							Manage
						</Button>
					)
				) : null}
			</Card.Footer>
		</Card>
	);
}
