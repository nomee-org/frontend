import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Bell, MessageSquare, Heart, Share, User } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import moment from "moment";
import {
  useNotifications,
  useMarkAllNotificationsAsRead,
} from "@/data/use-backend";
import { INotification, NotificationType } from "@/types/backend";
import { useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  WebSocketEventHandlers,
  webSocketService,
} from "@/services/backend/socketservice";
import { useUsername } from "@/hooks/use-username";

export function NotificationPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token, activeUsername } = useUsername();

  const { data: notificationsData, isLoading } = useNotifications(
    10,
    undefined,
    activeUsername
  );
  const { data: unReadNotificationsData, refetch: unRefetchNotificationsData } =
    useNotifications(10, true, activeUsername);

  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const unreadCount =
    unReadNotificationsData?.pages?.[0]?.pagination?.total ?? 0;

  const isMobile = useIsMobile();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const handlers: WebSocketEventHandlers = {
      id: "notifications",
      onNotification: () => {
        unRefetchNotificationsData();
      },
    };

    webSocketService.setEventHandlers(handlers);

    return () => {
      webSocketService.removeEventHandlers(handlers);
    };
  }, [token]);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.LIKE:
        return <Heart className="h-4 w-4 text-red-500" />;
      case NotificationType.COMMENT:
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case NotificationType.FOLLOW:
        return <User className="h-4 w-4 text-green-500" />;
      case NotificationType.REPOST:
        return <Share className="h-4 w-4 text-purple-500" />;
      case NotificationType.MENTION:
        return <MessageSquare className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleNotificationClick = (notification: INotification) => {
    setIsOpen(false);
    if (notification?.metadata?.postId) {
      navigate(`/feeds/${notification.metadata.postId}`);
    } else if (notification?.userId) {
      navigate(`/names/${notification.userId}`);
    }
  };

  const content = (
    <>
      <div className="flex items-center justify-between p-3 md:p-4 border-b sticky top-0 bg-background">
        <h3 className="font-semibold">Notifications</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Mark all read
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50 animate-pulse" />
            <p>Loading notifications...</p>
          </div>
        ) : (notificationsData?.pages?.[0].pagination.total ?? 0) === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-0">
            {notificationsData?.pages?.[0]?.data?.map((notification) => (
              <div key={notification.id}>
                <div
                  className={`p-3 md:p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                    !notification.isRead ? "bg-muted/30" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">
                          {notification.title || notification.message}
                        </p>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {moment(notification.createdAt).fromNow()}
                      </p>
                    </div>
                  </div>
                </div>
                <Separator />
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-2 sticky bottom-0 bg-background border-t">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center text-sm"
          onClick={() => {
            setIsOpen(false);
            navigate("/notifications");
          }}
        >
          View all notifications
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setIsOpen(true)}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Notifications</TooltipContent>
        </Tooltip>
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent className="max-h-[80vh] flex flex-col">
            <DrawerHeader className="sticky top-0 bg-background border-b">
              <DrawerTitle>Notifications</DrawerTitle>
            </DrawerHeader>
            <div className="flex flex-col flex-1 overflow-hidden">
              {content}
            </div>
          </DrawerContent>
        </Drawer>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent>Notifications</TooltipContent>
          <PopoverContent
            className="w-72 sm:w-80 p-0 max-h-96 flex flex-col"
            align="end"
            side="bottom"
            sideOffset={8}
          >
            {content}
          </PopoverContent>
        </Popover>
      </Tooltip>
    </TooltipProvider>
  );
}
