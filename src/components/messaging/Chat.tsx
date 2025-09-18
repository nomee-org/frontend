/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ContentType,
  Conversation,
  DecodedMessage,
  Dm,
  Group,
  SortDirection,
} from "@xmtp/browser-sdk";
import moment from "moment";
import { DomainAvatar } from "../domain/DomainAvatar";
import { Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useXmtp } from "@/contexts/XmtpContext";
import { formatUnits } from "viem";
import { useNavigate } from "react-router-dom";
import { useNameResolver } from "@/contexts/NicknameContext";
import { ContentTypeReadReceipt } from "@xmtp/content-type-read-receipt";
import { Badge } from "../ui/badge";
import { getSummary } from "./actions/utils";

export const Chat = ({
  conversation,
  searchQuery,
}: {
  conversation: Conversation;
  searchQuery: string;
}) => {
  const { client, newMessages } = useXmtp();
  const { nickname } = useNameResolver();
  const [lastMessage, setLastMessage] = useState<DecodedMessage>(undefined);
  const [peerAddress, setPeerAddress] = useState<string | undefined>(undefined);

  const navigate = useNavigate();

  const isSelected =
    conversation.metadata.conversationType === "group"
      ? location.pathname.includes(`/messages/groups/${conversation?.id}`)
      : location.pathname.includes(
          `/messages/${peerAddress ? nickname(peerAddress) : conversation.id}`
        );

  const handleConversationClick = (conversation: Conversation) => {
    if (conversation.metadata.conversationType === "group") {
      navigate(`/groups/${conversation.id}`);
    } else {
      navigate(
        `/messages/${peerAddress ? nickname(peerAddress) : conversation.id}`
      );
    }
  };

  useEffect(() => {
    const newMessage = newMessages.find(
      (m) => m.conversationId === conversation.id
    );
    if (!newMessage) return;
    setLastMessage(newMessage);
  }, [conversation, newMessages]);

  const getPeerAddress = useCallback(async () => {
    try {
      if (conversation.metadata.conversationType === "dm") {
        const peerInboxId = await (conversation as Dm).peerInboxId();
        const state = await client.preferences.inboxStateFromInboxIds([
          peerInboxId,
        ]);
        setPeerAddress(state?.[0]?.identifiers?.[0]?.identifier);
      }
    } catch (error) {
      setPeerAddress(undefined);
    }
  }, [client, conversation]);

  const getLastMessages = useCallback(async () => {
    try {
      const messages = await conversation.messages({
        contentTypes: [
          ContentType.Reply,
          ContentType.Reaction,
          ContentType.RemoteAttachment,
          ContentType.Attachment,
          ContentType.Text,
          ContentType.GroupUpdated,
          ContentType.GroupMembershipChange,
          ContentType.TransactionReference,
        ],
        limit: 1n,
        direction: SortDirection.Descending,
      });
      if ((messages?.length ?? 0) > 0) {
        setLastMessage(messages[0]);
      }
    } catch (error) {
      console.log(error);
    }
  }, [conversation]);

  useEffect(() => {
    getPeerAddress();
    getLastMessages();
  }, [getPeerAddress, getLastMessages]);

  if (
    searchQuery.length > 0 &&
    !(
      peerAddress?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
      nickname(peerAddress)?.toLowerCase().includes(searchQuery?.toLowerCase())
    )
  ) {
    return null;
  }

  return (
    <div
      key={conversation.id}
      onClick={() => handleConversationClick(conversation)}
      className={`mx-4 py-3 last:border-0 md:m-0 md:p-3 cursor-pointer transition-all duration-200 md:hover:bg-accent/80 border-t-sidebar-border border-b md:rounded-xl md:border md:border-transparent ${
        isSelected
          ? "md:bg-accent md:border-primary/20 md:shadow-sm"
          : "hover:shadow-sm"
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="relative flex-shrink-0">
          {conversation.metadata.conversationType === "group" ? (
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center border-2 border-primary/10">
              <Users className="h-5 w-5 text-primary" />
              {!conversation?.isActive && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 border-2 border-background rounded-full"></div>
              )}
            </div>
          ) : (
            <div className="relative">
              <DomainAvatar
                domain={nickname(peerAddress)}
                className="h-12 w-12 ring-2 ring-background shadow-sm"
              />
              {!conversation?.isActive && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 border-2 border-background rounded-full"></div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate text-foreground max-w-40">
                {conversation.metadata.conversationType === "group"
                  ? (conversation as Group)?.name || "Group Chat"
                  : nickname(peerAddress, 6)}
              </h3>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
              <span className="text-xs text-muted-foreground font-medium">
                {moment(
                  lastMessage
                    ? Math.ceil(Number(formatUnits(lastMessage.sentAtNs, 6)))
                    : conversation.createdAt
                ).format("HH:mm")}
              </span>
              <>
                {(() => {
                  const count = newMessages.filter(
                    (m) =>
                      !m.contentType.sameAs(ContentTypeReadReceipt) &&
                      m.senderInboxId !== client.inboxId &&
                      m.conversationId === conversation.id
                  ).length;

                  return (
                    <>
                      {count > 0 && (
                        <Badge className="bg-red-500 p-2 text-xs h-4 flex items-center justify-center rounded-full">
                          {count}
                        </Badge>
                      )}
                    </>
                  );
                })()}
              </>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground truncate flex-1 max-w-44">
              {lastMessage
                ? getSummary(
                    lastMessage,
                    lastMessage.senderInboxId === client?.inboxId,
                    false
                  )
                : "No messages yet"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
