import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ParsedText, ParsedContent, containsHTML } from "@/lib/text-parser";
import {
  ArrowLeft,
  Loader,
  MessageSquare,
  Heart,
  Share,
  MoreHorizontal,
  Link,
  Repeat,
  ShieldCheck,
} from "lucide-react";
import { DomainAvatar } from "@/components/domain/DomainAvatar";
import { PollDisplay } from "@/components/posts/PollDisplay";
import CommentComposer from "@/components/posts/CommentComposer";
import ReplyComposer from "@/components/posts/ReplyComposer";
import { PostLikesModal } from "@/components/posts/PostLikesModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Textarea } from "@/components/ui/textarea";
import {
  useGetPost,
  useGetPostComments,
  useLikePost,
  useUnlikePost,
  useRepost,
  useRepostWithComment,
} from "@/data/use-backend";
import { toast } from "sonner";
import { IComment } from "@/types/backend";
import {
  WebSocketEventHandlers,
  webSocketService,
} from "@/services/backend/socketservice";
import { useIsMobile } from "@/hooks/use-mobile";
import InfiniteScroll from "react-infinite-scroll-component";
import moment from "moment";
import { useUsername } from "@/hooks/use-username";
import { PostSEO } from "@/components/seo/PostSEO";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PostDetails = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [activeReplies, setActiveReplies] = useState<Set<string>>(new Set());
  const [repostDialogOpen, setRepostDialogOpen] = useState(false);
  const [repostContent, setRepostContent] = useState("");
  const [likesModalOpen, setLikesModalOpen] = useState(false);
  const isMobile = useIsMobile();
  const { token, activeUsername } = useUsername();
  const {
    data: post,
    isLoading: postLoading,
    error: postError,
  } = useGetPost(postId, undefined, activeUsername);

  const {
    data: commentsData,
    isLoading: commentsIsLoading,
    hasNextPage: commentsHasNextPage,
    fetchNextPage: commentsFetchNextPage,
    isLoading: commentsLoading,
    error: commentsError,
  } = useGetPostComments(postId, 20, activeUsername);

  const likeMutation = useLikePost(activeUsername);
  const unlikeMutation = useUnlikePost(activeUsername);
  const repostMutation = useRepost(activeUsername);
  const repostWithCommentMutation = useRepostWithComment(activeUsername);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/feeds/${postId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const handleShare = (id: string) => {
    if (navigator.share) {
      navigator.share({
        title: `Post by ${post?.author?.username}`,
        text: post?.content,
        url: `${window.location.origin}/feeds/${id}`,
      });
    } else {
      handleCopyLink();
    }
  };

  useEffect(() => {
    if (postId) {
      webSocketService.joinPost(postId);

      return () => {
        webSocketService.leavePost(postId);
      };
    }
  }, [postId]);

  useEffect(() => {
    const handlers: WebSocketEventHandlers = {
      id: "post-details",
      onNewComment: (comment) => {
        if (comment.postId === postId) {
          console.log("New comment on this post:", comment);
        }
      },
      onNewLike: (like) => {
        console.log("New like:", like);
      },
      onViralPost: (post) => {
        if (post.id === postId) {
          console.log("This post went viral:", post);
        }
      },
    };

    webSocketService.setEventHandlers(handlers);

    return () => {
      webSocketService.removeEventHandlers(handlers);
    };
  }, [token, activeUsername]);

  const handleLike = async (targetId: string) => {
    try {
      await likeMutation.mutateAsync(targetId);
    } catch (error) {
      toast.error("Failed to like");
    }
  };

  const handleUnlike = async (targetId: string) => {
    try {
      await unlikeMutation.mutateAsync(targetId);
    } catch (error) {
      toast.error("Failed to unlike");
    }
  };

  const handleToggleLike = async (targetId: string, isLiked: boolean) => {
    if (isLiked) {
      await handleUnlike(targetId);
    } else {
      await handleLike(targetId);
    }
  };

  const handleReply = (targetId: string) => {
    if (targetId === postId) {
      setReplyingTo(targetId);
    } else {
      setActiveReplies((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(targetId)) {
          newSet.delete(targetId);
        } else {
          newSet.add(targetId);
        }
        return newSet;
      });
    }
  };

  const handleCancelReply = (commentId: string) => {
    setActiveReplies((prev) => {
      const newSet = new Set(prev);
      newSet.delete(commentId);
      return newSet;
    });
  };

  const handleRepost = async (withComment = false) => {
    if (withComment) {
      setRepostDialogOpen(true);
    } else {
      try {
        await repostMutation.mutateAsync(postId!);
        toast.success("Post reposted!");
      } catch (error) {
        toast.error("Failed to repost");
      }
    }
  };

  const handleRepostSubmit = async () => {
    try {
      await repostWithCommentMutation.mutateAsync({
        postId: postId!,
        comment: repostContent,
      });
      setRepostDialogOpen(false);
      setRepostContent("");
      toast.success("Post reposted with comment!");
    } catch (error) {
      toast.error("Failed to repost with comment");
    }
  };

  if (!postId) {
    return (
      <div className="flex-1 p-4 lg:p-6">
        <div className="text-center text-red-500">Invalid post ID</div>
      </div>
    );
  }

  if (postLoading) {
    return (
      <div className="flex-1 p-4 lg:p-6">
        <div className="flex justify-center items-center h-64">
          <Loader className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="flex-1 p-4 lg:p-6">
        <div className="text-center text-red-500">
          <p>Failed to load post</p>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mt-4"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const renderComments = (comments: IComment[], level: number = 0) => {
    if (level >= 2) return null;

    return (
      <InfiniteScroll
        dataLength={commentsData?.pages?.flatMap((p) => p.data)?.length ?? 0}
        next={commentsFetchNextPage}
        hasMore={commentsHasNextPage}
        loader={null}
        children={comments.map((comment) => (
          <div key={comment.id} className={`${level > 0 ? "ml-8" : ""} mt-4`}>
            <div className="border-l-2 border-border pl-4">
              <div className="bg-secondary/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <DomainAvatar domain={comment?.author?.username} size="sm" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold text-accent text-sm">
                        {comment?.author?.username}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground text-xs">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <ParsedContent
                      content={comment.content}
                      className="text-foreground leading-relaxed text-sm whitespace-pre-wrap mb-3"
                    />

                    <div className="flex items-center space-x-4">
                      {level < 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => handleReply(comment.id)}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          {activeReplies.has(comment.id) ? "Cancel" : "Reply"} (
                          {comment._count?.replies || 0})
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
                        onClick={() => handleToggleLike(comment.id, false)}
                      >
                        <Heart className="w-4 h-4 mr-1" />
                        {comment._count?.likes || 0}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reply composer for this comment */}
              {activeReplies.has(comment.id) && level < 1 && (
                <ReplyComposer
                  postId={comment.postId}
                  parentCommentId={comment.id}
                  onSubmit={(reply) => {
                    // Reply was already created by ReplyComposer
                    setActiveReplies((prev) => {
                      const newSet = new Set(prev);
                      newSet.delete(comment.id);
                      return newSet;
                    });
                  }}
                  onCancel={() => handleCancelReply(comment.id)}
                  placeholder={`Reply to @${comment.author?.username}...`}
                />
              )}

              {/* Render nested replies */}
              {comment.replies && comment.replies.length > 0 && level < 2 && (
                <div className="mt-2">
                  {renderComments(comment.replies, level + 1)}
                </div>
              )}
            </div>
          </div>
        ))}
      />
    );
  };

  return (
    <>
      <PostSEO
        postId={postId}
        title={`Post by ${post?.author?.username}`}
        content={post?.content || ""}
        authorName={post?.author?.username || ""}
        createdAt={
          typeof post?.createdAt === "string"
            ? post.createdAt
            : new Date(post?.createdAt || "").toISOString()
        }
        likesCount={post?._count?.likes || 0}
        commentsCount={post?._count?.comments || 0}
        mediaUrls={post?.mediaUrls || []}
      />
      <main
        className="max-w-7xl w-full mx-auto px-4 md:px-6 py-8 space-y-8"
        role="main"
        aria-label={`Post by ${post?.author?.username}`}
      >
        {/* Header with Back Button */}
        <div className="flex items-center space-x-4 pb-4 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg lg:text-xl font-bold font-grotesk">Post</h1>
        </div>

        {/* Main Post */}
        <div className="flex space-x-3 lg:space-x-4 items-start">
          <DomainAvatar
            domain={post?.author?.username}
            size={isMobile ? "sm" : "md"}
          />
          <div className="flex-1 space-y-2 lg:space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-accent text-base lg:text-lg">
                  {post?.author?.username}
                </span>
                {post?.author?.isVerified && (
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                )}
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground text-sm lg:text-base">
                  {moment(post.createdAt).fromNow()}
                </span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleCopyLink}>
                    <Link className="w-4 h-4 mr-2" />
                    Copy link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare(post.id)}>
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <ParsedContent
              content={post.content}
              className="text-foreground leading-relaxed text-base lg:text-lg whitespace-pre-wrap rich-text-content"
            />

            {/* Media Display */}
            {post.mediaUrls && post.mediaUrls.length > 0 && (
              <div
                className={`mt-3 ${
                  post.mediaUrls.length === 1
                    ? "max-w-lg"
                    : "grid grid-cols-2 gap-2"
                }`}
              >
                {post.mediaUrls.map((url, index) => (
                  <div
                    key={index}
                    className="relative rounded-lg overflow-hidden"
                  >
                    <img
                      src={url}
                      alt={`Media ${index + 1}`}
                      className="w-full h-auto max-h-96 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Poll Display */}
            {post.poll && (
              <div className="mt-4">
                <PollDisplay
                  poll={post.poll}
                  postId={post.id}
                  userVotes={[]}
                  canVote={true}
                />
              </div>
            )}

            <div className="flex items-center space-x-6 pt-4 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
                onClick={() => handleReply(post.id)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                {post._count.comments}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-green-600 hover:bg-green-50 transition-colors"
                  >
                    <Repeat className="w-4 h-4 mr-2" />
                    {post._count.reposts}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => handleRepost(false)}>
                    <Repeat className="w-4 h-4 mr-2" />
                    Repost
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRepost(true)}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Repost with comment
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                  onClick={() => handleToggleLike(post.id, false)}
                >
                  <Heart className="w-4 h-4 mr-2" />
                </Button>
                {post._count.likes > 0 && (
                  <button
                    className="text-sm text-muted-foreground hover:text-red-500 hover:underline transition-colors"
                    onClick={() => setLikesModalOpen(true)}
                  >
                    {post._count.likes}
                  </button>
                )}
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    onClick={() => handleShare(post.id)}
                  >
                    <Share className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share post</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Reply Composer */}
        {replyingTo && (
          <CommentComposer
            postId={postId}
            onSubmit={(comment) => {
              // Comment was already created by the CommentComposer
              setReplyingTo(null);
            }}
          />
        )}

        {/* Comments Section */}
        <div className="space-y-4">
          <h3 className="text-base lg:text-lg font-semibold text-foreground">
            Comments ({post._count.comments})
          </h3>

          {commentsLoading ? (
            <div className="flex justify-center p-8">
              <Loader className="w-6 h-6 animate-spin" />
            </div>
          ) : commentsError ? (
            <div className="text-center text-red-500 p-4">
              Failed to load comments
            </div>
          ) : commentsData?.pages?.[0]?.pagination.total === 0 ? (
            <div className="text-center text-muted-foreground p-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No comments yet</p>
              <p className="text-sm mt-2">
                Be the first to comment on this post!
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {renderComments(commentsData?.pages?.flatMap((p) => p.data)) ??
                []}
            </div>
          )}
        </div>

        {/* Repost Dialog */}
        {isMobile ? (
          <Drawer open={repostDialogOpen} onOpenChange={setRepostDialogOpen}>
            <DrawerContent className="max-h-[80vh] flex flex-col">
              <DrawerHeader className="sticky top-0 bg-background border-b">
                <DrawerTitle>Repost with Comment</DrawerTitle>
              </DrawerHeader>
              <div className="p-4 flex flex-col flex-1 overflow-hidden">
                <div className="space-y-4 flex-1 overflow-y-auto">
                  <div className="p-3 border rounded-lg bg-muted/50">
                    <div className="flex items-center space-x-2 mb-2">
                      <DomainAvatar domain={post?.author?.username} size="xs" />
                      <span className="text-sm font-medium">
                        {post?.author?.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {moment(post.createdAt).fromNow()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {post.content.replace(/<[^>]*>/g, "")}
                    </p>
                  </div>
                  <Textarea
                    placeholder="Add a comment..."
                    value={repostContent}
                    onChange={(e) => setRepostContent(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                <div className="flex gap-2 pt-4 sticky bottom-0 bg-background border-t">
                  <Button
                    variant="outline"
                    onClick={() => setRepostDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleRepostSubmit} className="flex-1">
                    Repost
                  </Button>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Dialog open={repostDialogOpen} onOpenChange={setRepostDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Repost with Comment</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col overflow-hidden">
                <div className="space-y-4 flex-1 overflow-y-auto">
                  <div className="p-3 border rounded-lg bg-muted/50">
                    <div className="flex items-center space-x-2 mb-2">
                      <DomainAvatar domain={post?.author?.username} size="xs" />
                      <span className="text-sm font-medium">
                        {post?.author?.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {moment(post.createdAt).fromNow()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {post.content.replace(/<[^>]*>/g, "")}
                    </p>
                  </div>
                  <Textarea
                    placeholder="Add a comment..."
                    value={repostContent}
                    onChange={(e) => setRepostContent(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                <div className="flex gap-2 pt-4 sticky bottom-0 bg-background border-t">
                  <Button
                    variant="outline"
                    onClick={() => setRepostDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleRepostSubmit} className="flex-1">
                    Repost
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Post Likes Modal */}
        <PostLikesModal
          postId={postId!}
          isOpen={likesModalOpen}
          onClose={() => setLikesModalOpen(false)}
        />
      </main>
    </>
  );
};

export default PostDetails;
