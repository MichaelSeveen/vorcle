import { ScrollArea } from "@/components/ui/scroll-area";
import { TranscriptSegment } from "@/config/types";

interface MeetingTranscriptViewProps {
  transcript: TranscriptSegment[];
}

export default function MeetingTranscriptView({
  transcript,
}: MeetingTranscriptViewProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const getSpeakerSegmentTime = (segment: TranscriptSegment) => {
    const startTime = segment.offset;
    const endTime =
      segment.words[segment.words.length - 1]?.end || segment.offset;

    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  const getSegmentText = (segment: TranscriptSegment) => {
    return segment.words.map((word) => word.word).join(" ");
  };

  if (!transcript || transcript.length === 0) {
    return (
      <div className="my-20 text-center">
        <p className="text-lg text-muted-foreground">No transcript available</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Meeting transcript
      </h3>

      <ScrollArea className="h-[32rem]">
        {transcript.map((segment, index) => (
          <ul
            key={index}
            className="pb-4 border-b border-border last:border-b-0"
          >
            <li className="flex items-center gap-3 mb-2 mt-1">
              <span className="font-medium text-blue-600 dark:text-blue-500">
                {segment.speaker}
              </span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {getSpeakerSegmentTime(segment)}
              </span>
            </li>
            <p className="text-muted-foreground leading-relaxed pl-4">
              {getSegmentText(segment)}
            </p>
          </ul>
        ))}
      </ScrollArea>
    </div>
  );
}
