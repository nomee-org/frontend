/* eslint-disable @typescript-eslint/no-explicit-any */

// React imports
import { useState, useEffect, useRef } from "react";

// Third-party imports
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  DollarSign,
  Loader,
  ChevronDown,
  ArrowLeft,
  Trash2,
  VolumeX,
  Volume2,
} from "lucide-react";

// Local component imports
import BidMessagePopup from "@/components/domain/BidMessagePopup";
import { DomainAvatar } from "@/components/domain/DomainAvatar";
import { MessageInput } from "@/components/messaging/MessageInput";
import { MessageList } from "@/components/messaging/MessageList";
import { TypingIndicator } from "@/components/messaging/TypingIndicator";
import { OnlineStatus } from "@/components/messaging/OnlineStatus";
import { ConversationInfoModal } from "@/components/messaging/ConversationInfoModal";
import { MessageSettingsPopup } from "@/components/messaging/MessageSettingsPopup";
import { DeleteChatDialog } from "@/components/messaging/DeleteChatDialog";
import { MuteConversationPopup } from "@/components/messaging/MuteConversationPopup";
import { PinnedMessagesBar } from "@/components/messaging/PinnedMessagesBar";

// Hook imports
import { useUsername } from "@/hooks/use-username";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMessageScroll } from "@/hooks/use-message-scroll";
import { usePinnedMessagesVisibility } from "@/hooks/use-pinned-messages-visibility";

// Service/data imports
import {
  useGetMessages,
  useCreateConversation,
  useDeleteConversation,
  updateMessageInCache,
  addMessageInCache,
  useLastReadConversation,
} from "@/data/use-backend";
import { webSocketService, WebSocketEventHandlers } from "@/services/backend/socketservice";

// Type imports
import { ConversationType, IMessage } from "@/types/backend";

const UserConversation = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showBidPopup, setShowBidPopup] = useState(false);
  const [replyToId, setReplyToId] = useState<string | undefined>();
  const [editingMessage, setEditingMessage] = useState<IMessage | undefined>();
  const [showConversationInfo, setShowConversationInfo] = useState(false);
  const [showMessageSettings, setShowMessageSettings] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMuteDialog, setShowMuteDialog] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<
    string | undefined
  >();
  const { activeUsername } = useUsername();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const lastReadConversationMutation = useLastReadConversation();

  // Get current user's participant data to check mute status
  const currentParticipant = createConversation?.data?.participants?.find(
    (p) => p.user.username === activeUsername
  );

  useEffect(() => {
    if (username) {
      createConversation.mutate({
        type: ConversationType.DIRECT,
        participantUsernames: [username],
      });
    }
  }, [username]);

  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
    fetchNextPage,
    hasNextPage,
  } = useGetMessages(createConversation?.data?.id, 50, activeUsername);

  const {
    containerRef,
    isNearBottom,
    handleScroll,
    scrollToBottom,
    scrollToMessage,
  } = useMessageScroll({
    hasNextPage: hasNextPage || false,
    fetchNextPage: () => hasNextPage && fetchNextPage(),
    isFetchingNextPage: false,
    messages: messagesData?.pages?.flatMap((p) => p.data) ?? [],
    newMessageCount: 0,
  });

  const pinnedMessages = createConversation?.data?.pinnedMessages ?? [];
  const isPinnedBarVisible = usePinnedMessagesVisibility({
    containerRef,
    hasPinnedMessages: pinnedMessages.length > 0,
  });

  useEffect(() => {
    if (createConversation?.data?.id) {
      webSocketService.joinConversation(createConversation.data.id);
    }
  }, [createConversation]);

  const queryClient = useQueryClient();

  useEffect(() => {
    const handlers: WebSocketEventHandlers = {
      id: "user-conversations",
      onNewMessage: (newMessage) => {
        if (createConversation?.data?.id) {
          addMessageInCache(
            queryClient,
            newMessage,
            createConversation.data.id,
            50,
            activeUsername
          );
        }
      },
      onMessageDeleted: ({ messageId }) => {
        if (createConversation?.data?.id) {
          updateMessageInCache(
            queryClient,
            createConversation.data.id,
            50,
            activeUsername,
            (msg) =>
              msg.id === messageId
                ? { ...msg, isDeleted: true, content: undefined }
                : msg
          );
        }
      },
      onMessageReaction: (reaction) => {
        if (createConversation?.data?.id) {
          updateMessageInCache(
            queryClient,
            createConversation.data.id,
            50,
            activeUsername,
            (msg) =>
              msg.id === reaction.messageId
                ? {
                    ...msg,
                    reactions: [
                      ...msg.reactions.filter((r) => r.id !== reaction.id),
                      reaction,
                    ],
                  }
                : msg
          );
        }
      },
      onMessageUpdated: (updatedMessage) => {
        if (createConversation?.data?.id) {
          updateMessageInCache(
            queryClient,
            createConversation.data.id,
            50,
            activeUsername,
            (msg) => (msg.id === updatedMessage.id ? updatedMessage : msg)
          );
        }
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
    };

    // lastReadConversationMutation.mutate(createConversation?.data?.id);
    webSocketService.setEventHandlers(handlers);

    return () => {
      // lastReadConversationMutation.mutate(createConversation?.data?.id);
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
              // Add haptic feedback and smooth transition
              if (isMobile && navigator.vibrate) {
                navigator.vibrate(50);
              }
              navigate("/messages");
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
            <DollarSign className="h-2 w-2 md:h-3 lg:h-4 md:w-3 lg:w-4 mr-0.5 md:mr-1" />
            <span className="hidden sm:inline">Send </span>Bid
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
                {currentParticipant?.isMuted ? (
                  <>
                    <Volume2 className="h-4 w-4 mr-2" />
                    Unmute
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4 mr-2" />
                    Mute
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Pinned Messages Bar */}
      <PinnedMessagesBar
        pinnedMessages={pinnedMessages}
        isVisible={isPinnedBarVisible}
        onMessageClick={(messageId) => {
          // Additional handling if needed
        }}
        containerRef={containerRef}
      />

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
        ) : (messagesData?.pages?.[0]?.pagination.total ?? 0) === 0 ? (
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
              messages={
                messagesData?.pages
                  ?.flatMap((p) => p.data)
                  ?.sort(
                    (a, b) =>
                      new Date(a.createdAt).getTime() -
                      new Date(b.createdAt).getTime()
                  ) ?? []
              }
              onReply={(messageId) => setReplyToId(messageId)}
              onEdit={(message) => setEditingMessage(message)}
              onReplyClick={scrollToMessage}
              pinnedMessages={pinnedMessages}
            />
          </div>
        )}

        {/* Typing Indicator */}
        <TypingIndicator usernames={typingUsers} />

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
        conversationId={createConversation?.data?.id}
        replyToId={replyToId}
        onCancelReply={() => setReplyToId(undefined)}
        editingMessage={
          editingMessage
            ? { id: editingMessage.id, content: editingMessage.content || "" }
            : undefined
        }
        onTyping={(typing) => {
          if (typing) {
            webSocketService.startTyping(createConversation?.data?.id);
          } else {
            webSocketService.stopTyping(createConversation?.data?.id);
          }
        }}
        onRecording={(typing) => {
          if (typing) {
            webSocketService.startTyping(createConversation?.data?.id);
          } else {
            webSocketService.stopTyping(createConversation?.data?.id);
          }
        }}
        onCancelEdit={() => setEditingMessage(undefined)}
        onSendSuccess={() => {
          setReplyToId(undefined);
          setEditingMessage(undefined);
          scrollToBottom();
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
      <ConversationInfoModal
        isOpen={showConversationInfo}
        onClose={() => setShowConversationInfo(false)}
        conversation={createConversation?.data}
        username={username}
        onOpenMessageSettings={() => {
          setShowConversationInfo(false);
          setShowMessageSettings(true);
        }}
        conversationId={createConversation?.data?.id}
        selectedMessageId={selectedMessageId}
      />

      {/* Message Settings Popup */}
      <MessageSettingsPopup
        isOpen={showMessageSettings}
        onClose={() => setShowMessageSettings(false)}
        conversationId={createConversation?.data?.id}
        messageId={selectedMessageId}
      />

      {/* Delete Chat Dialog */}
      <DeleteChatDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        conversationId={createConversation?.data?.id || ""}
        onConfirm={() => {
          navigate("/messages");
        }}
        chatName={username || "Unknown User"}
        isGroup={false}
      />

      {/* Mute Conversation Popup */}
      <MuteConversationPopup
        isOpen={showMuteDialog}
        onClose={() => setShowMuteDialog(false)}
        isMuted={currentParticipant?.isMuted || false}
        conversationId={createConversation?.data?.id || ""}
        conversationName={username || "user"}
      />
    </div>
  );
};

export default UserConversation;
