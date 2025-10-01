import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useGetStickerPacks,
  useGetTrendingStickers,
  useGetRecentStickers,
} from "@/data/use-backend";
import InfiniteScroll from "react-infinite-scroll-component";
import { Sparkles, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sticker } from "@/types/backend";

interface StickersPickerPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onStickerSelected: (sticker: Sticker) => void;
  embedded?: boolean;
}

export function StickersPickerPopup({
  isOpen,
  onClose,
  onStickerSelected,
  embedded = false,
}: StickersPickerPopupProps) {
  const isMobile = useIsMobile();
  const [selectedTab, setSelectedTab] = useState("recent");

  const {
    data: stickerPacks,
    fetchNextPage: stickersFetchNextPage,
    hasNextPage: stickersHasNextPage,
    isLoading: stickerPacksLoading,
    isError: stickerPacksError,
    refetch,
  } = useGetStickerPacks(20);

  const {
    data: trendingStickers,
    isLoading: trendingLoading,
    isError: trendingError,
  } = useGetTrendingStickers(20);

  const {
    data: recentStickers,
    isLoading: recentLoading,
    isError: recentError,
  } = useGetRecentStickers(20);

  const handleStickerClick = (sticker: Sticker) => {
    onStickerSelected(sticker);
    onClose();
  };

  const StickerGrid = ({
    stickers,
    loading,
    error,
    className = "",
  }: {
    stickers?: Sticker[];
    loading: boolean;
    error: boolean;
    className?: string;
  }) => {
    if (loading) {
      return (
        <div className={cn("grid grid-cols-4 gap-3 p-2", className)}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-16 rounded-xl" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Failed to load stickers
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      );
    }

    if (!stickers || stickers.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground">No stickers available</p>
        </div>
      );
    }

    return (
      <div className={cn("grid grid-cols-4 gap-3 p-2", className)}>
        {stickers.map((sticker) => (
          <Button
            key={sticker.id}
            variant="ghost"
            className="h-16 w-16 p-2 hover:bg-muted rounded-xl transition-transform hover:scale-105"
            onClick={() => handleStickerClick(sticker)}
          >
            <img
              src={sticker.url}
              alt={sticker.name}
              className="w-full h-full object-cover rounded-lg"
              loading="lazy"
            />
          </Button>
        ))}
      </div>
    );
  };

  const PackStickers = ({ pack }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-2">
            <div>
              <h4 className="font-medium text-sm">{pack.name}</h4>
              <p className="text-xs text-muted-foreground">
                {pack.stickers?.length || 0} stickers
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-xs"
          >
            {expanded ? "Show Less" : "Show All"}
          </Button>
        </div>

        <StickerGrid
          stickers={expanded ? pack.stickers : pack.stickers?.slice(0, 4)}
          loading={false}
          error={false}
        />
      </div>
    );
  };

  const content = (
    <div className="space-y-4">
      {!embedded && (
        <div className="text-center">
          <h3 className="text-lg font-semibold">Choose a Sticker</h3>
          <p className="text-sm text-muted-foreground">
            Select a sticker to send in your message
          </p>
        </div>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recent" className="text-xs">
            <Clock className="h-4 w-4 mr-1" />
            Recent
          </TabsTrigger>
          <TabsTrigger value="trending" className="text-xs">
            <Sparkles className="h-4 w-4 mr-1" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="packs" className="text-xs">
            All Packs
          </TabsTrigger>
        </TabsList>

        <div className="max-h-[400px] overflow-y-auto">
          <TabsContent value="recent" className="mt-4">
            <StickerGrid
              stickers={recentStickers}
              loading={recentLoading}
              error={recentError}
            />
          </TabsContent>

          <TabsContent value="trending" className="mt-4">
            <StickerGrid
              stickers={trendingStickers}
              loading={trendingLoading}
              error={trendingError}
            />
          </TabsContent>

          <TabsContent value="packs" className="mt-4">
            {stickerPacksLoading ? (
              <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex items-center space-x-2 px-2">
                      <Skeleton className="w-8 h-8 rounded-lg" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3 p-2">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <Skeleton key={j} className="h-16 w-16 rounded-xl" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : stickerPacksError ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Failed to load sticker packs
                </p>
                <Button variant="outline" size="sm" onClick={() => refetch}>
                  Try Again
                </Button>
              </div>
            ) : (
              <InfiniteScroll
                dataLength={
                  stickerPacks?.pages?.flatMap((p) => p.data)?.length ?? 0
                }
                next={stickersFetchNextPage}
                hasMore={stickersHasNextPage}
                loader={
                  <div className="grid grid-cols-4 gap-3 p-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-16 rounded-xl" />
                    ))}
                  </div>
                }
                className="space-y-6"
              >
                {stickerPacks?.pages
                  ?.flatMap((p) => p.data)
                  ?.map((pack) => (
                    <PackStickers key={pack.id} pack={pack} />
                  ))}
              </InfiniteScroll>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );

  if (embedded) {
    return content;
  }

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[70vh]">
          <DrawerHeader className="pb-4">
            <DrawerTitle className="sr-only">Stickers</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Stickers</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
