"use client";

import { useTransition } from "react";
import Link from "next/link";
import ActionItemsList from "./action-item-list";
import AddActionItemInput from "./add-action-item-input";
import { ActionItem, UserIntegrationResult } from "@/config/types";
import { toast } from "sonner";
import { MeetingDetailError } from "../../hooks/use-meeting-details";

export interface ActionItemsProps {
  actionItems: ActionItem[];
  onDeleteItem: (id: number) => Promise<void>;
  onAddItem: (text: string) => Promise<void>;
  meetingId: string;
  integrations: UserIntegrationResult[];
  isPending: boolean;
  error: { type: MeetingDetailError; message: string } | null;
}

export default function ActionItems({
  actionItems,
  onDeleteItem,
  onAddItem,
  meetingId,
  integrations,
  error,
  isPending,
}: ActionItemsProps) {
  const [integrationTransition, startIntegrationTransition] = useTransition();

  function addToIntegration(provider: string, actionItem: ActionItem) {
    startIntegrationTransition(async () => {
      try {
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
      } catch (error) {
        console.error("Failed to add integration", error);
      }
    });
  }

  const hasConnectedIntegrations = integrations.length > 0;

  if (error && error.type === "actionItemError") {
    toast.error(error.message);
  }

  return (
    <div className="px-4 mb-4">
      <h3 className="text-lg font-semibold text-deep-saffron mb-4 font-mono">
        Action Items
      </h3>

      <ActionItemsList
        actionItems={actionItems}
        integrations={integrations}
        loading={integrationTransition}
        addToIntegration={addToIntegration}
        handleDeleteItem={onDeleteItem}
      />

      <AddActionItemInput onAddItem={onAddItem} isPending={isPending} />

      {!hasConnectedIntegrations && actionItems.length > 0 && (
        <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-dashed flex items-center justify-center">
          <Link href="/integrations" className="hover:underline text-sm">
            <strong>Connect Integrations</strong> to add action items to your
            tools
          </Link>
        </div>
      )}
    </div>
  );
}

// if (!integrationsLoaded) {
//   return (
//     <div className="px-4 mb-4">
//       <h3 className="text-lg font-semibold text-foreground mb-4">
//         Action Items
//       </h3>

//       <div className="space-y-4">
//         {actionItems.map((item) => (
//           <div key={item.id} className="group relative">
//             <div className="flex items-center gap-3">
//               <p className="flex-1 text-sm leading-relaxed text-foreground">
//                 {item.text}
//               </p>
//               <Skeleton className="h-6 w-20" />

//               <Button
//                 variant="ghost"
//                 size="icon"
//                 className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 text-destructive rounded transition-all"
//                 disabled
//               >
//                 <Trash2 />
//               </Button>
//             </div>
//           </div>
//         ))}
//         <Skeleton className="h-8 w-20" />
//       </div>
//     </div>
//   );
// }
