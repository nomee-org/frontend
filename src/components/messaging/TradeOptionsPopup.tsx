import {
  ChevronRight,
  InboxIcon,
  Coins,
  Loader,
  LetterText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { Conversation } from "@xmtp/browser-sdk";
import { useOwnedNames } from "@/data/use-doma";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { useState } from "react";
import ListPromptMessagePopup from "./ProposeMessagePopup";
import { NameOptionsPopup } from "./NamesOptionsPopup copy";

interface TradeOptionPopupProps {
  conversation: Conversation;
  isOpen: boolean;
  onClose: () => void;
  peerAddress: string;
}

const tradeOptions = [
  {
    id: "buy",
    name: "Purchase",
    description: "Buy or Create Offer for their domains.",
    icon: <InboxIcon />,
  },
  {
    id: "sell",
    name: "Sell",
    description: "Create a listing for your domains.",
    icon: <Coins />,
  },
  {
    id: "proposal",
    name: "Proposal ",
    description: "Propose them your desired offer.",
    icon: <LetterText />,
  },
];

export function TradeOptionPopup({
  conversation,
  isOpen,
  onClose,
  peerAddress,
}: TradeOptionPopupProps) {
  const isMobile = useIsMobile();
  const { address } = useAccount();

  const peerNames = useOwnedNames(peerAddress, 20, []);
  const names = useOwnedNames(address, 20, []);

  const [showPromptListing, setShowPromptListing] = useState(false);
  const [showCreateListing, setShowCreateListing] = useState(false);

  const [showOffer, setShowOffer] = useState(false);

  const handleClick = (tradeOption: {
    id: string;
    name: string;
    description: string;
  }) => {
    if (
      (tradeOption.id === "buy" || tradeOption.id === "proposal") &&
      (peerNames.isLoading || peerNames.isFetching)
    ) {
      return toast("Please wait.");
    } else if (
      tradeOption.id === "sell" &&
      (names.isLoading || names.isFetching)
    ) {
      return toast("Please wait.");
    }

    setShowPromptListing(tradeOption.id === "proposal");
    setShowOffer(tradeOption.id === "buy");
    setShowCreateListing(tradeOption.id === "sell");
  };

  const content = (
    <>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Choose an option to trade domains
        </p>

        <div className="space-y-3">
          {tradeOptions.map((tradeOption) => (
            <Card
              key={tradeOption.name}
              onClick={() => handleClick(tradeOption)}
              className="p-4 cursor-pointer hover:bg-secondary"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{tradeOption.icon}</div>
                  <div>
                    <h3 className="font-semibold">{tradeOption.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {tradeOption.description}
                    </p>
                  </div>
                </div>
                <>
                  {tradeOption.id === "buy" &&
                  (peerNames.isLoading || peerNames.isFetching) ? (
                    <Loader className="animate-spin" />
                  ) : tradeOption.id === "sell" &&
                    (names.isLoading || names.isFetching) ? (
                    <Loader className="animate-spin" />
                  ) : (
                    <ChevronRight />
                  )}
                </>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );

  if (showPromptListing) {
    return (
      <ListPromptMessagePopup
        conversation={conversation}
        isOpen={showPromptListing}
        onClose={(deep) => {
          setShowPromptListing(false);
          if (deep) {
            onClose();
          }
        }}
        peerAddress={peerAddress}
        names={peerNames?.data?.pages?.flatMap((p) => p.items)}
      />
    );
  }

  if (showOffer) {
    return (
      <NameOptionsPopup
        conversation={conversation}
        isOpen={showOffer}
        handleClick={(name) => {}}
        onClose={(deep) => {
          setShowOffer(false);
          if (deep) {
            onClose();
          }
        }}
        names={peerNames?.data?.pages?.flatMap((p) => p.items)}
      />
    );
  }

  if (showCreateListing) {
    return (
      <NameOptionsPopup
        conversation={conversation}
        isOpen={showCreateListing}
        handleClick={(name) => {}}
        onClose={(deep) => {
          setShowCreateListing(false);
          if (deep) {
            onClose();
          }
        }}
        names={names?.data?.pages?.flatMap((p) => p.items)}
      />
    );
  }

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Trade Options</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 pb-safe">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Trade Options</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
