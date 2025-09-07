import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { DomainAvatar } from "@/components/domain/DomainAvatar";
import { UserPreviewPopup } from "./UserPreviewPopup";
import { ReactionUsersPopup } from "./ReactionUsersPopup";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Reply,
  Edit,
  Pin,
  PinOff,
  Copy,
  Trash,
  User,
  Heart,
  Laugh,
  ThumbsUp,
  ThumbsDown,
  Angry,
  Check,
} from "lucide-react";
import { IMessage, MessageType } from "@/types/backend";
import { cn } from "@/lib/utils";
import moment from "moment";
import { useUsername } from "@/hooks/use-username";
import { toast } from "sonner";

const reactions = [
  { emoji: "❤️", icon: Heart, name: "heart" },
  { emoji: "😂", icon: Laugh, name: "laugh" },
  { emoji: "👍", icon: ThumbsUp, name: "thumbs_up" },
  { emoji: "👎", icon: ThumbsDown, name: "thumbs_down" },
  { emoji: "😮", icon: ThumbsUp, name: "surprised" },
  { emoji: "😡", icon: Angry, name: "angry" },
];

interface MessageBubbleProps {
  message: IMessage;
  isOwn: boolean;
  showAvatar: boolean;
  showTail: boolean;
  onReply?: (messageId: string) => void;
  onEdit?: (message: IMessage) => void;
  onPin?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onUnpin?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onReplyClick?: (messageId: string) => void;
  isPinned?: boolean;
  replyTo?: IMessage;
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar,
  showTail,
  onReply,
  onReaction,
  onEdit,
  onPin,
  onUnpin,
  onDelete,
  isPinned,
  replyTo,
}: MessageBubbleProps) {
  const { activeUsername } = useUsername();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [showReplyIcon, setShowReplyIcon] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isLongPressed, setIsLongPressed] = useState(false);
  const [showReactionUsers, setShowReactionUsers] = useState(false);
  const [selectedReactionEmoji, setSelectedReactionEmoji] =
    useState<string>("");
  const messageRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const longPressTimer = useRef<NodeJS.Timeout>();

  const handleLongPress = () => {
    setIsLongPressed(true);
    setShowReactions(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
    longPressTimer.current = setTimeout(handleLongPress, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    // Clear long press timer if user moves
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;

    // Allow swipe-to-reply only on other users' messages
    if (!isOwn && diff > 0 && diff <= 100) {
      setDragOffset(diff);
      setShowReplyIcon(diff > 30);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    if (!isOwn && dragOffset > 50 && onReply) {
      onReply(message.id);
    }

    setIsDragging(false);
    setDragOffset(0);
    setShowReplyIcon(false);

    // Hide reactions after some time if long pressed
    if (isLongPressed) {
      setTimeout(() => {
        setShowReactions(false);
        setIsLongPressed(false);
      }, 3000);
    }
  };

  const handleReaction = async (emoji: string) => {
    try {
      onReaction(message.id, emoji);
      setShowReactions(false);
      setIsLongPressed(false);
    } catch (error) {
      toast.error("Failed to add reaction");
    }
  };

  const handleReactionClick = (emoji: string) => {
    // Check if there are reactions for this emoji to show users popup
    const hasReactionsForEmoji = message.reactions?.some(
      (r) => r.emoji === emoji
    );

    if (hasReactionsForEmoji) {
      setSelectedReactionEmoji(emoji);
      setShowReactionUsers(true);
    } else {
      // Add new reaction
      handleReaction(emoji);
    }
  };

  const handleDelete = async () => {
    try {
      onDelete(message.id);
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };

  const renderRichContent = (content: string) => {
    if (!content) return "";

    // Convert newlines to <br> tags
    let richContent = content.replace(/\n/g, "<br>");

    // Make URLs clickable
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    richContent = richContent.replace(
      urlRegex,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="underline text-blue-400 hover:text-blue-300">$1</a>'
    );

    // Make emails clickable
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    richContent = richContent.replace(
      emailRegex,
      '<a href="mailto:$1" class="underline text-blue-400 hover:text-blue-300">$1</a>'
    );

    // Make mentions clickable
    const mentionRegex = /(?!<[^>]*>)@([a-zA-Z0-9._-]+)(?![^<]*<\/a>)/g;
    richContent = richContent.replace(
      mentionRegex,
      '<a href="/names/$1" class="text-accent hover:text-accent/80 hover:underline font-medium" onclick="event.stopPropagation()">@$1</a>'
    );

    return richContent;
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case MessageType.IMAGE:
        return (
          <div className="space-y-2">
            {message.mediaUrl && (
              <img
                src={message.mediaUrl}
                alt="Shared image"
                className="max-w-[min(100%,320px)] rounded-lg cursor-pointer"
                onClick={() => window.open(message.mediaUrl, "_blank")}
              />
            )}
            {message.content && (
              <div
                className="text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: renderRichContent(message.content),
                }}
              />
            )}
          </div>
        );
      case MessageType.VIDEO:
        return (
          <div className="space-y-2">
            {message.mediaUrl && (
              <video
                src={message.mediaUrl}
                controls
                className="max-w-[min(100%,320px)] rounded-lg"
              />
            )}
            {message.content && (
              <div
                className="text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: renderRichContent(message.content),
                }}
              />
            )}
          </div>
        );
      case MessageType.VOICE:
        return (
          <div className="space-y-2">
            {message.mediaUrl && (
              <audio
                src={message.mediaUrl}
                controls
                className="max-w-[min(100%,320px)] rounded-lg"
              />
            )}
            {message.content && (
              <div
                className="text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: renderRichContent(message.content),
                }}
              />
            )}
          </div>
        );
      case MessageType.FILE:
        return (
          <div className="flex items-center space-x-3 bg-black/10 p-3 rounded-lg">
            <div className="p-2 bg-white/10 rounded">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{message.content}</p>
              <p className="text-xs opacity-70">Document</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              Download
            </Button>
          </div>
        );
      case MessageType.STICKER:
        return (
          <div className="w-32 h-32">
            {message.mediaUrl && (
              <img
                src={message.mediaUrl}
                alt="Sticker"
                className="w-full h-full object-cover rounded-lg"
              />
            )}
          </div>
        );
      default:
        return (
          <div
            className="text-sm leading-relaxed break-words whitespace-pre-wrap"
            dangerouslySetInnerHTML={{
              __html: renderRichContent(message.content || ""),
            }}
          />
        );
    }
  };

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  return (
    <div
      className={cn("mb-1", isOwn ? "ml-12" : "mr-12")}
      data-message-id={message.id}
    >
      <div
        className={cn(
          "flex items-end group relative animate-fade-in",
          isOwn ? "justify-end" : "justify-start"
        )}
      >
        {/* Reply Icon */}
        {showReplyIcon && !isOwn && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 animate-scale-in">
            <div className="bg-primary text-primary-foreground rounded-full p-2">
              <Reply className="h-4 w-4" />
            </div>
          </div>
        )}

        {/* Avatar */}
        {!isOwn && (
          <div
            className={cn(
              "flex-shrink-0 mb-1",
              showAvatar ? "opacity-100" : "opacity-0"
            )}
          >
            <UserPreviewPopup username={message.sender?.username || "unknown"}>
              <div className="cursor-pointer">
                <DomainAvatar
                  domain={message.sender?.username || "unknown"}
                  size="xs"
                  className="h-6 w-6 md:h-8 md:w-8 hover:scale-105 transition-transform"
                />
              </div>
            </UserPreviewPopup>
          </div>
        )}

        {/* Message Bubble Container */}
        <div
          ref={messageRef}
          className={cn(
            "relative max-w-[75%] transition-all duration-200",
            !isOwn && "ml-2",
            isDragging && !isOwn && "cursor-grabbing"
          )}
          style={{
            transform:
              isDragging && !isOwn ? `translateX(${dragOffset}px)` : "none",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Reply-to message */}
          {replyTo && (
            <div
              className={cn(
                "mb-2 p-2 rounded-lg border-l-4 bg-muted/30 text-sm max-w-xs",
                isOwn ? "border-l-primary ml-auto" : "border-l-secondary"
              )}
            >
              <p className="text-muted-foreground text-xs font-medium">
                {replyTo.sender?.username || "User"}
              </p>
              <p className="text-foreground truncate text-xs">
                {replyTo.content || "Media message"}
              </p>
            </div>
          )}

          {/* Pinned indicator */}
          {isPinned && (
            <div
              className={cn(
                "flex items-center space-x-1 mb-1 text-xs text-muted-foreground",
                isOwn && "justify-end"
              )}
            >
              <Pin className="h-3 w-3" />
              <span>Pinned</span>
            </div>
          )}

          {/* Main bubble */}
          <div
            className={cn(
              "relative px-4 py-2 rounded-3xl shadow-sm transition-all duration-200 group/bubble",
              isOwn
                ? "bg-primary text-primary-foreground"
                : "bg-card text-card-foreground border",
              showTail && isOwn && "rounded-br-md",
              showTail && !isOwn && "rounded-bl-md"
            )}
          >
            {/* Username for group chats */}
            {!isOwn && showAvatar && (
              <p className="text-xs font-medium mb-1 opacity-70">
                {message.sender?.username}
              </p>
            )}

            {/* Message content */}
            {renderMessageContent()}

            {/* Timestamp and status */}
            <div
              className={cn(
                "flex items-center justify-end mt-1 space-x-1",
                isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
              )}
            >
              {message.isEdited && (
                <span className="text-xs opacity-60">edited</span>
              )}
              <span className="text-xs">
                {moment(message.createdAt).format("HH:mm")}
              </span>
              {isOwn && (
                <div className="flex items-center space-x-0.5">
                  <Check className="h-3 w-3" />
                  <Check className="h-3 w-3 -ml-1" />
                </div>
              )}
            </div>

            {/* Hover actions */}
            <div className="absolute -right-2 top-2 opacity-0 group-hover/bubble:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 bg-background/80 backdrop-blur-sm"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => onReply?.(message.id)}>
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </DropdownMenuItem>
                  {message.sender?.username === activeUsername && (
                    <DropdownMenuItem onClick={() => onEdit?.(message)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() =>
                      navigator.clipboard.writeText(message.content || "")
                    }
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      isPinned ? onUnpin?.(message.id) : onPin?.(message.id)
                    }
                  >
                    {isPinned ? (
                      <>
                        <PinOff className="h-4 w-4 mr-2" />
                        Unpin
                      </>
                    ) : (
                      <>
                        <Pin className="h-4 w-4 mr-2" />
                        Pin
                      </>
                    )}
                  </DropdownMenuItem>
                  {message.sender?.username === activeUsername && (
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-destructive"
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Reactions positioned at opposite end from tail */}
          {message.reactions && message.reactions.length > 0 && (
            <div
              className={cn(
                "absolute -bottom-2 z-10",
                // Position reactions opposite to tail
                isOwn ? "left-0" : "right-0"
              )}
            >
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs rounded-full bg-background border shadow-sm hover:bg-muted transition-colors"
                onClick={() => {
                  setSelectedReactionEmoji("");
                  setShowReactionUsers(true);
                }}
              >
                {/* Show first 2 unique emojis */}
                {Array.from(new Set(message.reactions.map((r) => r.emoji)))
                  .slice(0, 2)
                  .join("")}
                {/* Show count - if more than 2 unique emojis, show +X format */}
                {Array.from(new Set(message.reactions.map((r) => r.emoji)))
                  .length > 2
                  ? ` +${
                      Array.from(new Set(message.reactions.map((r) => r.emoji)))
                        .length - 2
                    }`
                  : ` ${message.reactions.length}`}
              </Button>
            </div>
          )}

          {/* Reaction selector */}
          {showReactions && (
            <div
              className={cn(
                "absolute -top-12 transform -translate-x-1/2 bg-popover border rounded-full p-1 flex space-x-1 shadow-lg z-20 animate-scale-in",
                isOwn ? "right-0 translate-x-1/4" : "left-1/2"
              )}
            >
              {reactions.map((reaction) => (
                <Button
                  key={reaction.name}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-lg hover:bg-accent rounded-full"
                  onClick={() => handleReaction(reaction.emoji)}
                >
                  {reaction.emoji}
                </Button>
              ))}
            </div>
          )}

          {/* Tail SVG */}
          {showTail && (
            <>
              {/* Border tail for non-own messages */}
              {!isOwn && (
                <svg
                  className="absolute bottom-0 left-0 transform -translate-x-1 w-4 h-4 z-[5]"
                  viewBox="0 0 16 16"
                  style={{ color: "hsl(var(--border))" }}
                  fill="currentColor"
                >
                  <path d="M0,4 Q0,0 4,0 L12,0 Q14,2 12,4 L8,8 Q6,10 4,8 Q0,6 0,4 Z" />
                </svg>
              )}

              {/* Main tail */}
              <svg
                className={cn(
                  "absolute bottom-0 w-4 h-4 z-10",
                  isOwn
                    ? "right-0 transform translate-x-1 text-primary"
                    : "left-0 transform -translate-x-1 text-card"
                )}
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                {isOwn ? (
                  <path d="M16,4 Q16,0 12,0 L4,0 Q2,2 4,4 L8,8 Q10,10 12,8 Q16,6 16,4 Z" />
                ) : (
                  <path d="M1,4 Q1,0 5,0 L13,0 Q15,2 13,4 L9,8 Q7,10 5,8 Q1,6 1,4 Z" />
                )}
              </svg>
            </>
          )}
        </div>
      </div>

      {/* Reaction Users Popup */}
      <ReactionUsersPopup
        isOpen={showReactionUsers}
        onClose={() => setShowReactionUsers(false)}
        reactions={message.reactions || []}
        messageId={message.id}
        currentUserId={activeUsername}
        onRemoveReaction={(reactionId) => {
          // Handle reaction removal - this would need to be implemented in parent
          console.log("Remove reaction:", reactionId);
        }}
      />
    </div>
  );
}
