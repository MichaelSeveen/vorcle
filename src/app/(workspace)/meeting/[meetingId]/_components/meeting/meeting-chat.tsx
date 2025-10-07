import Link from "next/link";
import { useTokenUsage } from "@/app/(workspace)/_context";
import { VorcleLogo } from "@/components/custom-icons/brand-logo";
import { WandSparkleIcon } from "@/components/custom-icons/duotone";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { segments } from "@/config/segments";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

interface ChatSidebarProps {
  messages: Message[];
  chatInput: string;
  showSuggestions: boolean;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onSuggestionClick: (suggestion: string) => void;
}

export default function MeetingChat({
  messages,
  chatInput,
  showSuggestions,
  onInputChange,
  onSendMessage,
  onSuggestionClick,
}: ChatSidebarProps) {
  const { canChat } = useTokenUsage();

  const chatSuggestions = [
    "What deadlines were discussed in this meeting?",
    "Write a follow-up email for the team",
    "What suggestions was I given during the discussion?",
    "Summarize the key action items from this meeting",
  ];

  return (
    <div className="relative h-[calc(100%-3.75rem)]">
      <ScrollArea className="flex-1 pt-3 h-[30rem]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex items-center gap-1 mb-2",
              message.isBot ? "justify-start" : "justify-end"
            )}
          >
            <div
              className={cn(
                "items-center justify-center size-8 ring ring-accent rounded-full ml-1",
                message.isBot ? "flex" : "hidden"
              )}
            >
              <VorcleLogo className="size-5" />
            </div>
            <div
              className={cn(
                "max-w-[60%] rounded-md p-2",
                message.isBot
                  ? "bg-muted text-foreground"
                  : "bg-primary text-primary-foreground"
              )}
            >
              <p className="text-sm text-pretty">{message.content}</p>
            </div>
          </div>
        ))}

        {messages.length > 0 && !messages[messages.length - 1].isBot && (
          <div className="flex justify-start">
            <div className="bg-muted text-foreground rounded-lg p-2">
              <p className="text-sm">Thinking...</p>
            </div>
          </div>
        )}
        {showSuggestions && messages.length === 0 && (
          <div className="flex flex-col items-center space-y-3 mt-12">
            {chatSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSuggestionClick(suggestion)}
                disabled={!canChat}
                className={cn(
                  "w-full rounded-lg p-3 border transition-colors inline-flex gap-2",
                  canChat
                    ? "bg-card text-foreground"
                    : "bg-muted/50 text-muted-foreground border-muted cursor-not-allowed"
                )}
              >
                <WandSparkleIcon className="size-4" />
                <p className="text-sm text-balance">{suggestion}</p>
              </button>
            ))}
          </div>
        )}

        {!canChat && (
          <div className="text-center p-4">
            <p className="text-xs text-muted-foreground mb-2">
              Daily chat limit reached
            </p>
            <Link
              href={segments.workspace.pricing}
              className={buttonVariants({ size: "sm", className: "w-fit" })}
            >
              Upgrade to continue chatting
            </Link>
          </div>
        )}
      </ScrollArea>

      <div className="absolute bottom-0 pt-3 border-t border-dashed w-full">
        <div className="flex gap-2">
          <Input
            type="text"
            value={chatInput}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key == "Enter") {
                e.preventDefault();
                onSendMessage();
              }
            }}
            placeholder={
              canChat ? "Ask about this meeting..." : "Daily limit reached"
            }
            className="flex-1"
            disabled={!canChat}
          />

          <Button
            type="button"
            size="icon"
            className="bg-deep-saffron"
            onClick={onSendMessage}
            disabled={!chatInput.trim() || !canChat}
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
    </div>
  );
}
