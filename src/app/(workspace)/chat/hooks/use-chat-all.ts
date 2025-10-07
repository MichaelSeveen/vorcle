import { useChatCore } from "@/hooks/use-chat-core";

const chatSuggestions = [
  "Summarize the action items from last week's standup",
  "What deadlines were discussed in recent meetings?",
  "Generate a follow-up email for the marketing meeting",
  "What feedback was given about the new feature?",
];

export default function useChatAll() {
  const chat = useChatCore({
    apiEndpoint: "/api/rag/chat-all",
    getRequestBody: (input: string) => ({ question: input }),
  });

  return {
    ...chat,
    chatSuggestions,
  };
}
