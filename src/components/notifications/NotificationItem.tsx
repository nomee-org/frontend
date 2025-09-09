import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Share,
  MessageSquare,
  MoreVertical,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import { INotification, NotificationType } from "@/types/backend";
import {
  useMarkNotificationAsRead,
  useDeleteNotification,
} from "@/data/use-backend";
import { useUsername } from "@/hooks/use-username";
import { useToast } from "@/hooks/use-toast";
import moment from "moment";
import { useNavigate } from "react-router-dom";

interface NotificationItemProps {
  notification: INotification;
}

const NotificationItem = ({ notification }: NotificationItemProps) => {
  const { activeUsername } = useUsername();
  const navigate = useNavigate();
  const { toast } = useToast();
  const markAsReadMutation = useMarkNotificationAsRead(activeUsername);
  const deleteNotificationMutation = useDeleteNotification();

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.LIKE:
        return <Heart className="h-4 w-4 text-red-500" />;
      case NotificationType.COMMENT:
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case NotificationType.FOLLOW:
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case NotificationType.REPOST:
        return <Share className="h-4 w-4 text-purple-500" />;
      case NotificationType.MENTION:
        return <MessageSquare className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const handleNotificationClick = (notification: INotification) => {
    if (notification?.metadata?.postId) {
      navigate(`/feeds/${notification.metadata.postId}`);
    } else if (notification?.userId) {
      navigate(`/names/${notification.userId}`);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsReadMutation.mutateAsync(notificationId);
      toast({ description: "Notification marked as read" });
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to mark notification as read",
      });
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotificationMutation.mutateAsync(notificationId);
      toast({ description: "Notification deleted" });
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to delete notification",
      });
    }
  };

  return (
    <div key={notification.id} className="relative group">
      <Card
        className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
          !notification.isRead ? "border-primary/50 bg-primary/5" : ""
        }`}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 mt-1">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0 pr-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {notification.title}
                </Badge>
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-primary rounded-full" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {moment(notification.createdAt).fromNow()}
              </span>
            </div>
            <p className="text-sm mt-2">
              {`${notification?.senderId ? `@${notification.senderId} ` : ""}${
                notification.message
              }`}
            </p>
          </div>
        </div>
      </Card>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {!notification.isRead && (
            <ContextMenuItem
              onClick={() => handleMarkAsRead(notification.id)}
              disabled={markAsReadMutation.isPending}
            >
              <Eye className="h-4 w-4 mr-2" />
              Mark as read
            </ContextMenuItem>
          )}
          {notification.isRead && (
            <ContextMenuItem disabled>
              <EyeOff className="h-4 w-4 mr-2" />
              Already read
            </ContextMenuItem>
          )}
          <Separator />
          <ContextMenuItem
            onClick={() => handleDeleteNotification(notification.id)}
            disabled={deleteNotificationMutation.isPending}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
};

export default NotificationItem;
