import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Smile, X } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRepostWithComment } from "@/data/use-backend";
import { useUsername } from "@/hooks/use-username";
import { IPost } from "@/types/backend";

interface RepostCommentComposerProps {
  postId: string;
  onSubmit?: (post: IPost) => void;
  onCancel: () => void;
  placeholder?: string;
  maxLength?: number;
}

export const RepostCommentComposer = ({
  postId,
  onSubmit,
  onCancel,
  placeholder = "Add a comment to your repost...",
  maxLength = 280,
}: RepostCommentComposerProps) => {
  const [content, setContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();
  const { activeUsername } = useUsername();
  const repostWithComment = useRepostWithComment(activeUsername);

  const handleEmojiClick = (emojiData: any) => {
    const emoji = emojiData.emoji;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      setContent(newContent);
      
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    }
    setShowEmojiPicker(false);
  };

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const result = await repostWithComment.mutateAsync({
        postId,
        comment: content.trim(),
      });
      
      onSubmit?.(result);
      setContent("");
    } catch (error) {
      console.error("Failed to submit repost comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const remainingChars = maxLength - content.length;
  const isOverLimit = remainingChars < 0;

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src="/placeholder.svg" />
          <AvatarFallback className="bg-muted text-muted-foreground">
            U
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-3">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[80px] resize-none border-0 p-0 text-base placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            maxLength={maxLength + 50} // Allow slight overflow for UX
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-secondary"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  side={isMobile ? "top" : "bottom"} 
                  className="w-auto p-0 border-0 shadow-lg"
                >
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    width={isMobile ? 280 : 350}
                    height={400}
                    previewConfig={{ showPreview: false }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-sm tabular-nums ${
                isOverLimit 
                  ? "text-destructive font-medium" 
                  : remainingChars <= 20 
                    ? "text-warning" 
                    : "text-muted-foreground"
              }`}>
                {remainingChars}
              </span>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!content.trim() || isOverLimit || isSubmitting}
                  className="min-w-[80px]"
                >
                  {isSubmitting ? "Posting..." : "Repost"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};