import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { segments } from "@/config/segments";
import { CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function SuccessPage() {
  return (
    <div className="min-h-svh flex items-center justify-center p-6">
      <Card className="max-w-md w-full text-center shadow-2xl border-0  backdrop-blur-sm">
        <CardHeader>
          <div className="mx-auto mb-4 relative">
            <CheckCircle className="size-14 text-green-600 mx-auto relative" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription className="text-base">
            Thank you for your subscription.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Link
            href={segments.workspace.home}
            className={buttonVariants({
              className: "w-full",
            })}
          >
            Workspace
            <ArrowRight />
          </Link>

          <p className="text-xs text-muted-foreground">
            You&apos;ll receive a confirmation email with your receipt and
            further steps.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
