/* eslint-disable @typescript-eslint/no-explicit-any */
// React imports
import { useState, useEffect, useCallback } from "react";

// Third-party imports
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import moment from "moment";

// UI component imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QueryListLoader } from "@/components/ui/query-loader";
import { QueryError } from "@/components/ui/query-error";

// Icon imports
import {
  Search,
  MessageSquare,
  Plus,
  MoreVertical,
  RefreshCcw,
} from "lucide-react";

// Local component imports
import { CreateGroupDialog } from "@/components/messaging/CreateGroupDialog";
import { ConnectWallet } from "@/components/common/ConnectWallet";
import { SEO } from "@/components/seo/SEO";

// Hook imports
import { useIsMobile } from "@/hooks/use-mobile";

// Type imports
import { useXmtp } from "@/contexts/XmtpContext";
import { Conversation } from "@xmtp/browser-sdk";
import { Chat } from "@/components/messaging/Chat";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ContentTypeReadReceipt } from "@xmtp/content-type-read-receipt";

const Messages = () => {
  // Navigation and routing states
  const navigate = useNavigate();
  const location = useLocation();

  // User and account states
  const { address } = useAccount();
  const isMobile = useIsMobile();
  const { identifier, client, newMessage } = useXmtp();

  // Local component states
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [isConversationSelected, setIsConversationSelected] = useState(false);
  const [isClosingConversation, setIsClosingConversation] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState<
    Error | undefined
  >(undefined);

  useEffect(() => {
    if (identifier && client) {
      getConversations();
    }
  }, [identifier, client]);

  useEffect(() => {
    if (newMessage && !newMessage.contentType.sameAs(ContentTypeReadReceipt)) {
      const index = conversations.findIndex(
        (c) => c.id === newMessage.conversationId
      );
      if (index > 0) {
        setConversations((prev) => {
          const updated = [...prev];
          const [item] = updated.splice(index, 1);
          return [item, ...updated];
        });
      }
    }
  }, [newMessage]);

  useEffect(() => {
    let streamController: AsyncIterator<any, any, any> | undefined;

    if (client) {
      (async () => {
        streamController = await client.conversations.stream({
          onValue: (value) => {
            setConversations((prev) => [value, ...prev]);
          },
          onError: (error) => {
            // setConversationsError(error);
          },
        });
      })();
    }

    return () => {
      if (streamController && typeof streamController.return === "function") {
        streamController.return();
      }
    };
  }, [identifier, client]);

  const getConversations = async () => {
    setConversationsLoading(true);

    try {
      if (client) {
        setConversations(await client.conversations.list());
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.log({ error });

      setConversationsError(error);
    } finally {
      setConversationsLoading(false);
    }
  };

  const handleSyncAll = async () => {
    await client.conversations.syncAll();
    setConversations(await client.conversations.list());
    toast.success("Synced");
  };

  useEffect(() => {
    if (identifier && client) {
      getConversations();
    }
  }, [identifier, client]);

  useEffect(() => {
    const wasSelected = isConversationSelected;
    const isSelected = location.pathname !== "/";

    // Handle reverse animation when going back to messages
    if (wasSelected && !isSelected && isMobile) {
      setIsClosingConversation(true);
      setTimeout(() => {
        setIsConversationSelected(false);
        setIsClosingConversation(false);
      }, 200);
      return;
    }

    setIsConversationSelected(isSelected);
  }, [location.pathname, isConversationSelected, isMobile]);

  // Show wallet connection message if no address
  if (!address) {
    return (
      <ConnectWallet description="Connect your wallet to access messaging features and start conversations with other users." />
    );
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
          } border-r-0 md:border-r border-border flex flex-col bg-background transition-all duration-200 ease-in-out ${
            (isConversationSelected || isClosingConversation) && isMobile
              ? ""
              : ""
          } ${
            isClosingConversation && isMobile
              ? "animate-[slide-in-left_0.2s_ease-out]"
              : ""
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-border/50 bg-background/95 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-foreground">Chats</h1>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="shadow-sm"
                  onClick={() => setShowCreateGroup(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden xs:inline">New </span>Group
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 md:h-8 md:w-8"
                    >
                      <MoreVertical className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-background border border-border shadow-lg z-50"
                  >
                    <DropdownMenuItem
                      onClick={() => handleSyncAll}
                      className="hover:bg-accent"
                    >
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Sync All
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
                  onRetry={() => {}}
                  message="Failed to load conversations"
                />
              </div>
            ) : conversationsLoading ? (
              <QueryListLoader />
            ) : conversations?.length === 0 ? (
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
                {conversations?.map((conversation) => {
                  return (
                    <Chat key={conversation.id} conversation={conversation} />
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
                  ? "animate-[slide-out-left_0.2s_ease-in-out]"
                  : "animate-[slide-in-left_0.2s_ease-out]"
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
