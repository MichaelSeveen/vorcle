"use client";

import { VorcleLogo } from "@/components/custom-icons/brand-logo";
import { useStickToBottom } from "@/components/stick-to-bottom/use-stick-to-bottom";
import { DotmSquare13 } from "@/components/ui/dotm-square-13";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessage } from "@/hooks/use-chat-core";

interface ChatMessagesProps {
	messages: ChatMessage[];
	isLoading: boolean;
}

export default function ChatMessages({
	messages,
	isLoading,
}: ChatMessagesProps) {
	const { scrollRef, contentRef } = useStickToBottom({
		initial: "instant",
		resize: "smooth",
	});

	return (
		<ScrollArea ref={scrollRef} className="h-[28rem]">
			<div
				ref={contentRef}
				className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4"
			>
				{messages.map((message) => (
					<div
						key={message.id}
						className={`flex gap-3 ${message.isBot ? "justify-start" : "justify-end"}`}
					>
						{message.isBot && (
							<div className="flex size-8 shrink-0 items-center justify-center rounded-full ring ring-ring bg-muted/20">
								<VorcleLogo className="size-5" />
							</div>
						)}
						<div
							className={`max-w-[85%] rounded-lg px-3 py-2 ${
								message.isBot
									? "bg-muted text-foreground"
									: "bg-primary text-accent-foreground"
							}`}
						>
							<p className="whitespace-pre-wrap text-sm leading-6">
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
			</div>
		</ScrollArea>
	);
}
