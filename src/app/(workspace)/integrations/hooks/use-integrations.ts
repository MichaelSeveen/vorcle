import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SlackIcon,
  JiraIcon,
  TrelloIcon,
  GoogleCalendarIcon,
  AsanaIcon,
} from "@/components/custom-icons";
import {
  Integration,
  UserIntegrationResult,
  GOOGLE_CALENDAR_SCOPES,
} from "@/config/types";
import { linkSocial } from "@/lib/auth-client";
import { toast } from "sonner";

export interface UseIntegrationsReturn {
  integrations: Integration[];
  setupProvider: string | null;
  setupData: unknown | null;
  isSetupLoading: boolean;
  isModalOpen: boolean;
  error: string | null;
  setSetupData: (data: unknown | null) => void;
  setIsModalOpen: (isModalOpen: boolean) => void;
  setSetupProvider: (provider: string | null) => void;
  loadSetupData: (provider: string) => Promise<void>;
  connectProvider: (provider: Integration["provider"]) => Promise<void>;
  disconnectProvider: (provider: Integration["provider"]) => Promise<void>;
  submitSetup: (
    provider: Integration["provider"],
    config: unknown
  ) => Promise<void>;
}
interface UseIntegrationsProps {
  integrationData: UserIntegrationResult[];
  calendarStatus: { success: boolean; message?: string; connected?: boolean };
  currentUserId: string;
}

type SetupProvider = "trello" | "jira" | "asana" | "slack";

const DEFAULT_INTEGRATIONS: Readonly<Integration[]> = [
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
] as const;

const SETUP_PROVIDERS: readonly SetupProvider[] = [
  "trello",
  "jira",
  "asana",
  "slack",
];

const isSetupProvider = (value: string | null): value is SetupProvider =>
  value !== null && SETUP_PROVIDERS.includes(value as SetupProvider);

export function useIntegrations({
  integrationData,
  calendarStatus,
  currentUserId,
}: UseIntegrationsProps): UseIntegrationsReturn {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [setupProvider, setSetupProvider] = useState<string | null>(null);
  const [setupData, setSetupData] = useState<unknown | null>(null);
  const [isSetupLoading, setIsSetupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [disconnectedProviders, setDisconnectedProviders] = useState<
    Set<string>
  >(new Set());

  const setupAbortController = useRef<AbortController | null>(null);

  const integrations = useMemo(() => {
    const isCalendarConnected =
      calendarStatus.success && (calendarStatus.connected ?? false);

    return DEFAULT_INTEGRATIONS.map((integration) => {
      if (disconnectedProviders.has(integration.provider)) {
        return { ...integration, isProviderConnected: false };
      }

      if (integration.provider === "google-calendar") {
        return {
          ...integration,
          isProviderConnected: isCalendarConnected,
        };
      }

      const status = integrationData.find(
        (data) => data.provider === integration.provider
      );

      if (!status) return { ...integration };

      return {
        ...integration,
        isProviderConnected: status.isProviderConnected || false,
        boardName: status.boardName ?? "",
        projectName: status.projectName ?? "",
        channelName: status.channelName ?? "",
      };
    });
  }, [integrationData, calendarStatus, disconnectedProviders]);

  const loadSetupData = useCallback(async (provider: string) => {
    setupAbortController.current?.abort();
    setupAbortController.current = new AbortController();

    try {
      setIsSetupLoading(true);
      setError(null);

      const response = await fetch(`/api/integrations/${provider}/setup`, {
        signal: setupAbortController.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to load ${provider} setup data`);
      }

      const data = await response.json();
      setSetupData(data);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        const message = `Error loading ${provider} setup data. Please try again.`;
        setError(message);
        console.error(`Error loading ${provider} setup data:`, err);
        toast.error(message);
      }
    } finally {
      setIsSetupLoading(false);
    }
  }, []);

  const connectProvider = useCallback(
    async (provider: Integration["provider"]) => {
      setError(null);

      try {
        if (provider === "google-calendar") {
          await linkSocial({
            provider: "google",
            scopes: [...GOOGLE_CALENDAR_SCOPES],
            callbackURL: "/api/calendar/connect-callback",
          });
          return;
        }

        const redirectUrl =
          provider === "slack"
            ? "/api/slack/install?return=integrations"
            : `/api/integrations/${provider}/auth`;

        window.location.href = redirectUrl;
      } catch (err) {
        const message = `Failed to connect ${provider}. Please try again.`;
        setError(message);
        console.error(`Error connecting ${provider}:`, err);
        toast.error(message);
      }
    },
    []
  );

  const disconnectProvider = useCallback(
    async (provider: Integration["provider"]) => {
      setError(null);

      try {
        setDisconnectedProviders((prev) => new Set(prev).add(provider));

        const disconnectUrl =
          provider === "google-calendar"
            ? "/api/auth/google/disconnect"
            : `/api/integrations/${provider}/disconnect`;

        const response = await fetch(disconnectUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to disconnect ${provider}`);
        }

        toast.success(`${provider} disconnected successfully`);

        window.location.reload();
      } catch (err) {
        setDisconnectedProviders((prev) => {
          const next = new Set(prev);
          next.delete(provider);
          return next;
        });

        const message = `Error disconnecting ${provider}. Please try again.`;
        setError(message);
        console.error("Error disconnecting:", err);
        toast.error(message);
      }
    },
    []
  );

  const submitSetup = useCallback(
    async (provider: Integration["provider"], config: unknown) => {
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
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `Failed to save ${provider} setup`
          );
        }

        setSetupProvider(null);
        setSetupData(null);
        setIsModalOpen(false);

        window.history.replaceState({}, "", "/integrations");

        toast.success(`${provider} setup completed successfully`);

        window.location.reload();
      } catch (err) {
        const message = `Error saving ${provider} setup. Please try again.`;
        setError(message);
        console.error("Error saving setup:", err);
        toast.error(message);
      } finally {
        setIsSetupLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!currentUserId) return;

    const urlParams = new URLSearchParams(window.location.search);
    const setup = urlParams.get("setup");

    if (setup && isSetupProvider(setup)) {
      setSetupProvider(setup);
      setIsModalOpen(true);
      loadSetupData(setup);
    }

    return () => {
      setupAbortController.current?.abort();
    };
  }, [currentUserId, loadSetupData]);

  return {
    integrations,
    setupProvider,
    setupData,
    isSetupLoading,
    isModalOpen,
    error,
    setSetupData,
    setIsModalOpen,
    setSetupProvider,
    loadSetupData,
    connectProvider,
    disconnectProvider,
    submitSetup,
  };
}
