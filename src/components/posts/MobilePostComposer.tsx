import { Sheet, SheetContent } from "@/components/ui/sheet";
import PostComposer, {
  PendingMediaFile,
} from "@/components/posts/PostComposer";
import { CreatePollDto } from "@/types/backend";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MobilePostComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    content: string,
    mediaFiles?: PendingMediaFile[],
    poll?: CreatePollDto
  ) => Promise<void>;
}

export function MobilePostComposer({
  isOpen,
  onClose,
  onSubmit,
}: MobilePostComposerProps) {
  const handleSubmit = async (
    content: string,
    mediaFiles: PendingMediaFile[] = [],
    poll?: CreatePollDto
  ) => {
    await onSubmit(content, mediaFiles, poll);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="h-[95vh] rounded-t-3xl border-0 bg-background shadow-2xl animate-slide-in-up p-0 overflow-hidden"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <div>
              <h2 className="text-lg font-semibold">Create Post</h2>
              <p className="text-sm text-muted-foreground">
                Share something with your community
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-10 w-10 rounded-full hover:bg-secondary"
                >
                  <X className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Close</TooltipContent>
            </Tooltip>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="mt-6">
              <PostComposer
                onSubmit={handleSubmit}
                replyingTo={null}
                onCancelReply={() => {}}
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
