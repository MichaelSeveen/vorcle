"use client";

import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Integration, IntegrationProvider } from "@/config/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTransition } from "react";
import { Switch } from "@/components/align-ui/switch";

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
      <CardHeader>
        <CardTitle className="inline-flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <integration.logo className="size-6" />
            {integration.name}
          </div>
          <Switch
            id={integration.provider}
            checked={integration.isProviderConnected}
            onCheckedChange={handleProviderToggle}
            disabled={providerTransition}
          />
        </CardTitle>

        <CardDescription>{integration.description}</CardDescription>
      </CardHeader>

      <CardContent>
        {integration.isProviderConnected &&
          integration.provider !== "google-calendar" &&
          (integration.boardName ||
            integration.projectName ||
            integration.channelName) && (
            <div className="p-2 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {integrationTitle}
                <strong className="ml-1 font-mono">
                  {integration.provider === "slack" &&
                    integration.channelName &&
                    `#${integration.channelName}`}
                  {integration.provider === "trello" && integration.boardName}
                  {integration.provider === "jira" && integration.projectName}
                  {integration.provider === "asana" && integration.projectName}
                </strong>
              </p>
            </div>
          )}

        {integration.isProviderConnected &&
          integration.provider === "google-calendar" && (
            <div className="p-2 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Status:
                <strong className="ml-1 font-mono">
                  Lambda auto-sync enabled
                </strong>
              </p>
            </div>
          )}
      </CardContent>

      <CardFooter>
        {integration.isProviderConnected ? (
          integration.provider === "google-calendar" ? null : (
            <Button
              variant="outline"
              onClick={() => onSetup(integration.provider)}
              className="w-full"
            >
              <Settings />
              Manage
            </Button>
          )
        ) : null}
      </CardFooter>
    </Card>
  );
}
