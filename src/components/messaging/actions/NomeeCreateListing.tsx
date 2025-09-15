/* eslint-disable @typescript-eslint/no-explicit-any */
import { CancelListingPopup } from "@/components/domain/CancelListingPopup";
import { BuyOrMakeOfferPopup } from "@/components/domain/BuyOrMakeOfferPopup";
import { Button } from "@/components/ui/button";
import { useName, useOffer } from "@/data/use-doma";
import { useHelper } from "@/hooks/use-helper";
import { Conversation, DecodedMessage } from "@xmtp/browser-sdk";
import { ContentTypeReply, Reply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import { Coins, Loader } from "lucide-react";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { formatUnits } from "viem";

export interface CreateListingProps {
  orderId: string;
  domainName: string;
}

export const NomeeCreateListing = ({
  props,
  isOwn,
  conversation,
  message,
}: {
  props: CreateListingProps;
  isOwn: boolean;
  conversation: Conversation;
  message?: DecodedMessage;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isBuyingOrMakingOffer, setIsBuyingOrMakingOffer] = useState(false);

  const { formatLargeNumber } = useHelper();

  const name = useName(props.domainName, isInView);
  const token = name?.data?.tokens?.[0];
  const listing = name?.data?.tokens?.[0]?.listings?.[0];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!isInView) {
          setIsInView(entry.isIntersecting);
        }
      },
      {
        root: null,
        threshold: 0.1,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  const handleReject = async () => {
    try {
      setIsRejecting(true);
      const richMessage = `rejected::${JSON.stringify({})}`;

      if (message) {
        await conversation?.sendOptimistic(
          {
            content: richMessage,
            reference: message.id,
            referenceInboxId: message.senderInboxId,
            contentType: ContentTypeText,
          } as Reply,
          ContentTypeReply
        );
      } else {
        await conversation?.sendOptimistic(richMessage, ContentTypeText);
      }

      conversation.publishMessages();
    } catch (error) {
      console.log(error);
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <>
      <div className="w-64 md:w-96 p-2 md:p-3 max-w-full space-y-3" ref={ref}>
        {/* Title */}
        <div className="text-base font-semibold flex items-center gap-1">
          <Coins />
          {isOwn ? "You sent a listing." : "You received a listing."}
        </div>

        {/* Info */}
        {name.isLoading || name.isFetching ? (
          <div className="min-h-20 flex items-center justify-center">
            <Loader className="animate-spin" />
          </div>
        ) : !listing ? (
          <div className="min-h-20 flex items-center justify-center">
            <p className="text-red-500 text-center">Completed.</p>
          </div>
        ) : (
          <div className="space-y-1 text-sm leading-relaxed">
            <div className="flex items-center justify-between">
              <span className="font-medium">Domain:</span>
              <span className="text-primary-foreground">{name.data.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Price:</span>
              <span className="text-primary-foreground">
                {formatLargeNumber(
                  Number(
                    formatUnits(
                      BigInt(listing.price),
                      listing.currency.decimals
                    )
                  )
                )}{" "}
                {listing.currency.symbol}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Expiration:</span>
              <span className="text-primary-foreground">
                {moment(new Date(listing.expiresAt)).fromNow()}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        {!isOwn ? (
          <div className="flex gap-2 pt-1">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => {
                setIsBuyingOrMakingOffer(true);
              }}
              disabled={isBuyingOrMakingOffer}
            >
              Buy or Make Offer
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={() => handleReject}
              disabled={isRejecting}
            >
              Reject
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 pt-1">
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={() => {
                setIsCancelling(true);
              }}
              disabled={isCancelling}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {token && isBuyingOrMakingOffer && (
        <BuyOrMakeOfferPopup
          conversation={conversation}
          replyTo={message}
          domainName={name.data.name}
          isOpen={isBuyingOrMakingOffer}
          onClose={() => {
            setIsBuyingOrMakingOffer(false);
          }}
          token={token}
        />
      )}

      {token && isCancelling && (
        <CancelListingPopup
          conversation={conversation}
          replyTo={message}
          isOpen={isCancelling}
          domainName={name.data.name}
          onClose={() => {
            setIsCancelling(false);
          }}
          token={token}
        />
      )}
    </>
  );
};
