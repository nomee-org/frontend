/* eslint-disable no-constant-binary-expression */
/* eslint-disable no-constant-condition */
import { formatUnits } from "viem";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BuyOrMakeOfferPopup } from "@/components/domain/BuyOrMakeOfferPopup";
import { Search, Filter, Eye, EyeOff, Loader } from "lucide-react";
import { useNames } from "@/data/use-doma";
import { Switch } from "@/components/ui/switch";
import { useHelper } from "@/hooks/use-helper";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccount } from "wagmi";
import WatchPopup from "@/components/domain/WatchPopup";
import { DomainAvatar } from "@/components/domain/DomainAvatar";
import { TLDFilter, Token } from "@/types/doma";
import { toast } from "sonner";
import { webSocketService } from "@/services/backend/socketservice";
import InfiniteScroll from "react-infinite-scroll-component";
import { DomainSearchSEO } from "@/components/seo/DomainSearchSEO";
import { useUsername } from "@/contexts/UsernameContext";
const popularSuggestions = [
  "crypto",
  "defi",
  "web3",
  "nft",
  "blockchain",
  "dao",
  "token",
  "swap",
];

const tlds: TLDFilter[] = [
  { name: "All", value: "all" },
  { name: ".com", value: "com" },
  { name: ".ai", value: "ai" },
  { name: ".io", value: "io" },
  { name: ".football", value: "football" },
];

const DomainSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedToken, setSelectedToken] = useState<Token | undefined>(
    undefined
  );
  const [listed, setListed] = useState(true);
  const [showWatchPopup, setShowWatchPopup] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const { formatLargeNumber } = useHelper();
  const { address } = useAccount();
  const { profile } = useUsername();

  const isWatched = (domainName: string) => {
    return profile?.watchUsernames?.includes(domainName);
  };

  const {
    data: namesData,
    isLoading: namesIsLoading,
    hasNextPage: namesHasNextPage,
    fetchNextPage: namesFetchNextPage,
  } = useNames(
    50,
    listed,
    searchQuery,
    [selectedCategory].filter((c) => c !== "all")
  );

  useEffect(() => {
    webSocketService.setEventHandlers({
      id: "domain-search",
      onPopularPostUpdate: (data) => {
        console.log("Domain popularity update:", data);
      },
      onHashtagTrending: (data) => {
        console.log("Trending hashtag:", data);
      },
    });
  });

  const handleSearchFocus = () => {
    setShowSuggestions(true);
  };

  const handleSearchBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };

  const handleOfferClick = (domainName: string, token: Token) => {
    setSelectedToken(token);
    setSelectedDomain(domainName);
  };

  const handleWatch = (domainName: string) => {
    if (!address) {
      return toast("Connect your wallet");
    }
    setSelectedDomain(domainName);
    setShowWatchPopup(true);
  };

  return (
    <>
      <DomainSearchSEO
        searchQuery={searchQuery}
        category={selectedCategory}
        sortBy={sortBy}
        listedOnly={listed}
        domainsCount={namesData?.pages?.[0]?.totalCount || 0}
      />
      {/* Search and Filters */}
      <div className="max-w-7xl w-full mx-auto p-content space-content">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for domains... (e.g., crypto, defi, web3)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            className="pl-12 h-12 text-base bg-background border-border focus:ring-2 focus:ring-primary/50"
          />

          {/* Suggestions Dropdown */}
          {showSuggestions && searchQuery === "" && (
            <div className="absolute top-full left-0 right-0 bg-card border border-border shadow-lg z-10 mt-2">
              <div className="p-compact">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  Popular searches
                </p>
                <div className="flex flex-wrap gap-2">
                  {popularSuggestions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-sm hover:bg-accent transition-colors"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-24 h-9 flex-shrink-0">
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

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-28 h-9 flex-shrink-0">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Popularity</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="change">24h Change</SelectItem>
                <SelectItem value="length">Length</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="px-2 h-9 flex-shrink-0"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">More Filters</span>
            </Button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 justify-start sm:justify-end w-full sm:w-auto">
            <Switch
              checked={listed}
              onCheckedChange={() => setListed(!listed)}
            />
            <div className="text-caption sm:text-body text-muted-foreground">
              Listed Only
            </div>
          </div>
        </div>

        {namesIsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <Card key={index} className="p-content">
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-4 rounded-full" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 flex-1" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <InfiniteScroll
          dataLength={namesData?.pages?.flatMap((p) => p.items)?.length ?? 0}
          next={namesFetchNextPage}
          hasMore={namesHasNextPage}
          loader={null}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          children={namesData?.pages
            ?.flatMap((p) => p.items)
            ?.map((name) => {
              const hasListings = name.tokens?.some(
                (token) => token.listings?.length > 0
              );
              return (
                <Link to={`/names/${name.name}`} key={name.name}>
                  <Card
                    className={`relative p-content transition-normal hover:shadow-custom-lg cursor-pointer overflow-hidden ${
                      hasListings
                        ? "border-border hover:border-primary/50 hover:bg-accent/30"
                        : "border-border/60 hover:border-border bg-background/90 hover:bg-accent/20"
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <DomainAvatar domain={name.name} size="sm" />
                          <span
                            className={`font-bold text-lg font-grotesk ${
                              hasListings
                                ? "text-foreground"
                                : "text-foreground/80"
                            }`}
                          >
                            {name.name}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-grey-400 hover:text-primary"
                          onClick={(e) => {
                            e.preventDefault();
                            handleWatch(name.name);
                          }}
                        >
                          {isWatched(name.name) ? (
                            <EyeOff className="h-4 w-4 text-primary" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">
                          {name.name.length} chars
                        </Badge>
                        {name.tokens?.[0] && (
                          <Badge className="bg-grey-800 text-white text-xs">
                            {name.tokens?.[0].chain.name}
                          </Badge>
                        )}
                      </div>

                      {/* Price Section */}
                      <div className="space-y-2">
                        {hasListings ? (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-bold font-grotesk text-foreground">
                                {(() => {
                                  const listing =
                                    name.tokens?.[0]?.listings?.[0];
                                  if (!listing) return "0 ETH";
                                  return `${formatLargeNumber(
                                    Number(
                                      formatUnits(
                                        BigInt(listing.price),
                                        listing.currency.decimals
                                      )
                                    )
                                  )} ${listing.currency.symbol}`;
                                })()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              $
                              {(() => {
                                const listing = name.tokens?.[0]?.listings?.[0];
                                if (!listing) return "0";
                                return formatLargeNumber(
                                  Number(
                                    formatUnits(
                                      BigInt(listing.price),
                                      listing.currency.decimals
                                    )
                                  ) * listing.currency.usdExchangeRate
                                );
                              })()}{" "}
                              USD
                            </p>
                          </>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-medium text-foreground/70">
                              Available for Offers
                            </span>
                            <Badge
                              variant="outline"
                              className="text-xs border-yellow-400/50 text-yellow-700 bg-yellow-50"
                            >
                              Unlisted
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        {hasListings ? (
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={(e) => {
                              e.preventDefault();
                              handleOfferClick(name.name, name.tokens?.[0]);
                            }}
                          >
                            Buy or Make Offer
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            className="flex-1 text-foreground/70 hover:bg-accent/30"
                            onClick={(e) => {
                              e.preventDefault();
                              handleWatch(name.name);
                            }}
                          >
                            {isWatched(name.name) ? "Unwatch" : "Watch"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
        />

        {(namesData?.pages?.flatMap((p) => p.items)?.length ?? 0) === 0 && (
          <Card className="p-section text-center">
            <div className="w-16 h-16 bg-secondary flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No domains found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters to find more domains
            </p>
          </Card>
        )}
      </div>

      {/* Watch Popup */}
      {showWatchPopup && selectedDomain && (
        <WatchPopup
          isOpen={showWatchPopup}
          onClose={() => setShowWatchPopup(false)}
          domainName={selectedDomain}
        />
      )}

      {/* Offer Popup */}
      {selectedToken && (
        <BuyOrMakeOfferPopup
          isOpen={Boolean(selectedToken)}
          token={selectedToken}
          domainName={selectedDomain}
          onClose={() => setSelectedToken(undefined)}
        />
      )}
    </>
  );
};

export default DomainSearch;
