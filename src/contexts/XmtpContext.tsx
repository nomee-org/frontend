import { Client, type Signer, type Identifier } from "@xmtp/browser-sdk";
import React, { createContext, ReactNode, useState } from "react";
import { toast } from "sonner";
import { stringToBytes } from "viem";
import { useAccount, useWalletClient } from "wagmi";

interface XmtpContextType {
  client: Client | null;
  identifier: Identifier | null;
  isLoading: boolean;
  error: Error | null;
  connect: (username: string) => Promise<void>;
  disconnect: () => void;
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
  const [client, setClient] = useState<Client | null>(null);
  const [identifier, setIdentifier] = useState<Identifier | null>(null);

  const connect = async (username: string) => {
    try {
      if (isLoading) {
        toast.warning("Connecting...");
        return;
      }

      if (!address) throw new Error("No connected wallet");

      setIsLoading(true);

      setIdentifier({
        identifier: address.toLowerCase(),
        identifierKind: "Ethereum",
      });

      const chainId = await walletClient.getChainId();

      const signer: Signer = {
        type: "SCW",
        getIdentifier: () => ({
          identifier: address,
          identifierKind: "Ethereum",
        }),
        signMessage: async (message: string) => {
          const signature = await walletClient.signMessage({
            message,
            account: address,
          });
          return stringToBytes(signature);
        },
        getChainId: () => BigInt(chainId),
      };

      console.log("Connecting to XMTP...");

      setClient(
        await Client.create(signer, {
          env: "dev",
          appVersion: "nomee-app/1.0",
        })
      );

      console.log("XMTP connected");

      toast(`Connected to XMTP as ${username}`);

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
