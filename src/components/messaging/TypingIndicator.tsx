import { useNameResolver } from "@/contexts/NicknameContext";

interface TypingIndicatorProps {
  addresses: string[];
}

export function TypingIndicator({ addresses }: TypingIndicatorProps) {
  const { nickname } = useNameResolver();

  if (addresses.length === 0) return null;

  const displayText =
    addresses.length === 1
      ? `${nickname(addresses[0])} is typing...`
      : addresses.length === 2
      ? `${nickname(addresses[0])} and ${nickname(addresses[1])} are typing...`
      : `${nickname(addresses[0])} and ${
          addresses.length - 1
        } others are typing...`;

  return (
    <div className="flex items-center space-x-2 px-4 py-2 text-muted-foreground">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
        <div
          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: "0.1s" }}
        />
        <div
          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        />
      </div>
      <span className="text-xs">{displayText}</span>
    </div>
  );
}
