import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Hash, TrendingUp, Users, Eye } from "lucide-react";
import {
  useGetHashtagPosts,
  useLikePost,
  useUnlikePost,
  useRepost,
  useCreateComment,
} from "@/data/use-backend";
import { useUsername } from "@/hooks/use-username";
import CommunityPost from "@/components/posts/CommunityPost";
import InfiniteScroll from "react-infinite-scroll-component";
import { toast } from "sonner";
import { HashtagSEO } from "@/components/seo/HashtagSEO";
import { QueryLoader, QueryListLoader } from "@/components/ui/query-loader";
import { QueryError } from "@/components/ui/query-error";

const Hashtag = () => {
  const { hashtag } = useParams();
  const navigate = useNavigate();
  const { activeUsername } = useUsername();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const {
    data: postsData,
    isLoading,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useGetHashtagPosts(hashtag || "", 20, activeUsername);

  const likeMutation = useLikePost();
  const unlikeMutation = useUnlikePost();
  const createCommentMutation = useCreateComment();

  const posts = postsData?.pages?.flatMap((p) => p.data) || [];
  const totalPosts = posts.length;

  // Get hashtag stats from first post's hashtag data if available
  const hashtagData = posts[0]?.hashtags?.find(
    (h) => h.hashtag.tag === hashtag
  )?.hashtag;

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

  const handleReply = (postId: string) => {
    setReplyingTo(postId);
  };

  const handleComment = async (postId: string, content: string) => {
    try {
      await createCommentMutation.mutateAsync({
        postId,
        content,
        parentId: undefined,
      });
      toast.success("Comment added!");
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const handleShare = (postId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/feeds/${postId}`);
    toast.success("Link copied to clipboard!");
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <QueryError
          error={error}
          onRetry={refetch}
          message="Failed to load hashtag posts"
        />
      </div>
    );
  }

  if (isLoading) {
    return <QueryLoader />;
  }

  if (!hashtag) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-muted-foreground">
            Invalid hashtag
          </h1>
          <p className="text-muted-foreground">
            The hashtag parameter is missing.
          </p>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <HashtagSEO
        hashtag={hashtag}
        postsCount={totalPosts}
        usageCount={hashtagData?.usageCount || totalPosts}
      />
      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Hash className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold font-grotesk text-foreground">
                  #{hashtag}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {hashtagData?.usageCount
                    ? `${hashtagData.usageCount.toLocaleString()} posts`
                    : totalPosts > 0
                    ? `${totalPosts.toLocaleString()} posts loaded`
                    : "No posts yet"}
                </p>
              </div>
            </div>
          </div>

          <Link to={`/search?q=${encodeURIComponent(`#${hashtag}`)}`}>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <TrendingUp className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">View in Search</span>
              <span className="sm:hidden">Search</span>
            </Button>
          </Link>
        </div>

        {/* Stats Card */}
        {hashtagData && (
          <Card className="p-4 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-xl sm:text-2xl font-bold text-primary">
                  {hashtagData.usageCount.toLocaleString()}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Total Posts
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xl sm:text-2xl font-bold text-primary">
                  {totalPosts.toLocaleString()}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Loaded
                </div>
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <div className="text-xl sm:text-2xl font-bold text-primary flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                  Trending
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Popular Now
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Posts Section */}
        {posts.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center">
            <div className="space-y-4">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Hash className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-semibold">
                  No posts yet
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                  Be the first to create a post with #{hashtag}! Start a
                  conversation and let others discover this hashtag.
                </p>
              </div>
              <Button onClick={() => navigate("/")} variant="outline">
                Create Post
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-0">
            <InfiniteScroll
              dataLength={posts.length}
              next={fetchNextPage}
              hasMore={hasNextPage}
              loader={
                <div className="flex justify-center p-4">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm">Loading more posts...</span>
                  </div>
                </div>
              }
              endMessage={
                posts.length > 5 && (
                  <div className="text-center p-6 text-muted-foreground">
                    <p className="text-sm">
                      You've seen all posts for #{hashtag}
                    </p>
                  </div>
                )
              }
              className="space-y-0"
            >
              {posts.map((post) => (
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
                  onReply={() => handleReply(post.id)}
                  onClick={() => navigate(`/feeds/${post.id}`)}
                  currentUser={activeUsername}
                  poll={post.poll}
                />
              ))}
            </InfiniteScroll>
          </div>
        )}
      </main>
    </>
  );
};

export default Hashtag;
