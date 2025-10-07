import { SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDragDrop } from "../context/dnd-context";
import { useCalendar } from "../context/calendar-context";
import { Switch } from "@/components/align-ui/switch";

export function Settings() {
  const {
    badgeVariant,
    setBadgeVariant,
    use24HourFormat,
    toggleTimeFormat,
    agendaModeGroupBy,
    setAgendaModeGroupBy,
  } = useCalendar();
  const { showConfirmation, setShowConfirmation } = useDragDrop();

  const isDotVariant = badgeVariant === "dot";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <SettingsIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel>Calendar settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="justify-between">
            Show drop confirmation
            <Switch
              checked={showConfirmation}
              onCheckedChange={(checked) => setShowConfirmation(checked)}
            />
          </DropdownMenuItem>
          <DropdownMenuItem className="justify-between">
            Use dot badge
            <Switch
              checked={isDotVariant}
              onCheckedChange={(checked) =>
                setBadgeVariant(checked ? "dot" : "colored")
              }
            />
          </DropdownMenuItem>
          <DropdownMenuItem className="justify-between">
            <p>
              {" "}
              Use <strong className="text-blue-600 md:text-blue-500">
                24
              </strong>{" "}
              hour format
            </p>
            <Switch
              checked={use24HourFormat}
              onCheckedChange={toggleTimeFormat}
            />
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Agenda view group by</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={agendaModeGroupBy}
            onValueChange={(value) =>
              setAgendaModeGroupBy(value as "date" | "color")
            }
          >
            <DropdownMenuRadioItem value="date">Date</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="color">Color</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
