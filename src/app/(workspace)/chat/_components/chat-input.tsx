"use client";

import { ChatComposer } from "@/components/chat/chat-composer";

interface ChatInputProps {
	chatInput: string;
	onInputChange: (value: string) => void;
	onSendMessage: () => void;
	isLoading: boolean;
	canChat: boolean;
}

export default function ChatInput({
	chatInput,
	onInputChange,
	onSendMessage,
	isLoading,
	canChat,
}: ChatInputProps) {
	return (
		<ChatComposer
			ariaLabel="Ask anything about your meetings"
			canSend={canChat}
			className="shrink-0 pt-4"
			disabledPlaceholder="Cycle limit reached"
			isLoading={isLoading}
			onSubmit={onSendMessage}
			onValueChange={onInputChange}
			placeholder="Ask anything about your meetings..."
			rows={4}
			submitLabel="Send chat message"
			textFieldClassName="mx-auto max-w-3xl"
			value={chatInput}
		/>
	);
}
