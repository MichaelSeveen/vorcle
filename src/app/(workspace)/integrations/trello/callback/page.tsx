"use client";

import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TrelloCallback() {
  const router = useRouter();

  const [status, setStatus] = useState("Connecting your trello account...");

  useEffect(() => {
    const processToken = async () => {
      try {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const token = params.get("token");

        if (!token) {
          setStatus("No auth token found");
          setTimeout(() => router.push("/integrations?error=no_token"), 1500);
          return;
        }

        setStatus("Saving your connection...");

        const response = await fetch("/api/integrations/trello/process-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          setStatus("Success! Redirecting...");
          router.push("/integrations?success=trello_connected&setup=trello");
        } else {
          setStatus("Failed to save trello connection");
          setTimeout(
            () => router.push("/integrations?error=save_failed"),
            1500
          );
        }
      } catch {
        setStatus("An error occured");
        setTimeout(() => router.push("/integrations?error=save_failed"), 1500);
      }
    };
    processToken();
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader className="animate-spin size-12 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Connecting to trello...
        </h2>
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}
