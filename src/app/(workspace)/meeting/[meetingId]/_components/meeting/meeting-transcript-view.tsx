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
        <ul>
          {transcript.map((segment, index) => (
            <li
              key={index}
              className="flex flex-col gap-2 items-start border-b last:border-b-0 pt-0.5 pb-3"
            >
              <p>
                <strong>{segment.speaker}</strong> •{" "}
                <span className="text-deep-saffron underline">
                  {getSpeakerSegmentTime(segment)}
                </span>
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {getSegmentText(segment)}
              </p>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
