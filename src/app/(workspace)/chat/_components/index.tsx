"use client";

import useChatAll from "../hooks/use-chat-all";
import ChatInput from "./chat-input";
import ChatMessages from "./chat-messages";
import ChatSuggestions from "./chat-suggestions";

export default function WorkspaceChatView() {
  const {
    chatInput,
    messages,
    showSuggestions,
    isLoading,
    chatSuggestions,
    handleSendMessage,
    handleSuggestionClick,
    handleInputChange,
  } = useChatAll();

  return (
    <div className="h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <div className="flex-1 p-6 overflow-auto">
          {messages.length === 0 && showSuggestions ? (
            <ChatSuggestions
              suggestions={chatSuggestions}
              onSuggestionClick={handleSuggestionClick}
            />
          ) : (
            <ChatMessages messages={messages} isLoading={isLoading} />
          )}
        </div>
        <ChatInput
          chatInput={chatInput}
          onInputChange={handleInputChange}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
