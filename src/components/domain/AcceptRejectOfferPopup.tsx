import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { DollarSign, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHelper } from "@/hooks/use-helper";
import { toast } from "sonner";
import moment from "moment";
import {
  AcceptOfferParams,
  CancelOfferParams,
  viemToEthersSigner,
} from "@doma-protocol/orderbook-sdk";
import { useNavigate } from "react-router-dom";
import { useWalletClient } from "wagmi";
import { Token } from "@/types/doma";
import { dataService } from "@/services/doma/dataservice";
import { useOrderbook } from "@/hooks/use-orderbook";
import { Conversation, DecodedMessage } from "@xmtp/browser-sdk";
import { ContentTypeText } from "@xmtp/content-type-text";
import { ContentTypeReply, Reply } from "@xmtp/content-type-reply";

interface Offer {
  externalId: string;
  price: string;
  currency: {
    symbol: string;
    decimals: number;
  };
  offererAddress: string;
  orderbook: string;
  createdAt: string;
  expiresAt?: string;
}

interface AcceptRejectOfferPopupProps {
  conversation?: Conversation;
  replyTo?: DecodedMessage;
  isOpen: boolean;
  onClose: () => void;
  offer: Offer | null;
  action: "accept" | "reject" | null;
  domainName?: string;
  token?: Token;
}

export function AcceptRejectOfferPopup({
  conversation,
  replyTo,
  isOpen,
  onClose,
  offer,
  action,
  domainName,
  token,
}: AcceptRejectOfferPopupProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const isMobile = useIsMobile();
  const { formatLargeNumber, parseCAIP10, trimAddress } = useHelper();
  const navigate = useNavigate();
  const { data: walletClient } = useWalletClient();
  const { acceptOffer, cancelOffer } = useOrderbook();

  const handleSendMessage = async () => {
    const names = await dataService.getOwnedNames({
      page: 1,
      take: 1,
      address: parseCAIP10(offer.offererAddress).address,
    });

    if (names.totalCount === 0) {
      navigate(`/messages/${parseCAIP10(offer.offererAddress).address}`);
    } else {
      navigate(`/messages/${names?.items?.[0]?.name}`);
    }
  };

  const handleConfirm = async () => {
    if (!offer || !action) return;

    setIsProcessing(true);
    try {
      await walletClient.switchChain({
        id: Number(parseCAIP10(token.chain.networkId).chainId),
      });

      if (action === "accept") {
        const params: AcceptOfferParams = {
          orderId: offer.externalId,
        };

        const acceptedOffer = await acceptOffer({
          params,
          chainId: token.chain.networkId,
          onProgress: (progress) => {
            progress.forEach((step) => {
              toast(step.description, {
                id: `accept_offer_${offer.externalId}_step_${step.kind}`,
              });
            });
          },
          signer: viemToEthersSigner(walletClient, token.chain.networkId),
        });

        if (conversation) {
          const richMessage = `accepted::${JSON.stringify({
            domainName,
            status: acceptedOffer.status,
            transactionHash: acceptedOffer.transactionHash,
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
      } else {
        const params: CancelOfferParams = {
          orderId: offer.externalId,
          cancellationType: "off-chain",
        };

        const cancelledOffer = await cancelOffer({
          params,
          chainId: `eip155:${Number(
            parseCAIP10(token.chain.networkId).chainId
          )}`,
          onProgress: (progress) => {
            progress.forEach((step) => {
              toast(step.description, {
                id: `cancel_offer_${offer.externalId}_step_${step.kind}`,
              });
            });
          },
          signer: viemToEthersSigner(walletClient, token.chain.networkId),
        });

        if (conversation) {
          const richMessage = `rejected::${JSON.stringify({
            domainName,
            status: cancelledOffer.status,
            transactionHash: cancelledOffer.transactionHash,
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
      }

      onClose();
    } catch (error) {
      console.log(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  if (!offer || !action) return null;

  const isAccept = action === "accept";
  const title = isAccept ? "Accept Offer" : "Reject Offer";
  const description = isAccept
    ? "Are you sure you want to accept this offer? This action cannot be undone."
    : "Notify the offerer of the rejection.";

  const content = (
    <>
      <div className="flex-1 overflow-y-auto">
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 p-1">
            {/* Warning Message */}
            <div
              className={`p-4 rounded-lg border-2 ${
                isAccept
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <div className="flex items-start space-x-3">
                {isAccept ? (
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <h4 className="font-semibold mb-1">{title}</h4>
                  <p className="text-sm">{description}</p>
                </div>
              </div>
            </div>

            {/* Offer Details */}
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-4 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {formatLargeNumber(
                        Number(offer.price) /
                          Math.pow(10, offer.currency.decimals)
                      )}{" "}
                      <span className="text-lg">{offer.currency.symbol}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Offer Amount
                    </div>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary border-primary/20"
                >
                  Pending
                </Badge>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Domain:</span>
                  <span className="font-medium">{domainName || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Offered by:</span>
                  <span className="font-medium">
                    {trimAddress(parseCAIP10(offer.offererAddress).address)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Orderbook:</span>
                  <span className="font-medium">{offer.orderbook}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {moment(offer.createdAt).format("MMM DD, YYYY HH:mm")}
                  </span>
                </div>
                {offer.expiresAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires:</span>
                    <span className="font-medium text-orange-600">
                      {moment(offer.expiresAt).format("MMM DD, YYYY HH:mm")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Important Notice */}
            {isAccept ? (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-amber-800">
                    <h5 className="font-semibold mb-1">Important Notice</h5>
                    <ul className="text-sm space-y-1">
                      <>
                        <li>• This action will transfer domain ownership</li>
                        <li>• Payment will be processed automatically</li>
                        <li>
                          • You will receive funds in your connected wallet
                        </li>
                        <li>• This action cannot be reversed</li>
                      </>
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </div>

      {/* Sticky Action Buttons */}
      <div className="border-t bg-background pt-4">
        <div className="flex gap-2">
          {!isAccept && (
            <Button
              onClick={handleSendMessage}
              disabled={isProcessing}
              variant="outline"
              className={`w-full`}
            >
              Send Message
            </Button>
          )}

          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`w-full ${
              isAccept
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Processing...
              </>
            ) : (
              `${isAccept ? "Accept Offer" : "Reject Offer"}`
            )}
          </Button>
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleCancel}>
        <DrawerContent className="max-h-[90vh] flex flex-col">
          <DrawerHeader className="text-left border-b bg-background">
            <DrawerTitle className="flex items-center space-x-2">
              {isAccept ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span>{title}</span>
            </DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {isAccept ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
