import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export interface WatchedName {
  id: string;
  wallet_address: string;
  domain_name: string;
  created_at: string;
  updated_at: string;
}

export const useWatchedNames = (walletAddress?: string) => {
  const [watchedNames, setWatchedNames] = useState<WatchedName[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchWatchedNames = useCallback(async () => {
    if (!walletAddress) {
      setWatchedNames([]);
      return;
    }

    setLoading(true);
    try {
      setWatchedNames([]);
    } catch (error) {
      console.error("Error in fetchWatchedNames:", error);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, toast]);

  const isWatched = useCallback(
    (domainName: string) => {
      return watchedNames.some((watched) => watched.domain_name === domainName);
    },
    [watchedNames]
  );

  const addToWatchlist = useCallback(
    async (domainName: string) => {
      if (!walletAddress) {
        toast({
          title: "Error",
          description: "Please connect your wallet to watch domains",
          variant: "destructive",
        });
        return false;
      }

      try {
        setWatchedNames((prev) => [...prev]);
        toast({
          title: "Added to watchlist",
          description: `${domainName} has been added to your watchlist`,
        });
        return true;
      } catch (error) {
        console.error("Error in addToWatchlist:", error);
        toast({
          title: "Error",
          description: "Failed to add domain to watchlist",
          variant: "destructive",
        });
        return false;
      }
    },
    [walletAddress, toast]
  );

  const removeFromWatchlist = useCallback(
    async (domainName: string) => {
      if (!walletAddress) return false;

      try {
        setWatchedNames((prev) =>
          prev.filter((watched) => watched.domain_name !== domainName)
        );
        toast({
          title: "Removed from watchlist",
          description: `${domainName} has been removed from your watchlist`,
        });
        return true;
      } catch (error) {
        console.error("Error in removeFromWatchlist:", error);
        toast({
          title: "Error",
          description: "Failed to remove domain from watchlist",
          variant: "destructive",
        });
        return false;
      }
    },
    [walletAddress, toast]
  );

  const toggleWatchlist = useCallback(
    async (domainName: string) => {
      if (isWatched(domainName)) {
        return await removeFromWatchlist(domainName);
      } else {
        return await addToWatchlist(domainName);
      }
    },
    [isWatched, addToWatchlist, removeFromWatchlist]
  );

  useEffect(() => {
    fetchWatchedNames();
  }, [fetchWatchedNames]);

  return {
    watchedNames,
    loading,
    isWatched,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    refetch: fetchWatchedNames,
  };
};
