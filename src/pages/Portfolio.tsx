import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Globe,
  Plus,
  Eye,
  EyeOff,
  DollarSign,
  Star,
  Activity,
} from "lucide-react";

import { useAccount } from "wagmi";
import { useOwnedNames, useSelectedNames } from "@/data/use-doma";
import { useHelper } from "@/hooks/use-helper";
import { TLDFilter } from "@/types/doma";
import { Link, useNavigate } from "react-router-dom";
import { DomainAvatar } from "@/components/domain/DomainAvatar";
import { formatUnits } from "viem";
import { webSocketService } from "@/services/backend/socketservice";
import InfiniteScroll from "react-infinite-scroll-component";
import { ConnectWallet } from "@/components/common/ConnectWallet";
import { RegistrarPopup } from "@/components/domain/RegistrarPopup";
import { toast } from "sonner";
import { PortfolioSEO } from "@/components/seo/PortfolioSEO";
import { useUsername } from "@/contexts/UsernameContext";
import WatchPopup from "@/components/domain/WatchPopup";

interface Activity {
  id: string;
  type: "purchase" | "sale" | "bid" | "offer";
  domain: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "cancelled";
}

const tlds: TLDFilter[] = [
  { name: "All", value: "all" },
  { name: ".com", value: "com" },
  { name: ".ai", value: "ai" },
  { name: ".io", value: "io" },
  { name: ".football", value: "football" },
];

const Portfolio = () => {
  const { address } = useAccount();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [watchName, setWatchName] = useState<string | undefined>(undefined);
  const [isRegistrarPopupOpen, setIsRegistrarPopupOpen] = useState(false);
  const { formatLargeNumber } = useHelper();
  const { profile } = useUsername();
  const navigate = useNavigate();

  const {
    data: namesData,
    isLoading: namesIsLoading,
    hasNextPage: namesHasNextPage,
    fetchNextPage: namesFetchNextPage,
  } = useOwnedNames(
    address,
    30,
    selectedCategory == "all" ? null : [selectedCategory]
  );

  const {
    data: watchNamesData,
    isLoading: watchNamesIsLoading,
    hasNextPage: watchNamesHasNextPage,
    fetchNextPage: watchNamesFetchNextPage,
  } = useSelectedNames(
    profile?.watchUsernames ?? [],
    30,
    selectedCategory == "all" ? null : [selectedCategory]
  );

  const activities: Activity[] = [];

  useEffect(() => {
    if (address) {
      webSocketService.setEventHandlers({
        id: "portfolio",
        onNotification: (notification) => {
          console.log("Portfolio notification:", notification);
          toast.success(notification.message || "Portfolio update");
        },
      });
    }
  }, [address]);

  // Show wallet connection message if no address
  if (!address) {
    return (
      <>
        <PortfolioSEO isConnected={false} />
        <ConnectWallet description="Connect your wallet to view your domain portfolio, track performance, and manage your investments." />
      </>
    );
  }

  if (namesIsLoading) {
    return (
      <>
        <PortfolioSEO
          domainsCount={0}
          totalValue={0}
          isConnected={Boolean(address)}
        />
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Portfolio Overview Skeletons */}
          <div className="max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="p-content">
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </Card>
            ))}
          </div>

          {/* Tabs Skeleton */}
          <div className="max-w-7xl w-full mx-auto space-y-4">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-content">
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                      <Skeleton className="h-8 w-8" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                    <div className="space-y-3">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="flex justify-between">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      ))}
                    </div>
                    <Skeleton className="h-4 w-32" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-8 flex-1" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PortfolioSEO
        domainsCount={namesData?.pages?.[0]?.totalCount || 0}
        totalValue={0}
        isConnected={Boolean(address)}
      />
      <div className="max-w-7xl w-full mx-auto p-content space-content">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-display font-grotesk">Portfolio</h1>
            <p className="text-muted-foreground text-body">
              Track your domain investments and performance
            </p>
          </div>
          <Button
            className="w-full sm:w-auto"
            onClick={() => setIsRegistrarPopupOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Buy Domain
          </Button>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-content">
            <div className="flex items-center justify-between mb-2">
              <span className="text-caption text-muted-foreground">
                Listing Value
              </span>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <span className="text-display font-grotesk">
                {formatLargeNumber(
                  namesData?.pages
                    ?.flatMap((p) => p.items)
                    ?.reduce((a, b) => {
                      return Number(
                        a +
                          Number(
                            formatUnits(
                              BigInt(b?.tokens?.[0]?.listings?.[0]?.price ?? 0),
                              b.tokens?.[0]?.listings?.[0]?.currency
                                ?.decimals ?? 18
                            )
                          ) *
                            (b?.tokens?.[0]?.listings?.[0]?.currency
                              ?.usdExchangeRate ?? 0)
                      );
                    }, 0)
                )}{" "}
                USD
              </span>
              <p className="text-caption text-muted-foreground flex gap-1 cursor-pointer items-center p-1">
                Hide
                <EyeOff className="w-4 h-4" />
              </p>
            </div>
          </Card>

          <Card className="p-content">
            <div className="flex items-center justify-between mb-2">
              <span className="text-caption text-muted-foreground">
                Total Domains
              </span>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <span className="text-display font-grotesk">
                {namesData?.pages?.[0]?.totalCount ?? 0}
              </span>
            </div>
          </Card>
        </div>

        {/* Domains & Activity Tabs */}
        <Tabs defaultValue="domains" className="space-y-4">
          <TabsList className="overflow-x-auto max-w-[calc(100vw-32px)] justify-start">
            <TabsTrigger value="domains">My Domains</TabsTrigger>
            <TabsTrigger value="watchlist">Watch Domains</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="domains" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {tlds.map((tld) => (
                      <SelectItem key={tld.value} value={tld.value}>
                        {tld.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <span className="text-sm text-muted-foreground">
                {namesData?.pages?.[0]?.totalCount ?? 0} domains
              </span>
            </div>

            {/* Domains Grid */}
            <InfiniteScroll
              dataLength={namesData.pages.flatMap((p) => p.items).length}
              next={namesFetchNextPage}
              hasMore={namesHasNextPage}
              loader={null}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              children={namesData?.pages
                .flatMap((p) => p.items)
                ?.map((name) => (
                  <Link to={`/names/${name.name}`} key={name.name}>
                    <Card className="relative p-section transition-normal hover:shadow-custom-lg cursor-pointer overflow-hidden border-border hover:border-primary/50 hover:bg-accent/30 bg-gradient-to-br from-background via-card to-accent/10">
                      <div className="space-y-6">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="aspect-square flex items-center justify-center">
                            <DomainAvatar
                              domain={name.name}
                              size="lg"
                              className="w-full h-full rounded-2xl shadow-custom-lg border border-border/30"
                            />
                          </div>

                          {/* Domain Name */}
                          <div className="text-center">
                            <h3 className="font-bold text-xl font-grotesk text-foreground mb-2">
                              {name.name}
                            </h3>
                            <div className="flex justify-center gap-2 mb-4">
                              <Badge
                                variant="outline"
                                className="text-xs bg-primary/5 border-primary/20"
                              >
                                {name.name.length} chars
                              </Badge>
                              {name?.tokens?.length && (
                                <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs">
                                  {name.tokens[0].chain.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Portfolio Stats */}
                        {(() => {
                          const listing = name.tokens?.[0]?.listings?.[0];
                          if (listing) {
                            return (
                              <div className="space-y-4 bg-accent/20 rounded-xl p-4 border border-border/30">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">
                                    Listed At
                                  </span>
                                  <span className="font-bold text-lg text-primary">
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
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">
                                    USD Value
                                  </span>
                                  <span className="text-sm font-medium">
                                    $
                                    {formatLargeNumber(
                                      Number(
                                        formatUnits(
                                          BigInt(listing.price),
                                          listing.currency.decimals
                                        )
                                      ) * listing.currency.usdExchangeRate
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-border/30">
                                  <span className="text-sm text-muted-foreground">
                                    Chain
                                  </span>
                                  <span className="font-semibold text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                    {name.tokens?.[0]?.chain?.name}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return (
                            <div className="space-y-4 bg-accent/20 rounded-xl p-4 border border-border/30">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                  Status
                                </span>
                                <span className="font-bold text-lg text-muted-foreground">
                                  Not Listed
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                  Expires At
                                </span>
                                <span className="text-sm font-medium">
                                  {new Date(
                                    name.expiresAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-border/30">
                                <span className="text-sm text-muted-foreground">
                                  Registrar
                                </span>
                                <span className="font-semibold text-xs bg-secondary/50 text-secondary-foreground px-2 py-1 rounded">
                                  {name.registrar.name}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </Card>
                  </Link>
                ))}
            />
          </TabsContent>

          <TabsContent value="watchlist" className="space-y-4">
            {/* Watch Domains */}
            <Card className="p-content">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div>
                  <h3 className="text-lg font-semibold font-grotesk">
                    Watch Domains
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Monitor domains you're interested in
                  </p>
                </div>
                <Button onClick={() => navigate(`/discover`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Watchlist
                </Button>
              </div>

              <InfiniteScroll
                dataLength={watchNamesData?.pages?.[0]?.totalCount ?? 0}
                next={watchNamesFetchNextPage}
                hasMore={watchNamesHasNextPage}
                loader={null}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                children={watchNamesData?.pages
                  ?.flatMap((p) => p.items)
                  ?.map((name, index) => (
                    <Card
                      key={index}
                      className="relative p-content transition-normal hover:shadow-custom-lg border-border hover:border-primary/50 hover:bg-accent/30 bg-gradient-to-br from-background via-card to-secondary/5"
                    >
                      <div className="space-y-5">
                        {/* Header with Unwatch */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <DomainAvatar
                              domain={name.name}
                              size="md"
                              className="border border-border/30"
                            />
                            <div>
                              <span className="font-bold text-lg font-grotesk text-foreground block">
                                {name.name}
                              </span>
                              <div className="flex gap-2 mt-1">
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-secondary/20 border-secondary/40"
                                >
                                  {name.name.length} chars
                                </Badge>
                                <Badge className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground text-xs">
                                  Watching
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setWatchName(name.name)}
                          >
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Price Info */}
                        <div className="space-y-3 bg-accent/20 rounded-xl p-4 border border-border/30">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              List Price
                            </span>
                            <span className="font-bold text-lg text-primary">
                              {name.tokens?.[0]?.listings?.[0]
                                ? `${formatLargeNumber(
                                    Number(
                                      formatUnits(
                                        BigInt(
                                          name.tokens[0].listings[0].price
                                        ),
                                        name.tokens[0].listings[0].currency
                                          .decimals
                                      )
                                    )
                                  )} ${
                                    name.tokens[0].listings[0].currency.symbol
                                  }`
                                : "Not Listed"}
                            </span>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-border/30">
                            <span className="text-sm text-muted-foreground">
                              Status
                            </span>
                            <Badge
                              variant="outline"
                              className={
                                name.tokens?.[0]?.listings?.[0]
                                  ? "border-green-400/50 text-green-700 bg-green-50/50"
                                  : "border-yellow-400/50 text-yellow-700 bg-yellow-50/50"
                              }
                            >
                              {name.tokens?.[0]?.listings?.[0]
                                ? "Listed"
                                : "Unlisted"}
                            </Badge>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-3">
                          <Button
                            onClick={() =>
                              navigate(
                                `/messages/${
                                  name.name
                                }?message=${"Hello, I am interested in your domain."}`
                              )
                            }
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-background/50 hover:bg-secondary/20 border-border/50"
                          >
                            Message Owner
                          </Button>
                          {name.tokens?.[0]?.listings?.[0] && (
                            <Button
                              onClick={() => navigate(`/names/${name.name}`)}
                              size="sm"
                              className="flex-1 bg-gradient-to-r from-primary to-primary/90"
                            >
                              Buy or Make Offer
                            </Button>
                          )}
                        </div>

                        {/* Watch Date */}
                        <div className="flex items-center justify-center text-xs text-muted-foreground bg-muted/20 rounded-lg p-2">
                          <Star className="h-3 w-3 mr-2" />
                          Added to watchlist
                        </div>
                      </div>
                    </Card>
                  ))}
              />
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <div className="p-content border-b">
                <h3 className="text-lg font-semibold font-grotesk">
                  Recent Activity
                </h3>
              </div>
              <div className="divide-y">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-content flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          activity.status === "completed"
                            ? "bg-green-500"
                            : activity.status === "pending"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                      />
                      <div>
                        <div className="font-medium">
                          {activity.type === "purchase"
                            ? "Purchased"
                            : activity.type === "sale"
                            ? "Sold"
                            : activity.type === "bid"
                            ? "Placed bid on"
                            : "Made offer on"}{" "}
                          {activity.domain}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(activity.date).toLocaleDateString()} •{" "}
                          {activity.amount} ETH
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={
                        activity.status === "completed"
                          ? "default"
                          : activity.status === "pending"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <RegistrarPopup
          isOpen={isRegistrarPopupOpen}
          onClose={() => setIsRegistrarPopupOpen(false)}
        />

        {watchName && (
          <WatchPopup
            isOpen={!!watchName}
            onClose={() => setWatchName(undefined)}
            domainName={watchName}
          />
        )}
      </div>
    </>
  );
};

export default Portfolio;
