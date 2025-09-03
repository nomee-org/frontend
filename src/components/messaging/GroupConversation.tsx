/* eslint-disable @typescript-eslint/no-explicit-any */

// React imports
import { useEffect, useState, useRef } from "react";

// Third-party imports
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  Trash2,
  VolumeX,
  Volume2,
} from "lucide-react";

// Local component imports
import { MessageInput } from "@/components/messaging/MessageInput";
import { ParticipantsDialog } from "@/components/messaging/ParticipantsDialog";
import { MessageList } from "@/components/messaging/MessageList";
import { TypingIndicator } from "@/components/messaging/TypingIndicator";
import { ConversationInfoModal } from "@/components/messaging/ConversationInfoModal";
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
  useGetConversation,
  useGetMessages,
  useDeleteConversation,
  updateMessageInCache,
  addMessageInCache,
  useLastReadConversation,
} from "@/data/use-backend";
import { webSocketService, WebSocketEventHandlers } from "@/services/backend/socketservice";

// Type imports
import { IMessage } from "@/types/backend";

const GroupConversation = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [replyToId, setReplyToId] = useState<string | undefined>();
  const [editingMessage, setEditingMessage] = useState<IMessage | undefined>();
  const [showParticipants, setShowParticipants] = useState(false);
  const [showConversationInfo, setShowConversationInfo] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMuteDialog, setShowMuteDialog] = useState(false);
  const { token, activeUsername } = useUsername();
  const queryClient = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const {
    data: conversation,
    isLoading: conversationLoading,
    error: conversationError,
  } = useGetConversation(id, undefined, activeUsername);

  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
    fetchNextPage,
    hasNextPage,
  } = useGetMessages(id, 50, activeUsername);

  const deleteConversation = useDeleteConversation();
  const lastReadConversationMutation = useLastReadConversation();

  // Get current user's participant data to check mute status
  const currentParticipant = conversation?.participants.find(
    (p) => p.user.username === activeUsername
  );

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

  const pinnedMessages = conversation?.pinnedMessages ?? [];
  const isPinnedBarVisible = usePinnedMessagesVisibility({
    containerRef,
    hasPinnedMessages: pinnedMessages.length > 0,
  });

  useEffect(() => {
    if (conversation?.id) {
      webSocketService.joinConversation(conversation.id);
    }
  }, [token, conversation]);

  useEffect(() => {
    const handlers: WebSocketEventHandlers = {
      id: "group-conversations",
      onNewMessage: (newMessage) => {
        if (conversation?.id) {
          addMessageInCache(
            queryClient,
            newMessage,
            conversation.id,
            50,
            activeUsername
          );
        }
      },
      onMessageDeleted: ({ messageId }) => {
        if (conversation?.id) {
          updateMessageInCache(
            queryClient,
            conversation.id,
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
        if (conversation?.id) {
          updateMessageInCache(
            queryClient,
            conversation.id,
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
        if (conversation?.id) {
          updateMessageInCache(
            queryClient,
            conversation.id,
            50,
            activeUsername,
            (msg) => (msg.id === updatedMessage.id ? updatedMessage : msg)
          );
        }
      },
      onUserTyping: ({ username, conversationId }) => {
        if (
          conversationId === conversation?.id &&
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
        if (conversationId === conversation?.id) {
          setTypingUsers((prev) => prev.filter((u) => u !== username));
        }
      },
    };

    webSocketService.setEventHandlers(handlers);

    return () => {
      webSocketService.removeEventHandlers(handlers);
    };
  }, [conversation]);

  useEffect(() => {
    if (conversation?.id) {
      lastReadConversationMutation.mutate(conversation.id);

      return () => {
        lastReadConversationMutation.mutate(conversation.id);
      };
    }
  }, [conversation]);

  if (conversationLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (conversationError || !conversation) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500">Failed to load conversation</p>
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
              <Avatar className="h-6 w-6 md:h-8 lg:h-10 md:w-8 lg:w-10">
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Users className="h-3 w-3 md:h-4 lg:h-5 md:w-4 lg:w-5 text-muted-foreground" />
                </div>
              </Avatar>
            </div>
            <div>
              <h3 className="font-semibold text-xs md:text-sm lg:text-base truncate max-w-[120px] md:max-w-none">
                {conversation.name || "Group Chat"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {conversation.participants.length} members
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 lg:space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowParticipants(true)}
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
                Delete Group
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
            className="fixed bottom-20 right-6 rounded-full w-10 h-10 p-0 animate-scale-in"
            size="sm"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Message Input */}
      <MessageInput
        conversationId={id || ""}
        replyToId={replyToId}
        onCancelReply={() => setReplyToId(undefined)}
        editingMessage={
          editingMessage
            ? { id: editingMessage.id, content: editingMessage.content || "" }
            : undefined
        }
        participants={conversation?.participants}
        onTyping={(typing) => {
          if (typing) {
            webSocketService.startTyping(conversation?.id);
          } else {
            webSocketService.stopTyping(conversation?.id);
          }
        }}
        onRecording={(typing) => {
          if (typing) {
            webSocketService.startTyping(conversation?.id);
          } else {
            webSocketService.stopTyping(conversation?.id);
          }
        }}
        onCancelEdit={() => setEditingMessage(undefined)}
        onSendSuccess={() => {
          setReplyToId(undefined);
          setEditingMessage(undefined);
          scrollToBottom();
        }}
      />

      {/* Participants Dialog */}
      <ParticipantsDialog
        isOpen={showParticipants}
        onClose={() => setShowParticipants(false)}
        conversationId={id || ""}
      />

      {/* Conversation Info Modal */}
      <ConversationInfoModal
        isOpen={showConversationInfo}
        onClose={() => setShowConversationInfo(false)}
        conversation={conversation}
      />

      {/* Delete Chat Dialog */}
      <DeleteChatDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        conversationId={id || ""}
        chatName={conversation?.name || "Group Chat"}
        isGroup={true}
        onConfirm={() => {
          navigate("/messages");
        }}
      />

      {/* Mute Conversation Popup */}
      <MuteConversationPopup
        isOpen={showMuteDialog}
        onClose={() => setShowMuteDialog(false)}
        isMuted={currentParticipant?.isMuted || false}
        conversationId={id || ""}
        conversationName={conversation?.name || "group"}
      />
    </div>
  );
};

export default GroupConversation;
