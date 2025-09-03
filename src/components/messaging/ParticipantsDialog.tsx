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
import {
  useGetConversationParticipants,
  useAddParticipant,
  useRemoveParticipant,
  useUpdateParticipantRole,
  useGetConversation,
} from "@/data/use-backend";
import { useNames } from "@/data/use-doma";
import { ParticipantRole } from "@/types/backend";
import { toast } from "sonner";
import InfiniteScroll from "react-infinite-scroll-component";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUsername } from "@/hooks/use-username";

interface ParticipantsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
}

export function ParticipantsDialog({
  isOpen,
  onClose,
  conversationId,
}: ParticipantsDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const isMobile = useIsMobile();
  const { activeUsername } = useUsername();

  const { data: conversation } = useGetConversation(conversationId);
  const { data: participants, isLoading: participantsLoading } =
    useGetConversationParticipants(conversationId, 50);

  const {
    data: searchResults,
    isLoading: searchLoading,
    hasNextPage,
    fetchNextPage,
  } = useNames(10, false, searchQuery, []);

  const addParticipantMutation = useAddParticipant();
  const removeParticipantMutation = useRemoveParticipant();
  const updateParticipantRoleMutation = useUpdateParticipantRole();

  // Get current user's role in the conversation
  const currentUserRole = conversation?.participants.find(
    (p) => p.user.username === activeUsername
  )?.role;

  // Check if current user can manage participants
  const canManageParticipants =
    currentUserRole === ParticipantRole.OWNER ||
    currentUserRole === ParticipantRole.ADMIN;

  const handleAddParticipant = async (username: string) => {
    try {
      await addParticipantMutation.mutateAsync({
        conversationId,
        addParticipantDto: {
          username,
          role: ParticipantRole.MEMBER,
        },
      });
      setSearchQuery("");
      setShowAddParticipant(false);
      toast.success("Participant added successfully");
    } catch (error) {
      toast.error("Failed to add participant");
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      await removeParticipantMutation.mutateAsync({
        conversationId,
        participantId,
      });
      toast.success("Participant removed successfully");
    } catch (error) {
      toast.error("Failed to remove participant");
    }
  };

  const handleUpdateRole = async (
    participantUsername: string,
    role: ParticipantRole
  ) => {
    try {
      await updateParticipantRoleMutation.mutateAsync({
        conversationId,
        username: participantUsername,
        role,
      });
      toast.success("Role updated successfully");
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  // Check if current user can manage a specific participant
  const canManageParticipant = (participant: any) => {
    if (!canManageParticipants) return false;
    if (participant.user.username === activeUsername) return false; // Can't manage self
    if (participant.role === ParticipantRole.OWNER) return false; // Can't manage owner

    // Only owners can manage admins
    if (participant.role === ParticipantRole.ADMIN) {
      return currentUserRole === ParticipantRole.OWNER;
    }

    return true; // Can manage members
  };

  const getRoleIcon = (role: ParticipantRole) => {
    switch (role) {
      case ParticipantRole.OWNER:
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case ParticipantRole.ADMIN:
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRoleBadge = (role: ParticipantRole) => {
    const roleConfig = {
      [ParticipantRole.OWNER]: { label: "Owner", variant: "default" as const },
      [ParticipantRole.ADMIN]: {
        label: "Admin",
        variant: "secondary" as const,
      },
      [ParticipantRole.MEMBER]: {
        label: "Member",
        variant: "outline" as const,
      },
    };

    const config = roleConfig[role];
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const content = (
    <>
      <div className="space-y-4 flex-1 overflow-y-auto">
        {/* Add Participant Button */}
        {canManageParticipants && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowAddParticipant(!showAddParticipant)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Participant
          </Button>
        )}

        {/* Add Participant Search */}
        {showAddParticipant && (
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
                          onClick={() => handleAddParticipant(user.name)}
                          disabled={addParticipantMutation.isPending}
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                </>
              }
            />

            {searchQuery &&
              (participants?.pages?.[0]?.pagination.total || 0) === 0 &&
              !searchLoading && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No users found
                </p>
              )}
          </div>
        )}

        {/* Participants List */}
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {participantsLoading ? (
            <div className="flex justify-center p-3 md:p-4">
              <Loader className="h-4 w-4 animate-spin" />
            </div>
          ) : (participants?.pages?.[0]?.pagination.total || 0) > 0 ? (
            participants.pages
              .flatMap((p) => p.data)
              .map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 hover:bg-accent rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        {getRoleIcon(participant.role)}
                      </div>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {participant.user.username}
                        </span>
                        {getRoleBadge(participant.role)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {participant.isActive ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </div>

                  {/* Participant Actions */}
                  {canManageParticipant(participant) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {participant.role !== ParticipantRole.ADMIN && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateRole(
                                participant.user.username,
                                ParticipantRole.ADMIN
                              )
                            }
                            disabled={updateParticipantRoleMutation.isPending}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Make Admin
                          </DropdownMenuItem>
                        )}
                        {participant.role === ParticipantRole.ADMIN && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateRole(
                                participant.user.username,
                                ParticipantRole.MEMBER
                              )
                            }
                            disabled={updateParticipantRoleMutation.isPending}
                          >
                            <User className="h-4 w-4 mr-2" />
                            Make Member
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() =>
                            handleRemoveParticipant(participant.id)
                          }
                          disabled={removeParticipantMutation.isPending}
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
              No participants found
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
              <span>Participants</span>
              <Badge variant="secondary" className="ml-2">
                {participants?.pages?.[0]?.pagination.total || 0}
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
            <span>Participants</span>
            <Badge variant="secondary" className="ml-2">
              {participants?.pages?.[0]?.pagination.total || 0}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col overflow-hidden">{content}</div>
      </DialogContent>
    </Dialog>
  );
}
