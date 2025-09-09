interface RecordingIndicatorProps {
  usernames: string[];
}

export function RecordingIndicator({ usernames }: RecordingIndicatorProps) {
  if (usernames.length === 0) return null;

  const displayText =
    usernames.length === 1
      ? `${usernames[0]} is recording...`
      : usernames.length === 2
      ? `${usernames[0]} and ${usernames[1]} are recording...`
      : `${usernames[0]} and ${usernames.length - 1} others are recording...`;

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
