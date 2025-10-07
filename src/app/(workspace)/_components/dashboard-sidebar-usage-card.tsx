import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTokenUsage } from "../_context";
import { Progress } from "@/components/ui/progress";
import { segments } from "@/config/segments";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function DashboardSidebarUsageCard() {
  const { usage, limits, loading } = useTokenUsage();

  const meetingProgress =
    usage && limits.meetings !== -1
      ? Math.min((usage.meetingsThisMonth / limits.meetings) * 100, 100)
      : 0;

  const chatProgress =
    usage && limits.chatMessages !== -1
      ? Math.min((usage.chatMessagesToday / limits.chatMessages) * 100, 100)
      : 0;

  const getUpgradeInfo = () => {
    if (!usage) return null;

    switch (usage.effectivePlan) {
      case "FREE":
        return {
          title: "Upgrade to Pro",
          description: "Get 10 meetings per month and 30 daily chat messages",
          showButton: true,
        };
      case "PRO":
        return {
          title: "Upgrade to Business",
          description: "Get 30 meetings per month and 100 daily chat messages",
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
    return <Loader2 className="size-8 animate-spin" />;
  }

  return (
    <div className="flex flex-col gap-3">
      {usage && (
        <Card className="py-4">
          <CardHeader className="px-4">
            <CardTitle>
              <p>
                Plan:
                <strong className="text-deep-saffron ml-1 font-mono">
                  {usage.effectivePlan}
                </strong>
              </p>
            </CardTitle>
            <CardDescription className="sr-only">
              Visual detail to help track your current plan.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4">
            <div className="space-y-2 mb-2">
              <div className="flex justify-between items-center text-sm">
                <span>Meetings</span>
                <span>
                  {usage.meetingsThisMonth}/
                  {limits.meetings === -1 ? "∞" : limits.meetings}
                </span>
              </div>
              {limits.meetings !== -1 && <Progress value={meetingProgress} />}
              {limits.meetings === -1 && (
                <div className="text-sm italic">Unlimited</div>
              )}
            </div>
            <div className="space-y-2 mb-2">
              <div className="flex justify-between items-center text-sm">
                <span>Chat Messages</span>
                <span>
                  {usage.chatMessagesToday}/
                  {limits.chatMessages === -1 ? "∞" : limits.chatMessages}
                </span>
              </div>
              {limits.chatMessages !== -1 && <Progress value={chatProgress} />}
              {limits.chatMessages === -1 && (
                <div className="text-sm italic">Unlimited</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {upgradeInfo && (
        <Card className="py-4">
          <CardHeader className="px-4">
            <CardTitle>{upgradeInfo.title}</CardTitle>
            <CardDescription className="text-balance">
              {upgradeInfo.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4">
            {upgradeInfo.showButton && (
              <Link
                href={segments.workspace.pricing}
                className={buttonVariants({
                  className: "w-full bg-accent",
                })}
              >
                {upgradeInfo.title}
              </Link>
            )}

            {!upgradeInfo.showButton && (
              <div
                className={buttonVariants({
                  className: "w-full",
                })}
              >
                🎉 Thank you for your support!
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
