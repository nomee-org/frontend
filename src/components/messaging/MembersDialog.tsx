import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Plus,
  MoreVertical,
  Crown,
  Shield,
  UserMinus,
  Search,
  User,
  Loader,
} from "lucide-react";
import { useAddMember, useRemoveMember } from "@/data/use-backend";
import { useNames } from "@/data/use-doma";
import { toast } from "sonner";
import InfiniteScroll from "react-infinite-scroll-component";
import { useIsMobile } from "@/hooks/use-mobile";
import { useXmtp } from "@/contexts/XmtpContext";
import { Group, PermissionLevel, SafeGroupMember } from "@xmtp/browser-sdk";

interface MembersDialogProps {
  group: Group;
  members: SafeGroupMember[];
  isOpen: boolean;
  onClose: () => void;
  membersLoading: boolean;
}

export function MembersDialog({
  group,
  members,
  isOpen,
  onClose,
  membersLoading,
}: MembersDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const isMobile = useIsMobile();
  const { client } = useXmtp();

  const {
    data: searchResults,
    isLoading: searchLoading,
    hasNextPage,
    fetchNextPage,
  } = useNames(10, false, searchQuery, []);

  const addMemberMutation = useAddMember(group);
  const removeMemberMutation = useRemoveMember(group);

  // Get current user's level in the conversation
  const currentUserLevel = members?.find(
    (m) => m.inboxId === client.inboxId
  )?.permissionLevel;

  // Check if current user can manage members
  const canManageMembers =
    currentUserLevel === PermissionLevel.SuperAdmin ||
    currentUserLevel === PermissionLevel.Admin;

  const handleAddMember = async (inboxId: string) => {
    try {
      await addMemberMutation.mutateAsync({
        inboxId,
        level: PermissionLevel.Member,
      });
      setSearchQuery("");
      setShowAddMember(false);
      toast.success("Member added successfully");
    } catch (error) {
      toast.error("Failed to add member");
    }
  };

  const handleRemoveMember = async (inboxId: string) => {
    try {
      await removeMemberMutation.mutateAsync({
        inboxIds: [inboxId],
      });
      toast.success("Member removed successfully");
    } catch (error) {
      toast.error("Failed to remove member");
    }
  };

  const handleUpdateLevel = async (inboxId: string, level: PermissionLevel) => {
    try {
      await addMemberMutation.mutateAsync({
        inboxId,
        level,
      });
      toast.success("Level updated successfully");
    } catch (error) {
      toast.error("Failed to update level");
    }
  };

  // Check if current user can manage a specific member
  const canManageMember = (member: SafeGroupMember) => {
    if (!canManageMembers) return false;
    if (member.inboxId === client.inboxId) return false; // Can't manage self
    if (member.permissionLevel === PermissionLevel.SuperAdmin) return false; // Can't manage owner

    // Only owners can manage admins
    if (member.permissionLevel === PermissionLevel.Admin) {
      return currentUserLevel === PermissionLevel.SuperAdmin;
    }

    return true; // Can manage members
  };

  const getLevelIcon = (level: PermissionLevel) => {
    switch (level) {
      case PermissionLevel.SuperAdmin:
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case PermissionLevel.Admin:
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getLevelBadge = (level: PermissionLevel) => {
    const levelConfig = {
      [PermissionLevel.SuperAdmin]: {
        label: "Owner",
        variant: "default" as const,
      },
      [PermissionLevel.Admin]: {
        label: "Admin",
        variant: "secondary" as const,
      },
      [PermissionLevel.Member]: {
        label: "Member",
        variant: "outline" as const,
      },
    };

    const config = levelConfig[level];
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const content = (
    <>
      <div className="space-y-4 flex-1 overflow-y-auto">
        {/* Add Member Button */}
        {canManageMembers && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowAddMember(!showAddMember)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        )}

        {/* Add Member Search */}
        {showAddMember && (
          <div className="space-y-3 p-3 border rounded-lg">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by domain name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {searchLoading && (
              <div className="flex justify-center p-3 md:p-4">
                <Loader className="h-4 w-4 animate-spin" />
              </div>
            )}

            <InfiniteScroll
              dataLength={searchResults.pages.flatMap((p) => p.items).length}
              next={fetchNextPage}
              hasMore={hasNextPage}
              loader={null}
              className="max-h-40 overflow-y-auto space-y-2"
              children={
                <>
                  {searchResults.pages
                    .flatMap((p) => p.items)
                    .map((user) => (
                      <div
                        key={user.name}
                        className="flex items-center justify-between p-2 hover:bg-accent rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <User className="h-4 w-4" />
                            </div>
                          </Avatar>
                          <span className="font-medium text-sm">
                            {user.name}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddMember(user.name)}
                          disabled={addMemberMutation.isPending}
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                </>
              }
            />

            {searchQuery &&
              (searchResults?.pages?.[0]?.totalCount || 0) === 0 &&
              !searchLoading && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No users found
                </p>
              )}
          </div>
        )}

        {/* Members List */}
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {membersLoading ? (
            <div className="flex justify-center p-3 md:p-4">
              <Loader className="h-4 w-4 animate-spin" />
            </div>
          ) : (members?.length || 0) > 0 ? (
            members?.map((member) => (
              <div
                key={member.inboxId}
                className="flex items-center justify-between p-3 hover:bg-accent rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      {getLevelIcon(member.permissionLevel)}
                    </div>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{member.inboxId}</span>
                      {getLevelBadge(member.permissionLevel)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {member.consentState}
                    </p>
                  </div>
                </div>

                {/* Member Actions */}
                {canManageMember(member) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {member.permissionLevel !== PermissionLevel.Admin && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleUpdateLevel(
                              member.inboxId,
                              PermissionLevel.Admin
                            )
                          }
                          disabled={addMemberMutation.isPending}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Make Admin
                        </DropdownMenuItem>
                      )}
                      {member.permissionLevel === PermissionLevel.Admin && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleUpdateLevel(
                              member.inboxId,
                              PermissionLevel.Member
                            )
                          }
                          disabled={addMemberMutation.isPending}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Make Member
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleRemoveMember(member.inboxId)}
                        disabled={removeMemberMutation.isPending}
                        className="text-destructive"
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No members found
            </p>
          )}
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[80vh] flex flex-col">
          <DrawerHeader className="sticky top-0 bg-background border-b">
            <DrawerTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Members</span>
              <Badge variant="secondary" className="ml-2">
                {members?.length || 0}
              </Badge>
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-4 flex flex-col flex-1 overflow-hidden">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Members</span>
            <Badge variant="secondary" className="ml-2">
              {members?.length || 0}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col overflow-hidden">{content}</div>
      </DialogContent>
    </Dialog>
  );
}
