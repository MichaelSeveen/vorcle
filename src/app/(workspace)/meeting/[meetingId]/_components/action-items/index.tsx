import { toast } from "sonner";
import { useActionItems } from "../../hooks/use-action-items";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import ActionItemsList from "./action-item-list";
import AddActionItemInput from "./add-action-item-input";
import {
  createActionItem,
  removeActionItem,
} from "@/app/actions/meeting-action-items";
import { ActionItem } from "@/config/types";
import { Skeleton } from "@/components/ui/skeleton";

export interface ActionItemsProps {
  actionItems: ActionItem[];
  onDeleteItem: (id: number) => void;
  onAddItem: (text: string) => void;
  meetingId: string;
}

export default function ActionItems({
  actionItems,
  onDeleteItem,
  onAddItem,
  meetingId,
}: ActionItemsProps) {
  const {
    integrations,
    integrationsLoaded,
    loading,
    setLoading,
    showAddInput,
    setShowAddInput,
    newItemText,
    setNewItemText,
  } = useActionItems();

  const addToIntegration = async (provider: string, actionItem: ActionItem) => {
    setLoading((prev) => ({ ...prev, [`${provider}-${actionItem.id}`]: true }));
    try {
      toast.success(`Action item added to ${provider}`);

      await fetch("/api/integrations/action-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          actionItem: actionItem.text,
          meetingId,
        }),
      });
    } finally {
      setLoading((prev) => ({
        ...prev,
        [`${provider}-${actionItem.id}`]: false,
      }));
    }
  };

  const handleAddNewItem = async () => {
    if (!newItemText.trim()) {
      return;
    }

    try {
      const { success, error, data } = await createActionItem(
        meetingId,
        newItemText
      );

      if (error) {
        toast.error(error);
      }

      if (success && data) {
        toast.success("Added action item!");
        onAddItem(data.text);
        setNewItemText("");
        setShowAddInput(false);
      }
    } catch (error) {
      console.error("Failed to add action item:", error);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    try {
      const { success, error } = await removeActionItem(meetingId, itemId);

      if (error) {
        toast.error(error);
      }

      if (success) {
        toast.success("Deleted action item!");
        onDeleteItem(itemId);
      }
    } catch (error) {
      console.error("Failed to delete action item:", error);
    }
  };

  const hasConnectedIntegrations = integrations.length > 0;

  if (!integrationsLoaded) {
    return (
      <div className="px-4 mb-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Action Items
        </h3>

        <div className="space-y-4">
          {actionItems.map((item) => (
            <div key={item.id} className="group relative">
              <div className="flex items-center gap-3">
                <p className="flex-1 text-sm leading-relaxed text-foreground">
                  {item.text}
                </p>
                <Skeleton className="h-6 w-20" />

                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 text-destructive rounded transition-all"
                  disabled
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 mb-4">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Action Items
      </h3>

      <ActionItemsList
        actionItems={actionItems}
        integrations={integrations}
        loading={loading}
        addToIntegration={addToIntegration}
        handleDeleteItem={handleDeleteItem}
      />

      <AddActionItemInput
        showAddInput={showAddInput}
        setShowAddInput={setShowAddInput}
        newItemText={newItemText}
        setNewItemText={setNewItemText}
        onAddItem={handleAddNewItem}
      />

      {!hasConnectedIntegrations && actionItems.length > 0 && (
        <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30">
          <p className="text-xs text-muted-foreground text-center">
            <a href="/integrations" className="text-primary hover:underline">
              Connect Integrations
            </a>{" "}
            to add action items to your tools
          </p>
        </div>
      )}
    </div>
  );
}

// const response = await fetch(`/api/meetings/${meetingId}/action-items`, {
//   method: "POST",
//   headers: {
//     "Content-Type": "application/json",
//   },
//   body: JSON.stringify({
//     text: newItemText,
//   }),
// });
