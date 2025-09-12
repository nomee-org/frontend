import { Conversation, DecodedMessage } from "@xmtp/browser-sdk";
import { ContentTypeReadReceipt } from "@xmtp/content-type-read-receipt";
import { useEffect, useRef, useState, useCallback } from "react";

interface UseMessageScrollOptions {
  hasNextPage?: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage?: boolean;
  messages: DecodedMessage[];
}

export function useMessageScroll({
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  messages,
}: UseMessageScrollOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const previousMessageCount = useRef(messages.length);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (containerRef.current && shouldAutoScroll && isNearBottom) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages.length, shouldAutoScroll, isNearBottom]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceFromBottom < 100;

    setIsNearBottom(nearBottom);
    setShouldAutoScroll(nearBottom);

    // Load more messages when scrolled to top
    if (scrollTop < 100 && hasNextPage && !isFetchingNextPage) {
      const previousScrollHeight = scrollHeight;
      fetchNextPage();

      // Maintain scroll position after loading
      setTimeout(() => {
        if (containerRef.current) {
          const newScrollHeight = containerRef.current.scrollHeight;
          containerRef.current.scrollTop =
            newScrollHeight - previousScrollHeight;
        }
      }, 100);
    }
  }, [hasNextPage, fetchNextPage, isFetchingNextPage]);

  // Scroll to bottom when component mounts
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  // Track new messages for auto-scroll
  useEffect(() => {
    if (messages.length > previousMessageCount.current) {
      previousMessageCount.current = messages.length;
    }
  }, [messages.length]);

  const scrollToBottom = useCallback(async (conversation?: Conversation) => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setShouldAutoScroll(true);
    }

    try {
      await conversation?.sendOptimistic({}, ContentTypeReadReceipt);
      await conversation.publishMessages();
    } catch (error) {
      console.log(error);
    }
  }, []);

  const scrollToMessage = useCallback((messageId: string) => {
    if (containerRef.current) {
      const messageElement = containerRef.current.querySelector(
        `[data-message-id="${messageId}"]`
      );
      if (messageElement) {
        messageElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        // Add highlight effect
        messageElement.classList.add("animate-pulse");
        setTimeout(() => {
          messageElement.classList.remove("animate-pulse");
        }, 1000);
      }
    }
  }, []);

  return {
    containerRef,
    isNearBottom,
    shouldAutoScroll,
    handleScroll,
    scrollToBottom,
    scrollToMessage,
  };
}
