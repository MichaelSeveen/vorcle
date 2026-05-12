import { useChatCore } from "@/hooks/use-chat-core";

export default function useChatAll() {
	const chat = useChatCore({
		apiEndpoint: "/api/rag/chat-all",
		getRequestBody: (input: string) => ({ question: input }),
	});

	return {
		...chat,
	};
}
