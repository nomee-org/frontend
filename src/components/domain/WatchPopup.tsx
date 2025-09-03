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
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface WatchPopupProps {
  isOpen: boolean;
  onClose: () => void;
  domainName: string;
  isWatched: boolean;
  onToggleWatch: (domainName: string) => Promise<boolean>;
}

const WatchPopup = ({
  isOpen,
  onClose,
  domainName,
  isWatched,
  onToggleWatch,
}: WatchPopupProps) => {
  const [isToggling, setIsToggling] = useState(false);
  const isMobile = useIsMobile();

  const handleToggleWatch = async () => {
    setIsToggling(true);
    try {
      const success = await onToggleWatch(domainName);
      if (success) {
        onClose();
      }
    } finally {
      setIsToggling(false);
    }
  };

  const content = (
    <>
      <div className="space-y-4 flex-1 overflow-y-auto">
        <div className="text-center">
          <p className="text-muted-foreground">
            {isWatched
              ? "Are you sure you want to remove this domain from your watchlist?"
              : "Add this domain to your watchlist to track its activity and price changes."}
          </p>
          <div className="mt-3 p-3 bg-muted rounded-lg">
            <span className="font-medium font-mono">{domainName}</span>
          </div>
        </div>
      </div>

      <div className="flex space-x-3 sticky bottom-0 bg-background pt-4 border-t">
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1"
          disabled={isToggling}
        >
          Cancel
        </Button>
        <Button
          onClick={handleToggleWatch}
          className="flex-1"
          variant={isWatched ? "destructive" : "default"}
          disabled={isToggling}
        >
          {isToggling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isWatched ? "Remove" : "Add to Watchlist"}
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[80vh] flex flex-col">
          <DrawerHeader className="sticky top-0 bg-background border-b">
            <DrawerTitle className="flex items-center space-x-2">
              {isWatched ? (
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Eye className="h-5 w-5 text-primary" />
              )}
              <span>
                {isWatched ? "Remove from Watchlist" : "Add to Watchlist"}
              </span>
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-4 flex flex-col flex-1 overflow-hidden">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {isWatched ? (
              <EyeOff className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Eye className="h-5 w-5 text-primary" />
            )}
            <span>
              {isWatched ? "Remove from Watchlist" : "Add to Watchlist"}
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col overflow-hidden">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WatchPopup;