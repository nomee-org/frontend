import {
  ChevronRight,
  InboxIcon,
  Coins,
  Loader,
  LetterText,
} from "lucide-react";
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
import { Conversation, DecodedMessage } from "@xmtp/browser-sdk";
import { useOwnedNames } from "@/data/use-doma";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { useState } from "react";
import ListProposeMessagePopup from "./ProposeMessagePopup";
import { NameOptionsPopup } from "./NamesOptionsPopup";
import { BuyOrMakeOfferPopup } from "../domain/BuyOrMakeOfferPopup";
import { Name } from "@/types/doma";
import { ContentTypeText } from "@xmtp/content-type-text";
import { ContentTypeReply, Reply } from "@xmtp/content-type-reply";
import { ListDomainPopup } from "../domain/ListDomainPopup";
import { CreateListingProps } from "./actions/NomeeCreateListing";

interface TradeOptionPopupProps {
  conversation: Conversation;
  replyTo?: DecodedMessage;
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
  replyTo,
  isOpen,
  onClose,
  peerAddress,
}: TradeOptionPopupProps) {
  const isMobile = useIsMobile();
  const { address } = useAccount();

  const peerNames = useOwnedNames(peerAddress, 20, []);
  const names = useOwnedNames(address, 20, []);

  // layer 1
  const [showPropose, setShowPropose] = useState(false);
  const [showSell, setShowSell] = useState(false);
  const [showBuy, setBuyOffer] = useState(false);

  // layer 2
  const [showOfferListing, setShowOfferListing] = useState(false);
  const [showListing, setShowListing] = useState(false);

  // layer 0
  const [selectedName, setSelectedName] = useState<Name | undefined>(undefined);

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

    setShowPropose(tradeOption.id === "proposal");
    setBuyOffer(tradeOption.id === "buy");
    setShowSell(tradeOption.id === "sell");
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
                  {(tradeOption.id === "buy" ||
                    tradeOption.id === "purchase") &&
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

  // layer 2
  if (showOfferListing && selectedName && selectedName?.tokens?.length > 0) {
    return (
      <BuyOrMakeOfferPopup
        conversation={conversation}
        replyTo={replyTo}
        isOpen={showOfferListing}
        onClose={() => {
          setShowOfferListing(false);
        }}
        token={selectedName?.tokens[0]}
        domainName={selectedName.name}
      />
    );
  }

  if (showListing && selectedName && selectedName?.tokens?.length > 0) {
    return (
      <ListDomainPopup
        conversation={conversation}
        replyTo={replyTo}
        isOpen={showListing}
        onClose={() => {
          setShowListing(false);
        }}
        token={selectedName?.tokens[0]}
        domainName={selectedName.name}
      />
    );
  }

  // layer 1
  if (showPropose) {
    return (
      <ListProposeMessagePopup
        conversation={conversation}
        isOpen={showPropose}
        onClose={(deep) => {
          setShowPropose(false);
          if (deep) {
            onClose();
          }
        }}
        peerAddress={peerAddress}
        names={peerNames?.data?.pages?.flatMap((p) => p.items)}
      />
    );
  }

  if (showBuy) {
    return (
      <NameOptionsPopup
        conversation={conversation}
        isOpen={showBuy}
        handleClick={(name) => {
          if (name?.tokens?.[0]?.listings?.length > 0) {
            setSelectedName(name);
            setShowOfferListing(true);
          } else {
            toast.error(`${name.name} has no listing.`);
          }
        }}
        onClose={(deep) => {
          setBuyOffer(false);
          if (deep) {
            onClose();
          }
        }}
        names={peerNames?.data?.pages?.flatMap((p) => p.items)}
      />
    );
  }

  if (showSell) {
    return (
      <NameOptionsPopup
        conversation={conversation}
        isOpen={showSell}
        emptyMessage="You don't have a domain."
        handleClick={async (name) => {
          const token = name?.tokens?.[0];
          const listing = token?.listings?.[0];

          if (listing) {
            if (conversation) {
              const richMessage = `created_listing::${JSON.stringify({
                domainName: name.name,
                orderId: listing.externalId,
              } as CreateListingProps)}`;

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

            setShowSell(false);
            onClose();
          } else {
            setSelectedName(name);
            setShowListing(true);
          }
        }}
        onClose={(deep) => {
          setShowSell(false);
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
