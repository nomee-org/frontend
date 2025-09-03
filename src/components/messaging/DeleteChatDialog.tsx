import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { Trash2 } from "lucide-react";
import { useDeleteConversation } from "@/data/use-backend";
import { toast } from "sonner";

interface DeleteChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  chatName: string;
  isGroup?: boolean;
  onConfirm?: () => void;
}

export const DeleteChatDialog = ({
  isOpen,
  onClose,
  conversationId,
  chatName,
  isGroup = false,
  onConfirm,
}: DeleteChatDialogProps) => {
  const isMobile = useIsMobile();
  const deleteConversation = useDeleteConversation();

  const handleDelete = async () => {
    try {
      await deleteConversation.mutateAsync(conversationId);
      onConfirm?.();
      onClose();
      toast.success(`${isGroup ? "Group" : "Chat"} deleted successfully`);
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      toast.error(`Failed to delete ${isGroup ? "group" : "chat"}`);
    }
  };

  const title = `Delete ${isGroup ? "Group" : "Chat"}`;
  const description = isGroup
    ? `Are you sure you want to delete the group "${chatName}"? This action cannot be undone and all messages will be permanently deleted.`
    : `Are you sure you want to delete this conversation with ${chatName}? This action cannot be undone and all messages will be permanently deleted.`;

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center space-x-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              <span>{title}</span>
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-4">
            <p className="text-sm text-muted-foreground">{description}</p>
            <div className="flex flex-col space-y-2">
              <Button
                onClick={handleDelete}
                disabled={deleteConversation.isPending}
                variant="destructive"
                className="w-full"
              >
                {deleteConversation.isPending ? "Deleting..." : "Delete"}
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            <span>{title}</span>
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteConversation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteConversation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};