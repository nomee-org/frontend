/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { DomainAvatar } from "@/components/domain/DomainAvatar";
import { Smile } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNames } from "@/data/use-doma";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCreateComment } from "@/data/use-backend";
import { IComment } from "@/types/backend";

interface CommentComposerProps {
  postId: string;
  parentCommentId?: string;
  onSubmit?: (comment: IComment) => void;
  placeholder?: string;
  maxLength?: number;
}

const CommentComposer = ({
  postId,
  parentCommentId,
  onSubmit,
  placeholder = "Write a comment...",
  maxLength = 280,
}: CommentComposerProps) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const { data: usersData } = useNames(20, false, mentionQuery, []);

  const getTextContent = () => {
    return editorRef.current?.textContent || "";
  };

  const getContentLength = () => {
    return getTextContent().length;
  };

  const createComment = useCreateComment();

  const handleSubmit = async () => {
    const textContent = getTextContent();
    if (textContent.trim()) {
      setIsSubmitting(true);
      try {
        const htmlContent = editorRef.current?.innerHTML || "";

        const result = await createComment.mutateAsync({
          postId,
          content: htmlContent,
          parentId: parentCommentId,
        });

        onSubmit?.(result);

        if (editorRef.current) {
          editorRef.current.innerHTML = "";
        }

        setShowMentions(false);
      } catch (error) {
        console.error("Failed to create comment:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleInput = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return;

    const textContent = getTextContent();
    const range = selection.getRangeAt(0);
    const cursorPos = range.startOffset;
    setCursorPosition(cursorPos);

    // Check for mentions (@)
    const beforeCursor = textContent.substring(0, cursorPos);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  }, []);

  const insertMention = (domain: string) => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection) return;

    const textContent = getTextContent();
    const beforeCursor = textContent.substring(0, cursorPosition);
    const afterCursor = textContent.substring(cursorPosition);

    // Remove the partial mention
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      const beforeMention = beforeCursor.substring(
        0,
        beforeCursor.length - mentionMatch[0].length
      );
      const newContent = `${beforeMention}<span class="mention text-accent font-medium">@${domain}</span>&nbsp;${afterCursor}`;
      editorRef.current.innerHTML = newContent;

      // Move cursor after the mention
      const range = document.createRange();
      const textNode =
        editorRef.current.childNodes[editorRef.current.childNodes.length - 1];
      range.setStart(textNode, 0);
      range.setEnd(textNode, 0);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    setShowMentions(false);
    setMentionQuery("");
    editorRef.current.focus();
  };

  const handleEmojiClick = (emojiData: any) => {
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textNode = document.createTextNode(emojiData.emoji);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        editorRef.current.innerHTML += emojiData.emoji;
      }
    }
    setShowEmojiPicker(false);
    editorRef.current?.focus();
  };

  const remainingChars = maxLength - getContentLength();

  return (
    <div className={`rounded-lg`} onClick={(e) => e.stopPropagation()}>
      <div className="relative">
        {/* Rich Text Editor */}
        <div className="relative">
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onKeyDown={(e) => {
              if (
                (e.key === "ArrowUp" || e.key === "ArrowDown") &&
                showMentions
              ) {
                e.preventDefault();
              }
              if (e.key === "Escape") {
                setShowMentions(false);
              }
            }}
            className="min-h-20 p-3 text-base focus:outline-none border border-border rounded-md focus:ring-2 focus:ring-accent/20"
            style={{ maxHeight: "120px", overflowY: "auto" }}
            autoFocus={isMobile}
            data-placeholder={placeholder}
          />

          <div className="flex items-center justify-between mt-3">
            <div></div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Popover
                  open={showEmojiPicker}
                  onOpenChange={setShowEmojiPicker}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-accent hover:text-accent/80"
                    >
                      <Smile className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                  </PopoverContent>
                </Popover>

                <span
                  className={`text-sm font-medium ${
                    remainingChars < 20
                      ? "text-orange-500"
                      : remainingChars < 0
                      ? "text-red-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {remainingChars}
                </span>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={
                  !getTextContent().trim() || remainingChars < 0 || isSubmitting
                }
                className="bg-gradient-blue-light text-white hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? "Posting..." : "Comment"}
              </Button>
            </div>
          </div>

          {/* Mention Suggestions */}
          {showMentions &&
            (usersData?.pages?.flatMap((p) => p.items)?.length ?? 0) > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 bg-background border border-border rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                {usersData?.pages
                  ?.flatMap((p) => p.items)
                  ?.map((domain) => (
                    <button
                      key={domain.name}
                      type="button"
                      onClick={() => insertMention(domain.name)}
                      className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center space-x-2"
                    >
                      <DomainAvatar domain={domain.name} size="sm" />
                      <span className="text-accent font-medium">
                        @{domain.name}
                      </span>
                    </button>
                  ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CommentComposer;
