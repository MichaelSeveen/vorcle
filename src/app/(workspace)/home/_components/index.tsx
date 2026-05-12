"use client";

import { Button, Spinner } from "@heroui/react";
import { Refresh04Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { use } from "react";
import type { GoogleCalendarEvent } from "@/config/types";
import type { getPastMeetings } from "@/helpers/meetings/past-meetings";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMeetings } from "../hooks/use-meetings";
import PastMeetings from "./past-meetings";
import UpcomingMeetings from "./upcoming-meetings";

interface WorkspaceHomeViewProps {
	pastMeetings: Promise<Awaited<ReturnType<typeof getPastMeetings>>>;
	currentUserId: string;
	upcomingEvents: {
		ok: boolean;
		events: GoogleCalendarEvent[];
		connected: boolean;
		source: string;
	};
	calendarStatus: { success: boolean; message?: string; connected?: boolean };
}

export default function WorkspaceHomeView({
	pastMeetings,
	upcomingEvents,
	calendarStatus,
}: WorkspaceHomeViewProps) {
	const {
		events,
		isCalendarConnected,
		error,
		meetingBotState,
		pendingToggleByEventId,
		isLinking,
		isRefreshing,
		refreshEvents,
		toggleMeetingBot,
		linkGoogleCalendar,
	} = useMeetings({
		upcomingEvents,
		calendarStatus,
	});

	const { data } = use(pastMeetings);
	const isMobile = useIsMobile();

	return (
		<section className="grid h-full grid-cols-[1fr_calc(100%-2rem)_1fr] md:grid-cols-[1fr_min(calc(100%-5rem),calc(760/16*1rem))_1fr] [&>*]:col-[2]">
			<div className="flex flex-col">
				<h2 className="text-xl font-semibold tracking-tight">Coming Up</h2>

				<UpcomingMeetings
					upcomingEvents={events}
					calendarConnected={isCalendarConnected}
					error={error}
					loading={isLinking}
					meetingBotState={meetingBotState}
					pendingToggleByEventId={pendingToggleByEventId}
					onBotToggle={toggleMeetingBot}
					onConnectCalendar={linkGoogleCalendar}
				/>

				<div className="mt-6 flex flex-col gap-3">
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-semibold tracking-tight">
							Past Meetings
						</h2>
						<Button size="sm" onPress={refreshEvents} isDisabled={isRefreshing}>
							{isRefreshing ? (
								<Spinner color="current" size="sm" />
							) : (
								<HugeiconsIcon icon={Refresh04Icon} />
							)}
							{!isMobile && (
								<span>{isRefreshing ? "Syncing..." : "Sync Now"}</span>
							)}
						</Button>
					</div>

					<PastMeetings data={data} />
				</div>
			</div>
		</section>
	);
}
