"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface AddActionItemInputProps {
  onAddItem: (text: string) => Promise<void>;
  isPending: boolean;
}

export default function AddActionItemInput({
  onAddItem,
  isPending,
}: AddActionItemInputProps) {
  const [showAddInput, setShowAddInput] = useState(false);
  const [newItemText, setNewItemText] = useState("");

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
              onAddItem(newItemText);
            }
            if (e.key === "Escape") {
              setShowAddInput(false);
              setNewItemText("");
            }
          }}
          autoFocus
          disabled={isPending}
        />
        <Button
          onClick={() => onAddItem(newItemText)}
          disabled={!newItemText.trim() || isPending}
          size="sm"
        >
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
    <Button
      variant="outline"
      size="sm"
      className="mt-3"
      disabled={isPending}
      onClick={() => setShowAddInput(true)}
    >
      <Plus />
      Add Action Item
    </Button>
  );
}
