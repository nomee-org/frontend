import { Button } from "@/components/ui/button";
import { Coins, LetterText } from "lucide-react";
import moment from "moment";

export const NomeeAction = ({
  data,
  isOwn,
}: {
  data: string;
  isOwn: boolean;
}) => {
  const text = data.match(/(?<=::).*/)?.[0];

  if (!text) {
    return <p className="text-muted-foreground">Cannot parse message.</p>;
  }

  if (data.startsWith("prompt_listing::")) {
    try {
      const props = JSON.parse(text);

      return (
        <div className="w-64 max-w-full space-y-3">
          {/* Title */}
          <div className="text-base font-semibold flex items-center gap-1">
            <LetterText />
            Proposal
          </div>

          {/* Info */}
          <div className="space-y-1 text-sm leading-relaxed">
            <div className="flex items-center justify-between">
              <span className="font-medium">Domain:</span>{" "}
              <span className="text-secondary">{props.domainName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Amount:</span>{" "}
              <span className="text-secondary">{props.amount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Currency:</span>{" "}
              <span className="text-secondary">{props.currency}</span>
            </div>
          </div>

          {/* Actions */}
          {!isOwn ? (
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" size="sm" className="flex-1">
                Create
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
    } catch {
      return <p className="text-destructive">Invalid JSON payload.</p>;
    }
  }

  if (data.startsWith("created_listing::")) {
    try {
      const props = JSON.parse(text);

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
              <span className="text-secondary">{props.domainName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Price:</span>{" "}
              <span className="text-secondary">{props.price}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Currency:</span>
              <span className="text-secondary">{props.currency}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Order Id:</span>{" "}
              <span className="text-secondary truncate max-w-24">
                {props.orderId}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">Expiration:</span>{" "}
              <span className="text-secondary">
                {moment(new Date(props.expiresMs)).fromNow()}
              </span>
            </div>
          </div>

          {/* Actions */}
          {!isOwn ? (
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" size="sm" className="flex-1">
                Create
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
    } catch {
      return <p className="text-destructive">Invalid JSON payload.</p>;
    }
  }

  return null;
};
