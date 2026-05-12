"use client";

import useChatAll from "../hooks/use-chat-all";
import ChatInput from "./chat-input";
import ChatMessages from "./chat-messages";

export default function WorkspaceChatView() {
	const {
		chatInput,
		messages,
		isLoading,
		canChat,
		handleSendMessage,
		handleInputChange,
	} = useChatAll();

	return (
		<div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-1 flex-col">
			<div className="min-h-0 flex-1">
				{messages.length === 0 ? (
					<div className="grid place-content-center h-full w-full">
						<h2 className="text-3xl font-light text-muted">
							What can I help you with?
						</h2>
						<p className="text-3xl font-light text-pretty">
							Ask me anything about your meetings!
						</p>
					</div>
				) : (
					<ChatMessages messages={messages} isLoading={isLoading} />
				)}
			</div>
			<ChatInput
				chatInput={chatInput}
				onInputChange={handleInputChange}
				onSendMessage={handleSendMessage}
				isLoading={isLoading}
				canChat={canChat}
			/>
		</div>
	);
}
