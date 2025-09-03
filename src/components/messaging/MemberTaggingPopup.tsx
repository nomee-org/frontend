import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { IConversationParticipant } from "@/types/backend";

interface MemberTaggingPopupProps {
  participants?: IConversationParticipant[];
  query: string;
  isVisible: boolean;
  selectedIndex: number;
  onSelect: (username: string) => void;
  currentUsername?: string;
}

export function MemberTaggingPopup({
  participants,
  query,
  isVisible,
  selectedIndex,
  onSelect,
  currentUsername,
}: MemberTaggingPopupProps) {
  const [filteredMembers, setFilteredMembers] = useState<
    IConversationParticipant[]
  >([]);

  useEffect(() => {
    const filtered = participants
      ?.filter(
        (p) =>
          p.user.username !== currentUsername &&
          p.user.username.toLowerCase().includes(query.toLowerCase())
      )
      ?.slice(0, 5); // Show max 5 suggestions
    setFilteredMembers(filtered);
  }, [participants, query, currentUsername]);

  if (!isVisible || filteredMembers.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-full mb-2 left-0 right-0 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-48">
      <ScrollArea className="p-2">
        <div className="space-y-1">
          {filteredMembers.map((participant, index) => (
            <Button
              key={participant.id}
              variant={index === selectedIndex ? "secondary" : "ghost"}
              className="w-full justify-start h-10 px-3"
              onClick={() => onSelect(participant.user.username)}
            >
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <User className="h-3 w-3 text-muted-foreground" />
                  </div>
                </Avatar>
                <span className="text-sm">@{participant.user.username}</span>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
