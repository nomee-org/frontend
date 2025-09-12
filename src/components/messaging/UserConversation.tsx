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
  Send,
  UserRoundX,
  RefreshCcw,
  VolumeOff,
  VolumeX,
} from "lucide-react";

// Local component imports
import ListPromptMessagePopup from "@/components/domain/ListPromptMessagePopup";
import { DomainAvatar } from "@/components/domain/DomainAvatar";
import { MessageInput } from "@/components/messaging/MessageInput";
import { MessageList } from "@/components/messaging/MessageList";
import { TypingIndicator } from "@/components/messaging/TypingIndicator";
import { OnlineStatus } from "@/components/messaging/OnlineStatus";
import { ConversationInfoModal } from "@/components/messaging/ConversationInfoModal";
import { MuteConversationPopup } from "@/components/messaging/MuteConversationPopup";
import { PinnedMessagesBar } from "@/components/messaging/PinnedMessagesBar";

// Hook imports
import { useIsMobile } from "@/hooks/use-mobile";
import { useMessageScroll } from "@/hooks/use-message-scroll";
import { usePinnedMessagesVisibility } from "@/hooks/use-pinned-messages-visibility";

// Service/data imports
import {
  webSocketService,
  WebSocketEventHandlers,
} from "@/services/backend/socketservice";

// Type imports
import { RecordingIndicator } from "./RecordingIndicator";
import { useXmtp } from "@/contexts/XmtpContext";
import { dataService } from "@/services/doma/dataservice";
import { useHelper } from "@/hooks/use-helper";
import { Conversation, DecodedMessage, Dm } from "@xmtp/browser-sdk";
import { formatUnits } from "viem";
import { toast } from "sonner";
import { useNameResolver } from "@/contexts/NicknameContext";
import { useAccount } from "wagmi";
import { useName } from "@/data/use-doma";

const UserConversation = () => {
  const [params] = useSearchParams();

  const initMessage = params.get("message");

  const { username: dmId } = useParams<{
    username: string;
  }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { address: myAddress } = useAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [showBidPopup, setShowBidPopup] = useState(false);
  const [replyToId, setReplyToId] = useState<string | undefined>();
  const [replyToInboxId, setReplyToInboxId] = useState<string | undefined>();
  const [showConversationInfo, setShowConversationInfo] = useState(false);
  const [showMuteDialog, setShowMuteDialog] = useState(false);
  const [peerAddress, setPeerAddress] = useState<string | undefined>(undefined);

  const { client, newMessage, clearNewMessage } = useXmtp();
  const { nickname, setNickname } = useNameResolver();
  const { parseCAIP10 } = useHelper();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [recordingUsers, setRecordingUsers] = useState<string[]>([]);

  const [conversation, setConversation] = useState<Conversation | undefined>(
    undefined
  );
  const [messages, setMessages] = useState<DecodedMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState<Error | undefined>(
    undefined
  );

  const {
    data: nameData,
    isLoading: isNameLoading,
    isRefetching,
    isEnabled,
  } = useName(dmId);

  const getOrCreateConversation = async (
    inboxId: string,
    address?: string
  ): Promise<Dm | undefined> => {
    try {
      let dm: Dm | undefined = undefined;

      if (inboxId) {
        dm = await client.conversations.getDmByInboxId(inboxId);
      }

      if (!dm) {
        if (address) {
          const canMessage = await client.canMessage([
            {
              identifier: address.toLowerCase(),
              identifierKind: "Ethereum",
            },
          ]);

          if (!canMessage.get(address.toLowerCase())) return undefined;
        }

        dm = await client.conversations.newDm(inboxId);
      }

      return dm;
    } catch (error) {
      return undefined;
    }
  };

  useEffect(() => {
    if (newMessage && newMessage.conversationId === conversation?.id) {
      setMessages((prev) => [newMessage, ...prev]);
      clearNewMessage();
    }
  }, [newMessage]);

  const getMessages = async () => {
    try {
      setMessages(await conversation.messages());
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

  const init = async () => {
    try {
      setIsLoading(true);
      setPeerAddress(undefined);

      if (dmId?.toLowerCase() === "you") {
        setPeerAddress(myAddress);
        setConversation(
          await getOrCreateConversation(client?.inboxId, myAddress)
        );
      } else if (nameData?.claimedBy && dmId.includes(".")) {
        const address = parseCAIP10(nameData.claimedBy).address;

        setPeerAddress(address);
        setNickname(address, nameData.name);

        setConversation(
          await getOrCreateConversation(
            await client.findInboxIdByIdentifier({
              identifier: address.toLowerCase(),
              identifierKind: "Ethereum",
            }),
            peerAddress
          )
        );
      } else if (dmId.startsWith("0x")) {
        setPeerAddress(dmId);
        setConversation(
          await getOrCreateConversation(
            await client.findInboxIdByIdentifier({
              identifier: dmId.toLowerCase(),
              identifierKind: "Ethereum",
            }),
            dmId
          )
        );
      } else {
        setPeerAddress(undefined);
        setConversation(await client.conversations.getConversationById(dmId));
      }
    } catch (error) {
      toast.error(error?.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (client?.inboxId) init();
  }, [dmId, client?.inboxId, nameData]);

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
    newMessageCount: 0,
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

  const handleSync = async () => {
    await conversation.sync();
    await getMessages();
    toast.success("Synced");
  };

  useEffect(() => {
    const handlers: WebSocketEventHandlers = {
      id: "user-conversations",
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

  if (isLoading || (isEnabled && (isNameLoading || isRefetching))) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <UserRoundX className="w-8 h-8 mx-auto mb-2" />
          <p className="text-muted-foreground">
            User is not registered on XTMP.
          </p>
          <Button size="sm" variant="outline">
            Invite them
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-[fade-in_0.2s_ease-out]">
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
                domain={nickname(peerAddress)}
                className="h-8 w-8 md:h-10 md:w-10"
              />
            </div>
            <div>
              <h3 className="font-semibold text-xs md:text-sm lg:text-base truncate max-w-[120px] md:max-w-none">
                {nickname(peerAddress, 8)}
              </h3>
              <OnlineStatus isOnline={true} className="mt-0.5" />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 lg:space-x-2">
          {peerAddress && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBidPopup(true)}
              className="text-primary border-primary hover:bg-primary hover:text-primary-foreground text-xs lg:text-sm h-7 md:h-8"
            >
              <Send className="h-2 w-2 md:h-3 lg:h-4 md:w-3 lg:w-4 mr-0.5 md:mr-1" />
              Offer
            </Button>
          )}
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
                onClick={() => handleSync}
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
        ) : messages?.length === 0 ? (
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
              conversation={conversation}
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
              onReply={(message) => {
                setReplyToId(message.id);
                setReplyToInboxId(message.senderInboxId);
              }}
              onReplyClick={scrollToMessage}
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
        conversation={conversation}
        replyToId={replyToId}
        replyToInboxId={replyToInboxId}
        onCancelReply={() => setReplyToId(undefined)}
        onRecording={(recording) => {
          if (recording) {
            webSocketService.startRecording(conversation?.id);
          } else {
            webSocketService.stopRecording(conversation?.id);
          }
        }}
        onSendSuccess={() => {
          setReplyToId(undefined);
          scrollToBottom();
        }}
      />

      {/* Bid Message Popup */}
      {peerAddress && conversation && (
        <ListPromptMessagePopup
          conversation={conversation}
          isOpen={showBidPopup}
          onClose={() => setShowBidPopup(false)}
          recipientAddress={peerAddress}
        />
      )}

      {/* Conversation Info Modal */}
      {conversation && (
        <ConversationInfoModal
          conversation={conversation}
          members={[]}
          messages={messages ?? []}
          isOpen={showConversationInfo}
          onClose={() => setShowConversationInfo(false)}
          peerAddress={peerAddress}
        />
      )}

      {/* Mute Conversation Popup */}
      {conversation && (
        <MuteConversationPopup
          conversation={conversation}
          isOpen={showMuteDialog}
          onClose={() => setShowMuteDialog(false)}
          isMuted={false}
          conversationName={nickname(peerAddress, 8)}
        />
      )}
    </div>
  );
};

export default UserConversation;
