import { VorcleLogo } from "@/components/custom-icons/brand-logo";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface Message {
  id: number;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export default function ChatMessages({
  messages,
  isLoading,
}: ChatMessagesProps) {
  return (
    <ScrollArea className="p-3 h-[40rem] w-full mx-auto max-w-4xl">
      <div className="flex flex-col">
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
                "max-w-[55%] rounded-md p-2",
                message.isBot
                  ? "bg-muted text-foreground"
                  : "bg-primary text-primary-foreground"
              )}
            >
              <p className="text-sm text-pretty">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div
            className="flex items-center justify-start gap-2 mb-2"
            aria-live="polite"
            aria-label="Assistant is typing"
          >
            <Loader2 className="size-5 animate-spin" />
            <p className="text-sm text-muted-foreground">
              Searching through your meetings...
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
