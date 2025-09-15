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
import { useWalletClient } from "wagmi";
import {
  CancelListingParams,
  viemToEthersSigner,
} from "@doma-protocol/orderbook-sdk";
import { useHelper } from "@/hooks/use-helper";
import { formatUnits } from "viem";
import { useOrderbook } from "@/hooks/use-orderbook";
import { Conversation, DecodedMessage } from "@xmtp/browser-sdk";
import { ContentTypeText } from "@xmtp/content-type-text";
import { ContentTypeReply, Reply } from "@xmtp/content-type-reply";

interface CancelListingPopupProps {
  conversation?: Conversation;
  replyTo?: DecodedMessage;
  isOpen: boolean;
  onClose: () => void;
  token: Token;
  domainName: string;
}

export function CancelListingPopup({
  conversation,
  replyTo,
  isOpen,
  onClose,
  token,
  domainName,
}: CancelListingPopupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();
  const { data: walletClient } = useWalletClient();
  const { formatLargeNumber, parseCAIP10 } = useHelper();
  const { cancelListing } = useOrderbook();

  const handleCancelListing = async () => {
    setIsLoading(true);

    try {
      await walletClient.switchChain({
        id: Number(parseCAIP10(token.chain.networkId).chainId),
      });

      const orderId = token.listings?.[0]?.externalId;
      if (!orderId) return;

      const params: CancelListingParams = {
        orderId,
        cancellationType: "off-chain",
      };

      const cancelledLisiting = await cancelListing({
        params,
        chainId: `eip155:${Number(parseCAIP10(token.chain.networkId).chainId)}`,
        onProgress: (progress) => {
          progress.forEach((step) => {
            toast(step.description, {
              id: `cancel_listing_${orderId}_step_${step.kind}`,
            });
          });
        },
        signer: viemToEthersSigner(walletClient, token.chain.networkId),
      });

      if (conversation) {
        const richMessage = `cancelled::${JSON.stringify({
          domainName,
          status: cancelledLisiting?.status,
          transactionHash: cancelledLisiting?.transactionHash,
        })}`;

        if (replyTo) {
          await conversation.sendOptimistic(
            {
              content: richMessage,
              reference: replyTo.id,
              contentType: ContentTypeText,
            } as Reply,
            ContentTypeReply
          );
        } else {
          await conversation.sendOptimistic(richMessage, ContentTypeText);
        }

        conversation.publishMessages();
      }

      toast.success("Listing cancelled successfully");

      onClose();
    } catch (error) {
      console.error(error);
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
              {formatLargeNumber(
                Number(
                  formatUnits(
                    BigInt(token.listings[0].price),
                    token.listings[0].currency.decimals
                  )
                )
              )}{" "}
              {token.listings[0].currency.symbol}
            </p>
            <p className="text-sm text-muted-foreground">
              Orderbook: {token.listings[0].orderbook}
            </p>
          </div>
        )}

        {/* Warning Message */}
        <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
          <p className="text-sm text-destructive">
            Are you sure you want to cancel this listing? This action cannot be
            undone and your domain will no longer be available for purchase.
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
        <div className="flex flex-col overflow-hidden">{content}</div>
      </DialogContent>
    </Dialog>
  );
}
