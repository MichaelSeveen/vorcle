"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";
import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { segments } from "@/config/segments";
import { PLAN_LIMITS, PlanLimits } from "@/config/types";
import { getClientSession } from "@/lib/get-client-session";

async function fetchTokenUsage() {
  const response = await fetch("/api/user/token-usage");
  if (!response.ok) throw new Error("Failed to fetch token usage");
  return response.json();
}

async function incrementChat() {
  const response = await fetch("/api/user/increment-chat", {
    method: "POST",
    headers: { "Content-type": "application/json" },
  });
  return response.json();
}

async function incrementMeeting() {
  const response = await fetch("/api/user/increment-meeting", {
    method: "POST",
    headers: { "Content-type": "application/json" },
  });
  return response.json();
}

interface UsageDataSubscription {
  id: string;
  planName: SubscriptionPlan;
  status: SubscriptionStatus;
  nextPaymentDate: Date | null;
}

interface UsageData {
  id: string;
  effectivePlan: SubscriptionPlan;
  effectiveStatus: SubscriptionStatus;
  meetingsThisMonth: number;
  chatMessagesToday: number;
  subscription: UsageDataSubscription | null;
}

interface UsageContextType {
  usage: UsageData | null;
  loading: boolean;
  canChat: boolean;
  canScheduleMeeting: boolean;
  limits: PlanLimits;
  incrementChatUsage: () => Promise<void>;
  incrementMeetingUsage: () => Promise<void>;
  refreshUsage: () => Promise<void>;
}

const TokenUsageContext = createContext<UsageContextType | undefined>(
  undefined
);

export function useTokenUsage() {
  const context = useContext(TokenUsageContext);
  if (context === undefined) {
    throw new Error("useTokenUsage must be used within a TokenUsageProvider");
  }
  return context;
}

export function TokenUsageProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const effectivePlan = usage?.effectivePlan || "FREE";
  const effectiveStatus = usage?.effectiveStatus || "INACTIVE";

  const limits = PLAN_LIMITS[effectivePlan];

  const isFree = effectivePlan === "FREE";

  const chatMessagesToday = usage?.chatMessagesToday ?? 0;
  const meetingsThisMonth = usage?.meetingsThisMonth ?? 0;

  const isActivePaid = !isFree && effectiveStatus === "ACTIVE";

  const canChat =
    (isFree &&
      (limits.chatMessages === -1 ||
        chatMessagesToday < limits.chatMessages)) ||
    (isActivePaid &&
      (limits.chatMessages === -1 || chatMessagesToday < limits.chatMessages));

  const canScheduleMeeting =
    (isFree &&
      (limits.meetings === -1 || meetingsThisMonth < limits.meetings)) ||
    (isActivePaid &&
      (limits.meetings === -1 || meetingsThisMonth < limits.meetings));

  const fetchUsage = useCallback(async () => {
    try {
      const { success, data } = await fetchTokenUsage();

      if (success && data) {
        setUsage(data);
      }
    } catch (error) {
      toast.error("Failed to fetch usage data");
      console.error("failed to fetch usage data", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const incrementChatUsage = async () => {
    if (!canChat) {
      return;
    }

    try {
      const { success, upgradeRequired, message } = await incrementChat();

      if (success) {
        setUsage((prev) =>
          prev
            ? {
                ...prev,
                chatMessagesToday: prev.chatMessagesToday + 1,
              }
            : null
        );
      } else {
        if (upgradeRequired) {
          toast.error(message);
        }
      }
    } catch (error) {
      toast.error("Failed to increment chat usage");
      console.error("Failed to increment chat usage", error);
    }
  };

  const incrementMeetingUsage = async () => {
    if (!canScheduleMeeting) {
      return;
    }

    try {
      const { success } = await incrementMeeting();

      if (success) {
        setUsage((prev) =>
          prev
            ? {
                ...prev,
                meetingsThisMonth: prev.meetingsThisMonth + 1,
              }
            : null
        );
      }
    } catch (error) {
      toast.error("Failed to increment meeting usage");
      console.error("Failed to increment meeting usage:", error);
    }
  };

  const refreshUsage = async () => {
    await fetchUsage();
  };

  useEffect(() => {
    async function fetchData() {
      const userId = await getClientSession();

      if (userId) {
        fetchUsage();
      } else {
        setLoading(false);
        router.push(segments.signIn);
      }
    }
    fetchData();
  }, [fetchUsage, router]);

  const values = {
    usage,
    loading,
    canChat,
    canScheduleMeeting,
    limits,
    incrementChatUsage,
    incrementMeetingUsage,
    refreshUsage,
  };

  return (
    <TokenUsageContext.Provider value={values}>
      {children}
    </TokenUsageContext.Provider>
  );
}
