import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { DomainAvatar } from "@/components/domain/DomainAvatar";
import { ExternalLink, Calendar, MessageCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { useHelper } from "@/hooks/use-helper";

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

  const { trimAddress } = useHelper();

  const handleViewProfile = () => {
    setOpen(false);
    navigate(`/names/${username}`);
  };

  const UserPreviewContent = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start space-x-4">
        <DomainAvatar domain={username} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold truncate">
              {trimAddress(username, 12)}
            </h3>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-3">
        <Button onClick={handleViewProfile} className="flex-1">
          <ExternalLink className="h-4 w-4 mr-2" />
          View Profile
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
