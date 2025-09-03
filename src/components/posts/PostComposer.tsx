/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DomainAvatar } from "@/components/domain/DomainAvatar";
import { PollCreator } from "@/components/posts/PollCreator";
import { Image, Smile, X, Bold, Underline, BarChart3 } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNames } from "@/data/use-doma";
import { CreatePollDto } from "@/types/backend";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  MediaPickerPopup,
  ProcessedMediaFile,
} from "@/components/media/MediaPickerPopup";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface MediaFile {
  id: string;
  url: string;
  type: "image" | "video";
  name: string;
}

export interface PendingMediaFile {
  id: string;
  file: File;
  type: "image" | "video";
  preview: string;
}

interface PostComposerProps {
  onSubmit: (
    content: string,
    pendingFiles?: ProcessedMediaFile[],
    poll?: CreatePollDto
  ) => void;
  replyingTo?: string | null;
  onCancelReply?: () => void;
}

const PostComposer = ({
  onSubmit,
  replyingTo,
  onCancelReply,
}: PostComposerProps) => {
  const [pendingMedia, setPendingMedia] = useState<ProcessedMediaFile[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [poll, setPoll] = useState<CreatePollDto | undefined>(undefined);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const maxLength = 280;

  const { data: usersData } = useNames(20, false, mentionQuery, []);

  const getTextContent = () => {
    return editorRef.current?.textContent || "";
  };

  const getContentLength = () => {
    return getTextContent().length;
  };

  const handleSubmit = async () => {
    const textContent = getTextContent();
    if (textContent.trim() || pendingMedia.length > 0 || poll) {
      setIsSubmitting(true);
      try {
        const htmlContent = editorRef.current?.innerHTML || "";

        onSubmit(htmlContent, pendingMedia, poll);

        if (editorRef.current) {
          editorRef.current.innerHTML = "";
        }

        setPendingMedia([]);
        setShowMentions(false);
        setShowPollCreator(false);
        setPoll(undefined);
        pendingMedia.forEach((media) => URL.revokeObjectURL(media.preview));
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

  const formatText = (command: string) => {
    document.execCommand(command, false);
    editorRef.current?.focus();
  };

  const handleFileSelect = (files: ProcessedMediaFile[]) => {
    setPendingMedia(files);
    setShowMediaPicker(false);
  };

  const removePendingMedia = (mediaId: string) => {
    setPendingMedia((prev) => {
      const mediaToRemove = prev.find((m) => m.id === mediaId);
      if (mediaToRemove) {
        URL.revokeObjectURL(mediaToRemove.preview);
      }
      return prev.filter((m) => m.id !== mediaId);
    });
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
  const isReply = !!replyingTo;

  return (
    <div className={isReply ? "border-accent/50 shadow-md" : ""}>
      {isReply && (
        <div className="px-6 pt-4 pb-2 border-b border-border bg-accent/5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-accent">
              Replying to post
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelReply}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="pt-0 relative">
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
            className="min-h-40 md:min-h-24 p-1 md:p-3 text-base lg:text-lg focus:outline-none border-none md:border border-border rounded-md focus:ring-2 focus:ring-accent/20"
            style={{ maxHeight: "200px", overflowY: "auto" }}
            autoFocus={isMobile}
            data-placeholder={
              isReply
                ? "Post your reply..."
                : "What's happening in the domain world?"
            }
          />

          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => formatText("bold")}
                className="text-muted-foreground hover:text-foreground"
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => formatText("underline")}
                className="text-muted-foreground hover:text-foreground"
              >
                <Underline className="w-4 h-4" />
              </Button>
              <div className="w-px h-6 bg-border mx-2" />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPollCreator(!showPollCreator)}
                className={`transition-colors ${
                  showPollCreator || poll
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-accent hover:text-accent/80"
                      onClick={() => setShowMediaPicker(true)}
                      disabled={isSubmitting || pendingMedia.length >= 4}
                    >
                      <Image className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add media</TooltipContent>
                </Tooltip>
                <Popover
                  open={showEmojiPicker}
                  onOpenChange={setShowEmojiPicker}
                >
                  <PopoverTrigger asChild>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-accent hover:text-accent/80"
                        >
                          <Smile className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Add emoji</TooltipContent>
                    </Tooltip>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                  </PopoverContent>
                </Popover>
                <div className="flex items-center space-x-2 ml-4">
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
              </div>
              <Button
                onClick={handleSubmit}
                disabled={
                  (!getTextContent().trim() &&
                    pendingMedia.length === 0 &&
                    !poll) ||
                  remainingChars < 0 ||
                  isSubmitting
                }
                className="bg-gradient-blue-light text-white hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? "Posting..." : isReply ? "Reply" : "Post"}
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

        {/* Poll Creator */}
        {showPollCreator && (
          <div className="mt-4">
            <PollCreator
              onPollChange={setPoll}
              isVisible={showPollCreator}
              onClose={() => setShowPollCreator(false)}
            />
          </div>
        )}

        {/* Media Preview */}
        {pendingMedia.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {pendingMedia.map((mediaFile) => (
              <div key={mediaFile.id} className="relative group">
                {mediaFile.type === "image" ? (
                  <img
                    src={mediaFile.preview}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ) : (
                  <video
                    src={mediaFile.preview}
                    className="w-full h-32 object-cover rounded-lg"
                    controls
                  />
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removePendingMedia(mediaFile.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Media Picker Popup */}
        <MediaPickerPopup
          isOpen={showMediaPicker}
          onClose={() => setShowMediaPicker(false)}
          onFilesSelected={handleFileSelect}
          maxFiles={4}
          acceptedTypes={["image/*", "video/*"]}
          existingFiles={pendingMedia}
        />
      </div>
    </div>
  );
};

export default PostComposer;
