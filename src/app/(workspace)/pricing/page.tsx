import { redirect } from "next/navigation";
import { segments } from "@/config/segments";

export default async function WorkspacePricingPage() {
	redirect(`${segments.workspace.settings}#subscription`);
}
