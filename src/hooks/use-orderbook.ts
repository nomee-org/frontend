import { domaConfig } from "@/configs/doma";
import { AcceptOfferHandler } from "@/seaport-helpers/accept-offer";
import { BuyListingHandler } from "@/seaport-helpers/buy-listing";
import { CancelListingHandler } from "@/seaport-helpers/cancel-listing";
import { CancelOfferHandler } from "@/seaport-helpers/cancel-offer";
import { ListingHandler } from "@/seaport-helpers/create-listing";
import { CreateOfferHandler } from "@/seaport-helpers/create-offer";
import {
  AcceptOfferParams,
  AcceptOfferResult,
  ApiClient,
  BuyListingParams,
  Caip2ChainId,
  CancelListingParams,
  CancelOfferParams,
  CreateListingParams,
  CreateListingResult,
  CreateOfferParams,
  CreateOfferResult,
  CurrencyToken,
  GetOrderbookFeeRequest,
  GetSupportedCurrenciesRequest,
  OnProgressCallback,
  RequestOptions,
} from "@doma-protocol/orderbook-sdk";
import { JsonRpcSigner } from "ethers";

export const useOrderbook = () => {
  const apiClient: ApiClient = new ApiClient(domaConfig.apiClientOptions);

  const createOffer = async ({
    params,
    signer,
    chainId,
    onProgress,
    hasWethOffer,
    currencies,
  }: {
    params: CreateOfferParams;
    signer: JsonRpcSigner;
    chainId: Caip2ChainId;
    onProgress: OnProgressCallback;
    hasWethOffer: boolean;
    currencies: CurrencyToken[];
  }): Promise<CreateOfferResult> => {
    const handler = new CreateOfferHandler(
      domaConfig,
      apiClient,
      signer,
      chainId,
      onProgress,
      {
        seaportBalanceAndApprovalChecksOnOrderCreation: !hasWethOffer,
      },
      currencies
    );

    return handler.execute(params);
  };

  const acceptOffer = async ({
    params,
    signer,
    chainId,
    onProgress,
  }: {
    params: AcceptOfferParams;
    signer: JsonRpcSigner;
    chainId: Caip2ChainId;
    onProgress: OnProgressCallback;
  }): Promise<AcceptOfferResult> => {
    const handler = new AcceptOfferHandler(
      domaConfig,
      apiClient,
      signer,
      chainId,
      onProgress
    );

    return handler.execute(params);
  };

  const cancelOffer = async ({
    params,
    signer,
    chainId,
    onProgress,
  }: {
    params: CancelOfferParams;
    signer: JsonRpcSigner;
    chainId: Caip2ChainId;
    onProgress: OnProgressCallback;
  }): Promise<AcceptOfferResult> => {
    const handler = new CancelOfferHandler(
      domaConfig,
      apiClient,
      signer,
      chainId,
      onProgress
    );

    return handler.execute(params);
  };

  const buyListing = async ({
    params,
    signer,
    chainId,
    onProgress,
  }: {
    params: BuyListingParams;
    signer: JsonRpcSigner;
    chainId: Caip2ChainId;
    onProgress: OnProgressCallback;
  }): Promise<AcceptOfferResult> => {
    const handler = new BuyListingHandler(
      domaConfig,
      apiClient,
      signer,
      chainId,
      onProgress
    );

    return handler.execute(params);
  };

  const cancelListing = async ({
    params,
    signer,
    chainId,
    onProgress,
  }: {
    params: CancelListingParams;
    signer: JsonRpcSigner;
    chainId: Caip2ChainId;
    onProgress: OnProgressCallback;
  }): Promise<AcceptOfferResult> => {
    const handler = new CancelListingHandler(
      domaConfig,
      apiClient,
      signer,
      chainId,
      onProgress
    );

    return handler.execute(params);
  };

  const createListing = async ({
    params,
    signer,
    chainId,
    onProgress,
  }: {
    params: CreateListingParams;
    signer: JsonRpcSigner;
    chainId: Caip2ChainId;
    onProgress: OnProgressCallback;
  }): Promise<CreateListingResult> => {
    const handler = new ListingHandler(
      domaConfig,
      apiClient,
      signer,
      chainId,
      onProgress
    );

    return handler.execute(params);
  };

  const getSupportedCurrencies = (
    params: GetSupportedCurrenciesRequest,
    options?: RequestOptions
  ) => {
    return apiClient.getSupportedCurrencies(params, options);
  };

  const getOrderbookFee = (
    params: GetOrderbookFeeRequest,
    options?: RequestOptions
  ) => {
    return apiClient.getOrderbookFee(params, options);
  };

  return {
    acceptOffer,
    createOffer,
    createListing,
    cancelOffer,
    buyListing,
    cancelListing,
    getSupportedCurrencies,
    getOrderbookFee,
  };
};
