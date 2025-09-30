/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DomainAvatar } from "@/components/domain/DomainAvatar";
import { ReactionUsersPopup } from "./ReactionUsersPopup";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Reply as ReplyIcon,
  Pin,
  PinOff,
  Copy,
  User,
  Heart,
  Laugh,
  ThumbsUp,
  ThumbsDown,
  Angry,
  Check,
  Smile,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import moment from "moment";
import { toast } from "sonner";
import { Conversation, DecodedMessage } from "@xmtp/browser-sdk";
import { ContentTypeReaction, Reaction } from "@xmtp/content-type-reaction";
import { formatUnits } from "viem";
import { useNameResolver } from "@/contexts/NicknameContext";
import { ContentTypeReadReceipt } from "@xmtp/content-type-read-receipt";
import { getSummary } from "./actions/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useXmtp } from "@/contexts/XmtpContext";
import { MessageRender } from "./renders/MessageRender";
import { Badge } from "../ui/badge";

const emojis = [
  { emoji: "❤️", icon: Heart, name: "heart" },
  { emoji: "😂", icon: Laugh, name: "laugh" },
  { emoji: "👍", icon: ThumbsUp, name: "thumbs_up" },
  { emoji: "👎", icon: ThumbsDown, name: "thumbs_down" },
  { emoji: "😮", icon: ThumbsUp, name: "surprised" },
  { emoji: "😡", icon: Angry, name: "angry" },
];

interface MessageBubbleProps {
  conversation: Conversation;
  message: DecodedMessage;
  isOwn: boolean;
  showAvatar: boolean;
  showTail: boolean;
  onReply?: (message: DecodedMessage) => void;
  onPin?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
  onUnpin?: (messageId: string) => void;
  onReplyClick?: (messageId: string) => void;
  isPinned?: boolean;
  reactions: DecodedMessage[];
  replyTo?: DecodedMessage;
  isSeen: boolean;
}

export function MessageBubble({
  conversation,
  message,
  isOwn,
  showAvatar,
  showTail,
  onReply,
  onReaction,
  onRemoveReaction,
  onPin,
  onUnpin,
  isPinned,
  reactions,
  replyTo,
  isSeen = false,
}: MessageBubbleProps) {
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
  const { nickname } = useNameResolver();
  const isMobile = useIsMobile();
  const { client } = useXmtp();

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

    // Allow swipe-to-reply
    if (diff > 0 && diff <= 100) {
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

    if (dragOffset > 50 && onReply) {
      onReply(message);
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

  const handleReaction = async (reaction: { emoji: string; name: string }) => {
    try {
      onReaction(message.id, reaction.emoji);
      setShowReactions(false);
      setIsLongPressed(false);
    } catch (error) {
      toast.error("Failed to add reaction");
    }
  };

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  if (message.contentType.sameAs(ContentTypeReaction)) return null;
  if (message.contentType.sameAs(ContentTypeReadReceipt)) return null;

  // === Group updated
  if (message.contentType.typeId === "group_updated") {
    return (
      <div className="sticky top-0 z-20 flex justify-center">
        <Badge
          variant="secondary"
          className="px-3 py-1 text-xs font-medium bg-muted/60 border-0 shadow-sm mt-1"
        >
          Started the conversation
        </Badge>
      </div>
    );
  }

  return (
    <div
      className={cn("mb-1", isMobile ? "!select-none" : "")}
      data-message-id={message.id}
    >
      <div
        className={cn(
          "flex items-end group relative animate-fade-in",
          isOwn ? "justify-end" : "justify-start"
        )}
      >
        {/* Reply Icon */}
        {showReplyIcon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 animate-scale-in">
            <div className="bg-primary text-primary-foreground rounded-full p-2">
              <ReplyIcon className="h-4 w-4" />
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
            <div className="cursor-pointer">
              <DomainAvatar
                domain={nickname(message.senderInboxId)}
                size="xs"
                className="h-6 w-6 md:h-8 md:w-8 hover:scale-105 transition-transform"
              />
            </div>
          </div>
        )}

        {/* Message Bubble Container */}
        <div
          ref={messageRef}
          className={cn(
            "relative max-w-[75%] transition-all duration-200",
            !isOwn && "ml-2",
            isDragging && "cursor-grabbing"
          )}
          style={{
            transform: isDragging ? `translateX(${dragOffset}px)` : "none",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
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

          {/* Reply-to message */}
          {replyTo && (
            <div
              className={cn(
                "mb-1 p-2 rounded-lg border-l-4 bg-muted/30 text-sm max-w-xs",
                isOwn ? "border-l-primary ml-auto" : "border-l-secondary"
              )}
            >
              <p className="text-muted-foreground text-xs font-medium">
                {replyTo.senderInboxId === client.inboxId ? "Yours" : "Theirs"}
              </p>
              <p className="text-foreground truncate text-xs">
                {getSummary(
                  replyTo,
                  replyTo.senderInboxId === client?.inboxId,
                  true
                )}
              </p>
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
                {nickname(message.senderInboxId, 6)}
              </p>
            )}

            {/* Message content */}
            <MessageRender
              conversation={conversation}
              message={message}
              isOwn={isOwn}
            />

            {/* Timestamp and status */}
            <div
              className={cn(
                "flex items-center justify-end mt-1 space-x-1",
                isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
              )}
            >
              <span className="text-xs">
                {moment(
                  Math.ceil(Number(formatUnits(message.sentAtNs, 6)))
                ).format("HH:mm")}
              </span>
              {isSeen || isOwn ? (
                <div className="flex items-center space-x-0.5">
                  <Check className="h-3 w-3" />
                  <Check className="h-3 w-3 -ml-1" />
                </div>
              ) : (
                <div className="flex items-center space-x-0.5">
                  <Check className="h-3 w-3" />
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
                  <DropdownMenuItem onClick={() => onReply?.(message)}>
                    <ReplyIcon className="h-4 w-4 mr-2" />
                    Reply
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowReactions(true)}>
                    <Smile className="h-4 w-4 mr-2" />
                    React
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      navigator.clipboard.writeText(message.content as any)
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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Reactions positioned at opposite end from tail */}
          {reactions?.length > 0 && (
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
                {Array.from(
                  new Set(reactions.map((r) => (r.content as Reaction).content))
                )
                  .slice(0, 2)
                  .join("")}
                {/* Show count - if more than 2 unique emojis, show +X format */}
                {Array.from(
                  new Set(reactions.map((r) => (r.content as Reaction).content))
                ).length > 2
                  ? ` +${
                      Array.from(
                        new Set(
                          reactions.map((r) => (r.content as Reaction).content)
                        )
                      ).length - 2
                    }`
                  : ` ${reactions.length}`}
              </Button>
            </div>
          )}

          {/* Reaction selector */}
          {showReactions && (
            <div
              className={cn(
                "absolute top-3 transform bg-popover border rounded-full p-1 flex items-center space-x-1 shadow-lg z-20 animate-scale-in",
                isOwn ? "right-3" : "left-3"
              )}
            >
              {emojis?.map((emoji, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-lg hover:bg-accent rounded-full"
                  onClick={() => handleReaction(emoji)}
                >
                  {emoji.emoji}
                </Button>
              ))}
              <X
                className="cursor-pointer"
                onClick={() => setShowReactions(false)}
              />
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
        reactions={reactions || []}
        onRemoveReaction={onRemoveReaction}
      />
    </div>
  );
}
