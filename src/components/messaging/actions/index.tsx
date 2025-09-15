import { NomeeProposal } from "./NomeeProposal";
import { NomeeCreateListing } from "./NomeeCreateListing";
import { Conversation, DecodedMessage } from "@xmtp/browser-sdk";
import { NomeeCreateOffer } from "./NomeeCreateOffer";

export const NomeeAction = ({
  conversation,
  message,
  data,
  isOwn,
}: {
  data: string;
  isOwn: boolean;
  conversation: Conversation;
  message?: DecodedMessage;
}) => {
  const text = data.match(/(?<=::).*/)?.[0];

  if (!text) {
    return <p className="text-muted-foreground">Cannot parse message.</p>;
  }

  if (data.startsWith("proposal::")) {
    try {
      return (
        <NomeeProposal
          props={JSON.parse(text)}
          isOwn={isOwn}
          conversation={conversation}
          message={message}
        />
      );
    } catch {
      return <p className="text-destructive">Invalid JSON payload.</p>;
    }
  }

  if (data.startsWith("created_listing::")) {
    try {
      return (
        <NomeeCreateListing
          props={JSON.parse(text)}
          isOwn={isOwn}
          conversation={conversation}
          message={message}
        />
      );
    } catch {
      return <p className="text-destructive">Invalid JSON payload.</p>;
    }
  }

  if (data.startsWith("created_offer::")) {
    try {
      return (
        <NomeeCreateOffer
          props={JSON.parse(text)}
          isOwn={isOwn}
          conversation={conversation}
          message={message}
        />
      );
    } catch {
      return <p className="text-destructive">Invalid JSON payload.</p>;
    }
  }

  return null;
};
