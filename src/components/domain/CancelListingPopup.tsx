import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Token } from "@/types/doma";
import { useIsMobile } from "@/hooks/use-mobile";

interface CancelListingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  token: Token;
  domainName: string;
}

export function CancelListingPopup({
  isOpen,
  onClose,
  token,
  domainName,
}: CancelListingPopupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();

  const handleCancelListing = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Implement cancel listing logic with SDK
      toast.success("Listing cancelled successfully");
      onClose();
    } catch (error) {
      console.error("Failed to cancel listing:", error);
      toast.error("Failed to cancel listing");
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <>
      <div className="space-y-4 flex-1 overflow-y-auto">
        {/* Current Listing Info */}
        {token.listings && token.listings.length > 0 && (
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Current Listing</p>
            <p className="font-semibold">
              {(parseFloat(token.listings[0].price) / Math.pow(10, token.listings[0].currency.decimals)).toFixed(4)} {token.listings[0].currency.symbol}
            </p>
            <p className="text-sm text-muted-foreground">
              {token.listings[0].orderbook}
            </p>
          </div>
        )}

        {/* Warning Message */}
        <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
          <p className="text-sm text-destructive">
            Are you sure you want to cancel this listing? This action cannot be undone and your domain will no longer be available for purchase.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 sticky bottom-0 bg-background border-t">
        <Button 
          variant="outline" 
          onClick={onClose} 
          className="flex-1"
          disabled={isLoading}
        >
          Keep Listing
        </Button>
        <Button 
          variant="destructive" 
          onClick={handleCancelListing} 
          className="flex-1"
          disabled={isLoading}
        >
          {isLoading ? "Cancelling..." : "Cancel Listing"}
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[80vh] flex flex-col">
          <DrawerHeader className="sticky top-0 bg-background border-b">
            <DrawerTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Cancel Listing - {domainName}
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
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Cancel Listing - {domainName}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col overflow-hidden">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}