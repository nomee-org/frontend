import { Button } from "@/components/ui/button";
import { DomainAvatar } from "@/components/domain/DomainAvatar";
import { PollDisplay } from "@/components/posts/PollDisplay";
import { ParsedContent } from "@/lib/text-parser";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  Heart,
  MessageCircle,
  Share,
  MoreHorizontal,
  Trash2,
  Link,
  Repeat,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { IComment, IPoll, IPollVote, IRepostedFrom } from "@/types/backend";
import moment from "moment";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { PostLikesModal } from "@/components/posts/PostLikesModal";
import CommentComposer from "@/components/posts/CommentComposer";
import {
  useLikePost,
  useUnlikePost,
  useRepost,
  useRepostWithComment,
  useDeletePost,
} from "@/data/use-backend";
import { useUsername } from "@/hooks/use-username";

export interface MediaFile {
  id: string;
  url: string;
  type: "image" | "video";
  name: string;
}

interface PostAuthor {
  domainName: string;
  avatar?: string;
  isVerified?: boolean;
}

interface PostProps {
  id: string;
  author: PostAuthor;
  content: string;
  timestamp: string;
  likes: number;
  commentsCount: number;
  repostCount: number;
  comments: IComment[];
  isLiked: boolean;
  repostedFrom?: IRepostedFrom;
  media?: MediaFile[];
  poll?: IPoll;
  userPollVotes?: IPollVote[];
  onReply?: (postId: string) => void;
  onClick?: () => void;
  currentUser?: string;
}

const CommunityPost = ({
  id,
  author,
  content,
  timestamp,
  likes,
  commentsCount,
  repostCount,
  comments,
  isLiked,
  repostedFrom,
  media = [],
  poll,
  userPollVotes = [],
  onReply,
  onClick,
  currentUser,
}: PostProps) => {
  const [repostDialogOpen, setRepostDialogOpen] = useState(false);
  const [repostContent, setRepostContent] = useState("");
  const [likesModalOpen, setLikesModalOpen] = useState(false);
  const [showCommentComposer, setShowCommentComposer] = useState(false);
  const isMobile = useIsMobile();
  const { activeUsername } = useUsername();

  const likePost = useLikePost(activeUsername);
  const unlikePost = useUnlikePost(activeUsername);
  const repostPost = useRepost(activeUsername);
  const repostWithComment = useRepostWithComment(activeUsername);
  const deletePost = useDeletePost(activeUsername);

  const isOwnPost = currentUser === author.domainName;

  const [reactiveIsLiked, setReactiveIsLiked] = useState(isLiked);
  const [reactiveLikes, setReactiveLikes] = useState(likes);
  const [reactiveRepostCount, setReactiveRepostCount] = useState(repostCount);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/feeds/${id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Post by ${author.domainName}`,
        text: content,
        url: `${window.location.origin}/feeds/${id}`,
      });
    } else {
      handleCopyLink();
    }
  };

  const handleRepost = async () => {
    try {
      await repostPost.mutateAsync(id);
      setReactiveRepostCount((prev) => prev + 1);
      toast.success("Post reposted!");
    } catch (error) {
      console.error("Failed to repost:", error);
      toast.error("Failed to repost");
    }
  };

  const handleRepostWithComment = async () => {
    if (!repostContent.trim()) {
      toast.error("Please add a comment");
      return;
    }

    try {
      await repostWithComment.mutateAsync({
        postId: id,
        comment: repostContent.trim(),
      });

      setRepostDialogOpen(false);
      setRepostContent("");
      setReactiveRepostCount((prev) => prev + 1);
      toast.success("Post reposted with comment!");
    } catch (error) {
      console.error("Failed to repost with comment:", error);
      toast.error("Failed to repost with comment");
    }
  };

  const RepostDialog = () => {
    const dialogContent = (
      <>
        <div className="space-y-4 flex-1 overflow-y-auto">
          <div className="p-3 border rounded-lg bg-muted/50">
            <div className="flex items-center space-x-2 mb-2">
              <DomainAvatar domain={author.domainName} size="xs" />
              <span className="text-sm font-medium">{author.domainName}</span>
              {author?.isVerified && (
                <ShieldCheck className="w-4 h-4 text-blue-500" />
              )}
              <span className="text-xs text-muted-foreground">
                {moment(timestamp).fromNow()}
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {content.replace(/<[^>]*>/g, "")}
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
          <Button onClick={handleRepostWithComment} className="flex-1">
            Repost
          </Button>
        </div>
      </>
    );

    if (isMobile) {
      return (
        <Drawer open={repostDialogOpen} onOpenChange={setRepostDialogOpen}>
          <DrawerContent className="max-h-[80vh] flex flex-col">
            <DrawerHeader className="sticky top-0 bg-background border-b">
              <DrawerTitle>Repost with Comment</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 flex flex-col flex-1 overflow-hidden">
              {dialogContent}
            </div>
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <Dialog open={repostDialogOpen} onOpenChange={setRepostDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Repost with Comment</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col overflow-hidden">{dialogContent}</div>
        </DialogContent>
      </Dialog>
    );
  };

  const PostContent = (
    <div className="p-card max-md:px-0" onClick={onClick}>
      <div className="flex space-x-3">
        <DomainAvatar domain={author.domainName} size="sm" />
        <div className="flex-1 space-items">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-accent hover:underline cursor-pointer text-body">
                {author.domainName}
              </span>
              {author?.isVerified && (
                <ShieldCheck className="w-4 h-4 text-blue-500" />
              )}
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground text-caption">
                {moment(timestamp).fromNow()}
              </span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {isOwnPost && (
                  <>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyLink();
                      }}
                    >
                      <Link className="w-4 h-4 mr-2" />
                      Copy link
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await deletePost.mutateAsync(id);
                          toast.success("Post deleted!");
                        } catch (error) {
                          console.error("Failed to delete post:", error);
                          toast.error("Failed to delete post");
                        }
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete post
                    </DropdownMenuItem>
                  </>
                )}
                {!isOwnPost && (
                  <>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyLink();
                      }}
                    >
                      <Link className="w-4 h-4 mr-2" />
                      Copy link
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare();
                      }}
                    >
                      <Share className="w-4 h-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <ParsedContent
            content={content}
            className="text-foreground leading-relaxed whitespace-pre-wrap rich-text-content text-body"
          />

          {/* Media Display */}
          {media.length > 0 && (
            <div
              className={`mt-3 ${
                media.length === 1 ? "max-w-md" : "grid grid-cols-2 gap-2"
              }`}
            >
              {media.map((mediaFile) => (
                <div
                  key={mediaFile.id}
                  className="relative rounded-lg overflow-hidden"
                >
                  {mediaFile.type === "image" ? (
                    <img
                      src={mediaFile.url}
                      alt={mediaFile.name}
                      className="w-full h-auto max-h-96 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    />
                  ) : (
                    <video
                      src={mediaFile.url}
                      className="w-full h-auto max-h-96 object-cover"
                      controls
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Poll Display */}
          {poll && (
            <div className="mt-4" onClick={(e) => e.stopPropagation()}>
              <PollDisplay
                poll={poll}
                postId={id}
                userVotes={userPollVotes}
                canVote={true}
              />
            </div>
          )}

          {/* Has repost */}
          {repostedFrom && (
            <div className="mt-3 p-3 bg-muted/20">
              <div className="flex items-center space-x-2 mb-1">
                <DomainAvatar
                  domain={repostedFrom.originalPost?.authorId}
                  size="xs"
                />
                <span className="text-sm font-medium text-foreground">
                  {repostedFrom.originalPost?.authorId}
                </span>
                <span className="text-xs text-muted-foreground">
                  {moment(repostedFrom.originalPost?.createdAt).fromNow()}
                </span>
              </div>
              <ParsedContent
                content={repostedFrom.originalPost?.content}
                className="text-sm text-foreground/90 mb-2 line-clamp-2"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-muted-foreground flex items-center">
                    <Heart className="w-3 h-3 mr-1" />
                    {repostedFrom.originalPost?._count?.likes || 0}
                  </span>
                </div>
                {repostedFrom.originalPost?._count?.comments > 1 && (
                  <button
                    className="text-xs text-primary hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReply(id);
                    }}
                  >
                    View {repostedFrom.originalPost?._count?.comments - 1} more{" "}
                    {repostedFrom.originalPost?._count?.comments - 1 === 1
                      ? "reply"
                      : "replies"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Trending Comment */}
          {comments.length > 0 && (
            <div className="mt-3 pl-4 border-l-2 border-muted bg-muted/30 rounded-r-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <DomainAvatar domain={comments[0].authorId} size="xs" />
                <span className="text-sm font-medium text-foreground">
                  {comments[0].authorId}
                </span>
                <span className="text-xs text-muted-foreground">
                  {moment(comments[0].createdAt).fromNow()}
                </span>
              </div>
              <ParsedContent
                content={comments[0].content}
                className="text-sm text-foreground/90 mb-2 line-clamp-2"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-muted-foreground flex items-center">
                    <Heart className="w-3 h-3 mr-1" />
                    {reactiveLikes || 0}
                  </span>
                </div>
                {commentsCount > 1 && (
                  <button
                    className="text-xs text-primary hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReply(id);
                    }}
                  >
                    View {commentsCount - 1} more{" "}
                    {commentsCount - 1 === 1 ? "reply" : "replies"}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-6 pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowCommentComposer(!showCommentComposer);
              }}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {commentsCount}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-green-600 hover:bg-green-50 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Repeat className="w-4 h-4" />
                  {reactiveRepostCount}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRepost();
                  }}
                >
                  <Repeat className="w-4 h-4 mr-2" />
                  Repost
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setRepostDialogOpen(true);
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Repost with comment
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className={`text-muted-foreground transition-colors ${
                  reactiveIsLiked
                    ? "text-red-500 hover:text-red-600 hover:bg-red-50"
                    : "hover:text-red-500 hover:bg-red-50"
                }`}
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    if (reactiveIsLiked) {
                      await unlikePost.mutateAsync(id);
                      setReactiveLikes((prev) => prev - 1);
                      setReactiveIsLiked(false);
                    } else {
                      await likePost.mutateAsync(id);
                      setReactiveLikes((prev) => prev + 1);
                      setReactiveIsLiked(true);
                    }
                  } catch (error) {
                    console.error("Failed to like/unlike post:", error);
                  }
                }}
              >
                <Heart
                  className={`w-4 h-4 mr-2 ${
                    reactiveIsLiked ? "fill-current" : ""
                  }`}
                />
              </Button>
              {reactiveLikes > 0 && (
                <button
                  className="text-sm text-muted-foreground hover:text-red-500 hover:underline transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLikesModalOpen(true);
                  }}
                >
                  {reactiveLikes}
                </button>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
            >
              <Share className="w-4 h-4" />
            </Button>
          </div>

          {/* Comment Composer */}
          {showCommentComposer && (
            <div className="mt-4 pt-4 border-t border-border">
              <CommentComposer
                postId={id}
                onSubmit={() => {
                  setShowCommentComposer(false);
                }}
                placeholder="Write a comment..."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="hover:bg-secondary/50 transition-colors cursor-pointer border-b border-border last:border-b-0">
        {PostContent}
      </div>
      <RepostDialog />
      <PostLikesModal
        postId={id}
        isOpen={likesModalOpen}
        onClose={() => setLikesModalOpen(false)}
      />
    </>
  );
};

export default CommunityPost;
