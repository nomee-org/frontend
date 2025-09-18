/* eslint-disable @typescript-eslint/no-explicit-any */
import { useHelper } from "@/hooks/use-helper";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

export const Accepted = ({ props }: { props: any }) => {
  const { trimAddress } = useHelper();

  return (
    <div className="w-32 md:w-44 max-w-full">
      {/* Title */}
      <div className="text-base font-semibold flex items-center gap-1">
        <Check /> Accepted
      </div>

      {/* Info */}
      <div className="space-y-1 text-sm leading-relaxed">
        {props.domainName && (
          <div className="flex items-center justify-between">
            <span className="font-medium">Domain:</span>
            <Link className="underline" to={`/names/${props.domainName}`}>
              <span className="text-primary-foreground">
                {props.domainName}
              </span>
            </Link>
          </div>
        )}
        {props.orderId && (
          <div className="flex items-center justify-between">
            <span className="font-medium">Order Id:</span>
            <span className="text-primary-foreground truncate max-w-24">
              {props.orderId}
            </span>
          </div>
        )}
        {props.status && (
          <div className="flex items-center justify-between">
            <span className="font-medium">Status:</span>
            <span className="text-primary-foreground truncate max-w-24">
              {props.status}
            </span>
          </div>
        )}
        {props.transactionHash && (
          <div className="flex items-center justify-between">
            <span className="font-medium">Tx Hash:</span>
            <span className="text-primary-foreground truncate max-w-24">
              {trimAddress(props.transactionHash)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
