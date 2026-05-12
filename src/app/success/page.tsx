import { Card, Link } from "@heroui/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { segments } from "@/config/segments";

export default function SuccessPage() {
	return (
		<div className="min-h-svh flex items-center justify-center p-6">
			<Card className="max-w-md w-full text-center shadow-2xl border-0  backdrop-blur-sm">
				<Card.Header>
					<div className="mx-auto mb-4 relative">
						<HugeiconsIcon
							icon={CheckmarkCircle02Icon}
							className="size-14 text-green-600"
						/>
					</div>
					<Card.Title className="text-2xl">Payment Successful!</Card.Title>
					<Card.Description className="text-base">
						Thank you for your subscription.
					</Card.Description>
				</Card.Header>

				<Card.Content className="space-y-6">
					<Link href={segments.workspace.home}>Workspace</Link>

					<p className="text-xs text-foreground">
						You&apos;ll receive a confirmation email with your receipt and
						further steps.
					</p>
				</Card.Content>
			</Card>
		</div>
	);
}
