import { NomeeProposal } from "./NomeeProposal";
import { NomeeCreateListing } from "./NomeeCreateListing";
import { Conversation, DecodedMessage } from "@xmtp/browser-sdk";
import { NomeeCreateOffer } from "./NomeeCreateOffer";
import { Cancelled } from "./Cancelled";
import { Rejected } from "./Rejected";
import { Accepted } from "./Accepted";
import { Bought } from "./Bought";

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

  if (data.startsWith("rejected::")) {
    try {
      return <Rejected props={JSON.parse(text)} />;
    } catch (error) {
      return <p className="text-destructive">Invalid JSON payload.</p>;
    }
  }

  if (data.startsWith("accepted::")) {
    try {
      return <Accepted props={JSON.parse(text)} />;
    } catch (error) {
      return <p className="text-destructive">Invalid JSON payload.</p>;
    }
  }

  if (data.startsWith("cancelled::")) {
    try {
      return <Cancelled props={JSON.parse(text)} />;
    } catch (error) {
      return <p className="text-destructive">Invalid JSON payload.</p>;
    }
  }

  if (data.startsWith("bought")) {
    try {
      return <Bought props={JSON.parse(text)} />;
    } catch (error) {
      return <p className="text-destructive">Invalid JSON payload.</p>;
    }
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
