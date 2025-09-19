import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  Bell,
  Heart,
  MessageSquare,
  User,
  Share,
} from "lucide-react";
import {
  useNotifications,
  useMarkAllNotificationsAsRead,
} from "@/data/use-backend";
import { INotification, NotificationType } from "@/types/backend";
import { useUsername } from "@/hooks/use-username";
import { useToast } from "@/hooks/use-toast";
import InfiniteScroll from "react-infinite-scroll-component";
import { SEO } from "@/components/seo/SEO";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { ConnectWallet } from "@/components/common/ConnectWallet";
import { BuyDomain } from "@/components/domain/BuyDomain";
import {
  webSocketService,
  WebSocketEventHandlers,
} from "@/services/backend/socketservice";
import NotificationItem from "@/components/notifications/NotificationItem";

export default function Notifications() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { address } = useAccount();
  const { token, activeUsername } = useUsername();

  const {
    data: notificationsData,
    isLoading,
    hasNextPage: notificationsHasNextPage,
    fetchNextPage: notificationsFetchNextPage,
  } = useNotifications(20, undefined, activeUsername);

  const {
    data: unReadNotificationsData,
    isLoading: unreadIsLoading,
    hasNextPage: unReadNotificationsHasNextPage,
    fetchNextPage: unReadNotificationsFetchNextPage,
  } = useNotifications(20, true, activeUsername);

  const markAllAsReadMutation = useMarkAllNotificationsAsRead(activeUsername);

  useEffect(() => {
    webSocketService.setEventHandlers({
      id: "notifications",
      onNotification: (notification) => {
        toast({
          title: "New Notification",
          description: notification.message || notification.title,
        });
      },
    });
  }, [toast]);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.LIKE:
        return <Heart className="h-5 w-5 text-red-500" />;
      case NotificationType.COMMENT:
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case NotificationType.FOLLOW:
        return <User className="h-5 w-5 text-green-500" />;
      case NotificationType.REPOST:
        return <Share className="h-5 w-5 text-purple-500" />;
      case NotificationType.MENTION:
        return <MessageSquare className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const unreadCount =
    unReadNotificationsData?.pages?.[0]?.pagination?.total ?? 0;

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      toast({ description: "All notifications marked as read" });
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to mark all notifications as read",
      });
    }
  };

  const handleNotificationClick = (notification: INotification) => {
    // Navigate based on notification metadata
    if (notification.metadata?.postId) {
      navigate(`/feeds/${notification.metadata.postId}`);
    } else if (notification.userId) {
      navigate(`/names/${notification.userId}`);
    }
  };

  useEffect(() => {
    const handlers: WebSocketEventHandlers = {
      id: "notifications",
      onNotification: (notification) => {},
    };

    webSocketService.setEventHandlers(handlers);

    return () => {
      webSocketService.removeEventHandlers(handlers);
    };
  }, [token]);

  // Show connect wallet if user is not connected
  if (!address) {
    return (
      <ConnectWallet
        title="Connect Your Wallet"
        description="Connect your wallet to view your notifications and stay updated with your domain activity."
      />
    );
  }

  if (!activeUsername) {
    return <BuyDomain description="No active username." />;
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-content">
        <div className="flex items-center justify-center py-12">
          <Bell className="h-8 w-8 animate-pulse opacity-50" />
          <span className="ml-2 text-muted-foreground">
            Loading notifications...
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Notifications"
        description="View all your notifications including likes, comments, follows, mentions and more. Stay updated with your community activity."
        keywords="notifications, alerts, activity, likes, comments, follows, mentions, social updates"
      />
      <div className="container max-w-4xl mx-auto p-content">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${
                    unreadCount > 1 ? "s" : ""
                  }`
                : "You're all caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              variant="outline"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>

        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as "all" | "unread")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">All Notifications</TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {(notificationsData?.pages?.[0]?.pagination?.total || 0) === 0 ? (
              <Card className="p-12 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">
                  {filter === "unread"
                    ? "No unread notifications"
                    : "No notifications yet"}
                </h3>
                <p className="text-muted-foreground">
                  {filter === "unread"
                    ? "You're all caught up! Check back later for new notifications."
                    : "When you get notifications, they'll appear here."}
                </p>
              </Card>
            ) : (
              <InfiniteScroll
                dataLength={
                  notificationsData?.pages?.flatMap((p) => p.data)?.length ?? 0
                }
                next={notificationsFetchNextPage}
                hasMore={notificationsHasNextPage}
                loader={null}
                className="space-y-2"
                children={notificationsData?.pages
                  ?.flatMap((p) => p.data)
                  ?.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                    />
                  ))}
              />
            )}
          </TabsContent>

          <TabsContent value="unread" className="mt-6">
            {(unReadNotificationsData?.pages?.[0]?.pagination?.total || 0) ===
            0 ? (
              <Card className="p-12 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">
                  {filter === "unread"
                    ? "No unread notifications"
                    : "No notifications yet"}
                </h3>
                <p className="text-muted-foreground">
                  {filter === "unread"
                    ? "You're all caught up! Check back later for new notifications."
                    : "When you get notifications, they'll appear here."}
                </p>
              </Card>
            ) : (
              <InfiniteScroll
                dataLength={
                  unReadNotificationsData?.pages?.flatMap((p) => p.data)
                    ?.length ?? 0
                }
                next={unReadNotificationsFetchNextPage}
                hasMore={unReadNotificationsHasNextPage}
                loader={null}
                className="space-y-2"
                children={unReadNotificationsData?.pages
                  ?.flatMap((p) => p.data)
                  ?.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                    />
                  ))}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
