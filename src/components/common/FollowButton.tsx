import { Button } from "@/components/ui/button";
import { useFollowUser, useUnfollowUser } from "@/data/use-backend";
import { useUsername } from "@/hooks/use-username";
import { Loader } from "lucide-react";

interface FollowButtonProps {
  targetUsername: string;
  isFollowing: boolean;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

const FollowButton = ({
  targetUsername,
  isFollowing,
  variant,
  size = "sm",
  className = "",
  disabled = false,
  onFollowChange,
}: FollowButtonProps) => {
  const { activeUsername } = useUsername();
  const followUser = useFollowUser(activeUsername);
  const unfollowUser = useUnfollowUser(activeUsername);

  if (activeUsername === targetUsername) {
    return null;
  }

  const handleClick = async () => {
    try {
      if (isFollowing) {
        await unfollowUser.mutateAsync(targetUsername);
        onFollowChange?.(false);
      } else {
        await followUser.mutateAsync(targetUsername);
        onFollowChange?.(true);
      }
    } catch (error) {
      console.error("Failed to follow/unfollow user:", error);
    }
  };

  const isLoading = followUser.isPending || unfollowUser.isPending;

  return (
    <Button
      variant={variant ?? (isFollowing ? "outline" : "default")}
      size={size}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader className="h-4 w-4 animate-spin" />
      ) : (
        isFollowing ? "Unfollow" : "Follow"
      )}
    </Button>
  );
};

export default FollowButton;