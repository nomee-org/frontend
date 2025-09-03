import { DomaOrderbookSDKConfig } from "@doma-protocol/orderbook-sdk";
import { networks } from "./reown";
import axios from "axios";

export const domaQLClient = axios.create({
  baseURL: import.meta.env.VITE_DOMA_GRAPHQL_URL,
  headers: {
    "api-key": import.meta.env.VITE_DOMA_API_KEY,
  },
});

export const domaConfig: DomaOrderbookSDKConfig = {
  apiClientOptions: {
    baseUrl: import.meta.env.VITE_DOMA_URL,
    defaultHeaders: {
      "api-key": import.meta.env.VITE_DOMA_API_KEY,
    },
  },
  source: import.meta.env.VITE_APP_NAME,
  chains: networks,
};
