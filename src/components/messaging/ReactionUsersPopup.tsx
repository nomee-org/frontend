import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { DomainAvatar } from "@/components/domain/DomainAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { X } from "lucide-react";
import { Reaction } from "@xmtp/content-type-reaction";
import { useXmtp } from "@/contexts/XmtpContext";

interface ReactionUsersPopupProps {
  isOpen: boolean;
  onClose: () => void;
  reactions: Reaction[];
  onRemoveReaction?: (reactionId: string) => void;
}

export function ReactionUsersPopup({
  isOpen,
  onClose,
  reactions,
  onRemoveReaction,
}: ReactionUsersPopupProps) {
  const isMobile = useIsMobile();
  const { client } = useXmtp();

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.content]) {
      acc[reaction.content] = [];
    }
    acc[reaction.content].push(reaction);
    return acc;
  }, {} as Record<string, Reaction[]>);

  const ReactionContent = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">All Reactions</h3>
          <p className="text-sm text-muted-foreground">
            {reactions.length}{" "}
            {reactions.length === 1 ? "reaction" : "reactions"} total
          </p>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto space-y-3">
        {Object.entries(groupedReactions).map(([emojiKey, emojiReactions]) => (
          <div key={emojiKey} className="space-y-2">
            <div className="flex items-center space-x-2 sticky top-0 bg-background/95 backdrop-blur-sm py-1 border-b">
              <span className="text-xl">{emojiKey}</span>
              <span className="text-sm font-medium text-muted-foreground">
                {emojiReactions.length}{" "}
                {emojiReactions.length === 1 ? "person" : "people"}
              </span>
            </div>

            {emojiReactions.map((reaction, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors ml-6"
              >
                <DomainAvatar
                  domain={reaction.referenceInboxId || "unknown"}
                  size="sm"
                  className="h-8 w-8"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {reaction.referenceInboxId || "Unknown User"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Reacted with {emojiKey}
                  </p>
                </div>

                {/* Show remove button only for current user's reactions */}
                {reaction.referenceInboxId === client.inboxId &&
                  onRemoveReaction && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemoveReaction(reaction.reference)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}

                <Badge variant="outline" className="text-xs">
                  {emojiKey}
                </Badge>
              </div>
            ))}
          </div>
        ))}
      </div>

      {reactions.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No reactions found</p>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="px-6 pb-6">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-6 mt-2" />
          <ReactionContent />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Reaction Details</DialogTitle>
        </DialogHeader>
        <ReactionContent />
      </DialogContent>
    </Dialog>
  );
}
