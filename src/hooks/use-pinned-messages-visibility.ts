import { useState, useEffect, useRef, useCallback } from "react";

interface UsePinnedMessagesVisibilityOptions {
  containerRef: React.RefObject<HTMLDivElement>;
  hasPinnedMessages: boolean;
}

export function usePinnedMessagesVisibility({
  containerRef,
  hasPinnedMessages,
}: UsePinnedMessagesVisibilityOptions) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout>();

  const handleScroll = useCallback(() => {
    if (!containerRef.current || !hasPinnedMessages) return;

    const currentScrollY = containerRef.current.scrollTop;
    const scrollDirection = currentScrollY > lastScrollY.current ? "down" : "up";
    
    // Clear existing timeout
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    // Show/hide based on scroll direction
    if (scrollDirection === "up") {
      setIsVisible(true);
    } else if (scrollDirection === "down" && currentScrollY > 100) {
      // Only hide when scrolling down and past a threshold
      setIsVisible(false);
    }

    // Always show when near the top
    if (currentScrollY < 50) {
      setIsVisible(true);
    }

    // Debounce: show after stopping scroll
    scrollTimeout.current = setTimeout(() => {
      setIsVisible(true);
    }, 1500);

    lastScrollY.current = currentScrollY;
  }, [containerRef, hasPinnedMessages]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !hasPinnedMessages) return;

    container.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [handleScroll, hasPinnedMessages]);

  // Reset visibility when pinned messages change
  useEffect(() => {
    if (hasPinnedMessages) {
      setIsVisible(true);
    }
  }, [hasPinnedMessages]);

  return isVisible;
}