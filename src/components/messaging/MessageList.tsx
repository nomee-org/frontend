/* eslint-disable @typescript-eslint/no-explicit-any */
import { MessageBubble } from "@/components/messaging/MessageBubble";
import { useUsername } from "@/hooks/use-username";
import { Badge } from "@/components/ui/badge";
import moment from "moment";
import { usePinMessage, useUnpinMessage } from "@/data/use-backend";
import { toast } from "sonner";
import { ContentType, Conversation, DecodedMessage } from "@xmtp/browser-sdk";
import { useXmtp } from "@/contexts/XmtpContext";
import { ContentTypeReaction, Reaction } from "@xmtp/content-type-reaction";
import { formatUnits } from "viem";
import type { Reply } from "@xmtp/content-type-reply";
import { ContentTypeReply } from "@xmtp/content-type-reply";
interface MessageListProps {
  conversation: Conversation;
  messages: DecodedMessage[];
  onReply?: (message: DecodedMessage) => void;
  onPin?: (messageId: string) => void;
  onUnpin?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onReplyClick?: (messageId: string) => void;
  pinnedMessages?: DecodedMessage[];
  peerLastReceipt?: DecodedMessage<ContentType.ReadReceipt>;
}

interface MessageGroup {
  date: string;
  dateLabel: string;
  messages: DecodedMessage[];
}

const DateSeparator = ({ label }: { label: string }) => (
  <div className="sticky top-0 z-20 flex justify-center">
    <Badge
      variant="secondary"
      className="px-3 py-1 text-xs font-medium bg-muted/60 border-0 shadow-sm"
    >
      {label}
    </Badge>
  </div>
);

const getDateLabel = (date: moment.Moment): string => {
  const now = moment().startOf("day");
  const messageDay = moment(date).startOf("day");
  const daysDiff = now.diff(messageDay, "days");

  if (daysDiff === 0) {
    return "Today";
  } else if (daysDiff === 1) {
    return "Yesterday";
  } else if (daysDiff < 7) {
    return messageDay.format("dddd"); // Day of week (Monday, Tuesday, etc.)
  } else if (now.year() === messageDay.year()) {
    return messageDay.format("Do MMMM, dddd"); // 23rd June, Sunday
  } else {
    return messageDay.format("Do MMMM YYYY, dddd"); // 23rd June 2023, Sunday
  }
};

export const MessageList = ({
  conversation,
  messages,
  onReply,
  onPin,
  onUnpin,
  onReaction,
  onReplyClick,
  pinnedMessages = [],
  peerLastReceipt,
}: MessageListProps) => {
  const { client } = useXmtp();

  const pinMessage = usePinMessage(conversation);
  const unpinMessage = useUnpinMessage(conversation);

  const handlePin = async (messageId: string) => {
    try {
      await pinMessage.mutateAsync({ messageId });
      onPin?.(messageId);
      toast.success("Message pinned");
    } catch (error) {
      console.error("Failed to pin message:", error);
      toast.error("Failed to pin message");
    }
  };

  const handleUnpin = async (messageId: string) => {
    try {
      await unpinMessage.mutateAsync({ messageId });
      onUnpin?.(messageId);
      toast.success("Message unpinned");
    } catch (error) {
      console.error("Failed to unpin message:", error);
      toast.error("Failed to unpin message");
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const reaction: Reaction = {
        reference: messageId,
        action: "added",
        content: emoji,
        schema: "unicode",
      };

      await conversation.sendOptimistic(reaction, ContentTypeReaction);

      onReaction?.(messageId, emoji);

      conversation.publishMessages();
    } catch (error) {
      // toast.error("Failed to react to message");
    }
  };

  const shouldShowAvatar = (
    message: DecodedMessage,
    index: number,
    groupMessages: DecodedMessage[]
  ): boolean => {
    if (message.senderInboxId === client.inboxId) return false;

    const nextMessage = groupMessages[index + 1];
    return !nextMessage || nextMessage.senderInboxId !== message.senderInboxId;
  };

  const shouldShowTail = (
    message: DecodedMessage,
    index: number,
    groupMessages: DecodedMessage[]
  ): boolean => {
    const nextMessage = groupMessages[index + 1];
    return !nextMessage || nextMessage.senderInboxId !== message.senderInboxId;
  };

  const getReplyToMessage = (
    message: DecodedMessage
  ): DecodedMessage | undefined => {
    if (message.contentType.sameAs(ContentTypeReply)) return undefined;
    const reply: Reply = message.content as any;
    return messages.find((m) => m.id === reply.reference);
  };

  // Group messages by day
  const groupMessagesByDay = (): MessageGroup[] => {
    const groups: { [key: string]: MessageGroup } = {};

    messages.forEach((message) => {
      const messageDate = moment(
        Math.ceil(Number(formatUnits(message.sentAtNs, 6)))
      );
      const dateKey = messageDate.format("YYYY-MM-DD");

      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: dateKey,
          dateLabel: getDateLabel(messageDate),
          messages: [],
        };
      }

      groups[dateKey].messages.push(message);
    });

    // Convert to array and sort by date (oldest first)
    const groupArray = Object.values(groups);

    return groupArray
      .sort((a, b) => moment(a.date).diff(moment(b.date)))
      .map((group) => ({
        ...group,
        messages: group.messages.sort((a, b) =>
          moment(Math.ceil(Number(formatUnits(a.sentAtNs, 6)))).diff(
            moment(formatUnits(b.sentAtNs, 6))
          )
        ),
      }));
  };

  const messageGroups = groupMessagesByDay();

  return (
    <div className="space-y-1">
      {messageGroups.map((group) => (
        <div key={group.date}>
          <DateSeparator label={group.dateLabel} />
          <div className="space-y-1">
            {group.messages.map((message, index) => {
              const isOwn = message.senderInboxId === client?.inboxId;
              const isSeen =
                (peerLastReceipt as any)?.sent ?? 0n >= message.sentAtNs;

              const showAvatar = shouldShowAvatar(
                message,
                index,
                group.messages
              );
              const showTail = shouldShowTail(message, index, group.messages);
              const replyTo = getReplyToMessage(message);
              const isPinned = pinnedMessages
                .map((p) => p.id)
                .includes(message.id);

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  showTail={showTail}
                  onReply={onReply}
                  onPin={
                    isPinned
                      ? (messageId) => handleUnpin(messageId)
                      : (messageId) => handlePin(messageId)
                  }
                  onReaction={(messageId, emoji) =>
                    handleReaction(messageId, emoji)
                  }
                  onReplyClick={onReplyClick}
                  isPinned={isPinned}
                  reactions={[]}
                  isSeen={isSeen}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
