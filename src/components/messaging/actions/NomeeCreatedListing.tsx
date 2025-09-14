/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import moment from "moment";

export const NomeeCreatedListing = ({
  props,
  isOwn,
}: {
  props: any;
  isOwn: boolean;
}) => {
  return (
    <div className="w-64 md:w-96 p-2 md:p-3 max-w-full space-y-3">
      {/* Title */}
      <div className="text-base font-semibold flex items-center gap-1">
        <Coins />
        Listing
      </div>

      {/* Info */}
      <div className="space-y-1 text-sm leading-relaxed">
        <div className="flex items-center justify-between">
          <span className="font-medium">Domain:</span>{" "}
          <span className="text-primary-foreground">{props.domainName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">Price:</span>{" "}
          <span className="text-primary-foreground">{props.price}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">Currency:</span>
          <span className="text-primary-foreground">{props.currency}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">Order Id:</span>{" "}
          <span className="text-primary-foreground truncate max-w-24">
            {props.orderId}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">Expiration:</span>{" "}
          <span className="text-primary-foreground">
            {moment(new Date(props.expiresMs)).fromNow()}
          </span>
        </div>
      </div>

      {/* Actions */}
      {!isOwn ? (
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" size="sm" className="flex-1">
            Accept
          </Button>
          <Button variant="destructive" size="sm" className="flex-1">
            Reject
          </Button>
        </div>
      ) : (
        <div className="flex gap-2 pt-1">
          <Button variant="destructive" size="sm" className="flex-1">
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};
