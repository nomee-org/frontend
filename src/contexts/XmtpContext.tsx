/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client, DecodedMessage, Identifier, Signer } from "@xmtp/browser-sdk";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { toBytes } from "viem";
import { useAccount, useSignMessage, useWalletClient } from "wagmi";
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
  newMessage: DecodedMessage | undefined;
  clearNewMessage: () => void;
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
  }, [client]);

  const signer: Signer = useMemo(() => {
    return {
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
    };
  }, [address, signMessageAsync]);

  const connect = useCallback(async () => {
    if (!address) return;
    try {
      setIsLoading(true);

      const xmtpIdentifier: Identifier = {
        identifier: address,
        identifierKind: "Ethereum",
      };

      const canMessage = await Client.canMessage([xmtpIdentifier]);

      if (canMessage.get(address)) {
        const xmtpClient = await Client.build(xmtpIdentifier, {
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
        const xmtpClient = await Client.create(signer, {
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
      }

      setIdentifier(xmtpIdentifier);
      setIsLoading(false);
    } catch (error) {
      setError(error);
    }
  }, [address, setClient, signer]);

  useEffect(() => {
    if (!address) {
      setIsLoading(false);
      setError(null);
      setClient(null);
      setIdentifier(null);
    }
  }, [address, setClient]);

  useEffect(() => {
    if (address && !client) {
      connect();
    }
  }, [address, client, connect, setClient]);

  const value = {
    client,
    identifier,
    isLoading,
    error,
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
