import { Button, Spinner, Tooltip } from "@heroui/react";
import {
	Delete02Icon,
	JobShareIcon,
	Share08Icon,
	Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { removeMeetingById } from "@/app/actions/meetings-action";
import { SlackIcon } from "@/components/custom-icons";
import { segments } from "@/config/segments";
import type { MeetingInfoData, UserData } from "@/config/types";
import MeetingInfo from "./meeting-info";

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
					<Spinner />
					Loading\u2026
				</div>
			) : isOwner ? (
				<div className="flex items-center gap-2 md:ml-auto md:self-end">
					<Button
						onPress={handlePostToSlack}
						isDisabled={isPending || !meetingId}
						variant="secondary"
						size="sm"
						className="cursor-pointer disabled:cursor-not-allowed"
					>
						{isPending ? <Spinner /> : <SlackIcon />}
						{isPending ? "Posting..." : "Post to Slack"}
					</Button>

					<Tooltip delay={0}>
						<Button
							onPress={handleShare}
							variant="outline"
							isIconOnly
							aria-label="Share item"
						>
							{copied === "idle" ? (
								<HugeiconsIcon icon={Share08Icon} />
							) : (
								<HugeiconsIcon icon={Tick02Icon} />
							)}
							<Tooltip.Content>
								<p>Share this meeting</p>
							</Tooltip.Content>
						</Button>
					</Tooltip>

					<Tooltip delay={0}>
						<Button
							onPress={handleDelete}
							isDisabled={isDeleting}
							variant="danger"
							isIconOnly
						>
							{isDeleting ? <Spinner /> : <HugeiconsIcon icon={Delete02Icon} />}
						</Button>
						<Tooltip.Content>
							<p>Delete this meeting</p>
						</Tooltip.Content>
					</Tooltip>
				</div>
			) : (
				<div className="flex items-center gap-2 text-sm md:ml-auto">
					<HugeiconsIcon icon={JobShareIcon} size={20} />
					Viewing shared meeting.
				</div>
			)}
		</div>
	);
}
