import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useGetPostLikes,
  useFollowUser,
  useUnfollowUser,
} from "@/data/use-backend";
import { IUserBasic } from "@/types/backend";
import { useUsername } from "@/hooks/use-username";
import { Heart, Loader } from "lucide-react";
import InfiniteScroll from "react-infinite-scroll-component";

interface PostLikesModalProps {
  postId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PostLikesModal({
  postId,
  isOpen,
  onClose,
}: PostLikesModalProps) {
  const isMobile = useIsMobile();
  const { activeUsername } = useUsername();
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  const {
    data: likesData,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useGetPostLikes(postId, 20, activeUsername, isOpen);

  const allLikes = likesData?.pages.flatMap((page) => page.data || []) || [];

  const handleFollow = (username: string, isFollowing: boolean) => {
    if (isFollowing) {
      unfollowUser.mutate(username);
    } else {
      followUser.mutate(username);
    }
  };

  const content = (
    <>
      <div className="flex items-center space-x-2 mb-4">
        <Heart className="h-5 w-5 text-red-500 fill-current" />
        <span className="text-lg font-semibold">
          {likesData?.pages[0]?.pagination?.total || 0} Likes
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      ) : allLikes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No likes yet
        </div>
      ) : (
        <ScrollArea
          className={isMobile ? "h-[70vh]" : "h-[400px]"}
          id="likes-scroll"
        >
          <InfiniteScroll
            dataLength={allLikes.length}
            next={fetchNextPage}
            hasMore={hasNextPage || false}
            loader={
              <div className="flex justify-center py-4">
                <Loader className="h-6 w-6 animate-spin" />
              </div>
            }
            scrollableTarget="likes-scroll"
            className="space-y-4"
          >
            {allLikes.map(
              (like: IUserBasic & { isFollowing?: boolean }, index) => (
                <div
                  key={`${like.username}-${index}`}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={like.avatarUrl} alt={like.username} />
                      <AvatarFallback>
                        {like.firstName?.charAt(0) || like.username.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {like.firstName && like.lastName
                          ? `${like.firstName} ${like.lastName}`
                          : like.username}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{like.username}
                      </div>
                    </div>
                  </div>

                  {like.username !== activeUsername && (
                    <Button
                      variant={like.isFollowing ? "outline" : "default"}
                      size="sm"
                      onClick={() =>
                        handleFollow(like.username, like.isFollowing || false)
                      }
                      disabled={followUser.isPending || unfollowUser.isPending}
                    >
                      {followUser.isPending || unfollowUser.isPending ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : like.isFollowing ? (
                        "Unfollow"
                      ) : (
                        "Follow"
                      )}
                    </Button>
                  )}
                </div>
              )
            )}
          </InfiniteScroll>
        </ScrollArea>
      )}
    </>
  );

  if (!postId) return null;

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Post Likes</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Post Likes</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
