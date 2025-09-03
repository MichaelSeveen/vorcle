import { BadgeCheck, ExternalLink, Settings } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

interface IntegrationCardProps {
  integration: Integration;
  enable: (provider: IntegrationProvider) => void;
  disable: (provider: IntegrationProvider) => void;
  onSetup: (provider: string) => void;
}

function IntegrationCard({
  integration,
  enable,
  disable,
  onSetup,
}: IntegrationCardProps) {
  const integrationTitle =
    integration.provider === "trello"
      ? "Board Name:"
      : integration.provider === "slack"
      ? "Channel Name:"
      : "Project Name:";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="inline-flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <integration.logo className="size-6" />
            {integration.name}
          </div>
          <Badge
            variant="default"
            className="text-white bg-green-600 dark:bg-green-600"
          >
            <BadgeCheck />
            {integration.isProviderConnected ? "Enabled" : "Disabled"}
          </Badge>
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
          integration.provider === "google-calendar" ? (
            <Button
              variant="outline"
              onClick={() => disable(integration.provider)}
              className="flex-1 cursor-pointer"
              type="button"
            >
              Disable
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => disable(integration.provider)}
                className="flex-1 mr-2"
              >
                Disable
              </Button>
              <Button
                variant="outline"
                onClick={() => onSetup(integration.provider)}
                size="icon"
              >
                <Settings />
              </Button>
            </>
          )
        ) : (
          <Button
            onClick={() => enable(integration.provider)}
            className="w-full"
          >
            Enable
            <ExternalLink />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default IntegrationCard;
