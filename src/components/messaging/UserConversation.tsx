/* eslint-disable @typescript-eslint/no-explicit-any */

// React imports
import { useState, useEffect } from "react";

// Third-party imports
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

// UI component imports
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Icon imports
import {
  MoreVertical,
  Loader,
  ChevronDown,
  ArrowLeft,
  Trash2,
  VolumeX,
  Volume2,
  Send,
} from "lucide-react";

// Local component imports
import BidMessagePopup from "@/components/domain/BidMessagePopup";
import { DomainAvatar } from "@/components/domain/DomainAvatar";
import { MessageInput } from "@/components/messaging/MessageInput";
import { MessageList } from "@/components/messaging/MessageList";
import { TypingIndicator } from "@/components/messaging/TypingIndicator";
import { OnlineStatus } from "@/components/messaging/OnlineStatus";
import { ConversationInfoModal } from "@/components/messaging/ConversationInfoModal";
import { MuteConversationPopup } from "@/components/messaging/MuteConversationPopup";
import { PinnedMessagesBar } from "@/components/messaging/PinnedMessagesBar";

// Hook imports
import { useUsername } from "@/hooks/use-username";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMessageScroll } from "@/hooks/use-message-scroll";
import { usePinnedMessagesVisibility } from "@/hooks/use-pinned-messages-visibility";

// Service/data imports
import { useGetMessages, useCreateDmConversation } from "@/data/use-backend";
import {
  webSocketService,
  WebSocketEventHandlers,
} from "@/services/backend/socketservice";

// Type imports
import { RecordingIndicator } from "./RecordingIndicator";
import { useXmtp } from "@/contexts/XmtpContext";
import { dataService } from "@/services/doma/dataservice";
import { useHelper } from "@/hooks/use-helper";
import { Dm } from "@xmtp/browser-sdk";
import { toast } from "sonner";
import { formatUnits } from "viem";
import { backendService } from "@/services/backend/backendservice";

const UserConversation = ({ onRefresh }: { onRefresh: () => void }) => {
  const [params] = useSearchParams();

  const initMessage = params.get("message");

  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showBidPopup, setShowBidPopup] = useState(false);
  const [replyToId, setReplyToId] = useState<string | undefined>();
  const [showConversationInfo, setShowConversationInfo] = useState(false);
  const [showMuteDialog, setShowMuteDialog] = useState(false);

  const { activeUsername } = useUsername();
  const { client } = useXmtp();
  const { parseCAIP10 } = useHelper();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [recordingUsers, setRecordingUsers] = useState<string[]>([]);

  const createConversation = useCreateDmConversation(client);

  const initConversation = async () => {
    try {
      if (username.includes(".")) {
        const otherName = await dataService.getName({ name: username });
        const otherAddress = parseCAIP10(otherName.claimedBy).address;

        const inboxId = await client.findInboxIdByIdentifier({
          identifier: otherAddress,
          identifierKind: "Ethereum",
        });

        if (!inboxId) {
          return toast.error("Recipient is not yet on XMTP.");
        }

        createConversation.mutate({ inboxId });
      } else {
        const conversation = await client.conversations.getConversationById(
          username
        );
        createConversation.mutate({ conversation: conversation as Dm });
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (username) {
      initConversation();
    }
  }, [username]);

  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
    refetch: refetchMessages,
  } = useGetMessages(createConversation?.data, 50, activeUsername);
  console.log(messagesData);

  const {
    containerRef,
    isNearBottom,
    handleScroll,
    scrollToBottom,
    scrollToMessage,
  } = useMessageScroll({
    hasNextPage: false,
    fetchNextPage: () => refetchMessages(),
    isFetchingNextPage: false,
    messages: messagesData ?? [],
    newMessageCount: 0,
  });

  const pinnedMessages = [];
  const isPinnedBarVisible = usePinnedMessagesVisibility({
    containerRef,
    hasPinnedMessages: pinnedMessages.length > 0,
  });

  useEffect(() => {
    if (createConversation?.data?.id) {
      backendService.subscribeToConversation(createConversation?.data?.id);
      webSocketService.joinConversation(createConversation.data.id);
    }
  }, [createConversation]);

  useEffect(() => {
    const handlers: WebSocketEventHandlers = {
      id: "user-conversations",
      onMessageChanged: () => {
        refetchMessages();
        onRefresh();
      },
      onUserTyping: ({ username, conversationId }) => {
        if (
          conversationId === createConversation?.data?.id &&
          username !== activeUsername
        ) {
          setTypingUsers((prev) => {
            if (!prev.includes(username)) {
              return [...prev, username];
            }
            return prev;
          });
        }
      },
      onUserStoppedTyping: ({ username, conversationId }) => {
        if (conversationId === createConversation?.data?.id) {
          setTypingUsers((prev) => prev.filter((u) => u !== username));
        }
      },
      onUserRecording: ({ username, conversationId }) => {
        if (
          conversationId === createConversation?.data?.id &&
          username !== activeUsername
        ) {
          setRecordingUsers((prev) => {
            if (!prev.includes(username)) {
              return [...prev, username];
            }
            return prev;
          });
        }
      },
      onUserStoppedRecording: ({ username, conversationId }) => {
        if (conversationId === createConversation?.data?.id) {
          setRecordingUsers((prev) => prev.filter((u) => u !== username));
        }
      },
    };

    webSocketService.setEventHandlers(handlers);

    return () => {
      webSocketService.removeEventHandlers(handlers);
    };
  }, [createConversation]);

  if (createConversation.isPending) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-[fade-in_0.3s_ease-out,scale-in_0.2s_ease-out]">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-background flex items-center justify-between">
        <div className="flex items-center space-x-2 md:space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (isMobile && navigator.vibrate) {
                navigator.vibrate(50);
              }
              navigate("/");
            }}
            className="h-8 w-8 p-0 mr-2 hover:bg-accent/80 transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div
            className="flex items-center space-x-2 md:space-x-3 cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
            onClick={() => setShowConversationInfo(true)}
          >
            <div className="relative">
              <DomainAvatar
                domain={username}
                className="h-8 w-8 md:h-10 md:w-10"
              />
            </div>
            <div>
              <h3 className="font-semibold text-xs md:text-sm lg:text-base truncate max-w-[120px] md:max-w-none">
                {username || "Unknown User"}
              </h3>
              <OnlineStatus isOnline={true} className="mt-0.5" />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 lg:space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBidPopup(true)}
            className="text-primary border-primary hover:bg-primary hover:text-primary-foreground text-xs lg:text-sm h-7 md:h-8"
          >
            <Send className="h-2 w-2 md:h-3 lg:h-4 md:w-3 lg:w-4 mr-0.5 md:mr-1" />
            Offer
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 md:h-8 md:w-8"
              >
                <MoreVertical className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-background border border-border shadow-lg z-50"
            >
              <DropdownMenuItem
                onClick={() => setShowMuteDialog(true)}
                className="hover:bg-accent"
              >
                {/* {currentParticipant?.isMuted ? (
                  <>
                    <Volume2 className="h-4 w-4 mr-2" />
                    Unmute
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4 mr-2" />
                    Mute
                  </>
                )} */}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Pinned Messages Bar */}
      {createConversation?.data && (
        <PinnedMessagesBar
          conversation={createConversation?.data}
          pinnedMessages={pinnedMessages}
          isVisible={isPinnedBarVisible}
          containerRef={containerRef}
        />
      )}

      {/* Messages */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 p-2 md:p-3 lg:p-4 overflow-y-auto overflow-x-hidden h-full"
      >
        {messagesLoading ? (
          <div className="flex justify-center py-6 md:py-8">
            <Loader className="h-4 w-4 md:h-6 md:w-6 animate-spin" />
          </div>
        ) : messagesError ? (
          <div className="text-center text-red-500 text-xs md:text-sm">
            Failed to load messages
          </div>
        ) : messagesData?.length === 0 ? (
          <div className="text-center text-muted-foreground">
            <div className="space-y-1 md:space-y-2">
              <p className="text-xs md:text-sm">No messages yet</p>
              <p className="text-xs">
                Send a message to start the conversation!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-0 px-2 md:px-0">
            <MessageList
              conversation={createConversation?.data}
              messages={
                messagesData?.sort(
                  (a, b) =>
                    new Date(
                      Math.ceil(Number(formatUnits(a.sentAtNs, 6)))
                    ).getTime() -
                    new Date(
                      Math.ceil(Number(formatUnits(b.sentAtNs, 6)))
                    ).getTime()
                ) ?? []
              }
              onReply={(messageId) => setReplyToId(messageId)}
              onReplyClick={scrollToMessage}
              pinnedMessages={pinnedMessages}
            />
          </div>
        )}

        {/* Typing Indicator */}
        <TypingIndicator usernames={typingUsers} />

        {/* Recording Indicator */}
        <RecordingIndicator usernames={recordingUsers} />

        {/* Scroll to bottom button */}
        {!isNearBottom && (
          <Button
            onClick={scrollToBottom}
            className="fixed bottom-16 md:bottom-20 right-4 md:right-6 rounded-full w-8 h-8 md:w-10 md:h-10 p-0 animate-scale-in"
            size="sm"
          >
            <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        )}
      </div>

      {/* Message Input */}
      <MessageInput
        placeHolder={initMessage || ""}
        conversation={createConversation?.data}
        replyToId={replyToId}
        onCancelReply={() => setReplyToId(undefined)}
        onRecording={(recording) => {
          if (recording) {
            webSocketService.startRecording(createConversation?.data?.id);
          } else {
            webSocketService.stopRecording(createConversation?.data?.id);
          }
        }}
        onSendSuccess={() => {
          setReplyToId(undefined);
          scrollToBottom();

          setTimeout(() => {
            refetchMessages();
            backendService.onMessageSent(
              createConversation?.data?.id,
              client.inboxId
            );
          }, 2000);

          setTimeout(() => refetchMessages(), 5000);
        }}
      />

      {/* Bid Message Popup */}
      {username && (
        <BidMessagePopup
          isOpen={showBidPopup}
          onClose={() => setShowBidPopup(false)}
          recipientName={username}
          recipientId={username}
          domainName={activeUsername || ""}
          conversationId={createConversation?.data?.id}
        />
      )}

      {/* Conversation Info Modal */}
      {createConversation?.data && (
        <ConversationInfoModal
          conversation={createConversation?.data}
          members={[]}
          messages={messagesData ?? []}
          isOpen={showConversationInfo}
          onClose={() => setShowConversationInfo(false)}
        />
      )}

      {/* Mute Conversation Popup */}
      {/* <MuteConversationPopup
        isOpen={showMuteDialog}
        onClose={() => setShowMuteDialog(false)}
        isMuted={currentParticipant?.isMuted || false}
        conversationId={createConversation?.data?.id || ""}
        conversationName={username || "user"}
      /> */}
    </div>
  );
};

export default UserConversation;
