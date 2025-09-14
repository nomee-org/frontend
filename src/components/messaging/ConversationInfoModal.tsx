import { useEffect, useState } from "react";
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
  UserPlus,
  Crown,
  Shield,
  AtSign,
  Check,
  User,
} from "lucide-react";
import { DomainAvatar } from "@/components/domain/DomainAvatar";
import { OnlineStatus } from "@/components/messaging/OnlineStatus";
import { useIsMobile } from "@/hooks/use-mobile";
import moment from "moment";
import {
  Conversation,
  DecodedMessage,
  Group,
  PermissionLevel,
  SafeGroupMember,
} from "@xmtp/browser-sdk";
import { useOwnedNames } from "@/data/use-doma";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "../ui/label";
import { useNameResolver } from "@/contexts/NicknameContext";
import { useAccount } from "wagmi";

interface ConversationInfoModalProps {
  conversation: Conversation;
  members: SafeGroupMember[];
  messages: DecodedMessage[];
  isOpen: boolean;
  peerAddress?: string;
  onClose: () => void;
}

export const ConversationInfoModal = ({
  conversation,
  members,
  messages,
  isOpen,
  onClose,
  peerAddress,
}: ConversationInfoModalProps) => {
  const isMobile = useIsMobile();
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<"info" | "members">("info");

  const isGroupConversation =
    conversation.metadata.conversationType === "group";

  const { nickname, setNickname } = useNameResolver();
  const [domainName, setDomainName] = useState("");
  const { data: namesData } = useOwnedNames(peerAddress, 50, []);

  useEffect(() => {
    setDomainName(namesData?.pages?.[0]?.items?.[0]?.name ?? "");
  }, [namesData]);

  const handleSetNickname = () => {
    if (domainName && peerAddress) {
      setNickname(peerAddress, domainName);
    }
  };

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
              domain={nickname(peerAddress)}
              className="h-20 w-20"
            />
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold ">
            {isGroupConversation
              ? (conversation as Group).name || "Group Chat"
              : nickname(peerAddress, 12)}
          </h2>
          {isGroupConversation ? (
            <p className="text-muted-foreground">
              {members?.length || 0} members
            </p>
          ) : (
            <div className="flex items-center justify-center mt-2">
              <OnlineStatus isActive={conversation?.isActive} />
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
          {/* Domain Info */}
          {(namesData?.pages?.length ?? 0) > 0 && (
            <div className="space-y-2">
              <Label>Set a nickname</Label>
              <div className="flex items-center gap-2">
                <Select value={domainName} onValueChange={setDomainName}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {peerAddress?.toLowerCase() === address?.toLowerCase() && (
                      <SelectItem value={"You"}>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>{"You"}</span>
                        </div>
                      </SelectItem>
                    )}

                    {namesData?.pages
                      ?.flatMap((p) => p.items)
                      ?.map((name) => {
                        return (
                          <SelectItem value={name.name}>
                            <div className="flex items-center space-x-2">
                              <AtSign className="h-4 w-4" />
                              <span>{name.name}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>

                <Button
                  className="h-10 w-10"
                  variant="outline"
                  onClick={handleSetNickname}
                >
                  <Check />
                </Button>
              </div>
            </div>
          )}

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
                  {messages?.length || 0} total messages
                </p>
              </div>
            </div>
          </div>

          {/* Group Description */}
          {isGroupConversation && (conversation as Group).description && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Description</h3>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                {(conversation as Group).description}
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
          </div>
        </div>
      )}

      {/* Members Tab (Group only) */}
      {activeTab === "members" && isGroupConversation && (
        <ScrollArea className="h-80">
          <div className="space-y-2">
            {members?.map((member) => (
              <div
                key={member.inboxId}
                className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <div className="relative">
                  <DomainAvatar domain={member.inboxId} className="h-10 w-10" />
                  {/* {member.user.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                  )} */}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">{member.inboxId}</p>
                    {member.permissionLevel === PermissionLevel.Admin && (
                      <Badge variant="secondary" className="text-xs">
                        <Crown className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    {member.permissionLevel === PermissionLevel.SuperAdmin && (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Owner
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Consent: {member.consentState}
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
