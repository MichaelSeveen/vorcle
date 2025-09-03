import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Integration, IntegrationProvider } from "@/config/types";

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

type ProjectData = {
  workspaceId?: string;
  projects: SelectableItem[];
};

// type SetupFormData =
//   | { provider: "trello"; data: TrelloData }
//   | { provider: "slack"; data: SlackData }
//   | { provider: "asana" | "jira"; data: ProjectData };

interface SetupFormProps {
  provider: string;
  data: unknown;
  onSubmit: (provider: Integration["provider"], config: unknown) => void;
  onCancel: () => void;
  closeModal: (isModalOpen: boolean) => void;
  loading: boolean;
}

export default function SetupForm({
  provider,
  data,
  onSubmit,
  onCancel,
  loading,
  closeModal,
}: SetupFormProps) {
  const [selectedId, setSelectedId] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [createNew, setCreateNew] = useState(false);
  const [newName, setNewName] = useState("");

  const setupData = data as TrelloData | SlackData | ProjectData;

  const items =
    provider === "trello"
      ? (data as TrelloData)?.boards
      : provider === "slack"
      ? (data as SlackData)?.channels
      : (data as ProjectData)?.projects;

  const itemLabel =
    provider === "trello"
      ? "board"
      : provider === "slack"
      ? "channel"
      : "project";

  const handleSubmit = () => {
    if (createNew) {
      onSubmit(provider as IntegrationProvider, {
        createNew: true,
        [`${itemLabel}Name`]: newName,
        workspaceId: setupData?.workspaceId,
      });
      closeModal(true);
      return;
    }

    onSubmit(provider as IntegrationProvider, {
      [`${itemLabel}Id`]: selectedId,
      [`${itemLabel}Name`]: selectedName,
      projectKey: selectedId,
      workspaceId: setupData?.workspaceId,
    });

    closeModal(true);
  };

  return (
    <div>
      <div className="mb-4">
        <Label className="block text-sm font-medium text-foreground mb-2">
          Select {itemLabel} for action items:
        </Label>

        {!createNew ? (
          <Select
            value={selectedId}
            onValueChange={(value) => {
              const selected = items?.find(
                (item) =>
                  item.id === value || item.key === value || item.gid === value
              );
              setSelectedId(value);
              setSelectedName(selected?.name || "");
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={`Choose existing ${itemLabel}...`} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>
                  {itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)}s
                </SelectLabel>
                {items?.map((item) => (
                  <SelectItem
                    key={item.id ?? item.key ?? item.gid}
                    value={item.id ?? item.key ?? item.gid ?? ""}
                  >
                    {item.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        ) : (
          <Input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={`Enter new ${itemLabel} name...`}
          />
        )}
      </div>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm">
          <Checkbox
            id="create-new"
            checked={createNew}
            onCheckedChange={(checked) => setCreateNew(!!checked)}
          />

          <Label htmlFor="create-new">Create new {itemLabel}</Label>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1 cursor-pointer"
          type="button"
        >
          Cancel
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={
            loading || (!createNew && !selectedId) || (createNew && !newName)
          }
          className="flex-1 cursor-pointer"
          type="button"
        >
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
