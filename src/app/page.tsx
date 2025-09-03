import { buttonVariants } from "@/components/ui/button";
import { segments } from "@/config/segments";
import Link from "next/link";

export default function Homepage() {
  return (
    <div className="flex items-center justify-center min-h-svh">
      <Link
        href={segments.signIn}
        className={buttonVariants({
          variant: "fancy",
        })}
        aria-label="go to sign-in page"
      >
        Get Started
      </Link>
    </div>
  );
}
