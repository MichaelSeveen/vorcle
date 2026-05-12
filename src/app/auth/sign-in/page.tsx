import Link from "next/link";
import { redirect } from "next/navigation";
import { VorcleLogo } from "@/components/custom-icons/brand-logo";

import { segments } from "@/config/segments";
import { getCurrentUser } from "@/helpers/user";
import SignInButton from "./_components/sign-in-button";

export default async function SignInPage() {
	const currentUser = await getCurrentUser();

	if (currentUser) {
		redirect(segments.workspace.home);
	}

	return (
		<section className="px-6 lg:px-15 h-svh bg-white-chalk text-black">
			<div className="border-x-0 lg:border-x h-full">
				<div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-6 items-start h-full">
					{/* First Part */}
					<div className="relative border-r-0 lg:border-r h-full">
						<div className="absolute top-0 border-b w-full h-10 flex items-center">
							<Link href={segments.home}>
								<VorcleLogo svgColor="black" className="size-5 lg:ml-2" />
							</Link>
						</div>
						<div className="absolute bottom-0 h-10 border-t w-full flex justify-center items-center">
							<p className="text-xs text-foreground lg:ml-2">
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

						<div className="h-full lg:h-[calc(100%-5rem)] lg:w-[calc(100%-2rem)] grid place-content-center">
							<h1 className="text-pretty text-xl md:text-2xl lg:text-3xl font-semibold mt-6 mb-1 text-center">
								Welcome back to Vorcle
							</h1>
							<p className="text-muted text-center font-mono">
								Sign in to continue
							</p>
							<SignInButton />
						</div>
					</div>
					{/* Second Part */}
					<div className="hidden relative lg:flex border-l h-full items-center justify-center">
						<div className="absolute top-0 border-b w-full h-10" />

						<div className="absolute bottom-0 h-10 border-t w-full" />

						<div className="h-[calc(100%-5rem)] w-[calc(100%-5rem)] grid place-content-center">
							<VorcleLogo svgColor="black" className="size-full" />
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
