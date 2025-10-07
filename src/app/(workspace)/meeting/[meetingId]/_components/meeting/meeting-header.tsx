import { useTransition, useOptimistic } from "react";
import { SlackIcon } from "@/components/custom-icons";
import { Button } from "@/components/ui/button";
import { segments } from "@/config/segments";
import { Check, Eye, Loader, Share2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { removeMeetingById } from "@/app/actions/meetings-action";
import MeetingInfo from "./meeting-info";
import { MeetingInfoData, UserData } from "@/config/types";

interface MeetingHeaderProps {
  meetingId?: string;
  summary?: string | null;
  actionItems?: string;
  isOwner: boolean;
  isLoading?: boolean;
  meetingInfoData: MeetingInfoData;
  userData: UserData;
}

export default function MeetingHeader({
  meetingId,
  summary,
  actionItems,
  isOwner,
  isLoading = false,
  meetingInfoData,
  userData,
}: MeetingHeaderProps) {
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();

  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useOptimistic<"idle" | "copied">("idle");
  const [, startCopyTransition] = useTransition();

  const handlePostToSlack = () => {
    if (!meetingId) return;

    startTransition(async () => {
      try {
        const response = await fetch("/api/slack/post-meeting", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            meetingId,
            summary: summary ?? "Meeting summary is not available",
            actionItems: actionItems || "No action items recorded",
          }),
        });

        if (response.ok) {
          toast.success("Posted to Slack");
        } else {
          toast.error("Failed to post to Slack");
        }
      } catch (error) {
        console.error(error);
        toast.error("Error posting to Slack");
      }
    });
  };

  const handleShare = async () => {
    if (!meetingId) {
      return;
    }

    startCopyTransition(async () => {
      try {
        const shareUrl = `${window.location.origin}/meeting/${meetingId}`;
        navigator.clipboard.writeText(shareUrl);

        setCopied("copied");
        toast.success("Meeting link copied!");

        await new Promise((resolve) => setTimeout(resolve, 2000));
        setCopied("idle");
      } catch (error) {
        console.error("Failed to copy:", error);
      }
    });
  };

  const handleDelete = () => {
    if (!meetingId) {
      return;
    }

    startDeleteTransition(async () => {
      try {
        const { success, error, message } = await removeMeetingById(meetingId);

        if (error) {
          toast.error(error);
          return;
        }

        if (success) {
          toast.success(message);
          router.push(segments.workspace.home);
        }
      } catch (error) {
        console.error("Could not delete meeting", error);
      }
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 border-b pb-3">
      <MeetingInfo meetingData={meetingInfoData} userData={userData} />

      {isLoading ? (
        <div className="flex items-center gap-1 text-sm">
          <Loader className="animate-spin size-3.5" />
          Loading...
        </div>
      ) : isOwner ? (
        <div className="flex items-center gap-2 md:ml-auto md:self-end">
          <Button
            onClick={handlePostToSlack}
            disabled={isPending || !meetingId}
            variant="secondary"
            size="sm"
            className="cursor-pointer disabled:cursor-not-allowed"
          >
            <SlackIcon />
            {isPending ? "Posting..." : "Post to Slack"}
          </Button>

          <Button onClick={handleShare} variant="outline" size="sm">
            {copied === "idle" ? (
              <>
                <Share2 />
                Share
              </>
            ) : (
              <>
                <Check />
                Copied!
              </>
            )}
          </Button>

          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            variant="destructive"
            size="sm"
          >
            <Trash2 />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm md:ml-auto">
          <Eye className="size-3.5" />
          Viewing shared meeting.
        </div>
      )}
    </div>
  );
}
