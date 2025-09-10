/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { useName, useNameStats, useOffers } from "@/data/use-doma";
import { Token } from "@/types/doma";
import { useHelper } from "@/hooks/use-helper";
import { DomainAvatar } from "@/components/domain/DomainAvatar";
import {
  ArrowLeft,
  Eye,
  Share,
  MessageSquare,
  User,
  Shield,
  Activity,
  DollarSign,
  CheckCircle,
  XCircle,
  X,
  Plus,
  Loader,
  ShieldCheck,
  EyeOff,
} from "lucide-react";
import { QueryLoader, QueryListLoader } from "@/components/ui/query-loader";
import { QueryError, QueryErrorCard } from "@/components/ui/query-error";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import moment from "moment";
import { toast } from "sonner";
import { formatUnits } from "viem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CancelListingPopup } from "@/components/domain/CancelListingPopup";
import { ListDomainPopup } from "@/components/domain/ListDomainPopup";
import { OfferPopup } from "@/components/domain/OfferPopup";
import InfiniteScroll from "react-infinite-scroll-component";
import {
  useFollowUser,
  useGetFollowers,
  useGetFollowing,
  useGetPosts,
  useGetUserByUsername,
  useUnfollowUser,
} from "@/data/use-backend";
import CommunityPost from "@/components/posts/CommunityPost";
import { useUsername } from "@/hooks/use-username";
import { DomainSEO } from "@/components/seo/DomainSEO";
import { UserVerificationPopup } from "@/components/domain/UserVerificationPopup";
import { VerifiedBadge } from "@/components/common/VerifiedBadge";
import { AcceptRejectOfferPopup } from "@/components/domain/AcceptRejectOfferPopup";
import { CancelOfferPopup } from "@/components/domain/CancelOfferPopup";
import WatchPopup from "@/components/domain/WatchPopup";

const DomainDetails = () => {
  const { domainName } = useParams();
  const navigate = useNavigate();
  const [selectedToken, setSelectedToken] = useState<Token | undefined>(
    undefined
  );
  const [showOfferPopup, setShowOfferPopup] = useState(false);
  const [showWatchPopup, setShowWatchPopup] = useState(false);
  const [showCancelListingPopup, setShowCancelListingPopup] = useState(false);
  const [showListDomainPopup, setShowListDomainPopup] = useState(false);
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const [showAcceptRejectPopup, setShowAcceptRejectPopup] = useState(false);
  const [showCancelOfferPopup, setShowCancelOfferPopup] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [offerAction, setOfferAction] = useState<"accept" | "reject" | null>(
    null
  );
  const { parseCAIP10, formatLargeNumber, trimAddress } = useHelper();
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<
    "domain" | "posts" | "followers" | "following"
  >("domain");
  const {
    data: nameData,
    isLoading,
    error: nameError,
    refetch: refetchName,
  } = useName(domainName);

  const { data: nameStatsData } = useNameStats(nameData?.tokens?.[0]?.tokenId);

  const {
    data: offersData,
    hasNextPage: offersHasNextPage,
    fetchNextPage: offersFetchNextPage,
    error: offersError,
    refetch: refetchOffers,
  } = useOffers(20, nameData?.tokens?.[0]?.tokenId);

  const { activeUsername, profile } = useUsername();
  const isOwner = domainName === activeUsername;

  const {
    data: postsData,
    isLoading: postsLoading,
    hasNextPage: postsHasNextPage,
    fetchNextPage: postsFetchNextPage,
    error: postsError,
    refetch: refetchPosts,
  } = useGetPosts(20, activeTab === "posts" ? domainName : undefined);

  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
    refetch: refetchUser,
  } = useGetUserByUsername(domainName);

  const {
    data: followersData,
    isLoading: followersLoading,
    hasNextPage: followersHasNextPage,
    fetchNextPage: followersFetchNextPage,
    error: followersError,
    refetch: refetchFollowers,
  } = useGetFollowers(
    activeTab === "followers" ? domainName : undefined,
    50,
    activeUsername
  );

  const {
    data: followingData,
    isLoading: followingLoading,
    hasNextPage: followingHasNextPage,
    fetchNextPage: followingFetchNextPage,
    error: followingError,
    refetch: refetchFollowing,
  } = useGetFollowing(
    activeTab === "following" ? domainName : undefined,
    50,
    activeUsername
  );

  const followUser = useFollowUser(activeUsername);
  const unfollowUser = useUnfollowUser(activeUsername);

  useEffect(() => {
    setActiveTab("domain");
  }, [domainName]);

  const handleOffer = (token: Token) => {
    setSelectedToken(token);
    setShowOfferPopup(true);
  };

  const handleListing = (token: Token) => {
    setSelectedToken(token);
    setShowListDomainPopup(true);
  };

  const handleCancelListing = (token: Token) => {
    setSelectedToken(token);
    setShowCancelListingPopup(true);
  };

  const handleWatch = () => {
    if (!address) {
      return toast("Connect your wallet");
    }
    setShowWatchPopup(true);
  };

  if (nameError) {
    return (
      <div className="max-w-7xl mx-auto p-content space-content">
        <QueryError
          error={nameError}
          onRetry={refetchName}
          message="Failed to load domain details"
        />
      </div>
    );
  }

  if (isLoading) {
    return <QueryLoader />;
  }

  if (!nameData) {
    return (
      <div className="max-w-7xl mx-auto p-content space-content min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-muted-foreground">
            Domain not found
          </h1>
          <p className="mt-2 text-muted-foreground">
            The requested domain could not be found.
          </p>
          <Button onClick={() => navigate("/discover")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>
        </div>
      </div>
    );
  }

  const activeListings =
    nameData.tokens?.flatMap((token) => token.listings) || [];

  const hasActiveListings = activeListings.length > 0;
  const currentListing = activeListings[0];
  const currentPrice = currentListing
    ? formatLargeNumber(
        Number(
          formatUnits(
            BigInt(currentListing.price),
            currentListing.currency.decimals
          )
        )
      )
    : undefined;
  const currency = currentListing?.currency?.symbol;

  return (
    <>
      <DomainSEO
        domain={nameData}
        isListed={hasActiveListings}
        currentPrice={currentPrice}
        currency={currency}
        postsCount={userData?._count?.posts}
        followersCount={userData?._count?.followers}
      />
      <main className="max-w-7xl mx-auto p-content space-content">
        <div className="relative overflow-hidden">
          <div className="relative z-1">
            <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <DomainAvatar
                    domain={nameData.name}
                    size="sm"
                    className="w-10 h-10 sm:w-12 sm:h-12 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-grotesk truncate">
                        {nameData.name}
                      </h1>
                      {userData?.isVerified && (
                        <ShieldCheck className="w-4 h-4 md:w-6 md:h-6 text-blue-500" />
                      )}
                      {nameData.isFractionalized && (
                        <Badge
                          variant="secondary"
                          className="hidden sm:inline-flex text-xs"
                        >
                          Frac.
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="flex items-center space-x-1">
                          <span className="text-sm font-semibold text-foreground">
                            {userData?._count?.following}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            followers
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-sm font-semibold text-foreground">
                            {userData?._count?.followers}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            following
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        {nameData.transferLock ? (
                          <Shield className="h-3 w-3 text-yellow-500" />
                        ) : (
                          <Shield className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {nameData.transferLock
                            ? "Non Transferable"
                            : "Transferable"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
                {!isOwner && userData && (
                  <Button
                    variant={
                      (userData as any).isFollowing ? "outline" : "default"
                    }
                    size="sm"
                    onClick={() => {
                      if ((userData as any).isFollowing) {
                        unfollowUser.mutate(domainName);
                      } else {
                        followUser.mutate(domainName);
                      }
                    }}
                    disabled={followUser.isPending || unfollowUser.isPending}
                    className="px-2 md:px-3"
                  >
                    {followUser.isPending || unfollowUser.isPending ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (userData as any).isFollowing ? (
                      "Unfollow"
                    ) : (
                      "Follow"
                    )}
                  </Button>
                )}
                {isOwner ? (
                  <>
                    {!profile?.isVerified && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowVerificationPopup(true)}
                        className="px-2 md:px-3"
                      >
                        <Shield className="h-4 w-4" />
                        <span className="hidden md:inline ml-2">
                          Get Verified
                        </span>
                      </Button>
                    )}
                    {hasActiveListings ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          handleCancelListing(nameData.tokens?.[0]);
                        }}
                        title="Cancel Listing"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleListing(nameData.tokens?.[0]);
                        }}
                        title="List Domain"
                        className="px-2 md:px-3"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="hidden md:inline ml-2">
                          List Domain
                        </span>
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    {!profile?.watchUsernames?.includes(domainName) ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleWatch}
                        title="Add to Watchlist"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleWatch}
                      >
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: `${domainName} domain`,
                            text: `Check out this domain: ${domainName}`,
                            url: window.location.href,
                          });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          toast.success("Link copied to clipboard");
                        }
                      }}
                    >
                      <Share className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share domain</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(
                value as "domain" | "posts" | "followers" | "following"
              )
            }
          >
            <TabsList className="grid w-full grid-cols-4 mt-5">
              <TabsTrigger value="domain" className="text-xs sm:text-sm">
                Domain
              </TabsTrigger>
              <TabsTrigger value="posts" className="text-xs sm:text-sm">
                Posts
              </TabsTrigger>
              <TabsTrigger value="followers" className="text-xs sm:text-sm">
                Followers
              </TabsTrigger>
              <TabsTrigger value="following" className="text-xs sm:text-sm">
                Following
              </TabsTrigger>
            </TabsList>

            <TabsContent value="domain">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                <div className="lg:col-span-2 space-y-6">
                  {/* Price & Actions */}
                  {hasActiveListings && (
                    <Card className="p-3 sm:p-4 md:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <div>
                          {activeListings.map((listing) => (
                            <div key={listing.id}>
                              <div className="text-2xl sm:text-3xl font-bold font-grotesk">
                                {formatLargeNumber(
                                  Number(
                                    formatUnits(
                                      BigInt(listing.price),
                                      listing.currency.decimals
                                    )
                                  )
                                )}{" "}
                                {listing.currency.symbol}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                ~$
                                {formatLargeNumber(
                                  Number(
                                    formatUnits(
                                      BigInt(listing.price),
                                      listing.currency.decimals
                                    )
                                  ) * listing.currency.usdExchangeRate
                                )}
                              </div>
                              <div className="text-xs sm:text-sm text-muted-foreground">
                                {listing.orderbook} • Expires{" "}
                                {moment(listing.expiresAt).fromNow()}
                              </div>
                            </div>
                          ))}
                        </div>

                        {!isOwner ? (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 md:space-x-3">
                            <Link
                              to={`/messages/${domainName}`}
                              className="w-full sm:w-auto"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                title="Message Owner"
                                className="w-full px-3 py-2"
                              >
                                <MessageSquare className="h-4 w-4" />
                                <span className="ml-2 sm:hidden md:inline">
                                  Message Owner
                                </span>
                                <span className="ml-2 hidden sm:inline md:hidden">
                                  Message
                                </span>
                              </Button>
                            </Link>
                            <Button
                              onClick={() => {
                                handleOffer(nameData.tokens?.[0]);
                              }}
                              variant="outline"
                              size="sm"
                              title="Buy or Make Offer"
                              className="w-full sm:w-auto px-3 py-2"
                            >
                              <Activity className="h-4 w-4" />
                              <span className="ml-2 sm:hidden md:inline">
                                Buy or Make Offer
                              </span>
                              <span className="ml-2 hidden sm:inline md:hidden">
                                Offer
                              </span>
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => {
                              handleCancelListing(nameData.tokens?.[0]);
                            }}
                            variant="destructive"
                            size="sm"
                            title="Cancel Listing"
                            className="w-full sm:w-auto px-3 py-2"
                          >
                            <X className="h-4 w-4" />
                            <span className="ml-2 sm:hidden md:inline">
                              Cancel Listing
                            </span>
                            <span className="ml-2 hidden sm:inline md:hidden">
                              Cancel
                            </span>
                          </Button>
                        )}
                      </div>
                    </Card>
                  )}

                  {/* Domain Information */}
                  <Card className="p-3 sm:p-4 md:p-6">
                    <h3 className="text-lg sm:text-xl font-bold font-grotesk mb-4">
                      Domain Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-muted-foreground text-sm">
                          Domain Name
                        </span>
                        <span className="font-medium text-sm truncate max-w-32 sm:max-w-none">
                          {nameData.name}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-muted-foreground text-sm">
                          Owner
                        </span>
                        <span className="font-medium text-sm">
                          {trimAddress(parseCAIP10(nameData.claimedBy).address)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-muted-foreground text-sm">
                          Expires At
                        </span>
                        <span className="font-medium text-sm">
                          {moment(nameData.expiresAt).fromNow()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-muted-foreground text-sm">
                          Tokenized At
                        </span>
                        <span className="font-medium text-sm">
                          {moment(nameData.tokenizedAt).fromNow()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-muted-foreground text-sm">
                          Transfer Lock
                        </span>
                        <div className="flex items-center space-x-2">
                          {nameData.transferLock ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-medium text-sm">
                            {nameData.transferLock ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground text-sm">
                          Fractionalized
                        </span>
                        <div className="flex items-center space-x-2">
                          {nameData.isFractionalized ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-medium text-sm">
                            {nameData.isFractionalized ? "Yes" : "No"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Tokens */}
                  {nameData.tokens && nameData.tokens.length > 0 && (
                    <Card className="p-3 md:p-6">
                      <h3 className="text-xl font-bold font-grotesk mb-4">
                        Tokens
                      </h3>
                      <div className="space-y-4">
                        {nameData.tokens.map((token) => (
                          <div
                            key={`${token.networkId}-${token.tokenId}`}
                            className="border border-border rounded-lg p-3 md:p-4"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">
                                  Network
                                </span>
                                <span className="font-medium">
                                  {token.chain.name}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">
                                  Token ID
                                </span>
                                <a
                                  href={token.explorerUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-primary hover:underline max-w-32 truncate"
                                  title={token.tokenId}
                                >
                                  {token.tokenId}
                                </a>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">
                                  Owner
                                </span>
                                <span className="font-medium">
                                  {trimAddress(
                                    parseCAIP10(token.ownerAddress).address
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">
                                  Created
                                </span>
                                <span className="font-medium">
                                  {moment(token.createdAt).fromNow()}
                                </span>
                              </div>
                            </div>
                            {token.listings && token.listings.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-border">
                                <h4 className="font-semibold mb-2">
                                  Active Listings
                                </h4>
                                <div className="space-y-2">
                                  {token.listings.map((listing) => (
                                    <div
                                      key={listing.id}
                                      className="flex justify-between items-center text-sm"
                                    >
                                      <span>
                                        Orderbook: {listing.orderbook}
                                      </span>
                                      <span className="font-medium">
                                        {formatLargeNumber(
                                          Number(
                                            formatUnits(
                                              BigInt(listing.price),
                                              listing.currency.decimals
                                            )
                                          )
                                        )}{" "}
                                        {listing.currency.symbol}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Offers & Activity Tabs */}
                  {((offersData?.pages?.flatMap((p) => p.items)?.length ?? 0) >
                    0 ||
                    (nameData.activities &&
                      nameData.activities.length > 0)) && (
                    <Card className="p-content">
                      <Tabs defaultValue="offers" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="offers">Offers</TabsTrigger>
                          <TabsTrigger value="activity">
                            Recent Activity
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="offers" className="mt-6">
                          {offersData?.pages?.[0]?.totalCount > 0 ? (
                            <InfiniteScroll
                              dataLength={
                                offersData?.pages?.flatMap((p) => p.items)
                                  ?.length ?? 0
                              }
                              next={offersFetchNextPage}
                              hasMore={offersHasNextPage}
                              loader={null}
                              className="max-h-80"
                              children={
                                <div className="space-y-3">
                                  {offersData?.pages
                                    ?.flatMap((p) => p.items)
                                    ?.map((offer, index) => (
                                      <div
                                        key={offer.externalId}
                                        className="p-3 rounded-lg border border-border"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                              <DollarSign className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                              <div className="font-medium flex items-center gap-2">
                                                {formatLargeNumber(
                                                  Number(offer.price) /
                                                    Math.pow(
                                                      10,
                                                      offer.currency.decimals
                                                    )
                                                )}{" "}
                                                {offer.currency.symbol}
                                              </div>
                                              <div className="text-sm text-muted-foreground">
                                                by{" "}
                                                {trimAddress(
                                                  parseCAIP10(
                                                    offer.offererAddress
                                                  ).address
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-xs text-muted-foreground mb-1">
                                              {offer.orderbook}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                              {moment(
                                                offer.createdAt
                                              ).fromNow()}
                                            </div>
                                            {offer.expiresAt && (
                                              <div className="text-xs text-muted-foreground">
                                                Expires:{" "}
                                                {moment(
                                                  offer.expiresAt
                                                ).fromNow()}
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {isOwner && (
                                          <div className="mt-3 pt-3 border-t border-border flex gap-2">
                                            <Button
                                              variant="default"
                                              size="sm"
                                              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                              onClick={() => {
                                                setSelectedOffer(offer);
                                                setOfferAction("accept");
                                                setShowAcceptRejectPopup(true);
                                              }}
                                            >
                                              Accept
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                                              onClick={() => {
                                                setSelectedOffer(offer);
                                                setOfferAction("reject");
                                                setShowAcceptRejectPopup(true);
                                              }}
                                            >
                                              Reject
                                            </Button>
                                          </div>
                                        )}

                                        {parseCAIP10(offer.offererAddress)
                                          .address === address && (
                                          <div className="mt-3 pt-3 border-t border-border flex gap-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                                              onClick={() => {
                                                setSelectedOffer(offer);
                                                setShowCancelOfferPopup(true);
                                              }}
                                            >
                                              Cancel
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                </div>
                              }
                            />
                          ) : (
                            <div className="text-center text-muted-foreground py-8">
                              No offers found for this domain.
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="activity" className="mt-6">
                          {nameData.activities &&
                          nameData.activities.length > 0 ? (
                            <ScrollArea className="max-h-80">
                              <div className="space-y-3">
                                {nameData.activities.map((activity, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                        <Activity className="h-4 w-4 text-primary" />
                                      </div>
                                      <div>
                                        <div className="font-medium">
                                          {activity.type}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {activity.sld}.{activity.tld}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm text-muted-foreground">
                                        {moment(activity.createdAt).fromNow()}
                                      </div>
                                      {activity.txHash && (
                                        <div className="text-xs text-muted-foreground">
                                          {trimAddress(activity.txHash)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          ) : (
                            <div className="text-center text-muted-foreground py-8">
                              No recent activity found for this domain.
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </Card>
                  )}
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {/* Registrar Info */}
                  {nameData.registrar && (
                    <Card className="p-content">
                      <h3 className="text-lg font-bold font-grotesk mb-4">
                        Registrar
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name</span>
                          <span className="font-medium">
                            {nameData.registrar.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IANA ID</span>
                          <span className="font-medium">
                            {nameData.registrar.ianaId}
                          </span>
                        </div>
                        {nameData.registrar.websiteUrl && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Website
                            </span>
                            <a
                              href={nameData.registrar.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              Visit
                            </a>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}

                  {/* Owner Info */}
                  {!isOwner && (
                    <Card className="p-content">
                      <h3 className="text-lg font-bold font-grotesk mb-4">
                        Owner
                      </h3>
                      <div className="flex items-center space-x-3 mb-4">
                        <Avatar className="h-12 w-12">
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <User className="h-6 w-6 text-muted-foreground" />
                          </div>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {trimAddress(
                              parseCAIP10(nameData.claimedBy).address
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Domain Owner
                          </div>
                        </div>
                      </div>
                      <Link to={`/messages/${domainName}`}>
                        <Button className="w-full" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send Message
                        </Button>
                      </Link>
                    </Card>
                  )}

                  {/* Name Servers */}
                  {nameData.nameservers && nameData.nameservers.length > 0 && (
                    <Card className="p-content">
                      <h3 className="text-lg font-bold font-grotesk mb-4">
                        Name Servers
                      </h3>
                      <div className="space-y-2">
                        {nameData.nameservers.map((ns, index) => (
                          <div
                            key={index}
                            className="text-sm font-mono bg-muted p-2 rounded"
                          >
                            {ns.ldhName}
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Highest Offer */}
                  {nameStatsData?.highestOffer && (
                    <Card className="p-content">
                      <h3 className="text-lg font-bold font-grotesk mb-4">
                        Highest Offer
                      </h3>
                      {(() => {
                        const handleAcceptOffer = () => {
                          setSelectedOffer(nameStatsData.highestOffer);
                          setOfferAction("accept");
                          setShowAcceptRejectPopup(true);
                        };

                        const handleRejectOffer = () => {
                          setSelectedOffer(nameStatsData.highestOffer);
                          setOfferAction("reject");
                          setShowAcceptRejectPopup(true);
                        };

                        return (
                          <div className="p-4 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                                  <DollarSign className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <div className="text-2xl font-bold text-primary">
                                    {formatLargeNumber(
                                      Number(
                                        formatUnits(
                                          BigInt(
                                            nameStatsData.highestOffer.price
                                          ),
                                          nameStatsData.highestOffer.currency
                                            .decimals
                                        )
                                      )
                                    )}{" "}
                                    <span className="text-lg">
                                      {
                                        nameStatsData.highestOffer.currency
                                          .symbol
                                      }
                                    </span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Current highest offer
                                  </div>
                                </div>
                              </div>
                              <Badge
                                variant="secondary"
                                className="bg-primary/10 text-primary border-primary/20"
                              >
                                Top Offer
                              </Badge>
                            </div>

                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Offered by:
                                </span>
                                <span className="font-medium">
                                  {trimAddress(
                                    parseCAIP10(
                                      nameStatsData.highestOffer.offererAddress
                                    ).address
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Orderbook:
                                </span>
                                <span className="font-medium">
                                  {nameStatsData.highestOffer.orderbook}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Made:
                                </span>
                                <span className="font-medium">
                                  {moment(
                                    nameStatsData.highestOffer.createdAt
                                  ).fromNow()}
                                </span>
                              </div>
                              {nameStatsData.highestOffer.expiresAt && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Expires:
                                  </span>
                                  <span className="font-medium text-orange-600">
                                    {moment(
                                      nameStatsData.highestOffer.expiresAt
                                    ).fromNow()}
                                  </span>
                                </div>
                              )}
                            </div>

                            {isOwner && (
                              <div className="mt-4 pt-3 border-t border-primary/20 flex gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                  onClick={handleAcceptOffer}
                                >
                                  Accept Offer
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                                  onClick={handleRejectOffer}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="posts">
              {postsError ? (
                <QueryError
                  error={postsError}
                  onRetry={refetchPosts}
                  message="Failed to load posts"
                />
              ) : postsLoading ? (
                <QueryListLoader />
              ) : postsData?.pages?.flatMap((p) => p.data).length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <p>No posts posts available.</p>
                  <p className="text-sm mt-2">
                    Check back later for posts content!
                  </p>
                </div>
              ) : (
                <InfiniteScroll
                  dataLength={
                    postsData?.pages?.flatMap((p) => p.data).length ?? 0
                  }
                  next={postsFetchNextPage}
                  hasMore={postsHasNextPage}
                  loader={null}
                  className="space-y-0"
                  children={
                    <div className="space-y-0">
                      {postsData?.pages
                        ?.flatMap((p) => p.data)
                        ?.map((post) => {
                          return (
                            <CommunityPost
                              key={post.id}
                              id={post.id}
                              author={{
                                domainName: post?.author?.username,
                              }}
                              content={post.content}
                              timestamp={new Date(post.createdAt).toISOString()}
                              likes={post._count.likes}
                              commentsCount={post._count.comments}
                              comments={post.comments ?? []}
                              isLiked={false}
                              media={
                                post.mediaUrls?.map((url, i) => ({
                                  id: `${post.id}-${i}`,
                                  url,
                                  type:
                                    url.includes(".mp4") || url.includes(".mov")
                                      ? "video"
                                      : "image",
                                  name: `media-${i}`,
                                })) || []
                              }
                              onClick={() => navigate(`/feeds/${post.id}`)}
                              currentUser={activeUsername}
                              poll={post.poll}
                            />
                          );
                        })}
                    </div>
                  }
                />
              )}
            </TabsContent>

            <TabsContent value="followers">
              {followersError ? (
                <QueryError
                  error={followersError}
                  onRetry={refetchFollowers}
                  message="Failed to load followers"
                />
              ) : followersData?.pages?.flatMap((p) => p.data).length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <p>No followers yet.</p>
                </div>
              ) : (
                <InfiniteScroll
                  dataLength={
                    followersData?.pages?.flatMap((p) => p.data).length ?? 0
                  }
                  next={followersFetchNextPage}
                  hasMore={followersHasNextPage}
                  loader={
                    <div className="flex justify-center p-4">
                      <Loader className="w-5 h-5 animate-spin" />
                    </div>
                  }
                  className="space-y-0"
                >
                  <div className="space-y-2">
                    {followersData?.pages
                      ?.flatMap((p) => p.data)
                      ?.map((follower) => (
                        <div
                          key={follower.id}
                          className="flex items-center justify-between p-4 border border-border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <DomainAvatar
                              domain={follower.username}
                              size="sm"
                            />
                            <div>
                              <div className="font-medium flex items-center gap-1">
                                {follower.username}
                                <VerifiedBadge
                                  isVerified={(follower as any).isVerified}
                                />
                              </div>
                              {follower.displayName && (
                                <div className="text-sm text-muted-foreground">
                                  {follower.displayName}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {activeUsername !== follower.username && (
                              <Button
                                variant={
                                  (follower as any).isFollowing
                                    ? "outline"
                                    : "default"
                                }
                                size="sm"
                                onClick={() => {
                                  if ((follower as any).isFollowing) {
                                    unfollowUser.mutate(follower.username);
                                  } else {
                                    followUser.mutate(follower.username);
                                  }
                                }}
                                disabled={
                                  followUser.isPending || unfollowUser.isPending
                                }
                              >
                                {(follower as any).isFollowing
                                  ? "Unfollow"
                                  : "Follow"}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(`/names/${follower.username}`)
                              }
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </InfiniteScroll>
              )}
            </TabsContent>

            <TabsContent value="following">
              {followingError ? (
                <QueryError
                  error={followingError}
                  onRetry={refetchFollowing}
                  message="Failed to load following"
                />
              ) : followingData?.pages?.flatMap((p) => p.data).length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <p>Not following anyone yet.</p>
                </div>
              ) : (
                <InfiniteScroll
                  dataLength={
                    followingData?.pages?.flatMap((p) => p.data).length ?? 0
                  }
                  next={followingFetchNextPage}
                  hasMore={followingHasNextPage}
                  loader={
                    <div className="flex justify-center p-4">
                      <Loader className="w-5 h-5 animate-spin" />
                    </div>
                  }
                  className="space-y-0"
                >
                  <div className="space-y-2">
                    {followingData?.pages
                      ?.flatMap((p) => p.data)
                      ?.map((following) => (
                        <div
                          key={following.id}
                          className="flex items-center justify-between p-4 border border-border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <DomainAvatar
                              domain={following.username}
                              size="sm"
                            />
                            <div>
                              <div className="font-medium flex items-center gap-1">
                                {following.username}
                                <VerifiedBadge
                                  isVerified={(following as any).isVerified}
                                />
                              </div>
                              {following.displayName && (
                                <div className="text-sm text-muted-foreground">
                                  {following.displayName}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {activeUsername !== following.username && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  unfollowUser.mutate(following.username)
                                }
                                disabled={unfollowUser.isPending}
                              >
                                Unfollow
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(`/names/${following.username}`)
                              }
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </InfiniteScroll>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Offer Popup */}
        {showOfferPopup && nameData.tokens.length > 0 && selectedToken && (
          <OfferPopup
            isOpen={showOfferPopup}
            token={selectedToken}
            domainName={nameData?.name}
            onClose={() => {
              setShowOfferPopup(false);
              refetchName();
              refetchOffers();
            }}
          />
        )}

        {/* User Selection Popup */}
        {nameData && showWatchPopup && (
          <WatchPopup
            isOpen={showWatchPopup}
            domainName={nameData?.name}
            onClose={() => setShowWatchPopup(false)}
          />
        )}

        {showCancelListingPopup && selectedToken && (
          <CancelListingPopup
            isOpen={showCancelListingPopup}
            token={selectedToken}
            domainName={nameData?.name}
            onClose={() => {
              setShowCancelListingPopup(false);
              refetchName();
              refetchOffers();
            }}
          />
        )}

        {showListDomainPopup && selectedToken && (
          <ListDomainPopup
            isOpen={showListDomainPopup}
            token={selectedToken}
            domainName={nameData.name}
            onClose={() => {
              setShowListDomainPopup(false);
              refetchName();
              refetchOffers();
            }}
          />
        )}

        <UserVerificationPopup
          isOpen={showVerificationPopup}
          onClose={() => setShowVerificationPopup(false)}
          isVerified={false} // TODO: Add actual verification status from user data
        />

        {/* Accept/Reject Offer Popup */}
        <AcceptRejectOfferPopup
          isOpen={showAcceptRejectPopup}
          onClose={() => {
            setShowAcceptRejectPopup(false);
            setSelectedOffer(null);
            setOfferAction(null);
            refetchName();
            refetchOffers();
          }}
          offer={selectedOffer}
          action={offerAction}
          domainName={nameData?.name}
          token={nameData?.tokens?.[0]}
        />

        {/* Cancel Offer Popup */}
        <CancelOfferPopup
          isOpen={showCancelOfferPopup}
          onClose={() => {
            setShowCancelOfferPopup(false);
            setSelectedOffer(null);
            refetchName();
            refetchOffers();
          }}
          offer={selectedOffer}
          domainName={nameData?.name}
          token={nameData?.tokens?.[0]}
        />
      </main>
    </>
  );
};

export default DomainDetails;
