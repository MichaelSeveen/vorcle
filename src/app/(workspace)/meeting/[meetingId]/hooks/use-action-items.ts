import { segments } from "@/config/segments";
import { Integration } from "@/config/types";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function useActionItems() {
  const router = useRouter();
  const { data } = useSession();

  if (!data) {
    router.push(segments.signIn);
  }

  const userId = data?.session.userId;

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [integrationsLoaded, setIntegrationsLoaded] = useState(false);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [showAddInput, setShowAddInput] = useState(false);
  const [newItemText, setNewItemText] = useState("");

  useEffect(() => {
    if (userId) {
      fetchIntegrations();
    } else {
      setIntegrationsLoaded(true);
    }
  }, [userId]);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch("/api/integrations/status");

      if (!response.ok) {
        throw new Error("Failed to load integration status");
      }

      const integrationsData: Integration[] = await response.json();

      const integrations = integrationsData
        .filter((filteredData: Integration) => filteredData.isProviderConnected)
        .filter((data: Integration) => data.provider !== "slack")
        .map((integration: Integration) => ({
          ...integration,
        }));

      setIntegrations(integrations);
    } catch {
      setIntegrations([]);
    } finally {
      setIntegrationsLoaded(true);
    }
  };

  return {
    integrations,
    integrationsLoaded,
    loading,
    setLoading,
    showAddInput,
    setShowAddInput,
    newItemText,
    setNewItemText,
  };
}
