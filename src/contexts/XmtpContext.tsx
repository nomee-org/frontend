/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client, Identifier } from "@xmtp/browser-sdk";
import React, { createContext, ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import { toBytes, WalletClient } from "viem";
import { useAccount, useWalletClient } from "wagmi";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { mainnet } from "viem/chains";
import { Reaction, ReactionCodec } from "@xmtp/content-type-reaction";
import {
  AttachmentCodec,
  RemoteAttachmentCodec,
} from "@xmtp/content-type-remote-attachment";
import { ReplyCodec } from "@xmtp/content-type-reply";
interface XmtpContextType {
  client: Client<string | any | Reaction> | null;
  identifier: Identifier | null;
  isLoading: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const XmtpContext = createContext<XmtpContextType | undefined>(undefined);

interface XmtpProviderProps {
  children: ReactNode;
}

const ethersSigner = (client?: WalletClient) => {
  if (!client) return undefined;

  const { account, chain, transport } = client;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new BrowserProvider(transport as any, network);
  return new JsonRpcSigner(provider, account.address);
};

export const XmtpProvider: React.FC<XmtpProviderProps> = ({ children }) => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [client, setClient] = useState<Client<string | any | Reaction> | null>(
    null
  );
  const [identifier, setIdentifier] = useState<Identifier | null>(null);

  useEffect(() => {
    disconnect();
  }, [address]);

  const signer = ethersSigner(walletClient);

  const connect = async () => {
    try {
      if (isLoading) {
        toast.warning("Connecting...");
        return;
      }

      if (!address) throw new Error("No connected wallet");

      setIsLoading(true);

      await walletClient.switchChain({ id: mainnet.id });

      setIdentifier({
        identifier: address.toLowerCase(),
        identifierKind: "Ethereum",
      });

      setClient(
        await Client.create(
          {
            type: "SCW",
            getIdentifier: () => ({
              identifier: address.toLowerCase(),
              identifierKind: "Ethereum",
            }),
            signMessage: async (message) => {
              return toBytes(await signer.signMessage(message));
            },
            getChainId: () => BigInt(mainnet.id),
          },
          {
            env: "dev",
            appVersion: "nomee-app/1.0",
            dbEncryptionKey: new Uint8Array(
              import.meta.env.VITE_DB_ENCRYPTION_KEY.split(",").map(Number)
            ),
            codecs: [
              new ReplyCodec(),
              new ReactionCodec(),
              new AttachmentCodec(),
              new RemoteAttachmentCodec(),
            ],
          }
        )
      );

      setIsLoading(false);
    } catch (error) {
      console.error("Error connecting to XMTP:", error);
      setError(error);
    }
  };

  const disconnect = () => {
    client?.close();
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
