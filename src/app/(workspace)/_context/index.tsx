"use client";

import { useRouter } from "next/navigation";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

import { toast } from "sonner";
import { segments } from "@/config/segments";
import { PLAN_LIMITS, type PlanLimits } from "@/config/types";
import type { SubscriptionPlan, SubscriptionStatus } from "@/db/schema";
import { getClientSession } from "@/lib/get-client-session";

async function fetchTokenUsage(): Promise<{
	success: boolean;
	data?: UsageApiData;
	message?: string;
}> {
	const response = await fetch("/api/user/token-usage");
	if (!response.ok)
		throw new Error(`Token usage fetch failed: ${response.status}`);
	return response.json();
}

interface UsageApiData {
	id: string;
	effectivePlan: SubscriptionPlan;
	effectiveStatus: SubscriptionStatus;
	meetingsUsed: number;
	chatMessagesUsed: number;
	usagePeriodStart: string | null;
	usagePeriodEnd: string | null;
	nextResetDate: string | null;
	nextPaymentDate: string | null;
	cycleAnchor: "billing_cycle" | "calendar_month";
}

interface UsageContextType {
	usage: UsageApiData | null;
	loading: boolean;
	canChat: boolean;
	canScheduleMeeting: boolean;
	limits: PlanLimits;
	incrementChatUsage: () => Promise<void>;
	incrementMeetingUsage: () => Promise<void>;
	refreshUsage: () => Promise<void>;
}

const TokenUsageContext = createContext<UsageContextType | undefined>(
	undefined,
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
	const [usage, setUsage] = useState<UsageApiData | null>(null);
	const [loading, setLoading] = useState(true);

	const effectivePlan = usage?.effectivePlan ?? "FREE";
	const effectiveStatus = usage?.effectiveStatus ?? "INACTIVE";
	const limits = PLAN_LIMITS[effectivePlan] ?? PLAN_LIMITS.FREE;

	const isFree = effectivePlan === "FREE";
	const isActivePaid = !isFree && effectiveStatus === "ACTIVE";

	const chatMessagesUsed = usage?.chatMessagesUsed ?? 0;
	const meetingsUsed = usage?.meetingsUsed ?? 0;

	const canChat = useMemo(
		() =>
			(isFree || isActivePaid) &&
			(limits.chatMessages === -1 || chatMessagesUsed < limits.chatMessages),
		[isFree, isActivePaid, limits.chatMessages, chatMessagesUsed],
	);

	const canScheduleMeeting = useMemo(
		() =>
			(isFree || isActivePaid) &&
			(limits.meetings === -1 || meetingsUsed < limits.meetings),
		[isFree, isActivePaid, limits.meetings, meetingsUsed],
	);

	const refreshUsage = useCallback(async () => {
		try {
			const { success, data } = await fetchTokenUsage();
			if (success && data) {
				setUsage(data);
			}
		} catch (error) {
			console.error("Failed to load usage data:", error);
			toast.error("Failed to load usage data");
		} finally {
			setLoading(false);
		}
	}, []);

	const incrementChatUsage = useCallback(async () => {
		if (!canChat) return;

		setUsage((prev) =>
			prev ? { ...prev, chatMessagesUsed: prev.chatMessagesUsed + 1 } : null,
		);
	}, [canChat]);

	const incrementMeetingUsage = useCallback(async () => {
		if (!canScheduleMeeting) return;

		await refreshUsage();
	}, [canScheduleMeeting, refreshUsage]);

	useEffect(() => {
		let cancelled = false;

		async function init() {
			setLoading(true);
			const userId = await getClientSession();

			if (!userId) {
				setLoading(false);
				router.push(segments.signIn);
				return;
			}

			if (!cancelled) {
				await refreshUsage();
			}
		}

		init();
		return () => {
			cancelled = true;
		};
	}, [refreshUsage, router]);

	const value = useMemo<UsageContextType>(
		() => ({
			usage,
			loading,
			canChat,
			canScheduleMeeting,
			limits,
			incrementChatUsage,
			incrementMeetingUsage,
			refreshUsage,
		}),
		[
			usage,
			loading,
			canChat,
			canScheduleMeeting,
			limits,
			incrementChatUsage,
			incrementMeetingUsage,
			refreshUsage,
		],
	);

	return (
		<TokenUsageContext.Provider value={value}>
			{children}
		</TokenUsageContext.Provider>
	);
}
