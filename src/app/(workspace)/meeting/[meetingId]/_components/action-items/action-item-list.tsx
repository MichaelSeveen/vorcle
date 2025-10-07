import { UserIntegrationResult } from "@/config/types";
import ActionItemRow from "./action-item-row";

interface ActionItemsListProps {
  actionItems: {
    id: number;
    text: string;
  }[];
  integrations: UserIntegrationResult[];
  loading: boolean;
  addToIntegration: (
    provider: string,
    item: { id: number; text: string }
  ) => void;
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
          loading={props.loading}
          addToIntegration={props.addToIntegration}
          handleDeleteItem={props.handleDeleteItem}
        />
      ))}
    </ul>
  );
}
