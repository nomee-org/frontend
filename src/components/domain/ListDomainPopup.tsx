import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info } from "lucide-react";
import { toast } from "sonner";
import { Token } from "@/types/doma";
import {
  CreateListingParams,
  CurrencyToken,
  OrderbookFee,
  OrderbookType,
  viemToEthersSigner,
} from "@doma-protocol/orderbook-sdk";
import { parseUnits } from "viem";
import { useWalletClient } from "wagmi";
import { useHelper } from "@/hooks/use-helper";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOrderbook } from "@/hooks/use-orderbook";
import { Conversation, DecodedMessage } from "@xmtp/browser-sdk";
import { ContentTypeText } from "@xmtp/content-type-text";
import { ContentTypeReply, Reply } from "@xmtp/content-type-reply";

interface ListDomainPopupProps {
  conversation?: Conversation;
  replyTo?: DecodedMessage;
  isOpen: boolean;
  onClose: () => void;
  token: Token;
  domainName: string;
}

export function ListDomainPopup({
  conversation,
  replyTo,
  isOpen,
  onClose,
  token,
  domainName,
}: ListDomainPopupProps) {
  const [listingPrice, setListingPrice] = useState("");
  const [orderbook, setOrderbook] = useState<OrderbookType>(OrderbookType.DOMA);
  const [expirationDays, setExpirationDays] = useState("30");
  const [isLoading, setIsLoading] = useState(false);
  const [currencies, setCurrencies] = useState<CurrencyToken[]>([]);
  const [fees, setFees] = useState<OrderbookFee[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<
    CurrencyToken | undefined
  >(undefined);
  const { data: walletClient } = useWalletClient();
  const { parseCAIP10 } = useHelper();
  const isMobile = useIsMobile();
  const { getSupportedCurrencies, getOrderbookFee, createListing } =
    useOrderbook();

  const getCurrencies = async () => {
    try {
      const supportedCurrencies = await getSupportedCurrencies({
        chainId: token.chain.networkId,
        orderbook,
        contractAddress: token.tokenAddress,
      });

      const result = supportedCurrencies.currencies.filter(
        (c) => c.symbol !== "WETH"
      );

      setCurrencies(result);

      if (result.length) {
        setSelectedCurrency(result[0]);
      }
    } catch (error) {
      console.error("Failed to get currencies:", error);
    }
  };

  const getFees = async () => {
    const fees = await getOrderbookFee({
      chainId: token.chain.networkId,
      contractAddress: token.tokenAddress,
      orderbook,
    });

    setFees(fees.marketplaceFees);
  };

  useEffect(() => {
    getCurrencies();
  }, [token, isOpen, orderbook]);

  useEffect(() => {
    getFees();
  }, [token, orderbook]);

  const handleSubmit = async () => {
    if (!listingPrice) {
      toast.error("Please enter a listing price");
      return;
    }

    if (!selectedCurrency) {
      toast.error("Please select a currency");
      return;
    }

    setIsLoading(true);

    try {
      const durationMs = Number(expirationDays) * 24 * 3600 * 1000;

      await walletClient.switchChain({
        id: Number(parseCAIP10(token.chain.networkId).chainId),
      });

      const params: CreateListingParams = {
        items: [
          {
            contract: token.tokenAddress,
            tokenId: token.tokenId,
            price: parseUnits(
              listingPrice,
              selectedCurrency.decimals
            ).toString(),
            currencyContractAddress: selectedCurrency.contractAddress,
            duration: durationMs,
          },
        ],
        orderbook,
        source: import.meta.env.VITE_APP_NAME,
        marketplaceFees: fees,
      };

      const createdListing = await createListing({
        params,
        chainId: token.chain.networkId,
        onProgress: (progress) => {
          progress.forEach((step) => {
            toast(step.description, {
              id: `create_listing_${token.tokenId}_step_${step.kind}`,
            });
          });
        },
        signer: viemToEthersSigner(walletClient, token.chain.networkId),
      });

      if (conversation) {
        const richMessage = `created_listing::${JSON.stringify({
          domainName,
          orderId: createdListing.orders?.[0]?.orderId,
          contract: token.tokenAddress,
          tokenId: token.tokenId,
          price: listingPrice,
          currency: selectedCurrency.symbol,
          expiresMs: Date.now() + durationMs,
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

      onClose();
    } catch (error) {
      console.log(error);

      toast.error("Failed to list domain");
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <>
      <div className="space-y-4 flex-1 overflow-y-auto">
        {/* Domain Info */}
        <div className="bg-muted p-3 rounded-lg">
          <p className="text-sm text-muted-foreground truncate max-w-xs">
            Token ID: {token.tokenId}
          </p>
        </div>

        {/* Orderbook Selection */}
        <div className="space-y-2">
          <Label htmlFor="orderbook">Orderbook</Label>
          <Select
            value={orderbook}
            onValueChange={(e) => setOrderbook(e as OrderbookType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select orderbook" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={OrderbookType.DOMA}>Doma</SelectItem>
              <SelectItem value={OrderbookType.OPENSEA}>OpenSea</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Currency Selection */}
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={selectedCurrency?.symbol}
            onValueChange={(e) =>
              setSelectedCurrency(currencies.find((c) => c.symbol === e))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.symbol} value={currency.symbol}>
                  {currency.symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Listing Price */}
        <div className="space-y-2">
          <Label htmlFor="price">Listing Price</Label>
          <Input
            id="price"
            type="number"
            placeholder={`Enter price in ${selectedCurrency?.symbol}`}
            value={listingPrice}
            onChange={(e) => setListingPrice(e.target.value)}
          />
        </div>

        {/* Expiration */}
        <div className="space-y-2">
          <Label htmlFor="expiration">Listing Duration</Label>
          <Select value={expirationDays} onValueChange={setExpirationDays}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="60">60 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fees Information */}
        {fees.length > 0 && (
          <div className="bg-accent/20 border border-border/30 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Marketplace Fees</p>
            </div>
            {fees.map((fee, index) => (
              <div
                key={index}
                className="flex justify-between items-center text-sm"
              >
                <span className="text-muted-foreground">{fee.feeType}</span>
                <span>
                  {fee.basisPoints
                    ? `${(fee.basisPoints / 100).toFixed(2)}%`
                    : 0}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 sticky bottom-0 bg-background border-t">
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit} className="flex-1" disabled={isLoading}>
          {isLoading ? "Listing..." : "List Domain"}
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
              List Domain - {domainName}
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
            List Domain - {domainName}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col overflow-hidden">{content}</div>
      </DialogContent>
    </Dialog>
  );
}
