import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { DomainAvatar } from "@/components/domain/DomainAvatar";
import { ExternalLink, Calendar, MessageCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";

interface UserPreviewPopupProps {
  username: string;
  children: React.ReactNode;
}

export function UserPreviewPopup({
  username,
  children,
}: UserPreviewPopupProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const handleViewProfile = () => {
    setOpen(false);
    navigate(`/names/${username}`);
  };

  const handleSendMessage = () => {
    setOpen(false);
    navigate(`/messages/${username}`);
  };

  const UserPreviewContent = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start space-x-4">
        <DomainAvatar domain={username} size="lg" className="h-16 w-16" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold truncate">{username}</h3>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Domain owner and community member
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 py-4 border-t border-b">
        <div className="text-center">
          <div className="text-lg font-semibold">24</div>
          <div className="text-xs text-muted-foreground">Posts</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold">156</div>
          <div className="text-xs text-muted-foreground">Following</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold">89</div>
          <div className="text-xs text-muted-foreground">Followers</div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Joined December 2024</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <MessageCircle className="h-4 w-4" />
          <span>Active in community</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-3">
        <Button onClick={handleViewProfile} className="flex-1">
          <ExternalLink className="h-4 w-4 mr-2" />
          View Profile
        </Button>
        <Button
          onClick={handleSendMessage}
          variant="outline"
          className="flex-1"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Message
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent className="px-6 pb-6">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-6 mt-2" />
          <UserPreviewContent />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <UserPreviewContent />
      </DialogContent>
    </Dialog>
  );
}
