import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Send, Paperclip, Smile, Mic, X, Loader } from "lucide-react";
import { VoiceRecorderPopup } from "@/components/media/VoiceRecorderPopup";
import {
  MediaPickerPopup,
  ProcessedMediaFile,
} from "@/components/media/MediaPickerPopup";
import { StickersPickerPopup } from "@/components/media/StickersPickerPopup";
import { MemberTaggingPopup } from "@/components/messaging/MemberTaggingPopup";
import { useSendMessage, useUpdateMessage } from "@/data/use-backend";
import { MessageType, IConversationParticipant } from "@/types/backend";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { webSocketService } from "@/services/backend/socketservice";
import { useUsername } from "@/hooks/use-username";

interface MessageInputProps {
  placeHolder?: string;
  conversationId: string;
  replyToId?: string;
  onCancelReply?: () => void;
  editingMessage?: { id: string; content: string };
  onCancelEdit?: () => void;
  onSendSuccess?: () => void;
  onTyping?: (isTyping: boolean) => void;
  onRecording?: (isRecording: boolean) => void;
  participants?: IConversationParticipant[];
}

export function MessageInput({
  placeHolder,
  conversationId,
  replyToId,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onSendSuccess,
  onTyping,
  onRecording,
  participants = [],
}: MessageInputProps) {
  const [message, setMessage] = useState(placeHolder || "");
  const [selectedMedia, setSelectedMedia] = useState<ProcessedMediaFile[]>([]);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showStickersPicker, setShowStickersPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Member tagging states
  const [showMemberTagging, setShowMemberTagging] = useState(false);
  const [tagQuery, setTagQuery] = useState("");
  const [tagSelectedIndex, setTagSelectedIndex] = useState(0);
  const [tagStartPosition, setTagStartPosition] = useState(0);

  // Typing status
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();
  const { activeUsername } = useUsername();
  const sendMessageMutation = useSendMessage();
  const updateMessageMutation = useUpdateMessage();

  // Track recording state
  useEffect(() => {
    onRecording?.(isRecording);
  }, [isRecording, onRecording]);

  // Pre-fill message content when editing
  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.content);
    }
  }, [editingMessage]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 4 * 24; // 4 lines * line height
      textareaRef.current.style.height =
        Math.min(scrollHeight, maxHeight) + "px";
    }
  }, [message]);

  // Handle typing status with improved debouncing
  const handleTypingStart = useCallback(() => {
    if (!isTyping && conversationId) {
      setIsTyping(true);
      webSocketService.startTyping(conversationId);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (conversationId) {
        webSocketService.stopTyping(conversationId);
      }
    }, 2000);
  }, [isTyping, conversationId]);

  const handleTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (isTyping && conversationId) {
      setIsTyping(false);
      webSocketService.stopTyping(conversationId);
    }
  }, [isTyping, conversationId]);

  // Handle member tagging (only for group conversations)
  const handleMemberTagging = useCallback(
    (value: string, cursorPosition: number) => {
      // Only enable member tagging if participants exist (group conversations)
      if (!participants || participants.length <= 1) {
        setShowMemberTagging(false);
        return;
      }

      const beforeCursor = value.slice(0, cursorPosition);
      const atIndex = beforeCursor.lastIndexOf("@");

      if (atIndex !== -1) {
        const query = beforeCursor.slice(atIndex + 1);
        // Check if @ is at start or preceded by whitespace
        const charBeforeAt = beforeCursor[atIndex - 1];
        if (atIndex === 0 || /\s/.test(charBeforeAt)) {
          setTagQuery(query);
          setTagStartPosition(atIndex);
          setShowMemberTagging(true);
          setTagSelectedIndex(0);
          return;
        }
      }

      setShowMemberTagging(false);
    },
    [participants]
  );

  const insertMention = useCallback(
    (username: string) => {
      const beforeTag = message.slice(0, tagStartPosition);
      const afterTag = message.slice(tagStartPosition + tagQuery.length + 1);
      const newMessage = `${beforeTag}@${username} ${afterTag}`;

      setMessage(newMessage);
      setShowMemberTagging(false);

      // Focus back to textarea and position cursor after the mention
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPosition = tagStartPosition + username.length + 2; // +2 for @ and space
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(
            newCursorPosition,
            newCursorPosition
          );
        }
      }, 0);
    },
    [message, tagStartPosition, tagQuery]
  );

  // Handle input change with improved typing debouncing and tagging
  const handleInputChange = useCallback(
    (value: string) => {
      setMessage(value);

      // Handle member tagging
      if (textareaRef.current) {
        handleMemberTagging(value, textareaRef.current.selectionStart || 0);
      }

      // Only handle typing for new messages, not when editing
      if (!editingMessage) {
        if (value.trim()) {
          handleTypingStart();
        } else {
          handleTypingStop();
        }
      }
    },
    [editingMessage, handleTypingStart, handleTypingStop, handleMemberTagging]
  );

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping && conversationId) {
        webSocketService.stopTyping(conversationId);
      }
    };
  }, [isTyping, conversationId]);

  const handleSendMessage = async () => {
    if (!message.trim() && selectedMedia.length === 0) return;

    try {
      if (editingMessage) {
        // Update existing message
        await updateMessageMutation.mutateAsync({
          messageId: editingMessage.id,
          updateMessageDto: {
            content: message.trim(),
          },
        });
      } else {
        // Send new message
        await sendMessageMutation.mutateAsync({
          createMessageDto: {
            conversationId,
            content: message.trim(),
            type:
              selectedMedia.length > 0
                ? getMessageType(selectedMedia[0].file)
                : MessageType.TEXT,
            replyToId,
          },
          mediaFile: selectedMedia[0]?.file,
        });
      }

      setMessage("");
      setSelectedMedia([]);
      handleTypingStop(); // Stop typing when message is sent
      onSendSuccess?.();
      onCancelReply?.();
      onCancelEdit?.();
    } catch (error) {
      toast.error(
        editingMessage ? "Failed to update message" : "Failed to send message"
      );
    }
  };

  const handleVoiceRecorded = async (audioBlob: Blob, duration: number) => {
    try {
      const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, {
        type: audioBlob.type,
      });

      await sendMessageMutation.mutateAsync({
        createMessageDto: {
          conversationId,
          content: `Voice message (${Math.floor(duration / 60)}:${(
            duration % 60
          )
            .toString()
            .padStart(2, "0")})`,
          type: MessageType.VOICE,
          replyToId,
        },
        mediaFile: audioFile,
      });

      onSendSuccess?.();
      onCancelReply?.();
    } catch (error) {
      toast.error("Failed to send voice message");
    }
  };

  const handleRecordingStateChange = (recording: boolean) => {
    setIsRecording(recording);
  };

  const handleMediaSelected = (files: ProcessedMediaFile[]) => {
    setSelectedMedia(files);
  };

  const handleStickerSelected = async (stickerId: string) => {
    try {
      // This would need to be implemented with the backend service
      console.log("Sending sticker:", stickerId);
      toast.success("Sticker sent!");

      onSendSuccess?.();
      onCancelReply?.();
    } catch (error) {
      toast.error("Failed to send sticker");
    }
  };

  const getMessageType = (file: File): MessageType => {
    if (file.type.startsWith("image/")) return MessageType.IMAGE;
    if (file.type.startsWith("video/")) return MessageType.VIDEO;
    if (file.type.startsWith("audio/")) return MessageType.VOICE;
    return MessageType.FILE;
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => {
      const fileToRemove = prev[index];
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <div className="p-3 border-t border-border bg-background">
      {/* Reply/Edit Header */}
      {(replyToId || editingMessage) && (
        <div className="mb-3 p-3 bg-muted/50 rounded-lg border-l-4 border-l-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                {editingMessage ? "Editing message" : "Replying to message"}
              </p>
              {editingMessage && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {editingMessage.content}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={editingMessage ? onCancelEdit : onCancelReply}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Media Previews */}
      {selectedMedia.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedMedia.map((file, index) => (
            <div
              key={file.id}
              className="relative bg-muted p-2 rounded-lg flex items-center space-x-2"
            >
              <img
                src={file.preview}
                alt="Preview"
                className="h-8 w-8 object-cover rounded"
              />
              <span className="text-sm truncate max-w-32">
                {file.file.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => removeMedia(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Message Input */}
      <div className="flex items-end space-x-2">
        {/* Attachment button - Always visible */}
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground flex-shrink-0"
          onClick={() => setShowMediaPicker(true)}
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* Text Input with emoji trigger and member tagging - Growing textarea */}
        <div className="flex-1 relative">
          {/* Member Tagging Popup - Only show for group conversations */}
          {participants && participants.length > 1 && (
            <MemberTaggingPopup
              participants={participants}
              query={tagQuery}
              isVisible={showMemberTagging}
              selectedIndex={tagSelectedIndex}
              onSelect={insertMention}
              currentUsername={activeUsername}
            />
          )}

          <Textarea
            ref={textareaRef}
            placeholder="Type a message..."
            value={message}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (
                showMemberTagging &&
                participants &&
                participants.length > 1
              ) {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  const filteredCount = participants.filter(
                    (p) =>
                      p.user.username !== activeUsername &&
                      p.user.username
                        .toLowerCase()
                        .includes(tagQuery.toLowerCase())
                  ).length;
                  setTagSelectedIndex((prev) =>
                    Math.min(prev + 1, filteredCount - 1)
                  );
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setTagSelectedIndex((prev) => Math.max(prev - 1, 0));
                } else if (e.key === "Tab" || e.key === "Enter") {
                  e.preventDefault();
                  const filteredParticipants = participants.filter(
                    (p) =>
                      p.user.username !== activeUsername &&
                      p.user.username
                        .toLowerCase()
                        .includes(tagQuery.toLowerCase())
                  );
                  if (filteredParticipants[tagSelectedIndex]) {
                    insertMention(
                      filteredParticipants[tagSelectedIndex].user.username
                    );
                  }
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setShowMemberTagging(false);
                }
              } else if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            onSelect={(e) => {
              if (
                textareaRef.current &&
                participants &&
                participants.length > 1
              ) {
                handleMemberTagging(
                  message,
                  e.currentTarget.selectionStart || 0
                );
              }
            }}
            className="w-full resize-none transition-all duration-200 rounded-2xl border-2 focus:border-none min-h-[44px] max-h-[96px] overflow-y-auto pr-12"
            style={{ height: "auto" }}
            rows={1}
          />

          {/* Emoji trigger inside textarea - Only show when empty */}
          {!message.trim() && (
            <>
              {isMobile ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                  onClick={() => setShowStickersPicker(true)}
                >
                  <Smile className="h-4 w-4" />
                </Button>
              ) : (
                <Popover
                  open={showStickersPicker}
                  onOpenChange={setShowStickersPicker}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" side="top" align="end">
                    <StickersPickerPopup
                      isOpen={true}
                      onClose={() => setShowStickersPicker(false)}
                      onStickerSelected={handleStickerSelected}
                      embedded={true}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </>
          )}
        </div>

        {/* Voice/Send Button */}
        {message.trim() || selectedMedia.length > 0 ? (
          <Button
            onClick={handleSendMessage}
            disabled={
              sendMessageMutation.isPending || updateMessageMutation.isPending
            }
            size="sm"
            className="rounded-full h-10 w-10 p-0 flex-shrink-0"
          >
            {sendMessageMutation.isPending ||
            updateMessageMutation.isPending ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <>
            {isMobile ? (
              <Button
                variant="default"
                size="sm"
                className="rounded-full h-10 w-10 p-0 flex-shrink-0"
                onClick={() => setShowVoiceRecorder(true)}
              >
                <Mic className="h-4 w-4" />
              </Button>
            ) : (
              <Popover
                open={showVoiceRecorder}
                onOpenChange={setShowVoiceRecorder}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="rounded-full h-10 w-10 p-0 flex-shrink-0"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" side="top" align="end">
                  <VoiceRecorderPopup
                    isOpen={true}
                    onClose={() => setShowVoiceRecorder(false)}
                    onVoiceRecorded={handleVoiceRecorded}
                    onRecordingStateChange={handleRecordingStateChange}
                    embedded={true}
                  />
                </PopoverContent>
              </Popover>
            )}
          </>
        )}
      </div>

      {/* Popups - Only for mobile */}
      {isMobile && (
        <>
          <VoiceRecorderPopup
            isOpen={showVoiceRecorder}
            onClose={() => setShowVoiceRecorder(false)}
            onVoiceRecorded={handleVoiceRecorded}
            onRecordingStateChange={handleRecordingStateChange}
          />

          <StickersPickerPopup
            isOpen={showStickersPicker}
            onClose={() => setShowStickersPicker(false)}
            onStickerSelected={handleStickerSelected}
          />
        </>
      )}

      <MediaPickerPopup
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onFilesSelected={handleMediaSelected}
        existingFiles={selectedMedia}
      />
    </div>
  );
}
