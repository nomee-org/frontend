/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { AlertCircle, Send, AtSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Conversation, DecodedMessage } from "@xmtp/browser-sdk";
import { ContentTypeText } from "@xmtp/content-type-text";
import { Name } from "@/types/doma";
import { ContentTypeReply, Reply } from "@xmtp/content-type-reply";

interface ProposeMessagePopupProps {
  conversation: Conversation;
  replyTo?: DecodedMessage;
  isOpen: boolean;
  onClose: (deep: boolean) => void;
  peerAddress: string;
  names: Name[];
}

const ProposeMessagePopup = ({
  conversation,
  replyTo,
  isOpen,
  onClose,
  names,
}: ProposeMessagePopupProps) => {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USDC");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [domainName, setDomainName] = useState("");

  useEffect(() => {
    setDomainName(names?.[0]?.name ?? "");
  }, [names]);

  const currencies = [
    { value: "USDC", label: "USDC" },
    { value: "WETH", label: "WETH" },
  ];

  const handleSubmitBid = async () => {
    if (!domainName) {
      toast({
        title: "Error",
        description: "Please select a domain",
        variant: "destructive",
      });
      return;
    }

    if (!amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const richMessage = `prompt_listing::${JSON.stringify({
        domainName,
        amount,
        currency,
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

      setAmount("");
      onClose(true);

      conversation.publishMessages();
    } catch (error) {
      console.log(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <>
      {names.length > 0 ? (
        <div className="space-y-6 flex-1 overflow-y-auto">
          {/* Domain Info */}
          <div className="space-y-2">
            <Label>Select a domain *</Label>
            <Select value={domainName} onValueChange={setDomainName}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {names?.map((name) => {
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
            <Label>Amount *</Label>
            <div className="flex space-x-2">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1"
                step="0.001"
                min="0"
              />
              <Select value={currency} onValueChange={setCurrency}>
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
                This buy message will be sent to the domain owner. Make sure
                your offer is genuine and you have the funds available.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 py-10">
          <p className="text-muted text-sm text-center">
            User has no domain name.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-3 sticky bottom-0 bg-background pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => onClose(false)}
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmitBid}
          disabled={!amount || isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            "Sending..."
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send
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
              Propose an offer.
            </DrawerTitle>
            <p className="text-sm text-muted-foreground">
              Send a desired offer for {domainName}
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
            Propose an offer.
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Send a desired offer for {domainName}
          </p>
        </DialogHeader>
        <div className="flex flex-col overflow-hidden">{content}</div>
      </DialogContent>
    </Dialog>
  );
};

export default ProposeMessagePopup;
