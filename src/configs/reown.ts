import { Metadata } from "@reown/appkit";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { defineChain } from "viem";
import { sepolia, baseSepolia } from "viem/chains";
import { createAppKit } from "@reown/appkit/react";

export const domaTestnet = defineChain({
  id: 97476,
  name: "Doma Testnet",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc-testnet.doma.xyz"],
      webSocket: ["wss://rpc-testnet.doma.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Doma Explorer",
      url: "https://explorer-testnet.doma.xyz",
    },
  },
  testnet: true,
});

export const metadata: Metadata = {
  name: "Nomee",
  description: "Nomee",
  url: "https://example.com",
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
};

export const networks = [sepolia, baseSepolia, domaTestnet];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId: import.meta.env.VITE_REOWN_PROJECT_ID,
  ssr: true,
});

export const modal = createAppKit({
  adapters: [wagmiAdapter],
  defaultNetwork: domaTestnet,
  projectId: import.meta.env.VITE_REOWN_PROJECT_ID,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  networks: networks as any,
  metadata,
  features: {
    analytics: true,
    onramp: true,
    swaps: true,
    connectMethodsOrder: ["social", "email", "wallet"],
  },
  enableReconnect: true,
});
