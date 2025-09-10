import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { Users, Plus, X, Search, User, Loader } from "lucide-react";
import { useNames } from "@/data/use-doma";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import InfiniteScroll from "react-infinite-scroll-component";
import { useCreateGroupConversation } from "@/data/use-backend";
import { useXmtp } from "@/contexts/XmtpContext";
import { dataService } from "@/services/doma/dataservice";
import { useHelper } from "@/hooks/use-helper";

interface CreateGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (conversationId: string) => void;
}

export function CreateGroupDialog({
  isOpen,
  onClose,
  onSuccess,
}: CreateGroupDialogProps) {
  const isMobile = useIsMobile();
  const { parseCAIP10 } = useHelper();
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInboxIds, setSelectedInboxIds] = useState<string[]>([]);

  const { client } = useXmtp();

  const createConversationMutation = useCreateGroupConversation(client);
  const {
    data: searchResults,
    isLoading: searchLoading,
    fetchNextPage: searchFetchNextPage,
    hasNextPage: searchHasNextPage,
  } = useNames(10, false, searchQuery, []);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }

    if (selectedInboxIds.length < 1) {
      toast.error("Add at least one member to the group");
      return;
    }

    try {
      const result = await createConversationMutation.mutateAsync({
        name: groupName.trim(),
        description: description?.trim(),
        inboxIds: selectedInboxIds,
      });

      toast.success("Group created successfully");
      onSuccess?.(result.id);
      onClose();

      // Reset form
      setGroupName("");
      setDescription("");
      setSelectedInboxIds([]);
      setSearchQuery("");
    } catch (error) {
      toast.error("Failed to create group");
    }
  };

  const addUser = async (username: string) => {
    const otherName = await dataService.getName({ name: username });
    const otherAddress = parseCAIP10(otherName.claimedBy).address;

    const inboxId = await client.findInboxIdByIdentifier({
      identifier: otherAddress,
      identifierKind: "Ethereum",
    });

    if (!inboxId) {
      return toast.error(`@${username} is not yet on XMTP.`);
    }

    if (inboxId === client.inboxId) {
      return toast.error("You cannot add your self.");
    }

    if (!selectedInboxIds.includes(inboxId)) {
      setSelectedInboxIds([...selectedInboxIds, inboxId]);
      setSearchQuery("");
    }
  };

  const removeUser = (username: string) => {
    setSelectedInboxIds(selectedInboxIds.filter((user) => user !== username));
  };

  const content = (
    <div className="space-y-4">
      {/* Group Name */}
      <div className="space-y-2">
        <Label htmlFor="groupName">Group Name</Label>
        <Input
          id="groupName"
          placeholder="Enter group name..."
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          placeholder="Enter group description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      {/* Selected Users */}
      {selectedInboxIds.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Members ({selectedInboxIds.length})</Label>
          <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
            {selectedInboxIds.map((username) => (
              <div
                key={username}
                className="flex items-center space-x-2 bg-muted px-3 py-1 rounded-full"
              >
                <span className="text-sm">{username}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeUser(username)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Members */}
      <div className="space-y-2">
        <Label>Add Members</Label>
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
          dataLength={
            searchResults?.pages?.flatMap((p) => p.items)?.length ?? 0
          }
          next={searchFetchNextPage}
          hasMore={searchHasNextPage}
          loader={null}
          className="max-h-40 overflow-y-auto space-y-2 border rounded-lg p-2"
          children={searchResults?.pages
            ?.flatMap((p) => p.items)
            ?.filter((user) => !selectedInboxIds.includes(user.name))
            ?.map((user) => (
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
                  <span className="font-medium text-sm">{user.name}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addUser(user.name)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
            ))}
        />

        {searchQuery &&
          (searchResults?.pages?.[0]?.totalCount ?? 0) === 0 &&
          !searchLoading && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No users found
            </p>
          )}
      </div>
    </div>
  );

  const footer = (
    <div className="flex space-x-2">
      <Button variant="outline" onClick={onClose} className="flex-1">
        Cancel
      </Button>
      <Button
        onClick={handleCreateGroup}
        disabled={
          createConversationMutation.isPending ||
          !groupName.trim() ||
          selectedInboxIds.length < 1
        }
        className="flex-1"
      >
        {createConversationMutation.isPending ? (
          <Loader className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Users className="h-4 w-4 mr-2" />
        )}
        Create Group
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Create Group</span>
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-4">{content}</div>
          <DrawerFooter className="pt-0">{footer}</DrawerFooter>
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
            <span>Create Group</span>
          </DialogTitle>
        </DialogHeader>
        {content}
        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
