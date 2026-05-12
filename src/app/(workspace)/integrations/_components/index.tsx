"use client";

import { Alert, Modal } from "@heroui/react";
import type {
	IntegrationProvider,
	UserIntegrationResult,
} from "@/config/types";
import { useIntegrations } from "../hooks/use-integrations";
import IntegrationCard from "./integration-card";
import SetupForm from "./setup-form";

interface Props {
	integrationData: UserIntegrationResult[];
	calendarStatus: { success: boolean; message?: string; connected?: boolean };
	currentUserId: string;
}

export default function WorkspaceIntegrationsView({
	integrationData,
	calendarStatus,
	currentUserId,
}: Props) {
	const {
		integrations,
		setupProvider,
		setupData,
		setSetupData,
		isModalOpen,
		setIsModalOpen,
		isSetupLoading,
		error,
		loadSetupData,
		connectProvider,
		disconnectProvider,
		submitSetup,
		setSetupProvider,
	} = useIntegrations({
		integrationData,
		calendarStatus,
		currentUserId,
	});

	const activeIntegration = setupProvider
		? integrations.find(
				(i) => i.provider === (setupProvider as IntegrationProvider),
			)
		: null;

	const setUpDescription = activeIntegration?.description;

	return (
		<div className="max-w-6xl mx-auto w-full">
			<div className="mb-8">
				<h1 className="text-2xl md:text-4xl font-semibold text-foreground mb-2">
					Integrations
				</h1>

				<p className="text-sm md:text-base text-foreground">
					Connect your favourite tools to automatically add action items from
					meetings.
				</p>
			</div>

			{setupProvider && (
				<Modal.Backdrop
					isOpen={isModalOpen}
					onOpenChange={(open) => {
						setIsModalOpen(open);

						if (!open) {
							setSetupProvider(null);
							setSetupData(null);
							window.history.replaceState({}, "", "/integrations");
						}
					}}
				>
					<Modal.Container>
						<Modal.Dialog className="sm:max-w-md">
							<Modal.CloseTrigger />
							<Modal.Header>
								<Modal.Heading className="capitalize">
									{setupProvider}
								</Modal.Heading>
								<p className="text-sm text-muted">{setUpDescription}</p>
							</Modal.Header>
							<Modal.Body>
								<SetupForm
									key={setupProvider}
									provider={setupProvider}
									data={setupData}
									onSubmit={submitSetup}
									onRefresh={() => loadSetupData(setupProvider)}
									onCancel={() => {
										setSetupProvider(null);
										setSetupData(null);
										window.history.replaceState({}, "", "/integrations");
									}}
									loading={isSetupLoading}
								/>
							</Modal.Body>
						</Modal.Dialog>
					</Modal.Container>
				</Modal.Backdrop>
			)}

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
				{integrations.map((integration) => (
					<IntegrationCard
						key={integration.provider}
						integration={integration}
						enable={connectProvider}
						disable={disconnectProvider}
						onSetup={(provider) => {
							setSetupProvider(provider);
							setIsModalOpen(true);
							loadSetupData(provider);
						}}
					/>
				))}
			</div>

			<div className="max-w-xl w-full mt-12">
				{error && (
					<Alert status="danger" className="my-3">
						<Alert.Indicator />
						<Alert.Content>
							<Alert.Title>Error</Alert.Title>
							<Alert.Description>{error}</Alert.Description>
						</Alert.Content>
					</Alert>
				)}

				<Alert status="accent">
					<Alert.Indicator />
					<Alert.Content>
						<Alert.Title>How it works</Alert.Title>

						<Alert.Description>
							<ul className="mt-2 list-inside list-disc space-y-1 text-sm">
								<li>Connect your preferred tools above.</li>
								<li>Choose where to send action items during setup.</li>
								<li>
									In meetings, hover over action items and click &ldquo;Add
									to&rdquo;
								</li>
								<li>
									Choose one or more tools from the dropdown to add the task.
								</li>
							</ul>
						</Alert.Description>
					</Alert.Content>
				</Alert>
			</div>
		</div>
	);
}
