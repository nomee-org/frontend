/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Conversation,
  ConversationType,
  DecodedMessage,
  Group,
} from "@xmtp/browser-sdk";
import moment from "moment";
import { DomainAvatar } from "../domain/DomainAvatar";
import { Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ContentTypeRemoteAttachment } from "@xmtp/content-type-remote-attachment";
import { useNameResolver } from "@/hooks/use-name-resolver";
import { useXmtp } from "@/contexts/XmtpContext";

export const Chat = ({
  conversation,
  handleConversationClick,
  isSelected,
}: {
  conversation: Conversation;
  handleConversationClick: (conversation: Conversation) => void;
  isSelected: boolean;
}) => {
  const { client, newMessage } = useXmtp();
  const { resolveUsername } = useNameResolver();
  const [lastMessage, setLastMessage] = useState<string>("•••");

  const handleLastMessage = useCallback(
    (message: DecodedMessage) => {
      if (client && message) {
        const isCurrentUser = message.senderInboxId === client.inboxId;
        if (isCurrentUser) {
          if (message.contentType.sameAs(ContentTypeRemoteAttachment)) {
            setLastMessage("You sent an attachment");
          } else {
            setLastMessage(message.content as any);
          }
        } else {
          if (message.contentType.sameAs(ContentTypeRemoteAttachment)) {
            setLastMessage("Received an attachment");
          } else {
            setLastMessage(message.content as any);
          }
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

  useEffect(() => {
    (async () => {
      const messages = await conversation.messages();
      const latestMessage = Array.from(messages).reverse();

      if (latestMessage && latestMessage.length) {
        handleLastMessage(latestMessage[0]);
      }
    })();
  }, [conversation, handleLastMessage]);

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
          {conversation.metadata.conversationType ===
          ConversationType.Group.toString() ? (
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center border-2 border-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
          ) : (
            <div className="relative">
              <DomainAvatar
                domain={conversation.id}
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
                {conversation.metadata.conversationType ===
                ConversationType.Group.toString()
                  ? (conversation as Group).name
                  : resolveUsername(conversation.id)}
              </h3>
              {/* {otherUser?.isOnline && (
                                <span className="text-xs text-green-600 font-medium">
                                  Online
                                </span>
                              )} */}
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
              <span className="text-xs text-muted-foreground font-medium">
                {moment(conversation.createdAt).format("HH:mm")}
              </span>
              {/* {conversation?.unreadCount > 0 && (
                                <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center rounded-full">
                                  {(conversation?.unreadCount ?? 0) > 99
                                    ? "99+"
                                    : conversation?.unreadCount}
                                </Badge>
                              )} */}
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
