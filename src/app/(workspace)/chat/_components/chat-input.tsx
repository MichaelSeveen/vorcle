import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTokenUsage } from "../../_context";
import { segments } from "@/config/segments";

interface ChatInputProps {
  chatInput: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
}

export default function ChatInput({
  chatInput,
  onInputChange,
  onSendMessage,
  isLoading,
}: ChatInputProps) {
  const { canChat, usage, limits } = useTokenUsage();

  return (
    <div>
      {!canChat && usage && (
        <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <p className="text-sm text-deep-saffron text-center">
            Daily limit reached ({usage.chatMessagesToday}/{limits.chatMessages}{" "}
            messages used).
            <a href={segments.workspace.pricing} className="underline ml-1">
              Upgrade your plan
            </a>{" "}
            to continue chatting.
          </p>
        </div>
      )}

      <div className="flex gap-3 mx-auto w-full max-w-4xl">
        <Input
          type="text"
          value={chatInput}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSendMessage()}
          placeholder={
            canChat
              ? "Ask about any meeting — deadlines, decisions, action items, participants..."
              : "Daily chat limit reached - upgrade to continue"
          }
          className="flex-1"
          disabled={isLoading || !canChat}
        />

        <Button
          onClick={onSendMessage}
          disabled={isLoading || !canChat}
          size="icon"
          className="bg-deep-saffron hover:bg-deep-saffron/80"
        >
          <svg
            fill="var(--currentColor)"
            className="-rotate-90"
            viewBox="0 0 15 15"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M8.29289 2.29289C8.68342 1.90237 9.31658 1.90237 9.70711 2.29289L14.2071 6.79289C14.5976 7.18342 14.5976 7.81658 14.2071 8.20711L9.70711 12.7071C9.31658 13.0976 8.68342 13.0976 8.29289 12.7071C7.90237 12.3166 7.90237 11.6834 8.29289 11.2929L11 8.5H1.5C0.947715 8.5 0.5 8.05228 0.5 7.5C0.5 6.94772 0.947715 6.5 1.5 6.5H11L8.29289 3.70711C7.90237 3.31658 7.90237 2.68342 8.29289 2.29289Z" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
