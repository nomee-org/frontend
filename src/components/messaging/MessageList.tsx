import { IMessage, IPinnedMessage } from "@/types/backend";
import { MessageBubble } from "@/components/messaging/MessageBubble";
import { useUsername } from "@/hooks/use-username";
import { Badge } from "@/components/ui/badge";
import moment from "moment";
import { cn } from "@/lib/utils";
import { 
  usePinMessage, 
  useUnpinMessage, 
  useDeleteMessage, 
  useAddReaction 
} from "@/data/use-backend";
import { toast } from "sonner";

interface MessageListProps {
  messages: IMessage[];
  onReply?: (messageId: string) => void;
  onEdit?: (message: IMessage) => void;
  onPin?: (messageId: string) => void;
  onUnpin?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onReplyClick?: (messageId: string) => void;
  pinnedMessages?: IPinnedMessage[];
}

interface MessageGroup {
  date: string;
  dateLabel: string;
  messages: IMessage[];
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
  messages,
  onReply,
  onEdit,
  onPin,
  onUnpin,
  onDelete,
  onReaction,
  onReplyClick,
  pinnedMessages = [],
}: MessageListProps) => {
  const { activeUsername } = useUsername();
  
  const pinMessage = usePinMessage();
  const unpinMessage = useUnpinMessage();
  const deleteMessage = useDeleteMessage();
  const addReaction = useAddReaction();

  const handlePin = async (messageId: string, conversationId: string) => {
    try {
      await pinMessage.mutateAsync({ conversationId, messageId });
      onPin?.(messageId);
      toast.success("Message pinned");
    } catch (error) {
      console.error("Failed to pin message:", error);
      toast.error("Failed to pin message");
    }
  };

  const handleUnpin = async (messageId: string, conversationId: string) => {
    try {
      await unpinMessage.mutateAsync({ conversationId, messageId });
      onUnpin?.(messageId);
      toast.success("Message unpinned");
    } catch (error) {
      console.error("Failed to unpin message:", error);
      toast.error("Failed to unpin message");
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage.mutateAsync({ messageId });
      onDelete?.(messageId);
      toast.success("Message deleted");
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast.error("Failed to delete message");
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await addReaction.mutateAsync({
        messageId,
        addReactionDto: { emoji },
      });
      onReaction?.(messageId, emoji);
    } catch (error) {
      console.error("Failed to react to message:", error);
      toast.error("Failed to react to message");
    }
  };

  const shouldShowAvatar = (
    message: IMessage,
    index: number,
    groupMessages: IMessage[]
  ): boolean => {
    if (message.sender?.username === activeUsername) return false;

    const nextMessage = groupMessages[index + 1];
    return (
      !nextMessage || nextMessage.sender?.username !== message.sender?.username
    );
  };

  const shouldShowTail = (
    message: IMessage,
    index: number,
    groupMessages: IMessage[]
  ): boolean => {
    const nextMessage = groupMessages[index + 1];
    return (
      !nextMessage || nextMessage.sender?.username !== message.sender?.username
    );
  };

  const getReplyToMessage = (message: IMessage): IMessage | undefined => {
    if (!message.replyToId) return undefined;
    return messages.find((m) => m.id === message.replyToId);
  };

  // Group messages by day
  const groupMessagesByDay = (): MessageGroup[] => {
    const groups: { [key: string]: MessageGroup } = {};

    messages.forEach((message) => {
      const messageDate = moment(message.createdAt);
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
          moment(a.createdAt).diff(moment(b.createdAt))
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
              if (message.isDeleted) return null;

              const isOwn = message.sender?.username === activeUsername;
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
                  onEdit={onEdit}
                  onPin={
                    isPinned
                      ? (messageId) => handleUnpin(messageId, message.conversationId)
                      : (messageId) => handlePin(messageId, message.conversationId)
                  }
                  onDelete={(messageId) => handleDelete(messageId)}
                  onReaction={(messageId, emoji) => handleReaction(messageId, emoji)}
                  onReplyClick={onReplyClick}
                  isPinned={isPinned}
                  replyTo={replyTo}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};