"use client";

import { Loader } from "lucide-react";
import { useMeetingDetail } from "../hooks/use-meeting-details";
import MeetingHeader from "./meeting/meeting-header";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import ActionItems from "./action-items";
import ChatSidebar from "./chat-sidebar";
import MeetingRecordingAudioPlayer from "./meeting/meeting-recording-audio-player";
import MeetingTranscriptView from "./meeting/meeting-transcript-view";
import { ActionItem, MeetingData, TranscriptSegment } from "@/config/types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserData {
  name: string;
  image: string | null | undefined;
}

interface DetailViewProps {
  meetingData?: MeetingData;
  meetingId: string;
  userData: UserData;
}

export default function WorkspaceMeetingDetailView({
  meetingData,
  meetingId,
  userData,
}: DetailViewProps) {
  const {
    isOwner,
    userChecked,
    chatInput,
    messages,
    meetingState,
    showSuggestions,
    loading,
    handleSendMessage,
    handleSuggestionClick,
    handleInputChange,
    deleteActionItem,
    addActionItem,
    displayActionItems,
    meetingInfoData,
  } = useMeetingDetail({ meetingData, meetingId });

  const meetingActionItems =
    meetingState?.actionItems as unknown as ActionItem[];
  const meetingTranscript =
    meetingState?.transcript as unknown as TranscriptSegment[];

  return (
    <div className="relative min-h-svh">
      <MeetingHeader
        meetingId={meetingId}
        summary={meetingState?.summary}
        actionItems={
          meetingActionItems?.map((item) => `• ${item.text}`).join("\n") || ""
        }
        isOwner={isOwner}
        isLoading={!userChecked}
        meetingInfoData={meetingInfoData}
        userData={userData}
      />

      <div className="flex h-[calc(100vh-73px)]">
        <div
          className={`flex-1 p-6 overflow-auto pb-24 ${
            !userChecked ? "" : !isOwner ? "max-w-4xl mx-auto" : ""
          }`}
        >
          <Tabs defaultValue="summary">
            <div className="bg-background rounded-lg px-3 ring ring-border">
              <TabsList className="h-12 rounded-none border-b bg-transparent p-0 w-full">
                <TabsTrigger
                  value="summary"
                  className="data-[state=active]:after:bg-primary relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Summary
                </TabsTrigger>
                <TabsTrigger
                  value="transcript"
                  className="data-[state=active]:after:bg-primary relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Transcript
                </TabsTrigger>
                <TabsTrigger
                  value="chat-meeting"
                  className="data-[state=active]:after:bg-primary relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Chat Meeting
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="summary">
              <div className="bg-background rounded-lg ring ring-border">
                {loading ? (
                  <div className="flex flex-col items-center my-20">
                    <Loader className="animate-spin rounded-full size-8" />
                    <p className="text-muted-foreground text-lg mt-4">
                      Loading meeting data...
                    </p>
                  </div>
                ) : meetingState?.processed ? (
                  <ScrollArea>
                    <div className="flex flex-col gap-6">
                      {meetingState.summary && (
                        <div className="px-4 pt-4">
                          <h3 className="text-lg font-semibold text-foreground mb-3">
                            Meeting Summary
                          </h3>
                          <p className="text-muted-foreground text-balance">
                            {meetingState.summary}
                          </p>
                        </div>
                      )}

                      {!userChecked ? (
                        <div className="bg-card ring ring-border rounded-lg p-6">
                          <Skeleton className="h-4 bg-muted rounded w-1/4 mb-4" />
                          <div className="space-y-2">
                            <Skeleton className="h-3 bg-muted rounded w-3/4" />
                            <Skeleton className="h-3 bg-muted rounded w-1/2" />
                          </div>
                        </div>
                      ) : (
                        <>
                          {isOwner && displayActionItems.length > 0 && (
                            <ActionItems
                              actionItems={displayActionItems}
                              onDeleteItem={deleteActionItem}
                              onAddItem={addActionItem}
                              meetingId={meetingId}
                            />
                          )}

                          {!isOwner && displayActionItems.length > 0 && (
                            <>
                              <h3 className="text-lg font-semibold mb-4">
                                Action Items
                              </h3>
                              <div className="space-y-3">
                                {displayActionItems.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-start gap-3"
                                  >
                                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                                    <p className="text-sm text-foreground">
                                      {item.text}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center my-20">
                    <Loader className="animate-spin size-8" />
                    <p className="text-xl mt-4">Processing meeting with AI..</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      You&apos;ll receive an email when ready
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="transcript">
              <div className="bg-background rounded-lg ring ring-border">
                <ScrollArea>
                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <Loader className="animate-spin rounded-full size-8" />
                      <p className="text-muted-foreground text-lg mt-4">
                        Loading meeting data...
                      </p>
                    </div>
                  ) : meetingState?.transcript ? (
                    <MeetingTranscriptView transcript={meetingTranscript} />
                  ) : (
                    <div className="bg-card rounded-lg p-6 border border-border text-center">
                      <p className="text-muted-foreground">
                        No transcript avaialable
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>
            <TabsContent value="chat-meeting">
              <div className="bg-[#4B5D16] rounded ring ring-border">
                {!userChecked ? (
                  <div className="w-90 border-l border-border p-4 bg-card">
                    <Skeleton className="h-4 bg-muted rounded w-1/2 mb-4" />
                    <div className="space-y-3">
                      <Skeleton className="h-8 w-1/4 rounded" />
                      <Skeleton className="h-8 w-1/4 rounded" />
                      <Skeleton className="h-8 w-1/4 rounded" />
                    </div>
                  </div>
                ) : (
                  isOwner && (
                    <ChatSidebar
                      messages={messages}
                      chatInput={chatInput}
                      showSuggestions={showSuggestions}
                      onInputChange={handleInputChange}
                      onSendMessage={handleSendMessage}
                      onSuggestionClick={handleSuggestionClick}
                    />
                  )
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <MeetingRecordingAudioPlayer
        recordingUrl={meetingState?.recordingUrl}
        isOwner={isOwner}
      />
    </div>
  );
}

{
  /* <div className='flex border-b border-border'>
                            <Button
                                variant='ghost'
                                onClick={() => setActiveTab('summary')}
                                className={`px-4 py-2 text-sm font-medium border-b-2 rounded-none shadow-none transition-colors
                                ${activeTab === 'summary'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
                                    }`}
                                style={{ boxShadow: 'none' }}
                                type='button'
                            >
                                Summary
                            </Button>
                            <Button
                                variant='ghost'
                                onClick={() => setActiveTab('transcript')}
                                className={`px-4 py-2 text-sm font-medium border-b-2 rounded-none shadow-none transition-colors
                                ${activeTab === 'transcript'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
                                    }`}
                                style={{ boxShadow: 'none' }}
                                type='button'
                            >
                                Transcript
                            </Button>
                        </div> */
}

{
  /* <div className="mt-6">
              {activeTab === "summary" && (
                <div>
                  {loading ? (
                    <div className="bg-card border border-border rounded-lg p-6 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">
                        Loading meeting data..
                      </p>
                    </div>
                  ) : meetingData?.processed ? (
                    <div className="space-y-6">
                      {meetingData.summary && (
                        <div className="bg-card border border-border rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-foreground mb-3">
                            Meeting Summary
                          </h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {meetingData.summary}
                          </p>
                        </div>
                      )}

                      {!userChecked ? (
                        <div className="bg-card border border-border rounded-lg p-6">
                          <div className="animate-pulse">
                            <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
                            <div className="space-y-2">
                              <div className="h-3 bg-muted rounded w-3/4"></div>
                              <div className="h-3 bg-muted rounded w-1/2"></div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          {isOwner && displayActionItems.length > 0 && (
                            <ActionItems
                              actionItems={displayActionItems}
                              onDeleteItem={deleteActionItem}
                              onAddItem={addActionItem}
                              meetingId={meetingId}
                            />
                          )}

                          {!isOwner && displayActionItems.length > 0 && (
                            <div className="bg-card rounded-lg p-6 border border-border">
                              <h3 className="text-lg font-semibold text-foreground mb-4">
                                Action Items
                              </h3>
                              <div className="space-y-3">
                                {displayActionItems.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-start gap-3"
                                  >
                                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                                    <p className="text-sm text-foreground">
                                      {item.text}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="bg-card border border-border rounded-lg p-6 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">
                        Processing meeting with AI..
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        You'll receive an email when ready
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "transcript" && (
                <div>
                  {loading ? (
                    <div className="bg-card border border-border rounded-lg p-6 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">
                        Loading meeting data..
                      </p>
                    </div>
                  ) : meetingData?.transcript ? (
                    <TranscriptDisplay transcript={meetingData.transcript} />
                  ) : (
                    <div className="bg-card rounded-lg p-6 border border-border text-center">
                      <p className="text-muted-foreground">
                        No transcript avaialable
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div> */
}
