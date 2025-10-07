"use client";

import Link from "next/link";
import { ArrowLeft, Loader } from "lucide-react";
import { useMeetingDetail } from "../hooks/use-meeting-details";
import MeetingHeader from "./meeting/meeting-header";
import ActionItems from "./action-items";
import MeetingChat from "./meeting/meeting-chat";
import MeetingRecordingAudioPlayer from "./meeting/meeting-recording-audio-player";
import MeetingTranscriptView from "./meeting/meeting-transcript-view";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TabMenuHorizontalContent,
  TabMenuHorizontalList,
  TabMenuHorizontalRoot,
  TabMenuHorizontalTrigger,
} from "@/components/align-ui/tabs";
import {
  ActionItem,
  TranscriptSegment,
  UserIntegrationResult,
} from "@/config/types";
import type { MeetingByIdResult } from "@/helpers/meetings";
import { segments } from "@/config/segments";
import { buttonVariants } from "@/components/ui/button";
import { AlertTriangleIcon } from "@/components/custom-icons";

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
    showSuggestions,
    isActionItemPending,
    handleSendMessage,
    handleSuggestionClick,
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
        <p className="text-muted-foreground text-sm mt-2 mb-4">
          {error.message}
        </p>
        <Link
          href={segments.workspace.home}
          className={buttonVariants({
            variant: "link",
          })}
        >
          <ArrowLeft />
          Back to Meetings
        </Link>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="grid place-content-center h-full">
        <div className="flex flex-col items-center">
          <AlertTriangleIcon className="size-[5rem]" />
          <p className="text-muted-foreground text-sm mt-4 mb-2">
            You don&apos;t have any meetings yet.
          </p>
          <Link
            href={segments.workspace.home}
            className={buttonVariants({
              variant: "link",
              className: "mt-4",
            })}
          >
            <ArrowLeft />
            Start a meeting
          </Link>
        </div>
      </div>
    );
  }

  const meetingActionItems = meeting.actionItems as unknown as ActionItem[];
  const meetingTranscript =
    meeting.transcript as unknown as TranscriptSegment[];

  const ProcessingView = () => (
    <div className="flex flex-col items-center justify-center my-20">
      <Loader className="animate-spin size-8" />
      <h2 className="text-xl mt-4">Processing meeting with AI..</h2>
      <p className="text-sm text-muted-foreground mt-2">
        You&apos;ll receive an email when ready.
      </p>
    </div>
  );

  const ProcessedView = () => (
    <ScrollArea>
      <div className="flex flex-col gap-6">
        {meeting.summary && (
          <div className="px-4 pt-4">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Meeting Summary
            </h3>
            <p className="text-muted-foreground text-pretty">
              {meeting.summary}
            </p>
          </div>
        )}

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
            <h3 className="text-lg font-semibold mb-4">Action Items</h3>
            <div className="space-y-3">
              {actionItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p className="text-sm text-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );

  return (
    <div className="relative w-full h-full">
      <div className="flex md:gap-4 lg:gap-6 h-full">
        <div className="flex-2">
          <MeetingHeader
            meetingId={meetingId}
            summary={meeting.summary}
            actionItems={
              meetingActionItems?.map((item) => `• ${item.text}`).join("\n") ||
              ""
            }
            isOwner={isOwner}
            isLoading={!isOwner}
            meetingInfoData={meetingInfo}
            userData={userData}
          />
          <div className="mt-6">
            <TabMenuHorizontalRoot defaultValue="summary">
              <TabMenuHorizontalList>
                <TabMenuHorizontalTrigger value="summary">
                  Summary
                </TabMenuHorizontalTrigger>
                <TabMenuHorizontalTrigger value="transcript">
                  Transcript
                </TabMenuHorizontalTrigger>
              </TabMenuHorizontalList>
              <TabMenuHorizontalContent value="summary">
                <div className="bg-background rounded-lg ring ring-border mt-3">
                  {meeting.processed ? <ProcessedView /> : <ProcessingView />}
                </div>
                {isOwner ? (
                  <div>
                    <MeetingRecordingAudioPlayer
                      recordingUrl={meeting?.recordingUrl}
                    />
                  </div>
                ) : null}
              </TabMenuHorizontalContent>
              <TabMenuHorizontalContent value="transcript">
                <div className="bg-background rounded-lg ring ring-border mt-3">
                  {meeting.transcript ? (
                    <MeetingTranscriptView transcript={meetingTranscript} />
                  ) : (
                    <div className="bg-card rounded-lg p-6 border border-border text-center">
                      <p className="text-muted-foreground">
                        No transcript avaialable
                      </p>
                    </div>
                  )}
                </div>
              </TabMenuHorizontalContent>
            </TabMenuHorizontalRoot>
          </div>
        </div>
        <div className="hidden lg:block flex-1 bg-input/50 h-full rounded-sm p-2">
          <div className="h-15 w-full grid place-content-center border-dashed border-b">
            <h2 className="text-xl font-semibold tracking-tight">
              Ask <span className="text-deep-saffron">Vorcle</span>
            </h2>
          </div>
          {isOwner ? (
            <MeetingChat
              messages={messages}
              chatInput={chatInput}
              showSuggestions={showSuggestions}
              onInputChange={handleInputChange}
              onSendMessage={handleSendMessage}
              onSuggestionClick={handleSuggestionClick}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
