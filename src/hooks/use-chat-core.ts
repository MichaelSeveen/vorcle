import { useCallback, useRef, useState } from "react";
import { useTokenUsage } from "@/app/(workspace)/_context";

export interface ChatMessage {
	id: number;
	content: string;
	isBot: boolean;
	timestamp: Date;
}

interface UseChatCoreOptions {
	apiEndpoint: string;
	getRequestBody: (input: string) => Record<string, unknown>;
}

function getStringField(data: Record<string, unknown>, field: string) {
	const value = data[field];

	return typeof value === "string" ? value.trim() : "";
}

export function useChatCore({
	apiEndpoint,
	getRequestBody,
}: UseChatCoreOptions) {
	const [chatInput, setChatInput] = useState("");
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const nextMessageId = useRef(0);

	const { canChat, incrementChatUsage } = useTokenUsage();

	const createMessage = useCallback(
		(content: string, isBot: boolean): ChatMessage => ({
			id: ++nextMessageId.current,
			content,
			isBot,
			timestamp: new Date(),
		}),
		[],
	);

	const handleSendMessage = useCallback(async () => {
		const currentInput = chatInput.trim();

		if (!currentInput || isLoading) {
			return;
		}

		if (!canChat) {
			return;
		}

		setIsLoading(true);

		setMessages((prev) => [...prev, createMessage(currentInput, false)]);
		setChatInput("");

		try {
			const response = await fetch(apiEndpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(getRequestBody(currentInput)),
			});

			const data = (await response.json()) as Record<string, unknown>;

			if (response.ok) {
				await incrementChatUsage();

				const answer =
					getStringField(data, "answer") ||
					getStringField(data, "response") ||
					"I could not read the AI response. Please try asking again.";
				setMessages((prev) => [...prev, createMessage(answer, true)]);
			} else {
				if (data.upgradeRequired) {
					setMessages((prev) => [
						...prev,
						createMessage(
							`${getStringField(data, "error") || "Chat limit reached"} Open Settings to upgrade your plan and continue chatting.`,
							true,
						),
					]);
				} else {
					setMessages((prev) => [
						...prev,
						createMessage(
							getStringField(data, "error") ||
								"Sorry, I encountered an error. Please try again.",
							true,
						),
					]);
				}
			}
		} catch (error) {
			console.error("chat error:", error);
			setMessages((prev) => [
				...prev,
				createMessage(
					"Sorry, I could not connect to the server. Please check your connection and try again.",
					true,
				),
			]);
		} finally {
			setIsLoading(false);
		}
	}, [
		apiEndpoint,
		canChat,
		chatInput,
		createMessage,
		getRequestBody,
		incrementChatUsage,
		isLoading,
	]);

	const handleInputChange = (value: string) => {
		setChatInput(value);
	};

	return {
		chatInput,
		setChatInput,
		messages,
		setMessages,
		isLoading,
		setIsLoading,
		handleSendMessage,
		handleInputChange,
		canChat,
	};
}
