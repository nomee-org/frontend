/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client, DecodedMessage, Identifier } from "@xmtp/browser-sdk";
import React, { createContext, ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import { toBytes } from "viem";
import { useAccount, useWalletClient } from "wagmi";
import { Reaction, ReactionCodec } from "@xmtp/content-type-reaction";
import {
  AttachmentCodec,
  RemoteAttachment,
  RemoteAttachmentCodec,
} from "@xmtp/content-type-remote-attachment";
import { Reply, ReplyCodec } from "@xmtp/content-type-reply";
import { TextCodec } from "@xmtp/content-type-text";
import {
  ContentTypeReadReceipt,
  ReadReceiptCodec,
} from "@xmtp/content-type-read-receipt";

interface XmtpContextType {
  client: Client<string | any | Reply | RemoteAttachment | Reaction> | null;
  identifier: Identifier | null;
  isLoading: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  newMessage: DecodedMessage | undefined;
  clearNewMessage: () => void;
}

const XmtpContext = createContext<XmtpContextType | undefined>(undefined);

interface XmtpProviderProps {
  children: ReactNode;
}

export const XmtpProvider: React.FC<XmtpProviderProps> = ({ children }) => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [client, setClient] = useState<Client<string | any | Reaction> | null>(
    null
  );
  const [identifier, setIdentifier] = useState<Identifier | null>(null);
  const [newMessage, setNewMessage] = useState<DecodedMessage | undefined>(
    undefined
  );

  const clearNewMessage = () => {
    setNewMessage(undefined);
  };

  useEffect(() => {
    let streamController: AsyncIterator<any, any, any> | undefined;

    if (client?.inboxId) {
      (async () => {
        streamController = await client.conversations.streamAllMessages({
          onValue: (value) => {
            setNewMessage(value);
          },
          onError: (error) => {
            // setConversationsError(error);
          },
        });
      })();
    }

    return () => {
      if (streamController && typeof streamController.return === "function") {
        streamController.return();
      }
    };
  }, [client?.inboxId]);

  useEffect(() => {
    if (address && walletClient) {
      connect();
    } else {
      disconnect();
    }
  }, [address, walletClient]);

  const connect = async () => {
    try {
      if (isLoading) {
        toast.warning("Connecting...");
        return;
      }

      if (!address) throw new Error("No connected wallet");

      setIsLoading(true);

      const identifier: Identifier = {
        identifier: address.toLowerCase(),
        identifierKind: "Ethereum",
      };

      setIdentifier(identifier);

      const canMessage = await Client.canMessage([identifier]);

      if (canMessage.get(address.toLowerCase())) {
        const xmtpClient = await Client.build(identifier, {
          env: "dev",
          appVersion: "nomee-app/1.0",
          codecs: [
            new ReplyCodec(),
            new ReactionCodec(),
            new AttachmentCodec(),
            new RemoteAttachmentCodec(),
            new TextCodec(),
            new ReadReceiptCodec(),
          ],
        });
        setClient(xmtpClient);
      } else {
        const xmtpClient = await Client.create(
          {
            type: "EOA",
            getIdentifier: () => identifier,
            signMessage: async (message) => {
              return toBytes(
                await walletClient.signMessage({ message, account: address })
              );
            },
          },
          {
            env: "dev",
            appVersion: "nomee-app/1.0",
            codecs: [
              new ReplyCodec(),
              new ReactionCodec(),
              new AttachmentCodec(),
              new RemoteAttachmentCodec(),
              new TextCodec(),
              new ReadReceiptCodec(),
            ],
          }
        );
        setClient(xmtpClient);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error connecting to XMTP:", error);
      setError(error);
    }
  };

  const disconnect = () => {
    // client?.close();
    setIsLoading(false);
    setError(null);
    setClient(null);
    setIdentifier(null);
  };

  const value = {
    client,
    identifier,
    isLoading,
    error,
    connect,
    disconnect,
    newMessage,
    clearNewMessage,
  };

  return <XmtpContext.Provider value={value}>{children}</XmtpContext.Provider>;
};

export const useXmtp = () => {
  const context = React.useContext(XmtpContext);
  if (!context) {
    throw new Error("useXmtp must be used within a XmtpProvider");
  }
  return context;
};
