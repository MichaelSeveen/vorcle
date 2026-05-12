import type { ActionItem, UserIntegrationResult } from "@/config/types";
import ActionItemRow from "./action-item-row";

interface ActionItemsListProps {
	actionItems: ActionItem[];
	integrations: UserIntegrationResult[];
	pendingIntegrationKeys: string[];
	addToIntegration: (provider: string, item: ActionItem) => void;
	handleDeleteItem: (id: number) => void;
}

export default function ActionItemsList(props: ActionItemsListProps) {
	return (
		<ul className="space-y-2">
			{props.actionItems.map((item) => (
				<ActionItemRow
					key={item.id}
					item={item}
					integrations={props.integrations}
					pendingIntegrationKeys={props.pendingIntegrationKeys}
					addToIntegration={props.addToIntegration}
					handleDeleteItem={props.handleDeleteItem}
				/>
			))}
		</ul>
	);
}
