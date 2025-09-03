import { Button } from "@/components/ui/button";
import { ChevronDown, ExternalLink, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Integration, IntegrationProvider } from "@/config/types";
import { AsanaIcon, JiraIcon, TrelloIcon } from "@/components/custom-icons";

interface ActionItemRowProps {
  item: {
    id: number;
    text: string;
  };
  integrations: Integration[];
  loading: { [key: string]: boolean };
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

  function handleIntegrationLogo(name: Integration["provider"]) {
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
    <div className="group relative">
      <div className="flex items-start gap-3">
        <span className="size-2 rounded-full bg-primary mt-2 flex-shrink-0" />

        <p className="flex-1 text-sm leading-relaxed text-foreground">
          {item.text}
        </p>

        {hasConnectedIntegrations && (
          <div className="transition-opacity relative">
            {integrations.length === 1 ? (
              <Button
                onClick={() => addToIntegration(integrations[0].provider, item)}
                disabled={loading[`${integrations[0].provider}-${item.id}`]}
                size="sm"
                className="px-3 py-1 text-xs flex items-center gap-1"
              >
                {loading[`${integrations[0].provider}-${item.id}`] ? (
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
                        {loading[`${integration.provider}-${item.id}`]
                          ? "Adding..."
                          : `Add to ${integration.name}`}
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
          size="sm"
          onClick={() => handleDeleteItem(item.id)}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 text-destructive rounded transition-all cursor-pointer"
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}

{
  /* <div className='w-4 h-4 relative flex-shrink-0'>
                                                <img
                                                    src={integration.logo}
                                                    alt={integration.name}
                                                    className='w-full h-full object-contain'
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none'
                                                    }}
                                                />

                                            </div> */
}
