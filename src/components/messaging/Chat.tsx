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
import { Badge, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ContentTypeRemoteAttachment } from "@xmtp/content-type-remote-attachment";
import { useXmtp } from "@/contexts/XmtpContext";
import { formatUnits } from "viem";
import { ContentTypeText } from "@xmtp/content-type-text";
import { useNavigate } from "react-router-dom";
import { useNameResolver } from "@/contexts/NicknameContext";

export const Chat = ({ conversation }: { conversation: Conversation }) => {
  const { client, newMessage } = useXmtp();
  const { nickname } = useNameResolver();
  const [lastMessage, setLastMessage] = useState<string>("•••");
  const [lastMessageAt, setLastMessageAt] = useState<Date | undefined>(
    undefined
  );
  const [peerAddress, setPeerAddress] = useState<string | undefined>(undefined);

  const navigate = useNavigate();

  const isSelected =
    conversation.metadata.conversationType === "group"
      ? location.pathname.includes(`/messages/groups/${conversation?.id}`)
      : peerAddress &&
        location.pathname.includes(
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

  const handleLastMessage = useCallback(
    (message: DecodedMessage) => {
      if (client && message) {
        try {
          const isOwn = message.senderInboxId === client?.inboxId;

          if (isOwn) {
            if (message.contentType.sameAs(ContentTypeRemoteAttachment)) {
              setLastMessage("You sent an attachment");
            } else if (message.contentType.typeId === "group_updated") {
              if ((message.content as any)?.addedInboxes?.length) {
                setLastMessage(
                  `${
                    (message.content as any)?.addedInboxes?.length
                  } members added.`
                );
              } else if ((message.content as any)?.removedInboxes) {
                setLastMessage(
                  `${
                    (message.content as any)?.addedInboxes?.length
                  } members removed.`
                );
              } else {
                setLastMessage("Group updated");
              }
            } else if (message.contentType.sameAs(ContentTypeText)) {
              setLastMessage(message.content as any);
            }
          } else {
            if (message.contentType.sameAs(ContentTypeRemoteAttachment)) {
              setLastMessage("Received an attachment");
            } else if (message.contentType.typeId === "group_updated") {
              if ((message.content as any)?.addedInboxes?.length) {
                setLastMessage(
                  `${
                    (message.content as any)?.addedInboxes?.length
                  } members added.`
                );
              } else if ((message.content as any)?.removedInboxes) {
                setLastMessage(
                  `${
                    (message.content as any)?.addedInboxes?.length
                  } members removed.`
                );
              } else {
                setLastMessage("Group updated");
              }
            } else if (message.contentType.sameAs(ContentTypeText)) {
              setLastMessage(message.content as any);
            }
          }
          setLastMessageAt(
            new Date(Math.ceil(Number(formatUnits(message.sentAtNs, 6))))
          );
        } catch (error) {
          console.log(error);
        }
      }
    },
    [client?.inboxId]
  );

  useEffect(() => {
    if (newMessage && newMessage.conversationId === conversation.id) {
      handleLastMessage(newMessage);
    }
  }, [newMessage]);

  const getPeerAddress = async () => {
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
  };

  const getLastMessages = async () => {
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
      if (messages?.length) {
        const latestMessage = Array.from(messages).reverse();
        if (latestMessage && latestMessage.length) {
          handleLastMessage(latestMessage[0]);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getPeerAddress();
    getLastMessages();
  }, [conversation]);

  return (
    <div
      key={conversation.id}
      onClick={() => handleConversationClick(conversation)}
      className={`p-3 cursor-pointer transition-all duration-200 hover:bg-accent/80 rounded-xl border border-transparent ${
        isSelected ? "bg-accent border-primary/20 shadow-sm" : "hover:shadow-sm"
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="relative flex-shrink-0">
          {conversation.metadata.conversationType === "group" ? (
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center border-2 border-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
          ) : (
            <div className="relative">
              <DomainAvatar
                domain={nickname(peerAddress)}
                className="h-12 w-12 ring-2 ring-background shadow-sm"
              />
              {/* {otherUser?.isOnline && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full"></div>
                              )} */}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate text-foreground max-w-40">
                {conversation.metadata.conversationType === "group"
                  ? (conversation as Group).name
                  : nickname(peerAddress, 6)}
              </h3>
              {/* {otherUser?.isOnline && (
                                <span className="text-xs text-green-600 font-medium">
                                  Online
                                </span>
                              )} */}
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
              <span className="text-xs text-muted-foreground font-medium">
                {moment(lastMessageAt ?? conversation.createdAt).format(
                  "HH:mm"
                )}
              </span>
              {newMessage && newMessage.conversationId === conversation.id && (
                <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center rounded-full"></Badge>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground truncate flex-1 max-w-44">
              {lastMessage || "No messages yet"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
