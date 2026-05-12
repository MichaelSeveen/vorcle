"use client";

import { Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TrelloCallback() {
	const { push } = useRouter();

	const [status, setStatus] = useState("Connecting your trello account\u2026");

	useEffect(() => {
		const timers: ReturnType<typeof setTimeout>[] = [];

		const processToken = async () => {
			try {
				const hash = window.location.hash.substring(1);
				const params = new URLSearchParams(hash);
				const token = params.get("token");

				if (!token) {
					setStatus("No auth token found");
					timers.push(
						setTimeout(() => push("/integrations?error=no_token"), 1500),
					);
					return;
				}

				setStatus("Saving your connection\u2026");

				const response = await fetch("/api/integrations/trello/process-token", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ token }),
				});

				if (response.ok) {
					setStatus("Success! Redirecting\u2026");
					push("/integrations?success=trello_connected&setup=trello");
				} else {
					setStatus("Failed to save trello connection");
					timers.push(
						setTimeout(() => push("/integrations?error=save_failed"), 1500),
					);
				}
			} catch {
				setStatus("An error occured");
				timers.push(
					setTimeout(() => push("/integrations?error=save_failed"), 1500),
				);
			}
		};
		processToken();

		return () => {
			for (const id of timers) clearTimeout(id);
		};
	}, [push]);

	return (
		<div className="min-h-screen bg-background flex items-center justify-center">
			<div className="text-center">
				<Spinner size="lg" className="mx-auto mb-4" />
				<h2 className="text-xl font-semibold text-foreground mb-2">
					Connecting to Trello{"\u2026"}
				</h2>
				<p className="text-foreground">{status}</p>
			</div>
		</div>
	);
}
