"use client";

import {
	Button,
	Description,
	ErrorMessage,
	ScrollShadow,
	Spinner,
	Tabs,
} from "@heroui/react";
import { Alert02Icon, ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { segments } from "@/config/segments";
import type { UserIntegrationResult } from "@/config/types";
import type { MeetingByIdResult } from "@/helpers/meetings";
import {
	formatActionItemForExport,
	formatActionItemMetadata,
} from "@/helpers/meetings/action-items";
import { parseInsightList } from "@/helpers/meetings/insights";
import { useMeetingDetail } from "../hooks/use-meeting-details";
import ActionItems from "./action-items";
import MeetingChat from "./meeting/meeting-chat";
import MeetingHeader from "./meeting/meeting-header";
import MeetingRecordingAudioPlayer from "./meeting/meeting-recording-audio-player";
import MeetingTranscriptView from "./meeting/meeting-transcript-view";

interface UserData {
	id: string;
	name: string;
	image: string | null | undefined;
}

interface DetailViewProps {
	meetingData: MeetingByIdResult;
	meetingId: string;
	userData: UserData;
	integrationsData: UserIntegrationResult[];
}

function ProcessingView() {
	return (
		<div className="flex flex-col items-center justify-center my-20">
			<Spinner size="xl" />
			<h2 className="text-xl mt-4">Processing meeting with AI..</h2>
			<p className="text-sm text-muted mt-2">
				You&apos;ll receive an email when ready.
			</p>
		</div>
	);
}

function ProcessedView({
	summary,
	decisions,
	blockers,
}: {
	summary: string | null | undefined;
	decisions: string[];
	blockers: string[];
}) {
	return (
		<ScrollShadow className="h-[28rem]">
			<div className="flex flex-col gap-4">
				{summary && <p className="text-sm text-pretty">{summary}</p>}

				{decisions.length > 0 && (
					<div>
						<h3 className="text-lg font-medium">Decisions</h3>
						<ul className="space-y-2 list-disc ml-4">
							{decisions.map((decision) => (
								<li key={decision} className="text-sm text-pretty">
									{decision}
								</li>
							))}
						</ul>
					</div>
				)}

				{blockers.length > 0 && (
					<div>
						<h3 className="text-lg font-medium">Blockers</h3>
						<ul className="space-y-2 list-disc ml-4">
							{blockers.map((blocker) => (
								<li key={blocker} className="text-sm text-pretty">
									{blocker}
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</ScrollShadow>
	);
}

export default function WorkspaceMeetingDetailView({
	meetingData,
	meetingId,
	userData,
	integrationsData,
}: DetailViewProps) {
	const {
		isOwner,
		error,
		chatInput,
		messages,
		meeting,
		isChatLoading,
		isActionItemPending,
		handleSendMessage,
		handleInputChange,
		deleteActionItem,
		addActionItem,
		actionItems,
		meetingInfo,
	} = useMeetingDetail({ currentUserId: userData.id, meetingData, meetingId });

	if (error && error.type === "meetingError") {
		return (
			<div className="grid place-content-center h-full">
				<h1 className="text-2xl font-semibold">Meeting Not Found</h1>
				<ErrorMessage className="text-sm mt-2 mb-4">
					{error.message}
				</ErrorMessage>
				<Link href={segments.workspace.home}>
					<Button variant="ghost">
						<HugeiconsIcon icon={ArrowLeft02Icon} />
						Back to Meetings
					</Button>
				</Link>
			</div>
		);
	}

	if (!meeting) {
		return (
			<div className="grid place-content-center h-full">
				<div className="flex flex-col items-center">
					<HugeiconsIcon icon={Alert02Icon} className="size-[5rem]" />
					<Description className="text-sm mt-4 mb-2">
						You don&apos;t have any meetings yet.
					</Description>
					<Link href={segments.workspace.home}>
						<Button variant="ghost" className="mt-4">
							<HugeiconsIcon icon={ArrowLeft02Icon} />
							Start a meeting
						</Button>
					</Link>
				</div>
			</div>
		);
	}

	const decisions = parseInsightList(meeting.decisions);
	const blockers = parseInsightList(meeting.blockers);

	return (
		<div className="grid grid-cols-3 md:gap-4 items-start">
			<div className="col-span-2">
				<div className="flex flex-col">
					<MeetingHeader
						meetingId={meetingId}
						summary={meeting.summary}
						actionItems={
							actionItems
								.map((item) => `• ${formatActionItemForExport(item)}`)
								.join("\n") || ""
						}
						isOwner={isOwner}
						isLoading={!isOwner}
						meetingInfoData={meetingInfo}
						userData={userData}
					/>
					<div className="mt-6">
						<Tabs defaultSelectedKey="summary" variant="secondary">
							<Tabs.ListContainer>
								<Tabs.List aria-label="Meeting content">
									<Tabs.Tab id="summary">
										Summary
										<Tabs.Indicator />
									</Tabs.Tab>
									<Tabs.Tab id="transcript">
										Transcript
										<Tabs.Indicator />
									</Tabs.Tab>
									<Tabs.Tab id="action-items">
										Action Items
										<Tabs.Indicator />
									</Tabs.Tab>
								</Tabs.List>
							</Tabs.ListContainer>
							<Tabs.Panel id="summary">
								{meeting.processed ? (
									<ProcessedView
										summary={meeting.summary}
										decisions={decisions}
										blockers={blockers}
									/>
								) : (
									<ProcessingView />
								)}
								{isOwner ? (
									<div>
										<MeetingRecordingAudioPlayer
											recordingUrl={meeting?.recordingUrl}
										/>
									</div>
								) : null}
							</Tabs.Panel>
							<Tabs.Panel id="transcript">
								{meeting.transcript ? (
									<MeetingTranscriptView
										meetingId={meetingId}
										transcript={meeting.transcript}
										transcriptSourceLanguage={meeting.transcriptSourceLanguage}
										transcriptTranslations={meeting.transcriptTranslations}
									/>
								) : (
									<div className="bg-background rounded-lg p-6 border border-border text-center">
										<p className="text-foreground">
											No transcript available
										</p>
									</div>
								)}
							</Tabs.Panel>
							<Tabs.Panel id="action-items">
								<ScrollShadow className="h-[28rem]">
									{isOwner && actionItems.length > 0 && (
										<ActionItems
											actionItems={actionItems}
											onDeleteItem={deleteActionItem}
											onAddItem={addActionItem}
											meetingId={meetingId}
											integrations={integrationsData}
											isPending={isActionItemPending}
											error={error}
										/>
									)}

									{!isOwner && actionItems.length > 0 && (
										<>
											<h3 className="text-lg font-semibold mb-4">
												Action Items
											</h3>
											<div className="space-y-3">
												{actionItems.map((item) => (
													<div key={item.id} className="flex items-start gap-3">
														<div className="size-2 rounded-full bg-primary mt-2 flex-shrink-0" />
														<div className="space-y-1">
															<p className="text-sm text-foreground">
																{item.text}
															</p>
															{formatActionItemMetadata(item) ? (
																<p className="text-xs text-foreground">
																	{formatActionItemMetadata(item)}
																</p>
															) : null}
														</div>
													</div>
												))}
											</div>
										</>
									)}
								</ScrollShadow>
							</Tabs.Panel>
						</Tabs>
					</div>
				</div>
			</div>
			<div className="hidden lg:block col-span-1 rounded-sm">
				<div className="w-full grid place-content-center border-dashed border-b py-6">
					<h2 className="text-xl font-semibold tracking-tight">Ask Vorcle</h2>
				</div>
				{isOwner ? (
					<MeetingChat
						messages={messages}
						chatInput={chatInput}
						isLoading={isChatLoading}
						onInputChange={handleInputChange}
						onSendMessage={handleSendMessage}
					/>
				) : null}
			</div>
		</div>
	);
}
