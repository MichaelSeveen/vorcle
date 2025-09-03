import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface AddActionItemInputProps {
  showAddInput: boolean;
  setShowAddInput: (show: boolean) => void;
  newItemText: string;
  setNewItemText: (text: string) => void;
  onAddItem: () => void;
}

function AddActionItemInput({
  showAddInput,
  setShowAddInput,
  newItemText,
  setNewItemText,
  onAddItem,
}: AddActionItemInputProps) {
  if (showAddInput) {
    return (
      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
        <Input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Enter action item..."
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onAddItem();
            }
            if (e.key === "Escape") {
              setShowAddInput(false);
              setNewItemText("");
            }
          }}
          autoFocus
        />
        <Button onClick={onAddItem} disabled={!newItemText.trim()} size="sm">
          Add
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setShowAddInput(false);
            setNewItemText("");
          }}
        >
          Cancel
        </Button>
      </div>
    );
  }
  return (
    <Button variant="outline" size="sm" onClick={() => setShowAddInput(true)}>
      <Plus />
      <span>Add Action Item</span>
    </Button>
  );
}

export default AddActionItemInput;
