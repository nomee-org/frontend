import { useState, useEffect, useRef } from "react";
import { IMessage, IPinnedMessage } from "@/types/backend";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DomainAvatar } from "@/components/domain/DomainAvatar";
import { useIsMobile } from "@/hooks/use-mobile";
import moment from "moment";
import { useUnpinMessage } from "@/data/use-backend";
import { toast } from "sonner";

// Import Swiper styles
import "swiper/css";

interface PinnedMessagesBarProps {
  pinnedMessages: IPinnedMessage[];
  isVisible: boolean;
  onMessageClick: (messageId: string) => void;
  onUnpin?: (messageId: string) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function PinnedMessagesBar({
  pinnedMessages,
  isVisible,
  onMessageClick,
  onUnpin,
  containerRef,
}: PinnedMessagesBarProps) {
  const isMobile = useIsMobile();
  const [isAnimating, setIsAnimating] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const unpinMessage = useUnpinMessage();

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

  useEffect(() => {
    if (isVisible !== undefined) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!pinnedMessages.length) return null;

  const handleMessageClick = (messageId: string) => {
    if (containerRef.current) {
      // Find the message element and scroll to it
      const messageElement = containerRef.current.querySelector(
        `[data-message-id="${messageId}"]`
      );
      if (messageElement) {
        messageElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        // Add haptic feedback on mobile
        if (isMobile && navigator.vibrate) {
          navigator.vibrate(50);
        }

        // Highlight the message briefly
        messageElement.classList.add("animate-pulse");
        setTimeout(() => {
          messageElement.classList.remove("animate-pulse");
        }, 2000);
      }
    }
    onMessageClick(messageId);
  };

  const truncateContent = (content: string, maxLength: number = 60) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  return (
    <div
      ref={barRef}
      className={`sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      } ${isAnimating ? "animate-scale-in" : ""}`}
      style={{ minHeight: "60px" }}
    >
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Pin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Pinned Messages ({pinnedMessages.length})
            </span>
          </div>
        </div>

        <Swiper
          spaceBetween={12}
          slidesPerView="auto"
          className="w-full"
          style={{ height: "auto" }}
        >
          {pinnedMessages.map((pinnedMessage) => {
            const message = pinnedMessage.message;
            return (
              <SwiperSlide
                key={pinnedMessage.id}
                style={{ width: "auto", maxWidth: "280px" }}
              >
                <div
                  onClick={() => handleMessageClick(message.id)}
                  className="flex items-start space-x-2 p-2 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/80 transition-colors group"
                >
                  <DomainAvatar
                    domain={message.sender.username}
                    className="h-6 w-6 flex-shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground truncate">
                        {message.sender.username}
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-muted-foreground">
                          {moment(message.createdAt).format("HH:mm")}
                        </span>
                        {/* Always show unpin button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnpin(message.id, pinnedMessage.conversationId);
                          }}
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
                        >
                          <X className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {message.content
                        ? truncateContent(message.content)
                        : "Media message"}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </div>
  );
}
