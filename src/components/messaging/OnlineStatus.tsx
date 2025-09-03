import { cn } from "@/lib/utils";

interface OnlineStatusProps {
  isOnline: boolean;
  lastSeen?: Date;
  className?: string;
}

export function OnlineStatus({ isOnline, lastSeen, className }: OnlineStatusProps) {
  const getStatusText = () => {
    if (isOnline) return "Online";
    if (lastSeen) {
      const now = new Date();
      const diff = now.getTime() - lastSeen.getTime();
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (minutes < 1) return "Just now";
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return `${days}d ago`;
    }
    return "Offline";
  };

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          isOnline ? "bg-green-500" : "bg-gray-400"
        )}
      />
      <span className="text-xs text-muted-foreground">{getStatusText()}</span>
    </div>
  );
}