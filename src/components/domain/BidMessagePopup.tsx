import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { DollarSign, Clock, TrendingUp, AlertCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSendMessage } from "@/data/use-backend";
import { MessageType } from "@/types/backend";

interface BidMessagePopupProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  recipientId: string;
  domainName: string;
  conversationId?: string;
}

const BidMessagePopup = ({
  isOpen,
  onClose,
  recipientName,
  recipientId,
  domainName,
  conversationId,
}: BidMessagePopupProps) => {
  const [bidAmount, setBidAmount] = useState("");
  const [bidCurrency, setBidCurrency] = useState("ETH");
  const [bidType, setBidType] = useState("offer");
  const [durationDays, setDurationDays] = useState("7");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const sendMessageMutation = useSendMessage();

  const currencies = [
    { value: "ETH", label: "ETH", rate: 2800 },
    { value: "USDC", label: "USDC", rate: 1 },
    { value: "WETH", label: "WETH", rate: 2800 },
  ];

  const selectedCurrency = currencies.find((c) => c.value === bidCurrency);
  const estimatedUSD =
    bidAmount && selectedCurrency
      ? parseFloat(bidAmount) * selectedCurrency.rate
      : 0;

  const formatBidMessage = () => {
    const bidTypeText = {
      instant: "💰 Instant Buy Offer",
      offer: "📈 Domain Offer",
    }[bidType];

    const durationText = bidType === "auction" ? ` (${durationDays} days)` : "";

    return `${bidTypeText}${durationText}

🌐 Domain: ${domainName}
💵 Amount: ${bidAmount} ${bidCurrency}
${estimatedUSD ? `≈ $${estimatedUSD.toLocaleString()} USD` : ""}

💬 Message:
${message}

---
Sent via DOMA Bid System`;
  };

  const handleSubmitBid = async () => {
    if (!bidAmount || !message.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!conversationId) {
      toast({
        title: "Error",
        description: "Conversation not available. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const richMessage = formatBidMessage();

      await sendMessageMutation.mutateAsync({
        createMessageDto: {
          conversationId,
          content: richMessage,
          type: MessageType.TEXT,
        },
      });

      toast({
        title: "Success",
        description: "Bid message sent successfully!",
      });

      // Reset form
      setBidAmount("");
      setMessage("");
      setBidType("offer");
      setDurationDays("7");

      onClose();
    } catch (error) {
      console.error("Error sending bid message:", error);
      toast({
        title: "Error",
        description: "Failed to send bid message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <>
      <div className="space-y-6 flex-1 overflow-y-auto">
        {/* Domain Info */}
        <div className="bg-accent/50 p-2 md:p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">Domain</span>
            <Badge variant="outline">{domainName}</Badge>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="font-medium text-sm">Recipient</span>
            <span className="text-sm">{recipientName}</span>
          </div>
        </div>

        {/* Bid Type */}
        <div className="space-y-2">
          <Label>Bid Type</Label>
          <Select value={bidType} onValueChange={setBidType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instant">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Instant Buy</span>
                </div>
              </SelectItem>

              <SelectItem value="offer">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Make Offer</span>
                </div>
              </SelectItem>
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
          {bidAmount && (
            <p className="text-sm text-muted-foreground">
              ≈ ${estimatedUSD.toLocaleString()} USD
            </p>
          )}
        </div>

        {/* Duration (for auction bids) */}
        {bidType === "auction" && (
          <div className="space-y-2">
            <Label>Bid Duration</Label>
            <Select value={durationDays} onValueChange={setDurationDays}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 day</SelectItem>
                <SelectItem value="3">3 days</SelectItem>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Message */}
        <div className="space-y-2">
          <Label>Message *</Label>
          <Textarea
            placeholder="Describe your offer and why you're interested in this domain..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="resize-none"
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            {message.length}/500 characters
          </p>
        </div>

        {/* Warning */}
        <div className="flex items-start space-x-2 p-3 bg-muted/50 border rounded-lg">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium">Important</p>
            <p>
              This bid message will be sent to the domain owner. Make sure your
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
          disabled={!bidAmount || !message.trim() || isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            "Sending..."
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Bid
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
              Send Bid Message
            </DrawerTitle>
            <p className="text-sm text-muted-foreground">
              Send a bidding proposal to {recipientName} for {domainName}
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
            Send Bid Message
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Send a bidding proposal to {recipientName} for {domainName}
          </p>
        </DialogHeader>
        <div className="flex flex-col overflow-hidden">{content}</div>
      </DialogContent>
    </Dialog>
  );
};

export default BidMessagePopup;
