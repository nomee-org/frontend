/* eslint-disable @typescript-eslint/no-explicit-any */
import { useHelper } from "@/hooks/use-helper";
import { X } from "lucide-react";
import { Link } from "react-router-dom";

export const Cancelled = ({ props, isOwn }: { props: any; isOwn: boolean }) => {
  const { trimAddress } = useHelper();

  return (
    <div className="w-32 md:w-44 max-w-full">
      {/* Title */}
      <div className="text-base font-semibold flex items-center gap-1">
        <X className="text-red-500" /> Cancelled
      </div>

      {/* Info */}
      <div className="space-y-1 text-sm leading-relaxed">
        {props.domainName && (
          <div className="flex items-center justify-between">
            <span className="font-medium">Domain:</span>
            <Link className="underline" to={`/names/${props.domainName}`}>
              <span
                className={
                  isOwn ? "text-primary-secondary/80" : "text-primary/80"
                }
              >
                {props.domainName}
              </span>
            </Link>
          </div>
        )}
        {props.orderId && (
          <div className="flex items-center justify-between">
            <span className="font-medium">Order Id:</span>
            <span
              className={`${
                isOwn ? "text-primary-secondary/80" : "text-primary/80"
              } truncate max-w-24`}
            >
              {props.orderId}
            </span>
          </div>
        )}
        {props.status && (
          <div className="flex items-center justify-between">
            <span className="font-medium">Status:</span>
            <span
              className={`${
                isOwn ? "text-primary-secondary/80" : "text-primary/80"
              } truncate max-w-24`}
            >
              {props.status}
            </span>
          </div>
        )}
        {props.transactionHash && (
          <div className="flex items-center justify-between">
            <span className="font-medium">Tx Hash:</span>
            <span
              className={`${
                isOwn ? "text-primary-secondary/80" : "text-primary/80"
              } truncate max-w-24`}
            >
              {trimAddress(props.transactionHash)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
