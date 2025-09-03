import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, User, Loader, TrendingUp } from "lucide-react";
import CommunityPost from "@/components/posts/CommunityPost";
import { useNames } from "@/data/use-doma";
import { useSearchPosts, useLikePost, useUnlikePost } from "@/data/use-backend";
import { IPost } from "@/types/backend";
import { toast } from "sonner";
import { webSocketService } from "@/services/backend/socketservice";
import InfiniteScroll from "react-infinite-scroll-component";
import { DomainAvatar } from "@/components/domain/DomainAvatar";
import { useHelper } from "@/hooks/use-helper";
import { useUsername } from "@/contexts/UsernameContext";
import { SearchSEO } from "@/components/seo/SearchSEO";
import { QueryLoader, QueryListLoader } from "@/components/ui/query-loader";
import { QueryError } from "@/components/ui/query-error";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"users" | "posts">("users");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const { parseCAIP10 } = useHelper();

  const { activeUsername } = useUsername();

  const likeMutation = useLikePost(activeUsername);
  const unlikeMutation = useUnlikePost(activeUsername);

  const {
    data: usersData,
    isLoading: usersLoading,
    fetchNextPage: usersFetchNextPage,
    hasNextPage: usersHasNextPage,
    error: usersError,
    refetch: refetchUsers,
  } = useNames(
    20,
    false,
    activeTab === "users" ? searchQuery?.replace("#", "") : "",
    []
  );

  const {
    data: postsData,
    isLoading: postsLoading,
    fetchNextPage: postsFetchNextPage,
    hasNextPage: postsHasNextPage,
    error: postsError,
    refetch: refetchPosts,
  } = useSearchPosts(
    activeTab === "posts" ? searchQuery : "",
    20,
    activeUsername
  );

  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      setSearchParams({ q: query });
    } else {
      setSearchParams({});
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as "users" | "posts");
  };

  const handleLike = async (postId: string) => {
    try {
      await likeMutation.mutateAsync(postId);
    } catch (error) {
      toast.error("Failed to like post");
    }
  };

  const handleUnlike = async (postId: string) => {
    try {
      await unlikeMutation.mutateAsync(postId);
    } catch (error) {
      toast.error("Failed to unlike post");
    }
  };

  const handleShare = (postId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/feeds/${postId}`);
    toast.success("Link copied to clipboard!");
  };

  useEffect(() => {
    webSocketService.setEventHandlers({
      id: "search",
      onNewFollower: (follower) => {
        // Update user follower counts
        console.log("New follower:", follower);
      },
      onFollowingStatusUpdate: (update) => {
        // Update following status
        console.log("Following update:", update);
      },
      onNewPost: (post) => {
        // Add new posts to search results
        console.log("New post:", post);
      },
      onHashtagTrending: (data) => {
        // Update trending hashtags
        console.log("Trending hashtag:", data);
      },
    });
  }, []);

  return (
    <>
      <SearchSEO
        searchQuery={searchQuery}
        activeTab={activeTab}
        usersCount={usersData?.pages?.[0]?.totalCount || 0}
        postsCount={postsData?.pages?.[0]?.pagination.total || 0}
      />
      <div className="container mx-auto p-content max-w-4xl">
        {/* Search Header */}
        <div className="mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users and posts..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Search Results */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <div className="space-y-4">
              {!searchQuery && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Discover Users
                  </h2>
                </div>
              )}

              {usersError ? (
                <QueryError
                  error={usersError}
                  onRetry={refetchUsers}
                  message="Failed to load users"
                />
              ) : usersLoading ? (
                <QueryListLoader />
              ) : usersData?.pages?.[0]?.totalCount === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <p>
                    {searchQuery
                      ? "No users found matching your search"
                      : "No users available"}
                  </p>
                </div>
              ) : (
                <InfiniteScroll
                  dataLength={
                    usersData?.pages?.flatMap((p) => p.items)?.length ?? 0
                  }
                  next={usersFetchNextPage}
                  hasMore={usersHasNextPage}
                  loader={null}
                  className="grid gap-4"
                  children={usersData?.pages
                    ?.flatMap((p) => p.items)
                    ?.map((user) => (
                      <Card
                        key={user.name}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => navigate(`/names/${user.name}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            <DomainAvatar domain={user.name} size="sm" />
                            <div className="flex-1">
                              <h3 className="font-semibold">{user.name}</h3>
                              <p className="text-sm text-muted-foreground truncate max-w-60">
                                {parseCAIP10(user.claimedBy).address}
                              </p>
                            </div>
                            {user.tokens?.some(
                              (token) => token.listings?.length > 0
                            ) && <Badge variant="secondary">Listed</Badge>}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="posts" className="mt-6">
            <div className="space-y-4">
              {!searchQuery && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Trending Posts
                  </h2>
                </div>
              )}

              {postsError ? (
                <QueryError
                  error={postsError}
                  onRetry={refetchPosts}
                  message="Failed to load posts"
                />
              ) : postsLoading ? (
                <QueryListLoader />
              ) : postsData?.pages?.[0]?.pagination.total === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <p>
                    {searchQuery
                      ? "No posts found matching your search"
                      : "No trending posts available"}
                  </p>
                </div>
              ) : (
                <InfiniteScroll
                  dataLength={
                    postsData?.pages?.flatMap((p) => p.data)?.length ?? 0
                  }
                  next={postsFetchNextPage}
                  hasMore={postsHasNextPage}
                  loader={null}
                  className="space-y-4"
                  children={postsData?.pages
                    ?.flatMap((p) => p.data)
                    ?.filter((post: IPost) => {
                      // Filter out posts with invalid dates
                      const date = new Date(post.createdAt);
                      return !isNaN(date.getTime());
                    })
                    ?.map((post: IPost) => {
                      // Safely convert date with fallback
                      let timestamp: string;
                      try {
                        const date = new Date(post.createdAt);
                        timestamp = isNaN(date.getTime())
                          ? new Date().toISOString()
                          : date.toISOString();
                      } catch (error) {
                        timestamp = new Date().toISOString();
                      }

                      return (
                        <CommunityPost
                          key={post.id}
                          id={post.id}
                          author={{
                            domainName: post?.author?.username,
                          }}
                          content={post.content}
                          timestamp={timestamp}
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
                          onReply={() => {}}
                          onClick={() => navigate(`/feeds/${post.id}`)}
                        />
                      );
                    })}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default Search;
