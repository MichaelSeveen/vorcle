"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import type { ActionItem, UserIntegrationResult } from "@/config/types";
import type { MeetingDetailError } from "../../hooks/use-meeting-details";
import ActionItemsList from "./action-item-list";
import AddActionItemInput from "./add-action-item-input";

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
	const [pendingIntegrationKeys, setPendingIntegrationKeys] = useState<
		string[]
	>([]);

	async function addToIntegration(provider: string, actionItem: ActionItem) {
		const pendingKey = getPendingIntegrationKey(actionItem.id, provider);

		setPendingIntegrationKeys((currentKeys) =>
			currentKeys.includes(pendingKey)
				? currentKeys
				: [...currentKeys, pendingKey],
		);

		try {
			const response = await fetch("/api/integrations/action-items", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					provider,
					actionItem,
					meetingId,
				}),
			});

			const payload = await response.json().catch(() => null);

			if (!response.ok) {
				throw new Error(
					payload?.error || `Failed to add action item to ${provider}`,
				);
			}

			toast.success(`Added action item to ${formatProviderName(provider)}`);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: `Failed to add action item to ${provider}`;

			toast.error(message);
			console.error("Failed to add integration", error);
		} finally {
			setPendingIntegrationKeys((currentKeys) =>
				currentKeys.filter((key) => key !== pendingKey),
			);
		}
	}

	const hasConnectedIntegrations = integrations.length > 0;

	if (error && error.type === "actionItemError") {
		toast.error(error.message);
	}

	return (
		<div className="px-4 mb-4">
			<h3 className="text-lg font-semibold mb-4 font-mono">Action Items</h3>

			<ActionItemsList
				actionItems={actionItems}
				integrations={integrations}
				pendingIntegrationKeys={pendingIntegrationKeys}
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

function formatProviderName(provider: string) {
	return provider.charAt(0).toUpperCase() + provider.slice(1);
}

function getPendingIntegrationKey(itemId: number, provider: string) {
	return `${itemId}:${provider}`;
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
