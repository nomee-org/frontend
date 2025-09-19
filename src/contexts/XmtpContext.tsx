/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client, DecodedMessage, Identifier, Signer } from "@xmtp/browser-sdk";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import { toBytes } from "viem";
import { useAccount, useSignMessage } from "wagmi";
import { Reaction, ReactionCodec } from "@xmtp/content-type-reaction";
import {
  AttachmentCodec,
  RemoteAttachment,
  RemoteAttachmentCodec,
} from "@xmtp/content-type-remote-attachment";
import { Reply, ReplyCodec } from "@xmtp/content-type-reply";
import { TextCodec } from "@xmtp/content-type-text";
import { ReadReceipt, ReadReceiptCodec } from "@xmtp/content-type-read-receipt";

const XMTP_ENV = "dev" as const;

interface XmtpContextType {
  client: Client<
    string | any | Reply | RemoteAttachment | ReadReceipt | Reaction
  > | null;
  identifier: Identifier | null;
  isLoading: boolean;
  error: Error | null;
  newMessages: DecodedMessage[];
  clearNewMessages: (conversationId: string) => void;
  clearAllNewMessages: () => void;
}

const XmtpContext = createContext<XmtpContextType | undefined>(undefined);

interface XmtpProviderProps {
  children: ReactNode;
}

export const XmtpProvider: React.FC<XmtpProviderProps> = ({ children }) => {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [client, setClient] = useState<Client<
    string | any | Reply | RemoteAttachment | ReadReceipt | Reaction
  > | null>(null);
  const [identifier, setIdentifier] = useState<Identifier | null>(null);
  const [newMessages, setNewMessages] = useState<DecodedMessage[]>([]);

  const clearNewMessages = (conversationId: string) => {
    setNewMessages((prev) =>
      prev.filter((p) => p.conversationId !== conversationId)
    );
  };

  const clearAllNewMessages = () => {
    setNewMessages([]);
  };

  useEffect(() => {
    if (!client) return;

    let asyncIterator: AsyncIterator<any, any, any> | undefined;

    (async () => {
      asyncIterator = await client.conversations.streamAllMessages({
        onValue: (value) => {
          setNewMessages((prev) => [value, ...prev]);
        },
      });
    })();

    return () => {
      if (asyncIterator && typeof asyncIterator.return === "function") {
        asyncIterator.return();
      }
    };
  }, [client]);

  const connect = useCallback(async () => {
    if (!address) return;

    try {
      setIsLoading(true);

      const xmtpIdentifier: Identifier = {
        identifier: address,
        identifierKind: "Ethereum",
      };

      const canMessage = await Client.canMessage([xmtpIdentifier], XMTP_ENV);

      if (canMessage.get(address)) {
        const xmtpClient = await Client.build(xmtpIdentifier, {
          env: XMTP_ENV,
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
        xmtpClient.conversations.syncAll();
      } else {
        const xmtpClient = await Client.create(
          {
            type: "EOA",
            getIdentifier: () => ({
              identifier: address,
              identifierKind: "Ethereum",
            }),
            signMessage: async (message) => {
              return toBytes(
                await signMessageAsync({
                  account: address,
                  message,
                })
              );
            },
          },
          {
            env: XMTP_ENV,
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
        xmtpClient.conversations.syncAll();
      }

      setIdentifier(xmtpIdentifier);
      setIsLoading(false);
    } catch (error) {
      setError(error);
    }
  }, [address, signMessageAsync]);

  useEffect(() => {
    if (!address) {
      setIsLoading(false);
      setError(null);
      setClient(null);
      setIdentifier(null);
    }
  }, [address]);

  useEffect(() => {
    connect();
  }, [connect]);

  const value = {
    client,
    identifier,
    isLoading,
    error,
    newMessages,
    clearNewMessages,
    clearAllNewMessages,
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
