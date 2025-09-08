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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Zap, Clock } from "lucide-react";
import { toast } from "sonner";
import { useHelper } from "@/hooks/use-helper";
import { formatUnits, parseUnits } from "viem";
import {
  createDomaOrderbookClient,
  viemToEthersSigner,
  CreateOfferParams,
  CurrencyToken,
  BuyListingParams,
  OrderbookFee,
} from "@doma-protocol/orderbook-sdk";
import { domaConfig } from "@/configs/doma";
import { Token } from "@/types/doma";
import { useSwitchChain, useWalletClient } from "wagmi";
import { useIsMobile } from "@/hooks/use-mobile";
interface OfferPopupProps {
  isOpen: boolean;
  onClose: () => void;
  token: Token;
  domainName: string;
  onMessage?: () => void;
}

export function OfferPopup({
  isOpen,
  onClose,
  token,
  domainName,
  onMessage,
}: OfferPopupProps) {
  const [offerAmount, setOfferAmount] = useState("");
  const [offerType, setOfferType] = useState<"instant" | "make-offer">(
    "instant"
  );
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const { parseCAIP10, formatLargeNumber } = useHelper();
  const [currencies, setCurrencies] = useState<CurrencyToken[]>([]);
  const [fees, setFees] = useState<OrderbookFee[]>([]);

  const [selectedCurrency, setSelectedCurrency] = useState<
    CurrencyToken | undefined
  >(undefined);

  const client = createDomaOrderbookClient(domaConfig);
  const isMobile = useIsMobile();

  const getCurrencies = async () => {
    const supportedCurrencies = await client.getSupportedCurrencies({
      chainId: token.chain.networkId,
      orderbook: token.listings[0].orderbook,
      contractAddress: token.tokenAddress,
    });

    const result = supportedCurrencies.currencies.filter(
      (c) => c.contractAddress
    );

    setCurrencies(result);

    if (result.length) {
      setSelectedCurrency(result[0]);
    }
  };

  const getFees = async () => {
    const fees = await client.getOrderbookFee({
      chainId: token.chain.networkId,
      contractAddress: token.tokenAddress,
      orderbook: token.listings[0].orderbook,
    });

    setFees(fees.marketplaceFees);
  };

  useEffect(() => {
    getCurrencies();
  }, [token]);

  useEffect(() => {
    getFees();
  }, [token, offerAmount]);

  const handleSubmit = async () => {
    try {
      await switchChainAsync({
        chainId: Number(parseCAIP10(token.chain.networkId).chainId),
      });

      if (offerType === "instant") {
        const params: BuyListingParams = {
          orderId: token.listings[0].externalId,
        };

        const buyListing = await client.buyListing({
          params,
          chainId: token.chain.networkId,
          onProgress: (progress) => {
            progress.forEach((step, index) => {
              toast(step.description, {
                id: `buy_${token.tokenId}_step_${index}`,
              });
            });
          },
          signer: viemToEthersSigner(walletClient, token.chain.networkId),
        });

        console.log(buyListing);
        onClose();
      } else {
        if (!offerAmount) {
          return toast.error("Please enter an offer amount");
        }

        const durationSecs = 60 * 60 * 24 * 7; // 7 days

        console.log(selectedCurrency);

        const params: CreateOfferParams = {
          items: [
            {
              contract: token.tokenAddress,
              tokenId: token.tokenId,
              price: parseUnits(
                offerAmount,
                selectedCurrency.decimals
              ).toString(),
              currencyContractAddress: selectedCurrency.contractAddress,
              duration: durationSecs,
            },
          ],
          orderbook: token.listings[0].orderbook,
          source: import.meta.env.VITE_APP_NAME,
          marketplaceFees: fees,
        };

        const createOffer = await client.createOffer({
          params,
          chainId: token.chain.networkId,
          onProgress: (progress) => {
            progress.forEach((step, index) => {
              toast(step.description, {
                id: `create_offer_${token.listings[0].id}_step_${index}`,
              });
            });
          },
          signer: viemToEthersSigner(walletClient, token.chain.networkId),
        });

        console.log(createOffer);
        onClose();
      }
    } catch (error) {
      toast.error(error?.message);
    }
  };

  const content = (
    <>
      <div className="space-y-4 flex-1 overflow-y-auto">
        {/* Offer Type Selection */}
        <Tabs
          value={offerType}
          onValueChange={(value) =>
            setOfferType(value as "instant" | "make-offer")
          }
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="instant" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Buy Instant
            </TabsTrigger>
            <TabsTrigger value="make-offer" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Make Offer
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Current Price Display */}
        {token.listings[0].price && offerType === "instant" && (
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Current Price</p>
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
          </div>
        )}

        {/* Currency Selection */}
        {offerType === "make-offer" && (
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
                {currencies.map((currency) => {
                  return (
                    <SelectItem value={currency.symbol}>
                      {currency.symbol}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Offer Amount */}
        {offerType === "make-offer" && (
          <div className="space-y-2">
            <Label htmlFor="amount">Offer Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder={`Enter amount in ${selectedCurrency?.symbol}`}
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 sticky bottom-0 bg-background border-t">
        <Button onClick={handleSubmit} className="flex-1">
          {offerType === "instant" ? "Buy Now" : "Submit Offer"}
        </Button>

        {onMessage && (
          <Button
            variant="outline"
            size="icon"
            onClick={onMessage}
            title="Send Message"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[80vh] flex flex-col">
          <DrawerHeader className="sticky top-0 bg-background border-b">
            <DrawerTitle className="flex items-center gap-2">
              {offerType === "instant" ? "Buy Instantly" : "Make Offer"} -{" "}
              {domainName}
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
            {offerType === "instant" ? "Buy Instantly" : "Make Offer"} -{" "}
            {domainName}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col overflow-hidden">{content}</div>
      </DialogContent>
    </Dialog>
  );
}
