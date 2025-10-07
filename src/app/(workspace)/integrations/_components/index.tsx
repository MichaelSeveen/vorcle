"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon, AlertTriangleIcon } from "lucide-react";
import { useIntegrations } from "../hooks/use-integrations";
import SetupForm from "./setup-form";
import IntegrationCard from "./integration-card";
import { IntegrationProvider, UserIntegrationResult } from "@/config/types";

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

  // if (isLoading) {
  //   return (
  //     <div className="h-full bg-background flex items-center justify-center">
  //       <div className="flex flex-col items-center justify-center gap-4">
  //         <Loader className="animate-spin size-8" />
  //         <p className="text-lg font-semibold">Loading Integrations...</p>
  //       </div>
  //     </div>
  //   );
  // }

  const activeIntegration = setupProvider
    ? integrations.find(
        (i) => i.provider === (setupProvider as IntegrationProvider)
      )
    : null;

  const setUpDescription = activeIntegration?.description;

  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl md:text-4xl font-semibold text-foreground mb-2">
          Integrations
        </h1>

        <p className="text-sm md:text-base text-muted-foreground">
          Connect your favourite tools to automatically add action items from
          meetings.
        </p>
      </div>

      {setupProvider && (
        <Dialog
          open={isModalOpen}
          onOpenChange={() => setIsModalOpen(!isModalOpen)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="capitalize">{setupProvider}</DialogTitle>
              <DialogDescription>{setUpDescription}</DialogDescription>
            </DialogHeader>

            <SetupForm
              provider={setupProvider}
              data={setupData}
              onSubmit={submitSetup}
              closeModal={setIsModalOpen}
              onCancel={() => {
                setSetupProvider(null);
                setSetupData(null);
                window.history.replaceState({}, "", "/integrations");
              }}
              loading={isSetupLoading}
            />
          </DialogContent>
        </Dialog>
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

      {error && (
        <Alert variant="destructive" className="my-3">
          <AlertTriangleIcon />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Alert className="mt-4">
        <AlertCircleIcon />
        <AlertTitle>How it works</AlertTitle>
        <AlertDescription>
          <ol className="text-sm list-decimal">
            <li>Connect your preferred tools above.</li>
            <li>Choose where to send action items during setup.</li>
            <li>
              In meetings, hover over action items and click &ldquo;Add
              to&rdquo;
            </li>
            <li>Choose one or more tools from the dropdown to add the task.</li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  );
}
