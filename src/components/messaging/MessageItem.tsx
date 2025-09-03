import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Check,
  MoreVertical,
  Reply,
  Edit3,
  Trash2,
  Pin,
  PinOff,
  Copy,
  User,
  Heart,
  Laugh,
  ThumbsUp,
  ThumbsDown,
  Angry,
} from "lucide-react";
import { IMessage, MessageType } from "@/types/backend";
import { useDeleteMessage, useAddReaction } from "@/data/use-backend";
import { toast } from "sonner";
import { useUsername } from "@/hooks/use-username";
import { VoiceMessagePlayer } from "@/components/media/VoiceMessagePlayer";
import { ParsedText } from "@/lib/text-parser";

interface MessageItemProps {
  message: IMessage;
  onReply: (messageId: string) => void;
  onEdit: (message: IMessage) => void;
  onPin: (messageId: string) => void;
  onUnpin: (messageId: string) => void;
  isPinned?: boolean;
}

const reactions = [
  { emoji: "❤️", icon: Heart, name: "heart" },
  { emoji: "😂", icon: Laugh, name: "laugh" },
  { emoji: "👍", icon: ThumbsUp, name: "thumbs_up" },
  { emoji: "👎", icon: ThumbsDown, name: "thumbs_down" },
  { emoji: "😮", icon: ThumbsUp, name: "surprised" },
  { emoji: "😡", icon: Angry, name: "angry" },
];

export function MessageItem({
  message,
  onReply,
  onEdit,
  onPin,
  onUnpin,
  isPinned = false,
}: MessageItemProps) {
  const { activeUsername } = useUsername();
  const [showReactions, setShowReactions] = useState(false);
  const deleteMessageMutation = useDeleteMessage();
  const addReactionMutation = useAddReaction();

  const isOwnMessage = message.sender.username === activeUsername;

  const handleDelete = async () => {
    try {
      await deleteMessageMutation.mutateAsync({ messageId: message.id });
      toast.success("Message deleted");
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      toast.success("Message copied to clipboard");
    }
  };

  const handleReaction = async (emoji: string) => {
    try {
      await addReactionMutation.mutateAsync({
        messageId: message.id,
        addReactionDto: { emoji },
      });
      setShowReactions(false);
    } catch (error) {
      toast.error("Failed to add reaction");
    }
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
                className="max-w-xs rounded-lg cursor-pointer"
                onClick={() => window.open(message.mediaUrl, "_blank")}
              />
            )}
            {message.content && <p className="text-sm">{message.content}</p>}
          </div>
        );
      case MessageType.VIDEO:
        return (
          <div className="space-y-2">
            {message.mediaUrl && (
              <video
                src={message.mediaUrl}
                controls
                className="max-w-xs rounded-lg"
              />
            )}
            {message.content && <p className="text-sm">{message.content}</p>}
          </div>
        );
      case MessageType.VOICE:
        return (
          <div className="space-y-2">
            {message.mediaUrl && (
              <VoiceMessagePlayer
                audioUrl={message.mediaUrl}
                className="max-w-xs"
              />
            )}
            {message.content && <p className="text-sm">{message.content}</p>}
          </div>
        );
      case MessageType.FILE:
        return (
          <div className="flex items-center space-x-3 bg-muted/50 p-3 rounded-lg">
            <div className="p-2 bg-primary/10 rounded">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{message.content}</p>
              <p className="text-xs text-muted-foreground">Document</p>
            </div>
            <Button variant="ghost" size="sm">
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
          <div className="text-sm">
            <ParsedText text={message.content || ""} />
          </div>
        );
    }
  };

  if (!activeUsername) return null;

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={`flex ${
            isOwnMessage ? "justify-end" : "justify-start"
          } group`}
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          <div
            className={`max-w-[85%] lg:max-w-[70%] relative ${
              isOwnMessage ? "ml-auto" : "mr-auto"
            }`}
          >
            {/* Pinned indicator */}
            {isPinned && (
              <div className="flex items-center space-x-1 mb-1 text-xs text-muted-foreground">
                <Pin className="h-3 w-3" />
                <span>Pinned message</span>
              </div>
            )}

            <div
              className={`p-3 rounded-lg ${
                isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              {!isOwnMessage && (
                <p className="text-xs font-medium mb-1 opacity-70">
                  {message.sender.username}
                </p>
              )}

              {renderMessageContent()}

              <div className="flex items-center justify-between mt-2">
                <span className="text-xs opacity-70">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {isOwnMessage && (
                  <div className="flex items-center space-x-1">
                    <Check className="h-3 w-3 opacity-70" />
                    <Check className="h-3 w-3 opacity-70 -ml-1" />
                  </div>
                )}
              </div>
            </div>

            {/* Reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {message.reactions.map((reaction) => (
                  <Button
                    key={reaction.id}
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleReaction(reaction.emoji)}
                  >
                    {reaction.emoji} 1
                  </Button>
                ))}
              </div>
            )}

            {/* Reaction selector */}
            {showReactions && (
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-popover border rounded-lg p-1 flex space-x-1 shadow-lg z-10">
                {reactions.map((reaction) => (
                  <Button
                    key={reaction.name}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-lg hover:bg-accent"
                    onClick={() => handleReaction(reaction.emoji)}
                  >
                    {reaction.emoji}
                  </Button>
                ))}
              </div>
            )}

            {/* More options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onReply(message.id)}>
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </DropdownMenuItem>
                {isOwnMessage && (
                  <DropdownMenuItem onClick={() => onEdit(message)}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={
                    isPinned
                      ? () => onUnpin(message.id)
                      : () => onPin(message.id)
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
                {isOwnMessage && (
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onClick={() => onReply(message.id)}>
          <Reply className="h-4 w-4 mr-2" />
          Reply
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </ContextMenuItem>
        {isOwnMessage && (
          <ContextMenuItem onClick={() => onEdit(message)}>
            <Edit3 className="h-4 w-4 mr-2" />
            Edit
          </ContextMenuItem>
        )}
        <ContextMenuItem
          onClick={
            isPinned ? () => onUnpin(message.id) : () => onPin(message.id)
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
        </ContextMenuItem>
        {isOwnMessage && (
          <ContextMenuItem onClick={handleDelete} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
