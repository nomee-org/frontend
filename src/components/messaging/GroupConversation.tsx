/* eslint-disable @typescript-eslint/no-explicit-any */

// React imports
import { useCallback, useEffect, useState } from "react";

// Third-party imports
import { useParams, useNavigate } from "react-router-dom";

// UI component imports
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Icon imports
import {
  MoreVertical,
  Users,
  Loader,
  ChevronDown,
  ArrowLeft,
  VolumeX,
  RefreshCcw,
} from "lucide-react";

// Local component imports
import { MessageInput } from "@/components/messaging/MessageInput";
import { MessageList } from "@/components/messaging/MessageList";
import { TypingIndicator } from "@/components/messaging/TypingIndicator";
import { ConversationInfoModal } from "@/components/messaging/ConversationInfoModal";
import { MuteConversationPopup } from "@/components/messaging/MuteConversationPopup";
import { PinnedMessagesBar } from "@/components/messaging/PinnedMessagesBar";

// Hook imports
import { useIsMobile } from "@/hooks/use-mobile";
import { useMessageScroll } from "@/hooks/use-message-scroll";
import { usePinnedMessagesVisibility } from "@/hooks/use-pinned-messages-visibility";

// Service/data imports
import { useGetConversationMembers } from "@/data/use-backend";
import {
  webSocketService,
  WebSocketEventHandlers,
} from "@/services/backend/socketservice";

// Type imports
import { RecordingIndicator } from "./RecordingIndicator";
import { useXmtp } from "@/contexts/XmtpContext";
import {
  ContentType,
  Conversation,
  DecodedMessage,
  Group,
} from "@xmtp/browser-sdk";
import { MembersDialog } from "./MembersDialog";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { ContentTypeReadReceipt } from "@xmtp/content-type-read-receipt";
import { ContentTypeReaction } from "@xmtp/content-type-reaction";
import { toast } from "sonner";

const GroupConversation = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { address: myAddress } = useAccount();
  const [replyTo, setReplyTo] = useState<DecodedMessage | undefined>();
  const [showMembers, setShowMembers] = useState(false);
  const [showConversationInfo, setShowConversationInfo] = useState(false);
  const [showMuteDialog, setShowMuteDialog] = useState(false);
  const { client, newMessages, clearNewMessages } = useXmtp();

  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [recordingUsers, setRecordingUsers] = useState<string[]>([]);
  const [conversation, setConversation] = useState<Conversation | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(true);

  const [messages, setMessages] = useState<DecodedMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState<Error | undefined>(
    undefined
  );
  const [reactionMessages, setReactionMessages] = useState<
    DecodedMessage<ContentType.Reaction>[]
  >([]);

  const {
    data: membersData,
    isLoading: membersLoading,
    error: membersError,
    refetch: refetchMembers,
  } = useGetConversationMembers(conversation, 50);

  useEffect(() => {
    const cleanNewMessages = newMessages.filter(
      (m) => m.conversationId === conversation?.id
    );
    if (cleanNewMessages.length === 0) return;

    for (const newMessage of cleanNewMessages) {
      if (newMessage.conversationId === conversation?.id) {
        if (newMessage.contentType.sameAs(ContentTypeReadReceipt)) {
          // ignore
        } else if (newMessage.contentType.sameAs(ContentTypeReaction)) {
          setReactionMessages((prev) => [newMessage as any, ...prev]);
        } else {
          setMessages((prev) => [newMessage, ...prev]);
        }
      }
    }

    clearNewMessages(conversation?.id);
  }, [id, newMessages, conversation]);

  const getReactionMessages = async () => {
    try {
      setReactionMessages(
        (await conversation.messages({
          contentTypes: [ContentType.Reaction],
        })) as any
      );
    } catch (error) {
      console.log(error);
    }
  };

  const getMessages = async () => {
    try {
      setMessages(
        await conversation.messages({
          contentTypes: [
            ContentType.Reply,
            ContentType.RemoteAttachment,
            ContentType.Attachment,
            ContentType.Text,
            ContentType.GroupUpdated,
            ContentType.GroupMembershipChange,
            ContentType.TransactionReference,
          ],
        })
      );
    } catch (error) {
      // setMessagesError(error);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    if (conversation) {
      getMessages();
    }
  }, [conversation]);

  const {
    containerRef,
    isNearBottom,
    handleScroll,
    scrollToBottom,
    scrollToMessage,
  } = useMessageScroll({
    hasNextPage: false,
    fetchNextPage: () => {},
    isFetchingNextPage: false,
    messages: messages ?? [],
  });

  const pinnedMessages = [];
  const isPinnedBarVisible = usePinnedMessagesVisibility({
    containerRef,
    hasPinnedMessages: pinnedMessages.length > 0,
  });

  useEffect(() => {
    if (conversation?.id) {
      webSocketService.joinConversation(conversation.id);
    }
  }, [conversation]);

  const getConversation = useCallback(
    async (id: string) => {
      try {
        setIsLoading(true);
        setMessages([]);
        setReactionMessages([]);
        setMessages([]);

        setConversation(await client.conversations.getConversationById(id));
      } catch (error) {
        //
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  useEffect(() => {
    getConversation(id);
  }, [id, getConversation]);

  const handleSync = async () => {
    await conversation.sync();
    getMessages();
    getReactionMessages();
    toast.success("Synced");
  };

  useEffect(() => {
    const handlers: WebSocketEventHandlers = {
      id: "group-conversations",
      onUserTyping: ({ address, conversationId }) => {
        if (conversationId === conversation?.id && address !== myAddress) {
          setTypingUsers((prev) => {
            if (!prev.includes(address)) {
              return [...prev, address];
            }
            return prev;
          });
        }
      },
      onUserStoppedTyping: ({ address, conversationId }) => {
        if (conversationId === conversation?.id) {
          setTypingUsers((prev) => prev.filter((u) => u !== address));
        }
      },
      onUserRecording: ({ address, conversationId }) => {
        if (conversationId === conversation?.id && address !== myAddress) {
          setRecordingUsers((prev) => {
            if (!prev.includes(address)) {
              return [...prev, address];
            }
            return prev;
          });
        }
      },
      onUserStoppedRecording: ({ address, conversationId }) => {
        if (conversationId === conversation?.id) {
          setRecordingUsers((prev) => prev.filter((u) => u !== address));
        }
      },
    };

    webSocketService.setEventHandlers(handlers);

    return () => {
      webSocketService.removeEventHandlers(handlers);
    };
  }, [conversation]);

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-background flex items-center justify-between">
        <div className="flex items-center space-x-2 md:space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Add haptic feedback and smooth transition
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
              <Avatar className="h-6 w-6 md:h-8 lg:h-10 md:w-8 lg:w-10">
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Users className="h-3 w-3 md:h-4 lg:h-5 md:w-4 lg:w-5 text-muted-foreground" />
                </div>
              </Avatar>
            </div>
            <div>
              <h3 className="font-semibold text-xs md:text-sm lg:text-base truncate max-w-[120px] md:max-w-none">
                {(conversation as Group)?.name || "Group Chat"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {membersData?.length} members
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 lg:space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMembers(true)}
            className="h-7 w-7 md:h-8 md:w-8"
          >
            <Users className="h-3 w-3 md:h-4 md:w-4" />
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
                <VolumeX className="h-4 w-4 mr-2" />
                Mute
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSync()}
                className="hover:bg-accent"
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Sync
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Pinned Messages Bar */}
      {conversation && (
        <PinnedMessagesBar
          conversation={conversation}
          pinnedMessages={pinnedMessages}
          isVisible={isPinnedBarVisible}
          containerRef={containerRef}
        />
      )}

      {isLoading && (
        <div className="flex-1 flex h-full items-center justify-center p-4">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin mx-auto" />
          </div>
        </div>
      )}

      {/* Messages */}
      {!isLoading && conversation && (
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 p-2 md:p-3 lg:p-4 overflow-y-auto overflow-x-hidden h-full"
        >
          {messagesLoading ? (
            <div className="text-center text-muted-foreground h-full flex items-center justify-center">
              <div className="flex justify-center py-6 md:py-8">
                <Loader className="h-4 w-4 md:h-6 md:w-6 animate-spin" />
              </div>
            </div>
          ) : messagesError ? (
            <div className="text-center text-muted-foreground h-full flex items-center justify-center">
              <div className="text-center text-red-500 text-xs md:text-sm">
                Failed to load messages
              </div>
            </div>
          ) : (messages?.length ?? 0) === 0 ? (
            <div className="text-center text-muted-foreground h-full flex items-center justify-center">
              <div className="space-y-1 md:space-y-2 self-center">
                <p className="text-xs md:text-sm">No messages yet</p>
                <p className="text-xs">
                  Send a message to start the conversation!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-0 px-2 md:px-0">
              <MessageList
                conversation={conversation}
                onReply={(message) => setReplyTo(message)}
                onReplyClick={scrollToMessage}
                messages={
                  messages?.sort(
                    (a, b) =>
                      new Date(
                        Math.ceil(Number(formatUnits(a.sentAtNs, 6)))
                      ).getTime() -
                      new Date(
                        Math.ceil(Number(formatUnits(b.sentAtNs, 6)))
                      ).getTime()
                  ) ?? []
                }
                reactionMessages={reactionMessages}
                pinnedMessages={pinnedMessages}
              />
            </div>
          )}

          {/* Typing Indicator */}
          <TypingIndicator addresses={typingUsers} />

          {/* Recording Indicator */}
          <RecordingIndicator addresses={recordingUsers} />

          {/* Scroll to bottom button */}
          {!isNearBottom && (
            <Button
              onClick={() => scrollToBottom()}
              className="fixed bottom-20 right-6 rounded-full w-10 h-10 p-0 animate-scale-in"
              size="sm"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Message Input */}
      <MessageInput
        conversation={conversation}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(undefined)}
        members={membersData ?? []}
        onRecording={(typing) => {
          if (typing) {
            webSocketService.startTyping(conversation?.id);
          } else {
            webSocketService.stopTyping(conversation?.id);
          }
        }}
        onSendSuccess={() => {
          setReplyTo(undefined);
          scrollToBottom();
        }}
      />

      {/* Members Dialog */}
      {conversation && (
        <MembersDialog
          isOpen={showMembers}
          onClose={() => setShowMembers(false)}
          group={conversation as Group}
          members={membersData ?? []}
          membersLoading={membersLoading}
        />
      )}

      {/* Conversation Info Modal */}
      {conversation && (
        <ConversationInfoModal
          conversation={conversation}
          members={membersData ?? []}
          messages={messages ?? []}
          isOpen={showConversationInfo}
          onClose={() => setShowConversationInfo(false)}
        />
      )}

      {/* Mute Conversation Popup */}
      {/* <MuteConversationPopup
        isOpen={showMuteDialog}
        onClose={() => setShowMuteDialog(false)}
        isMuted={currentMember?.isMuted || false}
        conversationId={id || ""}
        conversationName={conversation?.name || "group"}
      /> */}
    </div>
  );
};

export default GroupConversation;
