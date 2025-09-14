/* eslint-disable @typescript-eslint/no-explicit-any */

// React imports
import { useState, useEffect, useCallback } from "react";

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
  VolumeX,
  HandCoins,
} from "lucide-react";

// Local component imports
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
import { useHelper } from "@/hooks/use-helper";
import {
  ConsentEntityType,
  ConsentState,
  ContentType,
  Conversation,
  DecodedMessage,
  Dm,
} from "@xmtp/browser-sdk";
import { formatUnits } from "viem";
import { toast } from "sonner";
import { useNameResolver } from "@/contexts/NicknameContext";
import { useAccount } from "wagmi";
import { useName } from "@/data/use-doma";
import { ContentTypeReadReceipt } from "@xmtp/content-type-read-receipt";
import { ContentTypeReaction } from "@xmtp/content-type-reaction";
import { TradeOptionPopup } from "./TradeOptionsPopup";

const UserConversation = () => {
  const [params] = useSearchParams();
  const initMessage = params.get("message");
  const { dmId } = useParams<{
    dmId: string;
  }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { address: myAddress } = useAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [showTradePopup, setShowTradePopup] = useState(false);
  const [replyTo, setReplyTo] = useState<DecodedMessage | undefined>();
  const [showConversationInfo, setShowConversationInfo] = useState(false);
  const [showMuteDialog, setShowMuteDialog] = useState(false);
  const [peerAddress, setPeerAddress] = useState<string | undefined>(undefined);
  const [peerInboxId, setPeerInboxId] = useState<string | undefined>(undefined);
  const { identifier, client, newMessages, clearNewMessages } = useXmtp();
  const { nickname, setNickname } = useNameResolver();
  const { parseCAIP10 } = useHelper();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [recordingUsers, setRecordingUsers] = useState<string[]>([]);
  const [conversation, setConversation] = useState<Conversation | undefined>(
    undefined
  );
  const [messages, setMessages] = useState<DecodedMessage[]>([]);
  const [receiptMessages, setReceiptMessages] = useState<
    DecodedMessage<ContentType.ReadReceipt>[]
  >([]);
  const [reactionMessages, setReactionMessages] = useState<
    DecodedMessage<ContentType.Reaction>[]
  >([]);
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

  const getOrCreateConversation = useCallback(
    async (inboxId: string) => {
      try {
        let dm: Dm | undefined = undefined;
        dm = await client.conversations.getDmByInboxId(inboxId);
        if (!dm) {
          const consentState = await client.preferences.getConsentState(
            ConsentEntityType.InboxId,
            inboxId
          );

          if (consentState === ConsentState.Denied) {
            return toast.error(
              `Recipient has denied messages from you. Please request permission.`
            );
          }

          await client.preferences.setConsentStates([
            {
              entityType: ConsentEntityType.InboxId,
              entity: inboxId,
              state: ConsentState.Allowed,
            },
          ]);

          dm = await client.conversations.newDm(inboxId);
        }

        setConversation(dm);

        dm.sync();
      } catch (error) {
        return undefined;
      }
    },
    [client]
  );

  useEffect(() => {
    const cleanNewMessages = newMessages.filter(
      (m) => m.conversationId === conversation?.id
    );
    if (cleanNewMessages.length === 0) return;

    for (const newMessage of cleanNewMessages) {
      if (newMessage.conversationId === conversation?.id) {
        if (newMessage.contentType.sameAs(ContentTypeReadReceipt)) {
          setReceiptMessages((prev) => [newMessage as any, ...prev]);
        } else if (newMessage.contentType.sameAs(ContentTypeReaction)) {
          setReactionMessages((prev) => [newMessage as any, ...prev]);
        } else {
          setMessages((prev) => [newMessage, ...prev]);
        }
      }
    }

    clearNewMessages(conversation?.id);
  }, [dmId, newMessages, conversation]);

  const getReceiptMessages = async () => {
    try {
      setReceiptMessages(
        (await conversation.messages({
          contentTypes: [ContentType.ReadReceipt],
        })) as any
      );
    } catch (error) {
      console.log(error);
    }
  };

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
      getReceiptMessages();
      getReactionMessages();
    }
  }, [conversation]);

  useEffect(() => {
    getOrCreateConversation(peerInboxId);
  }, [peerInboxId, getOrCreateConversation]);

  const init = async () => {
    try {
      setMessages([]);
      setReactionMessages([]);
      setReactionMessages([]);
      setIsLoading(true);
      setPeerAddress(undefined);

      if (dmId?.toLowerCase() === "you") {
        setPeerAddress(myAddress);
        setPeerInboxId(client?.inboxId);
      } else if (nameData?.claimedBy && dmId.includes(".")) {
        const address = parseCAIP10(nameData.claimedBy).address;

        setPeerAddress(address);
        setNickname(address, nameData.name);

        setPeerInboxId(
          await client.findInboxIdByIdentifier({
            identifier: address,
            identifierKind: "Ethereum",
          })
        );
      } else if (dmId.startsWith("0x")) {
        setPeerAddress(dmId);
        setPeerInboxId(
          await client.findInboxIdByIdentifier({
            identifier: dmId,
            identifierKind: "Ethereum",
          })
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
    if (client) {
      init();
    }
  }, [dmId, identifier, client, nameData]);

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
    messages: messages,
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
    getMessages();
    getReceiptMessages();
    getReactionMessages();
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

  return (
    <>
      {/* Chat Header */}
      <div className="p-4 sticky top-0 border-b border-border bg-background flex items-center justify-between">
        <div className="flex items-center space-x-0 md:space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (isMobile && navigator.vibrate) {
                navigator.vibrate(50);
              }
              navigate("/");
            }}
            className="h-8 w-8 p-0 hover:bg-accent/80 transition-all duration-200 hover:scale-110 active:scale-95"
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
              <OnlineStatus
                isActive={conversation?.isActive}
                className="mt-0.5"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 lg:space-x-2">
          {peerAddress && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTradePopup(true)}
              className="text-primary border-primary hover:bg-primary hover:text-primary-foreground text-xs lg:text-sm h-7 md:h-8"
            >
              Trade
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

      <div className="flex flex-col h-[calc(100vh-184px)] md:h-[calc(100vh-214px)]">
        {/* Pinned Messages Bar */}
        {conversation && (
          <PinnedMessagesBar
            conversation={conversation}
            pinnedMessages={pinnedMessages}
            isVisible={isPinnedBarVisible}
            containerRef={containerRef}
          />
        )}

        {(isLoading || (isEnabled && (isNameLoading || isRefetching))) && (
          <div className="flex-1 flex h-full items-center justify-center p-4">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin mx-auto" />
            </div>
          </div>
        )}

        {!conversation &&
          !(isLoading || (isEnabled && (isNameLoading || isRefetching))) && (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center space-y-4">
                <UserRoundX className="w-8 h-8 mx-auto mb-2" />
                <p className="text-muted-foreground">
                  User is not registered on XTMP.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (isMobile && navigator.vibrate) {
                        navigator.vibrate(50);
                      }
                      navigate("/");
                    }}
                    className="h-8 w-8 p-0 hover:bg-accent/80 transition-all duration-200 hover:scale-110 active:scale-95"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="secondary">
                    Invite them
                  </Button>
                </div>
              </div>
            </div>
          )}

        {/* Messages */}
        {!(isLoading || (isEnabled && (isNameLoading || isRefetching))) &&
          conversation && (
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
              ) : messages?.length === 0 ? (
                <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                  <div className="space-y-1 md:space-y-2 self-center">
                    <p className="text-xs md:text-sm">No messages yet</p>
                    <p className="text-xs">
                      Send a message to start the conversation!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-0 px-2 md:px-0 ">
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
                    pinnedMessages={pinnedMessages}
                    reactionMessages={reactionMessages}
                    peerLastReceipt={
                      receiptMessages.sort(
                        (a, b) =>
                          Number(formatUnits(b.sentAtNs, 6)) -
                          Number(formatUnits(a.sentAtNs, 6))
                      )?.[0] ?? undefined
                    }
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
                  onClick={() => {
                    scrollToBottom(conversation);
                  }}
                  className="fixed bottom-20 md:bottom-20 right-4 md:right-6 rounded-full w-8 h-8 md:w-10 md:h-10 p-0 animate-scale-in"
                  size="sm"
                  variant="secondary"
                >
                  <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              )}
            </div>
          )}

        {peerAddress && conversation && (
          <TradeOptionPopup
            conversation={conversation}
            replyTo={replyTo}
            isOpen={showTradePopup}
            onClose={() => setShowTradePopup(false)}
            peerAddress={peerAddress}
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

      {/* Message Input */}
      <MessageInput
        placeHolder={initMessage || ""}
        conversation={conversation}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(undefined)}
        onRecording={(recording) => {
          if (recording) {
            webSocketService.startRecording(conversation?.id);
          } else {
            webSocketService.stopRecording(conversation?.id);
          }
        }}
        onSendSuccess={() => {
          setReplyTo(undefined);
          scrollToBottom(conversation);
        }}
      />
    </>
  );
};

export default UserConversation;
