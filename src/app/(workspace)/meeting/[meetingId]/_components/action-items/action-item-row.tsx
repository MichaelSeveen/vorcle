import { Button } from "@/components/ui/button";
import { ChevronDown, ExternalLink, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserIntegrationResult, IntegrationProvider } from "@/config/types";
import { AsanaIcon, JiraIcon, TrelloIcon } from "@/components/custom-icons";

interface ActionItemRowProps {
  item: {
    id: number;
    text: string;
  };
  integrations: UserIntegrationResult[];
  loading: boolean;
  addToIntegration: (
    provider: string,
    item: { id: number; text: string }
  ) => void;
  handleDeleteItem: (id: number) => void;
}

export default function ActionItemRow({
  item,
  integrations,
  loading,
  addToIntegration,
  handleDeleteItem,
}: ActionItemRowProps) {
  const hasConnectedIntegrations = integrations.length > 0;

  function handleIntegrationLogo(name: UserIntegrationResult["provider"]) {
    switch (name) {
      case "jira":
        return <JiraIcon />;

      case "trello":
        return <TrelloIcon />;

      case "asana":
        return <AsanaIcon />;
      default:
        break;
    }
  }

  return (
    <li className="group relative">
      <div className="flex items-center gap-3">
        <span className="size-2 rounded-full bg-deep-saffron shrink-0 ml-0.5" />

        <p className="flex-1 text-sm text-foreground">{item.text}</p>

        {hasConnectedIntegrations && (
          <div className="transition-opacity relative">
            {integrations.length === 1 ? (
              <Button
                onClick={() => addToIntegration(integrations[0].provider, item)}
                disabled={loading}
                size="sm"
                className="px-3 py-1 text-xs flex items-center gap-1"
              >
                {loading ? (
                  "Adding..."
                ) : (
                  <>
                    Add to {integrations[0].name}
                    <ExternalLink />
                  </>
                )}
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm">
                    Add to
                    <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="min-w-[160px]">
                  {integrations.map((integration) => (
                    <DropdownMenuItem
                      key={integration.provider}
                      onClick={() =>
                        addToIntegration(integration.provider, item)
                      }
                    >
                      {handleIntegrationLogo(
                        integration.name.toLowerCase() as IntegrationProvider
                      )}

                      <span>
                        {loading ? "Adding..." : `Add to ${integration.name}`}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
        <Button
          variant="ghost"
          size="xs"
          onClick={() => handleDeleteItem(item.id)}
          className="opacity-0 group-hover:opacity-100 hover:bg-destructive/20 text-destructive rounded transition-all cursor-pointer"
        >
          <Trash2 />
        </Button>
      </div>
    </li>
  );
}
