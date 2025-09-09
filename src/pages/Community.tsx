// React imports
import { useState, useEffect } from "react";

// Third-party imports
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import InfiniteScroll from "react-infinite-scroll-component";

// UI component imports
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icon imports
import { TrendingUp, Loader, User, Search, Sparkles } from "lucide-react";

// Local component imports
import CommunityPost from "@/components/posts/CommunityPost";
import PostComposer, {
  PendingMediaFile,
} from "@/components/posts/PostComposer";
import { MobilePostComposer } from "@/components/posts/MobilePostComposer";
import { FloatingActionButton } from "@/components/layout/FloatingActionButton";
import { DomainAvatar } from "@/components/domain/DomainAvatar";
import { InterestsPopup } from "@/components/common/InterestsPopup";
import { SponsoredAd } from "@/components/common/SponsoredAd";
import { FeedSEO } from "@/components/seo/FeedSEO";

// Hook imports
import { useUsername } from "@/hooks/use-username";
import { useIsMobile } from "@/hooks/use-mobile";

// Service/data imports
import {
  useGetTimeline,
  useGetTrendingPosts,
  useCreatePost,
  useGetTrendingHashtags,
} from "@/data/use-backend";
import { useNames } from "@/data/use-doma";
import {
  webSocketService,
  WebSocketEventHandlers,
} from "@/services/backend/socketservice";

// Type imports
import { CreatePollDto } from "@/types/backend";

export interface MediaFile {
  id: string;
  url: string;
  type: "image" | "video";
  name: string;
}

const Community = () => {
  // Navigation and routing
  const navigate = useNavigate();

  // User and authentication
  const { token, activeUsername } = useUsername();
  const isMobile = useIsMobile();

  // Local component states
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"timeline" | "trending">(
    "timeline"
  );
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [showMobileComposer, setShowMobileComposer] = useState(false);
  const [interestsPopupOpen, setInterestsPopupOpen] = useState(false);

  // Data mutations
  const createPostMutation = useCreatePost();

  // Data fetching queries
  const {
    data: timelineData,
    isLoading: timelineLoading,
    hasNextPage: timelineHasNextPage,
    fetchNextPage: timelineFetchNextPage,
  } = useGetTimeline(20, activeUsername, activeUsername);

  const {
    data: trendingData,
    isLoading: trendingLoading,
    hasNextPage: trendingHasNextPage,
    fetchNextPage: trendingFetchNextPage,
  } = useGetTrendingPosts(20, activeUsername);

  const { data: namesSuggestions, isLoading: namesLoading } = useNames(
    searchQuery ? 5 : 10,
    false,
    searchQuery,
    []
  );

  const { data: trendingHashtags } = useGetTrendingHashtags(10, undefined);

  const handlePostSubmit = async (
    content: string,
    mediaFiles: PendingMediaFile[] = [],
    poll?: CreatePollDto
  ) => {
    try {
      const { postId } = await createPostMutation.mutateAsync({
        createPostDto: { content, poll },
        mediaFiles: mediaFiles.map((pf) => pf.file),
      });

      if (replyingTo) {
        setReplyingTo(null);
      }

      webSocketService.joinPost(postId);
    } catch (error) {
      toast.error("Failed to create post");
    }
  };

  const handleReply = (postId: string) => {
    setReplyingTo(postId);
  };

  const handleShare = (postId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/feeds/${postId}`);
    toast.success("Link copied to clipboard!");
  };

  useEffect(() => {
    const handlers: WebSocketEventHandlers = {
      id: "community",
      onPostCreationProgress: (progress) => {
        toast.success(progress.message, { id: progress.postId });
      },
      onPostCreationComplete: (post) => {
        toast.success("Post created successfully!", { id: post.id });
        webSocketService.leavePost(post.id);
      },
      onPostCreationError: (error) => {
        toast.success(error.error, { id: error.postId });
        webSocketService.leavePost(error.postId);
      },
    };

    webSocketService.setEventHandlers(handlers);

    return () => {
      webSocketService.removeEventHandlers(handlers);
    };
  }, [token, activeUsername]);

  const totalPosts =
    activeTab === "timeline"
      ? timelineData?.pages?.flatMap((p) => p.data)?.length ?? 0
      : trendingData?.pages?.flatMap((p) => p.data)?.length ?? 0;

  return (
    <>
      <FeedSEO
        feedType={activeTab}
        activeUsername={activeUsername}
        postsCount={totalPosts}
      />
      <main className="max-w-7xl mx-auto flex flex-col lg:flex-row h-full">
        {/* Main Content */}
        <section
          className="flex-1 p-4 lg:p-6 space-y-4 lg:space-y-6 order-2 lg:order-1"
          role="main"
          aria-label="Community posts feed"
        >
          {activeUsername && !isMobile && !replyingTo && (
            <PostComposer onSubmit={handlePostSubmit} />
          )}

          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "timeline" | "trending")
            }
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="space-y-4 mt-4">
              {timelineLoading ? (
                <div className="flex justify-center p-8">
                  <Loader className="w-6 h-6 animate-spin" />
                </div>
              ) : (timelineData?.pages?.[0]?.pagination?.total ?? 0) === 0 ? (
                <div className="text-center p-8 text-muted-foreground space-y-4">
                  <p>No posts in your timeline yet.</p>
                  <p className="text-sm">
                    Follow some users to see their posts here!
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setInterestsPopupOpen(true)}
                    className="mt-4"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Customize Your Feed
                  </Button>
                </div>
              ) : (
                <InfiniteScroll
                  dataLength={
                    timelineData?.pages?.flatMap((p) => p.data).length ?? 0
                  }
                  next={timelineFetchNextPage}
                  hasMore={timelineHasNextPage}
                  loader={null}
                  className="space-y-0"
                  children={
                    <div className="space-y-0">
                      {timelineData?.pages
                        ?.flatMap((p) => p.data)
                        ?.map((post) => {
                          return (
                            <CommunityPost
                              key={post.id}
                              id={post.id}
                              author={{
                                domainName: post?.author?.username,
                                isVerified: post?.author?.isVerified,
                              }}
                              content={post.content}
                              timestamp={new Date(post.createdAt).toISOString()}
                              likes={post._count.likes}
                              commentsCount={post._count.comments}
                              comments={post.comments ?? []}
                              isLiked={(post?.likes?.length ?? 0) > 0}
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
                              onReply={() => handleReply(post.id)}
                              onClick={() => navigate(`/feeds/${post.id}`)}
                              currentUser={activeUsername}
                              poll={post.poll}
                            />
                          );
                        })}

                      {timelineData?.pages
                        ?.flatMap((p) => p.ads)
                        ?.map((ad) => {
                          return <SponsoredAd ad={ad} key={ad.id} />;
                        })}
                    </div>
                  }
                />
              )}
            </TabsContent>

            <TabsContent value="trending" className="space-y-4 mt-4">
              {trendingLoading ? (
                <div className="flex justify-center p-8">
                  <Loader className="w-6 h-6 animate-spin" />
                </div>
              ) : trendingData?.pages?.flatMap((p) => p.data).length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <p>No trending posts available.</p>
                  <p className="text-sm mt-2">
                    Check back later for trending content!
                  </p>
                </div>
              ) : (
                <InfiniteScroll
                  dataLength={
                    trendingData?.pages?.flatMap((p) => p.data).length ?? 0
                  }
                  next={trendingFetchNextPage}
                  hasMore={trendingHasNextPage}
                  loader={null}
                  className="space-y-0"
                  children={
                    <div className="space-y-0">
                      {trendingData?.pages
                        ?.flatMap((p) => p.data)
                        ?.map((post) => {
                          return (
                            <CommunityPost
                              key={post.id}
                              id={post.id}
                              author={{
                                domainName: post?.author?.username,
                                isVerified: post?.author?.isVerified,
                              }}
                              content={post.content}
                              timestamp={new Date(post.createdAt).toISOString()}
                              likes={post._count.likes}
                              commentsCount={post._count.comments}
                              comments={post.comments ?? []}
                              isLiked={(post?.likes?.length ?? 0) > 0}
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
                              onReply={() => handleReply(post.id)}
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
          </Tabs>
        </section>

        {/* Right Sidebar */}
        <aside
          className="w-full lg:w-80 p-content space-content border-b lg:border-b-0 lg:border-l border-border order-1 lg:order-2"
          role="complementary"
          aria-label="Search and trending topics"
        >
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowUserSuggestions(true);
              }}
              onFocus={() => setShowUserSuggestions(true)}
              className="pl-12 h-12 text-base bg-background border-border focus:ring-2 focus:ring-primary/50"
            />

            <Sparkles
              className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground"
              onClick={() => setInterestsPopupOpen(true)}
            />

            {/* User Suggestions Dropdown */}
            {showUserSuggestions &&
              (namesSuggestions?.pages.flatMap((p) => p.items)?.length > 0 ||
                searchQuery) && (
                <Card className="absolute top-full mt-1 w-full z-50 max-h-60 md:max-h-80 overflow-y-auto">
                  <CardContent className="p-compact">
                    {namesLoading ? (
                      <div className="flex justify-center p-3 md:p-4">
                        <Loader className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                      </div>
                    ) : namesSuggestions?.pages.flatMap((p) => p.items)
                        ?.length > 0 ? (
                      <>
                        <div className="space-y-0.5 md:space-y-1">
                          {namesSuggestions?.pages
                            .flatMap((p) => p.items)
                            .map((name) => (
                              <div
                                key={name.name}
                                className="flex items-center space-x-2 md:space-x-3 p-1.5 md:p-2 hover:bg-secondary rounded cursor-pointer"
                                onClick={() => {
                                  navigate(`/names/${name.name}`);
                                  setShowUserSuggestions(false);
                                  setSearchQuery("");
                                }}
                              >
                                <DomainAvatar domain={name.name} size="xs" />
                                <span className="font-medium text-sm truncate">
                                  {name.name}
                                </span>
                              </div>
                            ))}
                        </div>

                        <div className="mt-1 md:mt-2 pt-1 md:pt-2 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs md:text-sm h-7 md:h-8"
                            onClick={() => {
                              navigate(
                                `/search?q=${encodeURIComponent(searchQuery)}`
                              );
                              setShowUserSuggestions(false);
                            }}
                          >
                            View more results
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="p-compact text-center text-muted-foreground text-caption">
                        {searchQuery
                          ? "No users found"
                          : "Search for users and posts..."}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
          </div>

          {/* Trending Hashtags */}
          <Card className="lg:sticky lg:top-[80px]">
            <CardHeader className="p-card">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-accent" />
                <h3 className="text-subheading">Trending</h3>
              </div>
            </CardHeader>
            <CardContent className="space-items">
              {trendingHashtags?.length === 0 ? (
                <p className="text-caption text-muted-foreground">
                  No trending hashtags yet
                </p>
              ) : (
                trendingHashtags?.map((hashtag, index) => (
                  <div
                    key={hashtag.id}
                    className="flex items-center justify-between p-compact hover:bg-secondary/50 rounded-lg cursor-pointer transition-normal group"
                    onClick={() => navigate(`/hashtag/${hashtag.tag}`)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-accent group-hover:text-accent/80 text-body truncate">
                        #{hashtag.tag}
                      </p>
                      <p className="text-caption text-muted-foreground">
                        {hashtag.usageCount.toLocaleString()} posts
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-caption font-semibold ml-2"
                    >
                      #{index + 1}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </aside>
      </main>

      {/* Click outside to close suggestions */}
      {showUserSuggestions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserSuggestions(false)}
        />
      )}

      {/* Mobile Post Composer */}
      {isMobile && (
        <MobilePostComposer
          isOpen={showMobileComposer}
          onClose={() => setShowMobileComposer(false)}
          onSubmit={handlePostSubmit}
        />
      )}

      {/* Floating Action Button */}
      <FloatingActionButton
        onClick={() => setShowMobileComposer(true)}
        show={activeUsername && isMobile}
      />

      {/* Interests Popup */}
      <InterestsPopup
        open={interestsPopupOpen}
        onOpenChange={setInterestsPopupOpen}
      />
    </>
  );
};

export default Community;
