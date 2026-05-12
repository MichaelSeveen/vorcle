import {
	Button,
	Card,
	Description,
	Label,
	ProgressBar,
	Spinner,
} from "@heroui/react";
import { format } from "date-fns";
import Link from "next/link";
import { segments } from "@/config/segments";
import { useTokenUsage } from "../_context";

export default function DashboardSidebarUsageCard() {
	const { usage, limits, loading } = useTokenUsage();

	const meetingProgress =
		usage && limits.meetings !== -1
			? Math.min((usage.meetingsUsed / limits.meetings) * 100, 100)
			: 0;

	const chatProgress =
		usage && limits.chatMessages !== -1
			? Math.min((usage.chatMessagesUsed / limits.chatMessages) * 100, 100)
			: 0;

	const getUpgradeInfo = () => {
		if (!usage) return null;

		switch (usage.effectivePlan) {
			case "FREE":
				return {
					title: "Upgrade to Pro",
					description:
						"Get 10 meetings and 30 chat messages every billing cycle",
					showButton: true,
				};
			case "PRO":
				return {
					title: "Upgrade to Business",
					description:
						"Get 30 meetings and 100 chat messages every billing cycle",
					showButton: true,
				};

			case "BUSINESS":
				return {
					title: "Upgrade to Enterprise",
					description: "Get unlimited meetings and chat messages",
					showButton: true,
				};
			case "ENTERPRISE":
				return {
					title: "You're on Enterprise",
					description: "Enjoying unlimited access to all features",
					showButton: false,
				};

			default:
				return {
					title: "Upgrade Your Plan",
					description: "Get access to more features",
					showButton: true,
				};
		}
	};

	const upgradeInfo = getUpgradeInfo();

	if (loading) {
		return <Spinner className="size-8" />;
	}

	return (
		<div className="flex flex-col gap-3">
			{usage && (
				<Card className="p-4">
					<Card.Header>
						<Card.Title>
							<p>
								Plan:
								<strong className="ml-1">{usage.effectivePlan}</strong>
							</p>
						</Card.Title>
						<Card.Description className="sr-only">
							Visual detail to help track your current plan.
						</Card.Description>
					</Card.Header>
					<Card.Content>
						{usage.nextResetDate ? (
							<p className="text-xs text-muted mb-3">
								Usage resets on{" "}
								{format(new Date(usage.nextResetDate), "MMM d, yyyy")}
							</p>
						) : null}
						<div className="space-y-2 mb-2">
							<div className="flex justify-between items-center text-sm">
								<Label>Meetings</Label>
								<Description>
									{usage.meetingsUsed}/
									{limits.meetings === -1 ? "∞" : limits.meetings}
								</Description>
							</div>
							{limits.meetings !== -1 && (
								<ProgressBar
									aria-label="Meeting usage"
									value={meetingProgress}
									size="sm"
								>
									<ProgressBar.Track>
										<ProgressBar.Fill />
									</ProgressBar.Track>
								</ProgressBar>
							)}
							{limits.meetings === -1 && (
								<div className="text-sm italic">Unlimited</div>
							)}
						</div>
						<div className="space-y-2 mb-2">
							<div className="flex justify-between items-center text-sm">
								<Label>Chat Messages</Label>
								<Description>
									{usage.chatMessagesUsed}/
									{limits.chatMessages === -1 ? "∞" : limits.chatMessages}
								</Description>
							</div>
							{limits.chatMessages !== -1 && (
								<ProgressBar
									aria-label="Chat usage"
									value={chatProgress}
									size="sm"
								>
									<ProgressBar.Track>
										<ProgressBar.Fill />
									</ProgressBar.Track>
								</ProgressBar>
							)}
							{limits.chatMessages === -1 && (
								<div className="text-sm">Unlimited</div>
							)}
						</div>
					</Card.Content>
				</Card>
			)}

			{upgradeInfo && (
				<Card className="p-4">
					<Card.Header>
						<Card.Title>{upgradeInfo.title}</Card.Title>
						<Card.Description>{upgradeInfo.description}</Card.Description>
					</Card.Header>
					<Card.Content>
						{upgradeInfo.showButton && (
							<Link href={`${segments.workspace.settings}#subscription`}>
								<Button fullWidth>{upgradeInfo.title}</Button>
							</Link>
						)}

						{!upgradeInfo.showButton && (
							<Button fullWidth isDisabled>
								Thank you for your support!
							</Button>
						)}
					</Card.Content>
				</Card>
			)}
		</div>
	);
}
