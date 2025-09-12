/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  Send,
  AtSign,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Conversation } from "@xmtp/browser-sdk";
import { useOwnedNames } from "@/data/use-doma";
import { ContentTypeText } from "@xmtp/content-type-text";

interface ListPromptMessagePopupProps {
  conversation: Conversation;
  isOpen: boolean;
  onClose: () => void;
  recipientAddress: string;
}

const ListPromptMessagePopup = ({
  conversation,
  isOpen,
  onClose,
  recipientAddress,
}: ListPromptMessagePopupProps) => {
  const [bidAmount, setBidAmount] = useState("");
  const [bidCurrency, setBidCurrency] = useState("USDC");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [domainName, setDomainName] = useState("");
  const { data: namesData } = useOwnedNames(recipientAddress, 50, []);

  useEffect(() => {
    setDomainName(namesData?.pages?.[0]?.items?.[0]?.name ?? "");
  }, [namesData]);

  const currencies = [
    { value: "USDC", label: "USDC" },
    { value: "WETH", label: "WETH" },
  ];

  const formatListPromptMessage = () => {
    return `
      💰 Buy Offer

      🌐 Domain: ${domainName}
      💵 Amount: ${bidAmount} ${bidCurrency}
    `;
  };

  const handleSubmitBid = async () => {
    if (!bidAmount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const richMessage = formatListPromptMessage();

      await conversation.sendOptimistic(richMessage, ContentTypeText);

      toast({
        title: "Success",
        description: "Bid message sent successfully!",
      });

      // Reset form
      setBidAmount("");
      onClose();

      await conversation.publishMessages();
    } catch (error) {
      // toast({
      //   title: "Error",
      //   description: "Failed to send bid message. Please try again.",
      //   variant: "destructive",
      // });
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <>
      <div className="space-y-6 flex-1 overflow-y-auto">
        {/* Domain Info */}
        <div className="space-y-2">
          <Label>Domain</Label>
          <Select value={domainName} onValueChange={setDomainName}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {namesData?.pages
                ?.flatMap((p) => p.items)
                ?.map((name) => {
                  return (
                    <SelectItem value={name.name}>
                      <div className="flex items-center space-x-2">
                        <AtSign className="h-4 w-4" />
                        <span>{name.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
            </SelectContent>
          </Select>
        </div>

        {/* Bid Amount */}
        <div className="space-y-2">
          <Label>Bid Amount *</Label>
          <div className="flex space-x-2">
            <Input
              type="number"
              placeholder="0.00"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className="flex-1"
              step="0.001"
              min="0"
            />
            <Select value={bidCurrency} onValueChange={setBidCurrency}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Warning */}
        <div className="flex items-start space-x-2 p-3 bg-muted/50 border rounded-lg">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium">Important</p>
            <p>
              This buy message will be sent to the domain owner. Make sure your
              offer is genuine and you have the funds available.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-3 sticky bottom-0 bg-background pt-4 border-t">
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmitBid}
          disabled={!bidAmount || isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            "Sending..."
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Offer
            </>
          )}
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[80vh] flex flex-col">
          <DrawerHeader className="sticky top-0 bg-background border-b">
            <DrawerTitle className="text-xl font-bold font-grotesk">
              Buy Offer Message
            </DrawerTitle>
            <p className="text-sm text-muted-foreground">
              Send a by offer for {domainName}
            </p>
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-grotesk">
            Buy Offer Message
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Send a by offer for {domainName}
          </p>
        </DialogHeader>
        <div className="flex flex-col overflow-hidden">{content}</div>
      </DialogContent>
    </Dialog>
  );
};

export default ListPromptMessagePopup;
