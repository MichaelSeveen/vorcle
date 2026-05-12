import { Button } from "@heroui/react";
import Link from "next/link";
import { useTokenUsage } from "@/app/(workspace)/_context";
import { ChatComposer } from "@/components/chat/chat-composer";
import { VorcleLogo } from "@/components/custom-icons/brand-logo";
import { useStickToBottom } from "@/components/stick-to-bottom/use-stick-to-bottom";
import { DotmSquare13 } from "@/components/ui/dotm-square-13";
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
	isLoading: boolean;
	onInputChange: (value: string) => void;
	onSendMessage: () => void;
}

export default function MeetingChat({
	messages,
	chatInput,
	isLoading,
	onInputChange,
	onSendMessage,
}: ChatSidebarProps) {
	const { canChat } = useTokenUsage();
	const { scrollRef, contentRef } = useStickToBottom({
		initial: "instant",
		resize: "smooth",
	});

	return (
		<div className="flex flex-col">
			<div className="flex-1 pt-3">
				<ScrollArea ref={scrollRef} className="h-[28rem]">
					<div ref={contentRef} className="flex flex-col gap-3 px-1 pb-3">
						{messages.map((message) => (
							<div
								key={message.id}
								className={cn(
									"flex items-start gap-2",
									message.isBot ? "justify-start" : "justify-end",
								)}
							>
								{message.isBot ? (
									<div className="ml-1 flex size-8 shrink-0 items-center justify-center rounded-full ring ring-ring bg-muted/20">
										<VorcleLogo className="size-5" />
									</div>
								) : null}
								<div
									className={cn(
										"max-w-[78%] rounded-lg px-3 py-2",
										message.isBot
											? "bg-muted text-foreground"
											: "bg-muted text-accent-foreground",
									)}
								>
									<p className="whitespace-pre-wrap text-pretty text-sm leading-6 text-white">
										{message.content}
									</p>
								</div>
							</div>
						))}

						{isLoading &&
							messages.length > 0 &&
							!messages[messages.length - 1].isBot && (
								<div className="flex items-center gap-3">
									<DotmSquare13
										size={24}
										dotSize={4}
										speed={1.4}
										opacityBase={0.1}
										opacityMid={0.4}
										opacityPeak={0.95}
									/>
									Thinking
								</div>
							)}

						{!canChat && (
							<div className="p-4 text-center">
								<p className="mb-2 text-xs text-foreground">
									Cycle chat limit reached
								</p>
								<Link href={`${segments.workspace.settings}#subscription`}>
									<Button size="sm" className="w-fit">
										Upgrade to continue chatting
									</Button>
								</Link>
							</div>
						)}
					</div>
				</ScrollArea>
			</div>

			<ChatComposer
				ariaLabel="Ask about this meeting"
				canSend={canChat}
				className="shrink-0 pt-4"
				disabledPlaceholder="Cycle limit reached"
				isLoading={isLoading}
				onSubmit={onSendMessage}
				onValueChange={onInputChange}
				placeholder="Ask about this meeting..."
				rows={3}
				submitLabel="Send meeting chat message"
				value={chatInput}
			/>
		</div>
	);
}
