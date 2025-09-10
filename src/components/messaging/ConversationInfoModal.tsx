import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Calendar,
  MessageCircle,
  Settings,
  UserPlus,
  Crown,
  Shield,
  User,
} from "lucide-react";
import { IConversation, ConversationType } from "@/types/backend";
import { DomainAvatar } from "@/components/domain/DomainAvatar";
import { OnlineStatus } from "@/components/messaging/OnlineStatus";
import { useIsMobile } from "@/hooks/use-mobile";
import moment from "moment";

interface ConversationInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation?: IConversation;
  username?: string; // For direct conversations
  onOpenMessageSettings?: () => void;
  conversationId?: string;
  selectedMessageId?: string;
}

export const ConversationInfoModal = ({
  isOpen,
  onClose,
  conversation,
  username,
  onOpenMessageSettings,
  conversationId,
  selectedMessageId,
}: ConversationInfoModalProps) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<"info" | "members">("info");

  const isGroupConversation = conversation?.type === ConversationType.GROUP;
  const otherUser = conversation?.participants?.find(
    (p) => p.userId !== username
  )?.user;

  const renderContent = () => (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          {isGroupConversation ? (
            <Avatar className="h-20 w-20">
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Users className="h-10 w-10 text-muted-foreground" />
              </div>
            </Avatar>
          ) : (
            <DomainAvatar
              domain={username || otherUser?.username}
              className="h-20 w-20"
            />
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold">
            {isGroupConversation
              ? conversation?.name || "Group Chat"
              : username || otherUser?.username || "Unknown User"}
          </h2>
          {isGroupConversation ? (
            <p className="text-muted-foreground">
              {conversation?.participants?.length || 0} members
            </p>
          ) : (
            <div className="flex items-center justify-center mt-2">
              <OnlineStatus isOnline={otherUser?.isOnline || false} />
            </div>
          )}
        </div>
      </div>

      {/* Tabs for Group Conversations */}
      {isGroupConversation && (
        <div className="flex bg-muted rounded-lg p-1">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "info"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Info
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "members"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Members
          </button>
        </div>
      )}

      {/* Content */}
      {activeTab === "info" && (
        <div className="space-y-4">
          {/* Conversation Details */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Created</p>
                <p className="text-xs text-muted-foreground">
                  {moment(conversation?.createdAt).format("MMMM DD, YYYY")}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Messages</p>
                <p className="text-xs text-muted-foreground">
                  {conversation?._count?.messages || 0} total messages
                </p>
              </div>
            </div>
          </div>

          {/* Group Description */}
          {isGroupConversation && conversation?.description && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Description</h3>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                {conversation.description}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {isGroupConversation && (
              <Button variant="outline" className="w-full justify-start">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Members
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                if (onOpenMessageSettings) {
                  onOpenMessageSettings();
                }
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              {isGroupConversation ? "Group Settings" : "Chat Settings"}
            </Button>
          </div>
        </div>
      )}

      {/* Members Tab (Group only) */}
      {activeTab === "members" && isGroupConversation && (
        <ScrollArea className="h-80">
          <div className="space-y-2">
            {conversation?.participants?.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <div className="relative">
                  <DomainAvatar
                    domain={participant.user.username}
                    className="h-10 w-10"
                  />
                  {participant.user.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">
                      {participant.user.username}
                    </p>
                    {participant.role === "ADMIN" && (
                      <Badge variant="secondary" className="text-xs">
                        <Crown className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    {participant.role === "OWNER" && (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Owner
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Joined {moment(participant.joinedAt).format("MMM DD, YYYY")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <>
        <Drawer open={isOpen} onOpenChange={onClose}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>
                {isGroupConversation ? "Group Info" : "Profile"}
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-8">{renderContent()}</div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {isGroupConversation ? "Group Info" : "Profile"}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">{renderContent()}</ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};
