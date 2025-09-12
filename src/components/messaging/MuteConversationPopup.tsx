import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { VolumeX, Volume2, Loader } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { useState } from "react";
import { Conversation } from "@xmtp/browser-sdk";

interface MuteConversationPopupProps {
  conversation: Conversation;
  isOpen: boolean;
  onClose: () => void;
  isMuted: boolean;
  onMute?: () => void;
  onUnmute?: () => void;
  conversationName?: string;
}

export function MuteConversationPopup({
  conversation,
  isOpen,
  onClose,
  isMuted,
  onMute,
  onUnmute,
  conversationName = "conversation",
}: MuteConversationPopupProps) {
  const isMobile = useIsMobile();

  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async () => {
    try {
      if (isMuted) {
        // to do
        onUnmute?.();
        toast.success("Conversation unmuted");
      } else {
        // to do
        onMute?.();
        toast.success("Conversation muted");
      }
      onClose();
    } catch (error) {
      console.error("Failed to mute/unmute conversation:", error);
      toast.error(`Failed to ${isMuted ? "unmute" : "mute"} conversation`);
    }
  };

  const content = (
    <div className="space-y-4">
      <div className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
          {isMuted ? (
            <Volume2 className="h-6 w-6 text-green-600" />
          ) : (
            <VolumeX className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            {isMuted ? "Unmute" : "Mute"} {conversationName}?
          </h3>
          <p className="text-sm text-muted-foreground">
            {isMuted
              ? "You will start receiving notifications from this conversation again."
              : "You won't receive notifications from this conversation, but you can still see new messages."}
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleAction}
          disabled={isLoading}
          className="flex-1"
          variant={isMuted ? "default" : "secondary"}
        >
          {isLoading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
          {isMuted ? "Unmute" : "Mute"}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[50vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>
              {isMuted ? "Unmute" : "Mute"} Conversation
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isMuted ? "Unmute" : "Mute"} Conversation</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
