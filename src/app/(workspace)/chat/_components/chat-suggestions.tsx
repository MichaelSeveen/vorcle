import { Suggestion, Suggestions } from "@/components/ui/suggestion";

interface ChatSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

export default function ChatSuggestions({
  suggestions,
  onSuggestionClick,
}: ChatSuggestionsProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 max-w-5xl mx-auto w-full">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-3 text-center text-pretty">
          Ask <span className="text-deep-saffron">Vorcle Bot</span> questions
          about your meetings.
        </h2>

        <p className="text-muted-foreground text-center text-pretty">
          I can search across all your meetings to find information, summarize
          discussions, and answer questions
        </p>
      </div>

      <Suggestions>
        {suggestions.map((suggestion, index) => (
          <Suggestion
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            suggestion={suggestion}
          />
        ))}
      </Suggestions>
    </div>
  );
}
