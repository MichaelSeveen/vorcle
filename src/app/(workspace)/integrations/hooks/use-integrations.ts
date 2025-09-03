import {
  SlackIcon,
  JiraIcon,
  TrelloIcon,
  GoogleCalendarIcon,
  AsanaIcon,
} from "@/components/custom-icons";
import { Integration } from "@/config/types";
import { linkSocial, useSession } from "@/lib/auth-client";
import { useEffect, useState } from "react";

export interface UseIntegrationsReturn {
  integrations: Integration[];
  isLoading: boolean;
  setupProvider: string | null;
  setupData: unknown | null;
  setSetupData: (data: unknown | null) => void;
  loadSetupData: (provider: string) => void;
  isSetupLoading: boolean;
  isModalOpen: boolean;
  setIsModalOpen: (iseModalOpen: boolean) => void;
  error: string | null;
  loadIntegrations: () => Promise<void>;
  connectProvider: (provider: Integration["provider"]) => Promise<void>;
  disconnectProvider: (provider: Integration["provider"]) => Promise<void>;
  submitSetup: (
    provider: Integration["provider"],
    config: unknown
  ) => Promise<void>;
  setSetupProvider: (provider: string | null) => void;
}

const DEFAULT_INTEGRATIONS: Integration[] = [
  {
    provider: "slack",
    name: "Slack",
    description: "Post meeting summaries to your Slack channels",
    isProviderConnected: false,
    channelName: undefined,
    logo: SlackIcon,
  },
  {
    provider: "trello",
    name: "Trello",
    description: "Add action items to your Trello boards",
    isProviderConnected: false,
    logo: TrelloIcon,
  },
  {
    provider: "jira",
    name: "Jira",
    description: "Create tickets for development tasks and more",
    isProviderConnected: false,
    logo: JiraIcon,
  },
  {
    provider: "asana",
    name: "Asana",
    description: "Pandora tasks with your team projects",
    isProviderConnected: false,
    logo: AsanaIcon,
  },
  {
    provider: "google-calendar",
    name: "Google Calendar",
    description: "Auto-Sync your meetings",
    isProviderConnected: false,
    logo: GoogleCalendarIcon,
  },
];

export function useIntegrations(): UseIntegrationsReturn {
  const { data: session } = useSession();

  const [integrations, setIntegrations] =
    useState<Integration[]>(DEFAULT_INTEGRATIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [setupProvider, setSetupProvider] = useState<string | null>(null);
  const [setupData, setSetupData] = useState<unknown | null>(null);
  const [isSetupLoading, setIsSetupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    function initialize() {
      const abortController = new AbortController();
      const userId = session?.user.id;

      if (userId) {
        loadIntegrations(abortController.signal);
      }

      const urlParams = new URLSearchParams(window.location.search);
      const setup = urlParams.get("setup");

      if (setup && ["trello", "jira", "asana", "slack"].includes(setup)) {
        setSetupProvider(setup);
        setIsModalOpen(true);
        loadSetupData(setup, abortController.signal);
      }

      return function cleanup() {
        abortController.abort();
      };
    },
    [session?.user.id]
  );

  async function loadIntegrations(signal?: AbortSignal) {
    setIsLoading(true);
    setError(null);

    try {
      const [integrationsResponse, calendarResponse] = await Promise.all([
        fetch("/api/integrations/status", { signal }),
        fetch("/api/user/calendar-status", { signal }),
      ]);

      if (!integrationsResponse.ok || !calendarResponse.ok) {
        throw new Error("Failed to load integration statuses");
      }

      const integrationsData = await integrationsResponse.json();

      const calendarData = await calendarResponse.json();

      setIntegrations((prev: Integration[]) => {
        return prev.map((integration: Integration) => {
          if (integration.provider === "google-calendar") {
            return {
              ...integration,
              isProviderConnected: calendarData.connected || false,
            };
          }

          const status = integrationsData.find(
            (data: Integration) => data.provider === integration.provider
          );

          return {
            ...integration,
            isProviderConnected: status?.isProviderConnected || false,
            boardName: status?.boardName,
            projectName: status?.projectName,
            channelName: status?.channelName,
          };
        });
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError("Failed to load integrations. Please try again.");
        console.error("Error loading integrations:", err);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function loadSetupData(provider: string, signal?: AbortSignal) {
    try {
      const response = await fetch(`/api/integrations/${provider}/setup`, {
        signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to load ${provider} setup data`);
      }
      const data = await response.json();
      setSetupData(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(`Error loading ${provider} setup data. Please try again.`);
        console.error(`Error loading ${provider} setup data:`, err);
      }
    }
  }

  async function connectProvider(provider: Integration["provider"]) {
    setError(null);
    try {
      if (provider === "google-calendar") {
        await linkSocial({
          provider: "google",
          scopes: [
            "https://www.googleapis.com/auth/calendar.readonly",
            "https://www.googleapis.com/auth/calendar.events.readonly",
          ],
          callbackURL: "/api/calendar/connect-callback",
        });
        return;
      }
      window.location.href =
        provider === "slack"
          ? `/api/slack/install?return=integrations`
          : `/api/integrations/${provider}/auth`;
    } catch (err: unknown) {
      setError(`Failed to connect ${provider}. Please try again.`);
      console.error(`Error connecting ${provider}:`, err);
    }
  }

  async function disconnectProvider(provider: Integration["provider"]) {
    setError(null);

    try {
      const disconnectUrl =
        provider === "google-calendar"
          ? "/api/auth/google/disconnect"
          : `/api/integrations/${provider}/disconnect`;

      const response = await fetch(disconnectUrl, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Failed to disconnect ${provider}`);
      }

      setIntegrations((prevState: Integration[]) => {
        return prevState.map((integration: Integration) => {
          if (integration.provider === provider) {
            return { ...integration, connected: false };
          }
          return integration;
        });
      });

      await loadIntegrations();
    } catch (err: unknown) {
      setError(`Error disconnecting ${provider}. Please try again.`);
      console.error("Error disconnecting:", err);
    }
  }

  async function submitSetup(
    provider: Integration["provider"],
    config: unknown
  ) {
    setIsSetupLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/integrations/${provider}/setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`Failed to save ${provider} setup`);
      }

      setSetupProvider(null);
      setSetupData(null);
      window.history.replaceState({}, "", "/integrations");
      await loadIntegrations();
    } catch (err: unknown) {
      setError(`Error saving ${provider} setup. Please try again.`);
      console.error("Error saving setup:", err);
    } finally {
      setIsSetupLoading(false);
    }
  }

  return {
    integrations,
    isLoading,
    setupProvider,
    setupData,
    setSetupData,
    setIsModalOpen,
    isModalOpen,
    isSetupLoading,
    loadSetupData,
    error,
    loadIntegrations,
    connectProvider,
    disconnectProvider,
    submitSetup,
    setSetupProvider,
  };
}
