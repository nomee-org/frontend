/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { Conversation, DecodedMessage } from "@xmtp/browser-sdk";
import { ContentTypeReply, Reply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import { LetterText } from "lucide-react";
import { useState } from "react";

export const NomeeProposal = ({
  props,
  isOwn,
  conversation,
  message,
}: {
  props: any;
  isOwn: boolean;
  conversation: Conversation;
  message?: DecodedMessage;
}) => {
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    try {
      setLoading(true);

      if (message) {
        await conversation?.sendOptimistic(
          {
            content: "Cancelled",
            reference: message.id,
            referenceInboxId: message.senderInboxId,
            contentType: ContentTypeText,
          } as Reply,
          ContentTypeReply
        );
      } else {
        await conversation?.sendOptimistic("Cancelled", ContentTypeText);
      }

      await conversation.publishMessages();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      if (message) {
        await conversation?.sendOptimistic(
          {
            content: "Rejected",
            reference: message.id,
            referenceInboxId: message.senderInboxId,
            contentType: ContentTypeText,
          } as Reply,
          ContentTypeReply
        );
      } else {
        await conversation?.sendOptimistic("Rejected", ContentTypeText);
      }

      conversation.publishMessages();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {};

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
          <span className="text-primary-foreground">{props.domainName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">Amount:</span>{" "}
          <span className="text-primary-foreground">{props.amount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">Currency:</span>{" "}
          <span className="text-primary-foreground">{props.currency}</span>
        </div>
      </div>

      {/* Actions */}
      {!isOwn ? (
        <div className="flex gap-2 pt-1">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={handleAccept}
            disabled={loading}
          >
            Create
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1"
            onClick={handleReject}
            disabled={loading}
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
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};
