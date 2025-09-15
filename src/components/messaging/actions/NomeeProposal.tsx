/* eslint-disable @typescript-eslint/no-explicit-any */
import { ListDomainPopup } from "@/components/domain/ListDomainPopup";
import { Button } from "@/components/ui/button";
import { useName } from "@/data/use-doma";
import { useHelper } from "@/hooks/use-helper";
import { Conversation, DecodedMessage } from "@xmtp/browser-sdk";
import { ContentTypeReply, Reply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import { LetterText, Loader } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface ProposalProps {
  domainName: string;
  amount: number;
  currency: string;
}

export const NomeeProposal = ({
  props,
  isOwn,
  conversation,
  message,
}: {
  props: ProposalProps;
  isOwn: boolean;
  conversation: Conversation;
  message?: DecodedMessage;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const { formatLargeNumber } = useHelper();

  const name = useName(props.domainName, isInView);
  const token = name?.data?.tokens?.[0];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          obs.unobserve(entry.target);
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
      observer.disconnect();
    };
  }, []);

  const handleCancel = async () => {
    try {
      setIsCancelling(true);
      const richMessage = `cancelled::${JSON.stringify({})}`;

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
      setIsCancelling(false);
    }
  };

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
      <div className="w-64 max-w-full space-y-3" ref={ref}>
        {/* Title */}
        <div className="text-base font-semibold flex items-center gap-1">
          <LetterText />
          {isOwn
            ? "You sent a listing proposal."
            : "You received a listing proposal."}
        </div>

        {/* Info */}
        {name.isLoading || name.isFetching ? (
          <div className="min-h-20 flex items-center justify-center">
            <Loader className="animate-spin" />
          </div>
        ) : !token ? (
          <div className="min-h-20 flex items-center justify-center">
            <p className="text-red-500 text-center">
              Domain not existing anymore.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-1 text-sm leading-relaxed">
              <div className="flex items-center justify-between">
                <span className="font-medium">Domain:</span>
                <span className="text-primary-foreground">
                  {props.domainName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Amount:</span>
                <span className="text-primary-foreground">
                  {formatLargeNumber(Number(props.amount))} {props.currency}
                </span>
              </div>
            </div>

            {/* Actions */}
            {!isOwn ? (
              <div className="flex gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setIsAccepting(true);
                  }}
                  disabled={isAccepting}
                >
                  List
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={handleReject}
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
                  onClick={handleCancel}
                  disabled={isCancelling}
                >
                  Cancel
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {name?.data && isAccepting && (
        <ListDomainPopup
          conversation={conversation}
          replyTo={message}
          domainName={name.data.name}
          isOpen={isAccepting}
          onClose={() => {
            setIsAccepting(false);
          }}
          token={token}
          initPrice={props.amount.toString()}
          initCurrency={props.currency}
        />
      )}
    </>
  );
};
