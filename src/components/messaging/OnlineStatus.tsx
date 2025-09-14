import { cn } from "@/lib/utils";

interface OnlineStatusProps {
  isActive: boolean;
  className?: string;
}

export function OnlineStatus({ isActive, className }: OnlineStatusProps) {
  const getStatusText = () => {
    if (isActive) return "Active";
    return "Inactive";
  };

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          isActive ? "bg-green-500" : "bg-gray-400"
        )}
      />
      <span className="text-xs text-muted-foreground">{getStatusText()}</span>
    </div>
  );
}
