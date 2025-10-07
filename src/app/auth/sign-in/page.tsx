import Link from "next/link";

import { VorcleLogo } from "@/components/custom-icons/brand-logo";
import SignInButton from "./_components/sign-in-button";

import { segments } from "@/config/segments";
import { getCurrentUser } from "@/helpers/user";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect(segments.workspace.home);
  }

  return (
    <section className="px-6 lg:px-15 h-svh">
      <div className="border-x-0 lg:border-x h-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-6 items-start h-full">
          {/* First Part */}
          <div className="relative border-r-0 lg:border-r h-full">
            <div className="absolute top-0 border-b w-full h-10 flex items-center">
              <Link href={segments.home}>
                <VorcleLogo className="size-5 lg:ml-2" />
              </Link>
            </div>
            <div className="absolute bottom-0 h-10 border-t w-full flex items-center">
              <p className="text-xs text-muted-foreground lg:ml-2">
                By signing up, you agree to Vorcle&apos;s{" "}
                <strong className="underline text-blue-600 dark:text-blue-500">
                  Terms of service
                </strong>{" "}
                and{" "}
                <strong className="underline text-blue-600 dark:text-blue-500">
                  Privacy Policy
                </strong>
              </p>
            </div>
            <div className="hidden lg:block absolute right-8 w-[0.5px] bg-border h-full z-[5]" />
            <div className="h-full lg:h-[calc(100%-5rem)] lg:w-[calc(100%-2rem)] grid place-content-center">
              <h1 className="text-pretty text-xl md:text-2xl lg:text-3xl font-semibold mt-6 mb-1 text-center">
                Welcome back to{" "}
                <span className="text-deep-saffron">Vorcle</span>
              </h1>
              <p className="text-muted-foreground text-center">
                Sign in to continue
              </p>
              <SignInButton />
            </div>
          </div>
          {/* Second Part */}
          <div className="hidden relative lg:block border-l h-full">
            <div className="absolute top-0 border-b w-full h-10" />

            <div className="absolute bottom-0 h-10 border-t w-full" />

            <div className="absolute left-8 w-[0.5px] bg-border h-full z-[5]" />
            <div className="h-[calc(100%-5rem)] w-[calc(100%-5rem)] grid place-content-center">
              <CardLogo />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CardLogo() {
  return (
    <>
      <div className="flex gap-0.5">
        <span className="size-[12rem] rounded-full bg-accent" />
        <span className="size-[12rem] rounded-full bg-muted" />
      </div>
      <div className="flex gap-0.5 mt-0.5">
        <span className="size-[12rem] rounded-full bg-accent" />
        <span className="size-[8rem] rounded-full bg-accent" />
      </div>
    </>
  );
}
