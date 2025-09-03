// React imports
import { useState, useEffect } from "react";

// Third-party imports
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import moment from "moment";

// UI component imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { QueryListLoader } from "@/components/ui/query-loader";
import { QueryError } from "@/components/ui/query-error";

// Icon imports
import { Search, MessageSquare, User, Loader, Plus, Users } from "lucide-react";

// Local component imports
import { CreateGroupDialog } from "@/components/common/CreateGroupDialog";
import { ConnectWallet } from "@/components/common/ConnectWallet";
import { BuyDomain } from "@/components/domain/BuyDomain";
import { DomainAvatar } from "@/components/domain/DomainAvatar";
import { SEO } from "@/components/seo/SEO";

// Hook imports
import { useUsername } from "@/hooks/use-username";
import { useIsMobile } from "@/hooks/use-mobile";

// Service/data imports
import { useUserConversations } from "@/data/use-backend";
import { webSocketService, WebSocketEventHandlers } from "@/services/backend/socketservice";

// Type imports
import { IConversation, ConversationType } from "@/types/backend";

const Messages = () => {
  // Navigation and routing states
  const navigate = useNavigate();
  const location = useLocation();

  // User and account states
  const { token, activeUsername } = useUsername();
  const { address } = useAccount();
  const isMobile = useIsMobile();

  // Local component states
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [isConversationSelected, setIsConversationSelected] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosingConversation, setIsClosingConversation] = useState(false);

  // Data fetching states
  const {
    data: conversationsData,
    isLoading: conversationsLoading,
    error: conversationsError,
    refetch: refetchConversationsData,
  } = useUserConversations(50, activeUsername);

  const handleConversationClick = (conversation: IConversation) => {
    // Start animation on mobile with scale effect
    if (isMobile) {
      setIsAnimating(true);
    }

    if (conversation.type === ConversationType.GROUP) {
      navigate(`/messages/groups/${conversation.id}`);
    } else {
      const otherUser = conversation?.participants?.find(
        (p) => p.userId !== activeUsername
      )?.user;

      if (otherUser) {
        navigate(`/messages/${otherUser.username}`);
      }
    }
  };

  useEffect(() => {
    localStorage.setItem(
      `${activeUsername}:last-opened-at`,
      new Date().toString()
    );

    const wasSelected = isConversationSelected;
    const isSelected = location.pathname !== "/messages";

    // Handle reverse animation when going back to messages
    if (wasSelected && !isSelected && isMobile) {
      setIsClosingConversation(true);
      setTimeout(() => {
        setIsConversationSelected(false);
        setIsClosingConversation(false);
        setIsAnimating(false);
      }, 300);
      return;
    }

    setIsConversationSelected(isSelected);

    // Handle forward animation when opening conversation
    if (isSelected && !wasSelected && isMobile) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }

    // Reset animation when going back to messages list on desktop
    if (!isSelected && wasSelected && !isMobile) {
      setIsAnimating(false);
    }
  }, [location.pathname, isConversationSelected, isMobile]);

  useEffect(() => {
    const conversations = conversationsData?.pages?.flatMap((p) => p.data);
    if (conversations) {
      for (const conversation of conversations) {
        webSocketService.joinConversation(conversation.id);
      }
    }
  }, [conversationsData]);

  useEffect(() => {
    const handlers: WebSocketEventHandlers = {
      id: "all-conversations",
      onNewMessage: () => {
        refetchConversationsData();
      },
      onMessageDeleted: () => {
        refetchConversationsData();
      },
      onMessageReaction: () => {
        refetchConversationsData();
      },
      onMessageUpdated: () => {
        refetchConversationsData();
      },
    };

    webSocketService.setEventHandlers(handlers);

    return () => {
      webSocketService.removeEventHandlers(handlers);
    };
  }, []);

  // Show wallet connection message if no address
  if (!address) {
    return (
      <ConnectWallet description="Connect your wallet to access messaging features and start conversations with other users." />
    );
  }

  if (!activeUsername) {
    return <BuyDomain description="No active username." />;
  }

  return (
    <>
      <SEO
        title="Messages"
        description="Access your direct messages and group chats. Stay connected with your community through secure XMTP messaging."
        keywords="messages, direct messages, group chat, XMTP, secure messaging, web3 chat"
      />
      <div className="max-w-7xl mx-auto px-0 md:p-content h-[calc(100vh-50px)] md:h-[calc(100vh-80px)] flex">
        {/* Conversations Sidebar */}
        <div
          className={`${
            isConversationSelected || isClosingConversation
              ? "hidden md:flex md:w-80"
              : "flex-1 md:w-80"
          } border-r-0 md:border-r border-border flex flex-col bg-background transition-all duration-300 ease-in-out ${
            (isConversationSelected || isClosingConversation) && isMobile
              ? ""
              : ""
          } ${
            isClosingConversation && isMobile
              ? "animate-[slide-in-left_0.3s_ease-out]"
              : ""
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-border/50 bg-background/95 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-foreground">Messages</h1>
              <Button
                size="sm"
                className="animate-fade-in shadow-sm"
                onClick={() => setShowCreateGroup(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden xs:inline">New </span>Group
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-11 text-sm bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-200 rounded-xl"
              />
            </div>
          </div>

          <ScrollArea className="h-[calc(100%-100px)] md:h-[calc(100%-120px)]">
            {conversationsError ? (
              <div className="p-4">
                <QueryError
                  error={conversationsError}
                  onRetry={refetchConversationsData}
                  message="Failed to load conversations"
                />
              </div>
            ) : conversationsLoading ? (
              <QueryListLoader />
            ) : conversationsData?.pages.flatMap((p) => p.data)?.length ===
              0 ? (
              <div className="p-content text-center text-muted-foreground">
                <div className="space-y-1 md:space-y-2">
                  <p className="text-xs md:text-sm">No conversations found</p>
                  <p className="text-xs">
                    Start a conversation by messaging someone!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {conversationsData?.pages
                  .flatMap((p) => p.data)
                  ?.map((conversation) => {
                    const otherUser = conversation?.participants?.find(
                      (p) => p.user.username !== activeUsername
                    )?.user;

                    const isSelected =
                      conversation?.type === ConversationType.GROUP
                        ? location.pathname.includes(
                            `/messages/groups/${conversation?.id}`
                          )
                        : conversation?.type === ConversationType.DIRECT &&
                          location.pathname.includes(
                            `/messages/${otherUser?.username}`
                          );

                    return (
                      <div
                        key={conversation.id}
                        onClick={() => handleConversationClick(conversation)}
                        className={`p-3 cursor-pointer transition-all duration-200 hover:bg-accent/80 rounded-xl border border-transparent ${
                          isSelected
                            ? "bg-accent border-primary/20 shadow-sm"
                            : "hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="relative flex-shrink-0">
                            {conversation.type === ConversationType.GROUP ? (
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center border-2 border-primary/10">
                                <Users className="h-5 w-5 text-primary" />
                              </div>
                            ) : (
                              <div className="relative">
                                <DomainAvatar
                                  domain={otherUser?.username}
                                  className="h-12 w-12 ring-2 ring-background shadow-sm"
                                />
                                {otherUser?.isOnline && (
                                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full"></div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm truncate text-foreground">
                                  {conversation.name ?? otherUser?.username}
                                </h3>
                                {otherUser?.isOnline && (
                                  <span className="text-xs text-green-600 font-medium">
                                    Online
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                                <span className="text-xs text-muted-foreground font-medium">
                                  {moment(conversation.updatedAt).format(
                                    "HH:mm"
                                  )}
                                </span>
                                {conversation?.unreadCount > 0 && (
                                  <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center rounded-full">
                                    {(conversation?.unreadCount ?? 0) > 99
                                      ? "99+"
                                      : conversation?.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <p className="text-sm text-muted-foreground truncate flex-1 max-w-44">
                                {conversation.lastMessage?.content ||
                                  "No messages yet"}
                              </p>
                              {conversation.isEncrypted && (
                                <div className="flex-shrink-0">
                                  <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Conversation View */}
        {(isConversationSelected || isClosingConversation) && (
          <div
            className={`flex-1 flex flex-col md:flex-1 md:flex-col ${
              isMobile
                ? isClosingConversation
                  ? "animate-[slide-out-left_0.3s_ease-in-out]"
                  : "animate-[slide-in-left_0.3s_ease-out]"
                : "animate-fade-in"
            }`}
          >
            <Outlet />
          </div>
        )}
        {!isConversationSelected && !isClosingConversation && (
          <div className="hidden md:flex flex-1 items-center justify-center bg-muted/10">
            <div className="text-center animate-fade-in">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-medium text-muted-foreground mb-2">
                Select a conversation
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                Choose a conversation from the sidebar to start messaging, or
                create a new group chat.
              </p>
            </div>
          </div>
        )}

        {/* Create Group Dialog */}
        <CreateGroupDialog
          isOpen={showCreateGroup}
          onClose={() => setShowCreateGroup(false)}
          onSuccess={(conversationId) => {
            navigate(`/messages/groups/${conversationId}`);
            setShowCreateGroup(false);
          }}
        />
      </div>
    </>
  );
};

export default Messages;
