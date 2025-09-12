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
import { Offer, Token } from "@/types/doma";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWalletClient } from "wagmi";
import {
  CancelOfferParams,
  viemToEthersSigner,
} from "@doma-protocol/orderbook-sdk";
import { useHelper } from "@/hooks/use-helper";
import { formatUnits } from "viem";
import { useOrderbook } from "@/hooks/use-orderbook";

interface CancelOfferPopupProps {
  isOpen: boolean;
  onClose: () => void;
  token: Token;
  offer: Offer;
  domainName: string;
}

export function CancelOfferPopup({
  isOpen,
  onClose,
  token,
  offer,
  domainName,
}: CancelOfferPopupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();
  const { data: walletClient } = useWalletClient();
  const { formatLargeNumber, parseCAIP10 } = useHelper();
  const { cancelOffer } = useOrderbook();

  const handleCancelOffer = async () => {
    setIsLoading(true);

    try {
      await walletClient.switchChain({
        id: Number(parseCAIP10(token.chain.networkId).chainId),
      });

      const params: CancelOfferParams = {
        orderId: offer.externalId,
      };

      await cancelOffer({
        params,
        chainId: `eip155:${Number(parseCAIP10(token.chain.networkId).chainId)}`,
        onProgress: (progress) => {
          progress.forEach((step) => {
            toast(step.description, {
              id: `cancel_offer_${offer.externalId}_step_${step.kind}`,
            });
          });
        },
        signer: viemToEthersSigner(walletClient, token.chain.networkId),
      });

      toast.success("Offer cancelled successfully");

      onClose();
    } catch (error) {
      console.log(error);
      toast.error(error?.message);
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <>
      <div className="space-y-4 flex-1 overflow-y-auto">
        {/* Current Offer Info */}
        {offer && (
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground"> Offer</p>
            <p className="font-semibold">
              {formatLargeNumber(
                Number(
                  formatUnits(BigInt(offer.price), offer.currency.decimals)
                )
              )}{" "}
              {offer.currency.symbol}
            </p>
          </div>
        )}

        {/* Warning Message */}
        <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
          <p className="text-sm text-destructive">
            Are you sure you want to cancel this offer? This action cannot be
            undone and your offer will no longer be available for consideration.
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
          Keep Offer
        </Button>
        <Button
          variant="destructive"
          onClick={handleCancelOffer}
          className="flex-1"
          disabled={isLoading}
        >
          {isLoading ? "Cancelling..." : "Cancel Offer"}
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
              Cancel Offer - {domainName}
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
            Cancel Offer - {domainName}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col overflow-hidden">{content}</div>
      </DialogContent>
    </Dialog>
  );
}
