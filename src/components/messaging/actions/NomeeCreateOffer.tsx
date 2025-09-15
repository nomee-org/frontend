/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { Coins, Loader } from "lucide-react";
import moment from "moment";
import { Conversation, DecodedMessage } from "@xmtp/browser-sdk";
import { useState } from "react";
import { AcceptRejectOfferPopup } from "@/components/domain/AcceptRejectOfferPopup";
import { useName, useOffer } from "@/data/use-doma";
import { useHelper } from "@/hooks/use-helper";
import { CancelOfferPopup } from "@/components/domain/CancelOfferPopup";

export interface CreateOfferProps {
  orderId: string;
  domainName: string;
}

export const NomeeCreateOffer = ({
  props,
  isOwn,
  conversation,
  message,
}: {
  props: CreateOfferProps;
  isOwn: boolean;
  conversation: Conversation;
  message?: DecodedMessage;
}) => {
  const [action, setAction] = useState<"accept" | "reject">("accept");
  const [isCancelling, setIsCancelling] = useState(false);
  const [isAcceptingOrRejecting, setIsAcceptingOrRejecting] = useState(false);
  const { formatLargeNumber } = useHelper();

  const offer = useOffer(props.orderId);
  const name = useName(props.domainName);
  const token = name?.data?.tokens?.[0];

  return (
    <>
      <div className="w-64 md:w-96 p-2 md:p-3 max-w-full space-y-3">
        {/* Title */}
        <div className="text-base font-semibold flex items-center gap-1">
          <Coins />
          {isOwn ? "You sent an offer." : "You received an offer."}
        </div>

        {/* Info */}
        {offer.isLoading ||
        offer.isFetching ||
        name.isLoading ||
        name.isFetching ? (
          <div className="min-h-32 flex items-center justify-center">
            <Loader className="animate-spin" />
          </div>
        ) : !(offer?.data || token) ? (
          <div className="min-h-32 flex items-center justify-center">
            <p className="text-red-500 text-center">Invalid offer.</p>
          </div>
        ) : (
          <div className="space-y-1 text-sm leading-relaxed">
            <div className="flex items-center justify-between">
              <span className="font-medium">Domain:</span>{" "}
              <span className="text-primary-foreground">{name.data.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Price:</span>{" "}
              <span className="text-primary-foreground">
                {formatLargeNumber(
                  Number(offer.data.price) /
                    Math.pow(10, offer.data.currency.decimals)
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Currency:</span>
              <span className="text-primary-foreground">
                {offer.data.currency.symbol}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Offer Id:</span>{" "}
              <span className="text-primary-foreground truncate max-w-24">
                {offer.data.externalId}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Expiration:</span>{" "}
              <span className="text-primary-foreground">
                {moment(new Date(offer.data.expiresAt)).fromNow()}
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
                setAction("accept");
                setIsAcceptingOrRejecting(true);
              }}
              disabled={isAcceptingOrRejecting}
            >
              Accept
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={() => {
                setAction("reject");
                setIsAcceptingOrRejecting(true);
              }}
              disabled={isAcceptingOrRejecting}
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

      {offer?.data && token && (
        <AcceptRejectOfferPopup
          conversation={conversation}
          replyTo={message}
          isOpen={isAcceptingOrRejecting}
          action={action}
          offer={offer.data}
          domainName={name.data.name}
          onClose={() => {
            setIsAcceptingOrRejecting(false);
          }}
          token={token}
        />
      )}

      {offer?.data && token && (
        <CancelOfferPopup
          conversation={conversation}
          replyTo={message}
          isOpen={isCancelling}
          offer={offer.data}
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
