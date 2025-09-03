import { useState } from "react";
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
  const [isPosting, setIsPosting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePostToSlack = async () => {
    if (!meetingId) {
      return;
    }

    try {
      setIsPosting(true);

      const response = await fetch("/api/slack/post-meeting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meetingId: meetingId,
          summary: summary ?? "Meeting summary is not available",
          actionItems: actionItems || "No action items recorded",
        }),
      });

      // const result = await response.json();

      if (response.ok) {
        toast.success("Posted to Slack");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleShare = async () => {
    if (!meetingId) {
      return;
    }

    try {
      const shareUrl = `${window.location.origin}/meeting/${meetingId}`;
      await navigator.clipboard.writeText(shareUrl);

      setCopied(true);
      toast.success("Meeting link copied!");

      setTimeout(() => setCopied(false), 1000);
    } catch (error) {
      console.error("failed to copy:", error);
    }
  };

  const handleDelete = async () => {
    if (!meetingId) {
      return;
    }

    try {
      setIsDeleting(true);

      const { success, error, message } = await removeMeetingById(meetingId);

      if (error) {
        toast.error(error);
        setIsDeleting(false);
      }

      if (success) {
        toast.success(message);
        router.push(segments.workspace.home);
      }
    } catch (error) {
      console.error("Could not delete meeting", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex justify-between border-b">
      <MeetingInfo meetingData={meetingInfoData} userData={userData} />

      {isLoading ? (
        <div className="flex items-center gap-1 text-sm">
          <Loader className="animate-spin size-4" />
          Loading...
        </div>
      ) : isOwner ? (
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePostToSlack}
            disabled={isPosting || !meetingId}
            variant="fancy"
            size="sm"
            className="cursor-pointer disabled:cursor-not-allowed"
          >
            <SlackIcon />
            {isPosting ? "Posting..." : "Post to Slack"}
          </Button>

          <Button onClick={handleShare} variant="outline" size="sm">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                Share
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
        <div className="flex items-center gap-2 text-sm">
          <Eye className="size-4" />
          Viewing shared meeting.
        </div>
      )}
    </div>
  );
}

//  const response = await fetch(`/api/meetings/${meetingId}`, {
//         method: "DELETE",
//         headers: {
//           "Content-Type": "application/json",
//         },
//       });
//       const result = await response.json();

//       if (response.ok) {
//         router.push(segments.workspace.home);
//       } else {
//       }
